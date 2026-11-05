import "@khee/tokens/tokens.css";
import "@khee/react/reset.css";
import "@khee/react/components.css";
import "./preview.css";
import type { Preview } from "@storybook/react-vite";

const preview: Preview = {
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default preview;
