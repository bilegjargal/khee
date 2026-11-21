/**
 * Appends the consumer's `className` to a component's `khee-*` class.
 * A plain helper with no `"use client"` and no React Aria import, so
 * server components such as Card can call it (ADR 0011).
 */
export function joinClassNames(
  kheeClassName: string,
  className: string | undefined,
): string {
  return className ? `${kheeClassName} ${className}` : kheeClassName;
}
