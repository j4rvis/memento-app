"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { NewspaperEditorClient as NewspaperEditorClientType } from "./newspaper-editor-client";

const NewspaperEditorClient = dynamic(
  () =>
    import("./newspaper-editor-client").then((m) => ({
      default: m.NewspaperEditorClient,
    })),
  { ssr: false }
);

export function NewspaperEditorNoSSR(
  props: ComponentProps<typeof NewspaperEditorClientType>
) {
  return <NewspaperEditorClient {...props} />;
}
