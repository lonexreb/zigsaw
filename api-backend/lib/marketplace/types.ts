/**
 * Workflow template marketplace types (issue #11).
 *
 * Templates are user-published workflow snapshots that other users can clone.
 * The publish pipeline runs a credential sanitizer over the workflow JSON
 * before allowing it onto the marketplace — no user secrets ever land here.
 */

export type TemplateCategory = 'ai-only' | 'github' | 'gmail' | 'calendar' | 'creative' | 'data' | 'other';

export interface TemplateAuthor {
  userId: string;
  displayName: string;
  avatarUrl?: string;
}

export interface Template {
  /** URL slug; lowercase, dash-separated, unique. */
  slug: string;
  /** Stable id; ULID. */
  id: string;
  title: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  author: TemplateAuthor;
  /** Workflow JSON — already sanitized of secrets. */
  workflow: {
    nodes: Array<{ id: string; type: string; position: { x: number; y: number }; data: Record<string, unknown> }>;
    edges: Array<{ id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string }>;
  };
  /** Required configuration the cloning user must fill in. */
  requirements: Array<{
    nodeId: string;
    field: string;
    kind: 'api_key' | 'oauth' | 'config';
    description: string;
  }>;
  stars: number;
  installs: number;
  createdAt: number;
  updatedAt: number;
  /** Whether the template appears in public listings. */
  visibility: 'public' | 'unlisted' | 'private';
}

export interface TemplatesQuery {
  category?: TemplateCategory;
  q?: string;
  tags?: string[];
  sort?: 'stars' | 'installs' | 'recent';
  limit?: number;
}
