import { flushPromises } from "@vue/test-utils";
import { describe, expect, it, onTestFinished, vi } from "vitest";
import { createSSRApp, defineComponent, h, nextTick, type PropType, ref, Suspense, version } from "vue";
import { renderToString } from "vue/server-renderer";
import type { WlFieldSlotProps } from "../../src/field-types";
import WlField from "../../src/components/WlField.vue";
import { WlConfig } from "../../src/config";

const fieldNames = ["Billing", "Shipping"] as const;
type FieldName = typeof fieldNames[number];
interface FormOptions {
  explicitIds?: boolean;
  idPrefix?: string;
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function createForm({ explicitIds, idPrefix }: FormOptions) {
  const pending = { Billing: deferred(), Shipping: deferred() };
  const billingInputKey = ref(0);
  const showNotes = ref(false);
  const AsyncField = defineComponent({
    props: { name: { type: String as PropType<FieldName>, required: true } },
    async setup({ name }) {
      await pending[name].promise;
      return () => h(WlField, { label: name, id: explicitIds ? `field-${name}` : undefined }, {
        default: ({ id }: WlFieldSlotProps) => h("input", { id, key: name === "Billing" ? billingInputKey.value : 0 })
      });
    }
  });
  const app = createSSRApp({
    render: () => h("form", [
      ...fieldNames.map((name) => h(Suspense, { key: name }, { default: () => h(AsyncField, { name }) })),
      showNotes.value
        ? h(WlField, { label: "Notes" }, { default: ({ id }: WlFieldSlotProps) => h("input", { id }) })
        : null
    ])
  });
  if (idPrefix) app.use(WlConfig, { idPrefix });
  async function resolveField(name: FieldName) {
    pending[name].resolve();
    await flushPromises();
  }
  return { app, billingInputKey, resolveField, showNotes };
}

async function renderForm(options: FormOptions) {
  const server = createForm(options);
  const html = renderToString(server.app);
  await server.resolveField("Billing");
  await server.resolveField("Shipping");
  return html;
}

async function hydrateForm(options: FormOptions) {
  const container = document.createElement("div");
  container.innerHTML = await renderForm(options);
  const serverInputs = [...container.querySelectorAll("input")];
  const client = createForm(options);
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  document.body.append(container);
  onTestFinished(() => {
    client.app.unmount();
    container.remove();
    warn.mockRestore();
    error.mockRestore();
  });
  client.app.mount(container);
  return { client, container, serverInputs, warn, error };
}

function expectLinkedFields(container: HTMLElement, names: readonly string[]) {
  const inputs = [...container.querySelectorAll("input")];
  const labels = [...container.querySelectorAll("label")];
  expect(labels.map((label) => label.textContent)).toEqual(names);
  expect(inputs).toHaveLength(names.length);
  const ids = [...container.querySelectorAll("[id]")].map((element) => element.id);
  expect(ids).not.toContain("");
  expect(new Set(ids).size).toBe(ids.length);
  labels.forEach((label, index) => expect(label.control).toBe(inputs[index]));
  return inputs;
}

describe(`WlField IDs through async SSR hydration (Vue ${version})`, () => {
  it.each([
    { scenario: "generated IDs and matching order", explicitIds: false, first: "Billing", second: "Shipping" },
    { scenario: "generated IDs and reversed order", explicitIds: false, first: "Shipping", second: "Billing" },
    { scenario: "explicit IDs and reversed order", explicitIds: true, first: "Shipping", second: "Billing" }
  ] as const)("keeps each label linked to its input with $scenario", async ({ explicitIds, first, second }) => {
    const { client, container, serverInputs, warn, error } = await hydrateForm({ explicitIds });
    const serverIds = serverInputs.map((input) => input.id);
    await client.resolveField(first);
    await client.resolveField(second);
    const hydratedInputs = expectLinkedFields(container, fieldNames);
    expect(hydratedInputs[0]).toBe(serverInputs[0]);
    expect(hydratedInputs[1]).toBe(serverInputs[1]);
    // Hydration can retain the server's attributes until Vue creates a new input.
    client.billingInputKey.value++;
    await nextTick();
    const inputs = expectLinkedFields(container, fieldNames);
    expect(inputs[0]).not.toBe(serverInputs[0]);
    expect(inputs[1]).toBe(serverInputs[1]);
    expect(inputs.map((input) => input.id)).toEqual(explicitIds ? ["field-Billing", "field-Shipping"] : serverIds);
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it.each([
    { hydrated: "Billing", pending: "Shipping" },
    { hydrated: "Shipping", pending: "Billing" }
  ] as const)("keeps a new client field distinct while $pending is waiting for hydration", async ({ hydrated, pending }) => {
    const { client, container, serverInputs, warn, error } = await hydrateForm({ idPrefix: "checkout" });
    const serverIds = serverInputs.map((input) => input.id);
    await client.resolveField(hydrated);
    client.showNotes.value = true;
    await nextTick();
    const names = [...fieldNames, "Notes"];
    const initialIds = expectLinkedFields(container, names).map((input) => input.id);
    expect(initialIds.slice(0, 2)).toEqual(serverIds);
    expect(initialIds.every((id) => id.startsWith("wl-field-checkout-"))).toBe(true);

    await client.resolveField(pending);
    client.billingInputKey.value++;
    await nextTick();
    expect(expectLinkedFields(container, names).map((input) => input.id)).toEqual(initialIds);
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it("isolates prefixed field IDs across concurrent SSR requests", async () => {
    const [first, repeat, other] = await Promise.all([
      renderForm({ idPrefix: "checkout" }), renderForm({ idPrefix: "checkout" }), renderForm({ idPrefix: "profile" })
    ]);
    expect(repeat).toBe(first);
    const container = document.createElement("div");
    container.innerHTML = first + other;
    const inputs = expectLinkedFields(container, [...fieldNames, ...fieldNames]);
    expect(inputs.slice(0, 2).every((input) => input.id.startsWith("wl-field-checkout-"))).toBe(true);
    expect(inputs.slice(2).every((input) => input.id.startsWith("wl-field-profile-"))).toBe(true);
  });
});
