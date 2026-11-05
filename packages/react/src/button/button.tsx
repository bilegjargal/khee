"use client";

import type { Ref } from "react";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
} from "react-aria-components";
import { composeClassName } from "../utils/compose-class-name.js";

export interface ButtonProps extends AriaButtonProps {
  /**
   * Visual emphasis of the button.
   * @default "primary"
   */
  variant?: "primary" | "secondary";
  /**
   * Size of the button.
   * @default "md"
   */
  size?: "sm" | "md";
  ref?: Ref<HTMLButtonElement>;
}

/**
 * A button built on React Aria's `Button`.
 * All React Aria props pass through, including `onPress` and `isDisabled`.
 *
 * Status: experimental.
 */
export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <AriaButton
      {...props}
      className={composeClassName("khee-button", className)}
      data-variant={variant}
      data-size={size}
    />
  );
}
