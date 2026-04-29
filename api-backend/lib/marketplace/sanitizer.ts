/**
 * Workflow credential sanitizer (issue #11).
 *
 * Walks every node config and strips fields that look like secrets before a
 * workflow is published to the marketplace. The resulting workflow has
 * placeholders the cloning user fills in.
 */

import type { Template } from './types';

const SECRET_FIELD_PATTERNS = [
  /api[_-]?key/i,
  /access[_-]?token/i,
  /^token$/i,
  /secret/i,
  /password/i,
  /auth/i,
  /credential/i,
  /pat/i,
];

const SECRET_VALUE_PATTERNS = [
  /^sk-[A-Za-z0-9_-]{20,}$/,        // OpenAI / Anthropic
  /^sk-ant-[A-Za-z0-9_-]{20,}$/,    // Anthropic explicit
  /^gh[opsu]_[A-Za-z0-9]{30,}$/,    // GitHub
  /^AIza[0-9A-Za-z_-]{35}$/,        // Google
  /^xox[baprs]-[A-Za-z0-9-]{20,}$/, // Slack
  /^ya29\./,                        // Google OAuth tokens
];

interface SanitizeReport {
  redactions: Array<{ nodeId: string; field: string; reason: string }>;
}

function looksLikeSecretField(name: string): boolean {
  return SECRET_FIELD_PATTERNS.some((re) => re.test(name));
}

function looksLikeSecretValue(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (value.length < 16) return false;
  return SECRET_VALUE_PATTERNS.some((re) => re.test(value));
}

function walkConfig(
  cfg: Record<string, unknown>,
  nodeId: string,
  redactions: SanitizeReport['redactions'],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(cfg)) {
    if (looksLikeSecretField(k)) {
      redactions.push({ nodeId, field: k, reason: 'field-name match' });
      out[k] = '';
      continue;
    }
    if (looksLikeSecretValue(v)) {
      redactions.push({ nodeId, field: k, reason: 'value pattern match' });
      out[k] = '';
      continue;
    }
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = walkConfig(v as Record<string, unknown>, nodeId, redactions);
      continue;
    }
    out[k] = v;
  }
  return out;
}

/** Returns a sanitized template + the redactions that were applied. */
export function sanitizeForPublish(template: Template): { template: Template; report: SanitizeReport } {
  const redactions: SanitizeReport['redactions'] = [];
  const sanitizedNodes = template.workflow.nodes.map((node) => ({
    ...node,
    data: walkConfig(node.data ?? {}, node.id, redactions),
  }));

  // Promote redacted fields into the template's `requirements` so the cloner
  // sees clear "fill this in" markers.
  const requirements = [
    ...template.requirements,
    ...redactions
      .filter((r) => !template.requirements.some((req) => req.nodeId === r.nodeId && req.field === r.field))
      .map((r) => ({
        nodeId: r.nodeId,
        field: r.field,
        kind: 'api_key' as const,
        description: `Provide your own ${r.field} when cloning this template.`,
      })),
  ];

  return {
    template: {
      ...template,
      workflow: { ...template.workflow, nodes: sanitizedNodes },
      requirements,
    },
    report: { redactions },
  };
}
