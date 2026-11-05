/** A row of the Keyboard table on a component's docs page. */
export interface KeyboardDoc {
  /** The key or key combination, for example "Shift + Tab". */
  keys: string;
  /** What happens when the keys are pressed. */
  action: string;
}

/**
 * Content for the Keyboard and ARIA sections of the docs page template.
 * Set it on a component's meta as `parameters.kheeDocs`.
 */
export interface KheeDocs {
  keyboard?: KeyboardDoc[];
  aria?: string[];
}

/** Use with `satisfies` on a meta's `parameters` so content is type-checked. */
export interface KheeDocsParameters {
  kheeDocs?: KheeDocs;
}

/** Each component's meta has exactly one of these tags. */
export const STATUS_TAGS = ["experimental", "stable"] as const;
export type Status = (typeof STATUS_TAGS)[number];
