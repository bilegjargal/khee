import { Button, Card } from "@khee/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import type { KheeDocsParameters } from "../.storybook/khee-docs.ts";

const meta = {
  title: "Components/Card",
  component: Card,
  // Not interactive (ADR 0011), so no "interactive" tag.
  tags: ["experimental"],
  // Card has no ARIA pattern; its content keeps its own semantics.
  parameters: {
    kheeDocs: {
      keyboard: [],
      aria: [
        "Renders a plain <div> with no role, and it is never focusable. Tab moves straight to the interactive content inside it.",
        'When a card is a landmark, add role="region" with aria-labelledby pointing at its heading, or put <article> or <section> content inside it.',
        "Headings, text, and controls inside the card are your own markup and keep their own roles and names. Pick heading levels that fit the page outline.",
        "A clickable card is a different component. Never add onClick to Card; put a Button or link inside it instead.",
        "Its outline uses --khee-color-border-subtle, which is decorative. In forced colors mode the outline switches to CanvasText, since shadows disappear.",
      ],
    },
  } satisfies KheeDocsParameters,
  render: (args) => (
    <Card {...args}>
      <h2 className="khee-sb-title">Billing</h2>
      <p className="khee-sb-flush">
        Your next invoice is due on the first of the month.
      </p>
    </Card>
  ),
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// Long text and a button row, shared by several stories.
const renderWithAction: NonNullable<Story["render"]> = (args) => (
  <Card {...args}>
    <h2 className="khee-sb-title">Notifications</h2>
    <p className="khee-sb-flush">
      Choose how you hear about activity in your workspace. We send a summary
      email once a day with mentions, replies, and changes to the documents you
      follow, and we only send a push notification when someone mentions you
      directly or assigns you a task. You can change these settings at any time,
      and they apply to every device you are signed in on.
    </p>
    <div className="khee-sb-row">
      <Button>Save changes</Button>
      <Button variant="secondary">Cancel</Button>
    </div>
  </Card>
);

export const Default: Story = {};

/**
 * The card grows with its content and never sets a fixed width.
 * Card stretches its children, so put buttons in their own row.
 */
export const WithAction: Story = {
  render: renderWithAction,
};

/** German runs long. Long compound words wrap instead of overflowing. */
export const LongLabel: Story = {
  render: (args) => (
    <Card {...args} lang="de">
      <h2 className="khee-sb-title">Benachrichtigungseinstellungen</h2>
      <p className="khee-sb-flush">
        Datenschutzgrundverordnungskonformitätsprüfung und
        Kontoverwaltungsberechtigungen werden für jedes Gerät übernommen.
      </p>
      <div className="khee-sb-row">
        <Button>Änderungen speichern</Button>
      </div>
    </Card>
  ),
};

export const Dark: Story = {
  globals: { theme: "dark" },
  render: renderWithAction,
};

/** Arabic, right to left. The layout mirrors through logical properties. */
export const Rtl: Story = {
  globals: { direction: "rtl" },
  render: (args) => (
    <Card {...args} lang="ar">
      <h2 className="khee-sb-title">الفواتير</h2>
      <p className="khee-sb-flush">
        فاتورتك التالية مستحقة في اليوم الأول من الشهر.
      </p>
      <div className="khee-sb-row">
        <Button>حفظ التغييرات</Button>
        <Button variant="secondary">إلغاء</Button>
      </div>
    </Card>
  ),
};

/** The card is never a tab stop: Tab lands on the first control inside it. */
export const KeyboardSkipsCard: Story = {
  render: renderWithAction,
  play: async ({ canvas }) => {
    await userEvent.tab();
    await expect(
      canvas.getByRole("button", { name: "Save changes" }),
    ).toHaveFocus();
  },
};
