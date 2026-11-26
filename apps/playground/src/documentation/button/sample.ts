import type { Component } from "vue";
import { consumerSource } from "../../design-system/code";

export interface ButtonTopic {
  name: string;
  id: string;
  title: string;
  description: string;
  defaults: Record<string, string | boolean>;
  demo: Component;
  raw: string;
  comparison: Component;
  comparisonRaw: string;
  comparisonLabel: string;
}

/** Use the same SFC and selected props for the demo, snippet and runnable project. */
export function buttonSample(raw: string, settings: Record<string, string | boolean>) {
  const attributes = Object.entries(settings).map(([key, value]) => {
    const name = key.replace(/[A-Z]/g, (letter) => "-" + letter.toLowerCase());
    if (typeof value === "boolean") return value ? " " + name : "";
    return " " + name + '="' + value + '"';
  }).join("");
  const source = consumerSource(raw.replace(' v-bind="preview"', attributes))
    .replace(/\{\{ ("(?:[^"\\]|\\.)*") \}\}/g, (_, literal: string) =>
      (JSON.parse(literal) as string).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\{/g, "&#123;"));
  const match = /^([ \t]*)(<WlButton\b[\s\S]*?<\/WlButton>)/m.exec(source);
  if (!match) throw new Error("Button example must include a WlButton");
  const snippet = match[2]!.split("\n" + match[1]).join("\n");
  return { source, snippet };
}
