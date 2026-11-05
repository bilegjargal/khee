import {
  composeRenderProps,
  type ClassNameOrFunction,
} from "react-aria-components";

/**
 * Prepends a component's `khee-*` class to the consumer's `className`.
 * Supports both the string and the render-function form, so consumers can
 * still compute classes from React Aria's render props.
 * It replaces React Aria's default class (for example `react-aria-Button`).
 */
export function composeClassName<T>(
  kheeClassName: string,
  className: ClassNameOrFunction<T> | undefined,
): ClassNameOrFunction<T> {
  return composeRenderProps(className, (consumerClassName) =>
    consumerClassName ? `${kheeClassName} ${consumerClassName}` : kheeClassName,
  );
}
