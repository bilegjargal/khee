import { Button, Card } from "@khee/react";

// A server component. It renders client components without event handlers,
// since functions cannot cross the server boundary.
export default function Page() {
  return (
    <main style={{ padding: "var(--khee-space-lg)" }}>
      <h1
        style={{
          marginBlockEnd: "var(--khee-space-md)",
          fontSize: "var(--khee-font-size-lg)",
        }}
      >
        Khee Next.js check
      </h1>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--khee-space-sm)",
        }}
      >
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
      </div>
      <Card
        role="region"
        aria-labelledby="card-title"
        style={{ marginBlockStart: "var(--khee-space-lg)" }}
      >
        <h2 id="card-title" style={{ margin: 0 }}>
          Card
        </h2>
        <p style={{ margin: 0 }}>Rendered by a server component.</p>
        <div>
          <Button>Action</Button>
        </div>
      </Card>
    </main>
  );
}
