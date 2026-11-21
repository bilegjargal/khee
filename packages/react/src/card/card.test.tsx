import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button } from "../button/button.js";
import { Card } from "./card.js";

describe("Card", () => {
  it("renders a div with the khee-card class and no role", async () => {
    const screen = await render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId("card").element();
    expect(card).toBeInstanceOf(HTMLDivElement);
    expect(card).toHaveAttribute("class", "khee-card");
    expect(card).not.toHaveAttribute("role");
    expect(card).not.toHaveAttribute("tabindex");
  });

  it("appends a consumer className", async () => {
    const screen = await render(
      <Card data-testid="card" className="app-card">
        Content
      </Card>,
    );
    await expect
      .element(screen.getByTestId("card"))
      .toHaveAttribute("class", "khee-card app-card");
  });

  it("passes a style object through", async () => {
    const screen = await render(
      <Card data-testid="card" style={{ marginInlineStart: "3px" }}>
        Content
      </Card>,
    );
    await expect
      .element(screen.getByTestId("card"))
      .toHaveStyle({ marginInlineStart: "3px" });
  });

  it("forwards its ref to the div element", async () => {
    const ref = createRef<HTMLDivElement>();
    const screen = await render(
      <Card ref={ref} data-testid="card">
        Content
      </Card>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toBe(screen.getByTestId("card").element());
  });

  it("becomes a named region with role and aria-labelledby", async () => {
    const screen = await render(
      <Card role="region" aria-labelledby="billing-title">
        <h2 id="billing-title">Billing</h2>
      </Card>,
    );
    await expect
      .element(screen.getByRole("region", { name: "Billing" }))
      .toBeInTheDocument();
  });

  it("is not a tab stop, so Tab moves straight to its content", async () => {
    const screen = await render(
      <Card>
        <p>Text</p>
        <Button>Save</Button>
      </Card>,
    );
    await userEvent.tab();
    await expect
      .element(screen.getByRole("button", { name: "Save" }))
      .toHaveFocus();
  });
});
