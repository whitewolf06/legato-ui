import type { WlComponentManifest } from "legato-ui";

type Topic = "preview" | "appearance" | "size" | "states" | "content" | "selection" | "limits"
  | "format" | "placement" | "behavior" | "data" | "counter" | "indicators" | "validation";

// These are the props that make sense to try together in the canonical live examples.
const componentTopics: Readonly<Record<string, Partial<Record<Topic, readonly string[]>>>> = {
  WlAccordion: { selection: ["single"] },
  WlAlert: { appearance: ["tone", "closable"], content: ["title", "live"] },
  WlAutocomplete: { selection: ["minLength", "dropdown", "clearable"], states: ["loading", "invalid", "disabled"] },
  WlAvatar: { appearance: ["size", "presence", "shape"], content: ["label", "image"] },
  WlBadge: { appearance: ["tone", "dot"], counter: ["value", "max"] },
  WlBreadcrumbs: { appearance: ["separator", "maxItems"] },
  WlButtonGroup: { appearance: ["attached", "size", "density"] },
  WlCalendar: { selection: ["multiple", "disabled"] },
  WlCard: { appearance: ["variant", "padding", "hoverable"] },
  WlCheckbox: { states: ["indeterminate", "invalid", "disabled"], size: ["size", "density"] },
  WlCheckboxGroup: { appearance: ["orientation", "size", "density"], states: ["invalid", "loading", "disabled"] },
  WlChip: { indicators: ["count", "removable", "disabled"], size: ["size", "density"] },
  WlColorPicker: { appearance: ["alpha", "custom", "size"], data: [], states: ["invalid", "disabled"] },
  WlCommandPalette: { behavior: ["filter", "closeOnSelect", "loading"] },
  WlConfirmDialog: { preview: [] },
  WlContextMenu: { placement: ["placement", "align", "disabled"] },
  WlDatePicker: { selection: ["selectionMode", "displayFormat", "showIcon"], limits: ["minDate", "maxDate"], states: ["invalid", "disabled"] },
  WlDialog: { appearance: ["size", "header"], behavior: ["modal", "closeOnEscape", "closable"] },
  WlDivider: { placement: ["orientation"] },
  WlDrawer: { placement: ["position", "size"], behavior: ["dismissible", "closeOnEscape", "closable"] },
  WlEmpty: { content: ["icon", "title", "description"] },
  WlField: { content: ["label", "hint", "orientation"], validation: ["error", "required", "announceError"] },
  WlFilePicker: { selection: ["accept", "multiple"], size: ["size", "density", "disabled"] },
  WlFileUpload: { selection: ["multiple", "preview", "disabled"], limits: ["accept", "maxFiles", "maxSize"] },
  WlFilterBar: { indicators: ["activeCount", "showClear", "showApply"], states: ["density", "disabled"] },
  WlIcon: { appearance: ["name", "size"], content: ["title"] },
  WlIconButton: { appearance: ["variant", "tone", "size"], indicators: ["count", "dot", "active"], states: ["disabled", "loading"] },
  WlInput: { size: ["size", "density"], states: ["invalid", "disabled", "loading"], content: ["type", "clearable", "showCount"] },
  WlLink: { appearance: ["tone", "active"], behavior: ["external", "disabled"] },
  WlMenu: { preview: [] },
  WlMultiSelect: { appearance: ["display", "maxSelectedLabels"], selection: ["filter", "showSelectAll"], states: ["invalid", "loading", "disabled"] },
  WlNavItem: { appearance: ["icon", "badge", "collapsed"], states: ["active", "disabled"] },
  WlNumberInput: { limits: ["min", "max", "step"], format: ["format", "precision", "currency"], states: ["invalid", "disabled"] },
  WlPageHeader: { content: ["title", "description", "eyebrow"], size: ["size", "density", "headingLevel"] },
  WlPagination: { limits: ["pageCount", "siblings"], appearance: ["compact", "disabled"] },
  WlPasswordInput: { indicators: ["strength", "invalid", "disabled"], size: ["size", "density"] },
  WlPill: { appearance: ["tone", "dot"], content: ["label"] },
  WlPopover: { placement: ["placement", "align", "arrow"], behavior: ["dismissible", "closeOnEscape"] },
  WlProgress: { appearance: ["tone", "thin"], indicators: ["value", "indeterminate"] },
  WlRadio: { states: ["invalid", "disabled"], size: ["size", "density"] },
  WlRadioGroup: { appearance: ["orientation", "size", "density"], states: ["invalid", "loading", "disabled"] },
  WlSegmented: { appearance: ["orientation", "block", "disabled"] },
  WlSelect: { selection: ["filter", "clearable"], size: ["size", "density"], data: [], states: ["invalid", "loading", "disabled"] },
  WlSidebar: { behavior: ["collapsible", "expandOnHover", "showPin"], content: ["brand", "brandMark", "density"] },
  WlSkeleton: { appearance: ["preset", "shape", "lines"], size: ["width", "height", "borderRadius"] },
  WlSlider: { limits: ["min", "max", "step"], selection: ["range", "invalid", "disabled"] },
  WlSpinner: { appearance: ["size", "light"] },
  WlStatCard: { appearance: ["tone", "progress", "icon"], content: ["label", "value", "description"] },
  WlSteps: { selection: ["clickable", "orientation"] },
  WlSwitch: { appearance: ["size", "labelPosition", "density"], states: ["loading", "invalid", "disabled"] },
  WlTable: { behavior: ["stickyHeader", "loading"], data: ["emptyMessage"] },
  WlTabs: { placement: ["orientation"], behavior: ["lazy", "keepAlive"] },
  WlTag: { appearance: ["tone", "removable", "disabled"], size: ["size", "density"] },
  WlTagsInput: { limits: ["max", "allowDuplicates"], states: ["readonly", "invalid", "disabled"] },
  WlTextarea: { size: ["rows", "autoResize", "maxRows"], states: ["showCount", "invalid", "disabled"] },
  WlTimePicker: { format: ["hourFormat", "minTime", "maxTime"], states: ["size", "invalid", "disabled"] },
  WlToast: { preview: [] },
  WlToolbar: { placement: ["orientation", "loop", "disabled"] },
  WlTooltip: { placement: ["placement", "content"], behavior: ["showDelay", "hideDelay", "disabled"] }
};

export interface ComponentExampleTopic {
  id: string;
  title: string;
  controls: readonly string[];
  presets: boolean;
}

export function componentExampleTopics(name: WlComponentManifest["name"]): ComponentExampleTopic[] {
  return Object.entries(componentTopics[name] ?? { preview: [] }).map(([topic, controls], index) => ({
    id: index === 0 ? "preview" : "example-" + topic,
    title: "documentation.componentExamples." + topic,
    controls,
    presets: topic === "data"
  }));
}
