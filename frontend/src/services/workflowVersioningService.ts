/**
 * Workflow versioning service (issue #9).
 *
 * Every save creates an immutable version record. The store keeps the most
 * recent N versions per workflow (default 50). Rollback is non-destructive:
 * applying an old version creates a NEW version that copies the old state,
 * so the user never loses a previous edit.
 *
 * This is the storage + diff layer. The history panel UI consumes it.
 */

import type { Node, Edge } from '@xyflow/react';

const MAX_VERSIONS = 50;
const STORAGE_KEY_PREFIX = 'zigsaw.workflow.versions.';

export interface WorkflowSnapshot {
  nodes: Node[];
  edges: Edge[];
}

export interface WorkflowVersion {
  /** Sortable id; ULID-style. */
  id: string;
  workflowId: string;
  authorId: string;
  authorName: string;
  /** ms epoch. */
  createdAt: number;
  snapshot: WorkflowSnapshot;
  /** Auto-generated diff summary against the previous version. */
  summary: string;
  /** What was rolled back from, if any. */
  rolledBackFromVersionId?: string;
}

export interface DiffSummary {
  addedNodes: string[];
  removedNodes: string[];
  changedNodes: string[];
  addedEdges: string[];
  removedEdges: string[];
}

function nodeMap(nodes: Node[]): Map<string, Node> {
  return new Map(nodes.map((n) => [n.id, n]));
}

function edgeMap(edges: Edge[]): Map<string, Edge> {
  return new Map(edges.map((e) => [e.id, e]));
}

export function diffSnapshots(prev: WorkflowSnapshot, next: WorkflowSnapshot): DiffSummary {
  const prevNodes = nodeMap(prev.nodes);
  const nextNodes = nodeMap(next.nodes);
  const prevEdges = edgeMap(prev.edges);
  const nextEdges = edgeMap(next.edges);

  const addedNodes: string[] = [];
  const removedNodes: string[] = [];
  const changedNodes: string[] = [];

  for (const [id, node] of nextNodes) {
    const prevNode = prevNodes.get(id);
    if (!prevNode) {
      addedNodes.push(id);
    } else if (JSON.stringify(prevNode.data) !== JSON.stringify(node.data)) {
      changedNodes.push(id);
    }
  }
  for (const id of prevNodes.keys()) {
    if (!nextNodes.has(id)) removedNodes.push(id);
  }

  const addedEdges: string[] = [];
  const removedEdges: string[] = [];
  for (const id of nextEdges.keys()) if (!prevEdges.has(id)) addedEdges.push(id);
  for (const id of prevEdges.keys()) if (!nextEdges.has(id)) removedEdges.push(id);

  return { addedNodes, removedNodes, changedNodes, addedEdges, removedEdges };
}

export function summarize(diff: DiffSummary): string {
  const parts: string[] = [];
  if (diff.addedNodes.length) parts.push(`+${diff.addedNodes.length} node${diff.addedNodes.length > 1 ? 's' : ''}`);
  if (diff.removedNodes.length) parts.push(`-${diff.removedNodes.length} node${diff.removedNodes.length > 1 ? 's' : ''}`);
  if (diff.changedNodes.length) parts.push(`~${diff.changedNodes.length} edited`);
  if (diff.addedEdges.length) parts.push(`+${diff.addedEdges.length} edge${diff.addedEdges.length > 1 ? 's' : ''}`);
  if (diff.removedEdges.length) parts.push(`-${diff.removedEdges.length} edge${diff.removedEdges.length > 1 ? 's' : ''}`);
  return parts.length ? parts.join(', ') : 'no changes';
}

function ulid(): string {
  return Date.now().toString(36).padStart(8, '0') + Math.random().toString(36).slice(2, 10).padStart(8, '0');
}

export class WorkflowVersioningService {
  /** localStorage key for a workflow's version array. */
  private key(workflowId: string): string {
    return `${STORAGE_KEY_PREFIX}${workflowId}`;
  }

  list(workflowId: string): WorkflowVersion[] {
    try {
      const raw = localStorage.getItem(this.key(workflowId));
      return raw ? (JSON.parse(raw) as WorkflowVersion[]) : [];
    } catch {
      return [];
    }
  }

  get(workflowId: string, versionId: string): WorkflowVersion | null {
    return this.list(workflowId).find((v) => v.id === versionId) ?? null;
  }

  /** Append a new version. Auto-trims to the most recent MAX_VERSIONS. */
  save(input: {
    workflowId: string;
    authorId: string;
    authorName: string;
    snapshot: WorkflowSnapshot;
    rolledBackFromVersionId?: string;
  }): WorkflowVersion {
    const existing = this.list(input.workflowId);
    const previous = existing[existing.length - 1];
    const summary = previous ? summarize(diffSnapshots(previous.snapshot, input.snapshot)) : 'initial version';
    const version: WorkflowVersion = {
      id: ulid(),
      workflowId: input.workflowId,
      authorId: input.authorId,
      authorName: input.authorName,
      createdAt: Date.now(),
      snapshot: input.snapshot,
      summary,
      rolledBackFromVersionId: input.rolledBackFromVersionId,
    };
    const trimmed = [...existing, version].slice(-MAX_VERSIONS);
    try {
      localStorage.setItem(this.key(input.workflowId), JSON.stringify(trimmed));
    } catch {
      // Quota exceeded — drop the oldest 10 and retry.
      const fewer = trimmed.slice(-Math.max(10, MAX_VERSIONS - 10));
      try {
        localStorage.setItem(this.key(input.workflowId), JSON.stringify(fewer));
      } catch {
        // Give up silently — UI will show a non-blocking toast.
      }
    }
    return version;
  }

  /**
   * Apply a previous version. Non-destructive: takes the current live snapshot
   * (passed in by the caller) and stores it as a new version BEFORE returning
   * the requested old snapshot — so the caller can apply it to live state.
   */
  rollback(input: {
    workflowId: string;
    targetVersionId: string;
    currentSnapshot: WorkflowSnapshot;
    authorId: string;
    authorName: string;
  }): WorkflowSnapshot | null {
    const target = this.get(input.workflowId, input.targetVersionId);
    if (!target) return null;
    // Snapshot the current state first so it's never lost.
    this.save({
      workflowId: input.workflowId,
      authorId: input.authorId,
      authorName: input.authorName,
      snapshot: input.currentSnapshot,
    });
    // Then commit the rollback as a new version.
    this.save({
      workflowId: input.workflowId,
      authorId: input.authorId,
      authorName: input.authorName,
      snapshot: target.snapshot,
      rolledBackFromVersionId: target.id,
    });
    return target.snapshot;
  }
}
