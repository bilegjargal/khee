import {
  Controls,
  Description,
  Heading,
  Primary,
  Stories,
  Title,
  useOf,
} from "@storybook/addon-docs/blocks";
import type { KheeDocs } from "./khee-docs.ts";
import { StatusBadge } from "./status-badge.tsx";

function NotDocumented() {
  return <p className="khee-sb-notice sb-unstyled">Not documented yet.</p>;
}

function KeyboardSection({ keyboard }: { keyboard: KheeDocs["keyboard"] }) {
  return (
    <section>
      <Heading>Keyboard</Heading>
      {keyboard?.length ? (
        <table>
          <thead>
            <tr>
              <th scope="col">Keys</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {keyboard.map(({ keys, action }) => (
              <tr key={keys}>
                <td>
                  <kbd>{keys}</kbd>
                </td>
                <td>{action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <NotDocumented />
      )}
    </section>
  );
}

function AriaSection({ aria }: { aria: KheeDocs["aria"] }) {
  return (
    <section>
      <Heading>ARIA</Heading>
      {aria?.length ? (
        <ul>
          {aria.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : (
        <NotDocumented />
      )}
    </section>
  );
}

/**
 * The docs page for every component: title and status, description, the
 * primary story with controls, keyboard and ARIA notes, then the other stories.
 */
export function DocsPage() {
  const { preparedMeta } = useOf("meta", ["meta"]);
  const docs = preparedMeta.parameters.kheeDocs as KheeDocs | undefined;

  return (
    <>
      <Title />
      <StatusBadge tags={preparedMeta.tags} />
      <Description />
      <Primary />
      <Controls />
      <KeyboardSection keyboard={docs?.keyboard} />
      <AriaSection aria={docs?.aria} />
      <Stories includePrimary={false} />
    </>
  );
}
