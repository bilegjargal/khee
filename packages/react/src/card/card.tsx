import type { ComponentPropsWithRef } from "react";
import { joinClassNames } from "../utils/join-class-names.js";

export type CardProps = ComponentPropsWithRef<"div">;

/**
 * A container that groups related content on a surface.
 *
 * Card is a non-interactive component (ADR 0011): a plain `<div>` with no
 * React Aria primitive and no `"use client"`, so it renders as a server
 * component and ships no JavaScript. Headings and content are your own markup.
 * Every `<div>` prop passes through, including `ref`, `role`, and `aria-*`.
 */
export function Card({ className, ...props }: CardProps) {
  return <div {...props} className={joinClassNames("khee-card", className)} />;
}
