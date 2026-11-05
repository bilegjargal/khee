import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button } from "./button.js";

describe("Button", () => {
  it("has the button role and takes its name from its children", async () => {
    const screen = await render(<Button>Save</Button>);
    await expect
      .element(screen.getByRole("button", { name: "Save" }))
      .toBeInTheDocument();
  });

  it("defaults to the primary variant and md size", async () => {
    const screen = await render(<Button>Save</Button>);
    const button = screen.getByRole("button");
    await expect.element(button).toHaveAttribute("data-variant", "primary");
    await expect.element(button).toHaveAttribute("data-size", "md");
  });

  it("renders a custom variant and size", async () => {
    const screen = await render(
      <Button variant="secondary" size="sm">
        Save
      </Button>,
    );
    const button = screen.getByRole("button");
    await expect.element(button).toHaveAttribute("data-variant", "secondary");
    await expect.element(button).toHaveAttribute("data-size", "sm");
  });

  it("merges a string className", async () => {
    const screen = await render(<Button className="app-save">Save</Button>);
    const button = screen.getByRole("button");
    await expect
      .element(button)
      .toHaveAttribute("class", "khee-button app-save");
  });

  it("merges a function className computed from render props", async () => {
    const screen = await render(
      <Button
        isDisabled
        className={({ isDisabled }) => (isDisabled ? "app-off" : "app-on")}
      >
        Save
      </Button>,
    );
    const button = screen.getByRole("button");
    await expect
      .element(button)
      .toHaveAttribute("class", "khee-button app-off");
  });

  it("passes a style object through", async () => {
    const screen = await render(
      <Button style={{ marginInlineStart: "3px" }}>Save</Button>,
    );
    await expect
      .element(screen.getByRole("button"))
      .toHaveStyle({ marginInlineStart: "3px" });
  });

  it("passes a style function through", async () => {
    const screen = await render(
      <Button
        isDisabled
        style={({ isDisabled }) => ({
          marginInlineStart: isDisabled ? "5px" : "0px",
        })}
      >
        Save
      </Button>,
    );
    await expect
      .element(screen.getByRole("button"))
      .toHaveStyle({ marginInlineStart: "5px" });
  });

  it("forwards its ref to the button element", async () => {
    const ref = createRef<HTMLButtonElement>();
    const screen = await render(<Button ref={ref}>Save</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toBe(screen.getByRole("button").element());
  });

  describe("keyboard", () => {
    it("receives focus with Tab and shows the focus ring", async () => {
      const screen = await render(<Button>Save</Button>);
      const button = screen.getByRole("button");
      await userEvent.tab();
      await expect.element(button).toHaveFocus();
      await expect.element(button).toHaveAttribute("data-focus-visible");
    });

    it("fires onPress with Enter", async () => {
      const onPress = vi.fn();
      await render(<Button onPress={onPress}>Save</Button>);
      await userEvent.tab();
      await userEvent.keyboard("{Enter}");
      expect(onPress).toHaveBeenCalledOnce();
    });

    it("fires onPress with Space", async () => {
      const onPress = vi.fn();
      await render(<Button onPress={onPress}>Save</Button>);
      await userEvent.tab();
      await userEvent.keyboard(" ");
      expect(onPress).toHaveBeenCalledOnce();
    });
  });

  describe("pointer", () => {
    it("fires onPress on click", async () => {
      const onPress = vi.fn();
      const screen = await render(<Button onPress={onPress}>Save</Button>);
      await userEvent.click(screen.getByRole("button"));
      expect(onPress).toHaveBeenCalledOnce();
    });

    it("sets data-pressed only while the pointer is down", async () => {
      const onPress = vi.fn();
      const screen = await render(<Button onPress={onPress}>Save</Button>);
      const button = screen.getByRole("button");

      await commands.pointerDown(button.selector);
      await expect.element(button).toHaveAttribute("data-pressed");
      expect(onPress).not.toHaveBeenCalled();

      await commands.pointerUp();
      await expect.element(button).not.toHaveAttribute("data-pressed");
      expect(onPress).toHaveBeenCalledOnce();
    });
  });

  describe("isDisabled", () => {
    it("is skipped by Tab", async () => {
      const screen = await render(
        <>
          <Button isDisabled>Save</Button>
          <button type="button">Next</button>
        </>,
      );
      await userEvent.tab();
      await expect
        .element(screen.getByRole("button", { name: "Next" }))
        .toHaveFocus();
    });

    it("never fires onPress", async () => {
      const onPress = vi.fn();
      const screen = await render(
        <Button isDisabled onPress={onPress}>
          Save
        </Button>,
      );
      await userEvent.click(screen.getByRole("button"), { force: true });
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  // WCAG 2.2 SC 2.5.8 Target Size (Minimum): at least 24 by 24 CSS pixels.
  it.each(["sm", "md"] as const)(
    "meets the minimum target size at size %s",
    async (size) => {
      const screen = await render(<Button size={size}>OK</Button>);
      const { width, height } = screen
        .getByRole("button")
        .element()
        .getBoundingClientRect();
      expect(height).toBeGreaterThanOrEqual(24);
      expect(width).toBeGreaterThanOrEqual(24);
    },
  );
});
