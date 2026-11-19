import { Button } from "@khee/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import type { KheeDocsParameters } from "../.storybook/khee-docs.ts";

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["experimental", "interactive"],
  // The component's defaults, set explicitly so the controls show them.
  args: {
    variant: "primary",
    size: "md",
    children: "Save changes",
    onPress: fn(),
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["primary", "secondary"],
    },
    size: {
      control: "inline-radio",
      options: ["sm", "md"],
    },
  },
  // Follows the WAI-ARIA APG button pattern.
  parameters: {
    kheeDocs: {
      keyboard: [
        { keys: "Tab", action: "Moves focus to the button." },
        { keys: "Shift + Tab", action: "Moves focus to the previous element." },
        { keys: "Enter", action: "Activates the button." },
        { keys: "Space", action: "Activates the button." },
      ],
      aria: [
        "Renders a native <button>, so it has the implicit button role.",
        "Its accessible name comes from its children. A button with no visible text needs an aria-label.",
        'type defaults to "button", so it never submits a form by accident. Set type="submit" for a form\'s submit button.',
        "isDisabled sets the native disabled attribute: the button is removed from the tab order, ignores presses, and is announced as dimmed or unavailable.",
        "The focus ring shows only for keyboard focus (data-focus-visible), not for pointer presses.",
      ],
    },
  } satisfies KheeDocsParameters,
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

const VARIANTS = ["primary", "secondary"] as const;
const SIZES = ["sm", "md"] as const;

export const Primary: Story = {
  args: { variant: "primary" },
};

export const Secondary: Story = {
  args: { variant: "secondary" },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="khee-sb-row">
      {SIZES.map((size) => (
        <Button key={size} {...args} size={size}>
          Size {size}
        </Button>
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  args: { isDisabled: true },
  render: (args) => (
    <div className="khee-sb-row">
      {VARIANTS.map((variant) => (
        <Button key={variant} {...args} variant={variant} />
      ))}
    </div>
  ),
};

/** German runs long. The button grows with its label instead of clipping it. */
export const LongLabel: Story = {
  args: {
    children:
      "Änderungen speichern und Benachrichtigungseinstellungen übernehmen",
  },
};

export const Dark: Story = {
  globals: { theme: "dark" },
  render: (args) => (
    <div className="khee-sb-row">
      {VARIANTS.flatMap((variant) =>
        SIZES.map((size) => (
          <Button
            key={`${variant}-${size}`}
            {...args}
            variant={variant}
            size={size}
          />
        )),
      )}
      <Button {...args} isDisabled />
    </div>
  ),
};

/** Arabic, right to left. The layout mirrors through logical properties. */
export const Rtl: Story = {
  globals: { direction: "rtl" },
  args: { children: "حفظ التغييرات" },
  render: (args) => (
    <div className="khee-sb-row" lang="ar">
      {VARIANTS.map((variant) => (
        <Button key={variant} {...args} variant={variant} />
      ))}
    </div>
  ),
};

export const KeyboardPress: Story = {
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole("button", { name: "Save changes" });

    await userEvent.tab();
    await expect(button).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    await expect(args.onPress).toHaveBeenCalledTimes(2);
  },
};
