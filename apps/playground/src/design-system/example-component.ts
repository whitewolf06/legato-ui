import { type Component, defineAsyncComponent } from "vue";
import PlaygroundPageLoading from "../PlaygroundPageLoading.vue";

const modules = import.meta.glob<{ default: Component }>("./examples/*.vue");
const sources = import.meta.glob<string>("./examples/*.vue", { query: "?raw", import: "default" });
const examples = Object.fromEntries(Object.entries(modules).map(([path, loader]) => [
  path, defineAsyncComponent({ loader, loadingComponent: PlaygroundPageLoading, errorComponent: PlaygroundPageLoading, delay: 0 })
]));

export function playgroundExample(name: string) {
  const path = `./examples/${name}.vue`;
  return { component: examples[path], loadSource: sources[path] };
}
