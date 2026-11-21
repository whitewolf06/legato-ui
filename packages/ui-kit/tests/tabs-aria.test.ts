import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { defineComponent, h } from "vue";
import { WlTabs } from "../src";

const items = [
  { key: "general settings", label: "General" },
  { key: "general-settings", label: "Settings" },
  { key: "details", label: "Details" }
];

describe("Tabs ID relationships", () => {
  it("keeps duplicate groups and colliding normalized keys unique with existing panel targets", () => {
    const Harness = defineComponent({ setup: () => () => h("div", [h(WlTabs, { items }), h(WlTabs, { items })]) });
    const wrapper = mount(Harness, { attachTo: document.body });
    try {
      const ids = wrapper.findAll("[id]").map((element) => element.attributes("id"));
      expect(ids).toHaveLength(12);
      expect(new Set(ids).size).toBe(ids.length);
      for (const tab of wrapper.findAll('[role="tab"]')) {
        const panel = document.getElementById(tab.attributes("aria-controls")!);
        expect(panel?.getAttribute("role")).toBe("tabpanel");
        expect(panel?.getAttribute("aria-labelledby")).toBe(tab.attributes("id"));
        expect(panel?.getAttribute("tabindex")).toBe("0");
        expect(panel?.hidden).toBe(tab.attributes("aria-selected") !== "true");
      }
    } finally { wrapper.unmount(); }
  });

  it("keeps inactive panel shells while unmounting their contents and preserves keyboard focus", async () => {
    const wrapper = mount(WlTabs, {
      attachTo: document.body,
      props: { items },
      slots: { panel: ({ item }) => h("span", { "data-panel-content": item.key }, item.label) }
    });
    try {
      const tabs = wrapper.findAll('[role="tab"]');
      expect(wrapper.findAll("[data-panel-content]")).toHaveLength(1);
      expect(wrapper.get("[data-panel-content]").text()).toBe("General");
      for (const [key, index] of [["ArrowRight", 1], ["End", 2], ["Home", 0], ["ArrowLeft", 2]] as const) {
        const current = wrapper.get('[role="tab"][aria-selected="true"]');
        await current.trigger("keydown", { key });
        expect(document.activeElement).toBe(tabs[index]!.element);
        expect(tabs[index]!.attributes("aria-selected")).toBe("true");
        expect(wrapper.findAll('[role="tabpanel"]')).toHaveLength(items.length);
        expect(wrapper.findAll("[data-panel-content]")).toHaveLength(1);
        expect(wrapper.get("[data-panel-content]").text()).toBe(items[index]!.label);
      }
    } finally { wrapper.unmount(); }
  });
});

describe("Tabs keyboard entry after item changes", () => {
  const alpha = { key: "a", label: "Alpha" };
  const beta = { key: "b", label: "Beta" };
  const extra = { key: "c", label: "Extra" };
  const disabled = { key: "d", label: "Disabled", disabled: true };

  it.each([
    { change: "a reorder", before: [alpha, beta], after: [beta, alpha] },
    { change: "an insertion", before: [alpha, beta, disabled], after: [alpha, extra, beta, disabled] }
  ])("keeps the selected tab as the only tab stop after $change", async ({ before, after }) => {
    const outside = document.createElement("button");
    document.body.append(outside);
    const wrapper = mount(WlTabs, { attachTo: document.body, props: { items: before, modelValue: "b" } });
    try {
      outside.focus();
      await wrapper.setProps({ items: after });
      expect(document.activeElement).toBe(outside);
      expect(wrapper.emitted("update:modelValue")).toBeUndefined();
      const selected = wrapper.get<HTMLElement>('[role="tab"][aria-selected="true"]');
      expect(selected.text()).toBe("Beta");
      expect(wrapper.findAll('[role="tab"][tabindex="0"]').map((tab) => tab.text())).toEqual(["Beta"]);

      selected.element.focus();
      await selected.trigger("keydown", { key: "ArrowRight" });
      const next = wrapper.get('[role="tab"][aria-selected="true"]');
      expect(next.text()).toBe("Alpha");
      expect(document.activeElement).toBe(next.element);
      expect(wrapper.emitted("update:modelValue")).toEqual([["a"]]);
    } finally {
      wrapper.unmount();
      outside.remove();
    }
  });
});
