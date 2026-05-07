/**
 * Arcads-style 12-frame storyboard meta-prompt builder.
 *
 * Produces a single image prompt suitable for OpenAI's gpt-image-1 model that
 * yields a one-page storyboard sheet with: numbered shot grid (shot size +
 * motion labels), camera/story notes, color palette swatches, and character
 * design / casting reference portraits.
 *
 * Reference: el.cine (@EHuanglu) tutorial — "AI storytelling is crazy now".
 */

export type StoryboardStyle = 'cinematic' | 'animated' | 'sketch';

const STYLE_DIRECTIVES: Record<StoryboardStyle, string> = {
  cinematic:
    'Style: Mixed media — professional storyboard aesthetic combining loose graphite/pencil sketches with red ink frame borders, blue arrow annotations, handwritten capital-letter notes, and two photorealistic 3D character renders inset on the right. Authentic film pre-production document feel, clean.',
  animated:
    'Style: Pixar-inspired storyboard sheet — soft warm pencil sketches with red frame borders, expressive arrow annotations, hand-lettered notes, and two stylized 3D-animation character portraits inset on the right side. Clean professional pre-production document.',
  sketch:
    'Style: Pure graphite storyboard — loose hand-drawn shot grid with red frame borders, blue motion arrows, capital-letter handwritten camera notes, and two pencil-portrait character studies on the right. Authentic working-document feel.',
};

export interface BuildPromptOptions {
  idea: string;
  frameCount?: number;
  style?: StoryboardStyle;
}

/**
 * Build the full Arcads-style meta-prompt that instructs gpt-image-1 to
 * render a storyboard sheet. The user-supplied `idea` becomes the story brief
 * the model storyboards.
 */
export function buildStoryboardPrompt({
  idea,
  frameCount = 12,
  style = 'cinematic',
}: BuildPromptOptions): string {
  const safeIdea = idea.trim().replace(/\s+/g, ' ');
  const frames = Math.max(4, Math.min(16, Math.floor(frameCount)));

  return [
    `A single-page film pre-production storyboard sheet titled with the story name, opening sequence, showing shots 1.1.1 to 1.1.${frames}.`,
    '',
    `STORY BRIEF: ${safeIdea}`,
    '',
    `Layout: a left-and-center grid of ${frames} numbered storyboard panels (01–${String(frames).padStart(2, '0')}), each panel hand-drawn with red ink frame borders, the shot size labeled at top-left of each panel (CLOSE-UP / MEDIUM / WIDE / LOW ANGLE / TWO-SHOT etc.), the motion or beat labeled at top-right (e.g. "INHALE", "EXHALE", "FOCUS EXPANDS", "BOW / GRATITUDE"), and short capital-letter handwritten notes under each panel describing the action.`,
    '',
    `Bottom-left: a "NOTES / FLOW INTENTIONS" block with 3-4 bullet hand-lettered notes about breath, presence, gratitude, or the emotional throughline of the scene.`,
    '',
    `Bottom-center: a "CAMERA / STORY NOTES" block with 3 bullets about camera intent (e.g. "Start close for intimacy, open up for energy"; "Use low angles for fire & power"; "End wide with harmony & gratitude").`,
    '',
    `Bottom-right: "COLOR PALETTE (Environmental Mood)" — five labeled color swatches in crosshatched pencil/crayon style (Warm Fire red-orange, Earthy Food brown, Soft Steam gray, Metal Kitchen dark slate, Natural Herbs sage green) — adapt the swatch names to fit the STORY BRIEF.`,
    '',
    `Right side panel labeled "CHARACTER DESIGN & CASTING": two characters from the STORY BRIEF rendered first as a small pencil sketch, then as a photorealistic 3D-animation Pixar-style character portrait inset to the right of the sketch. Each character has a 3-word personality caption (e.g. "Focused. Disciplined. Mindful.") and a "Casting Reference" line with a real-actor name, age range, and approximate height.`,
    '',
    `Bottom right corner: "PAGE 1 OF 1".`,
    '',
    STYLE_DIRECTIVES[style],
    '',
    'Render at 16:9 aspect ratio, the full sheet visible edge-to-edge, no cropped panels, legible labels.',
  ].join('\n');
}

export const STORYBOARD_TEMPLATE_VERSION = '1.0.0';
