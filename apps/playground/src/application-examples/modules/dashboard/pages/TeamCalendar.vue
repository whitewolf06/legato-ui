<script setup lang="ts">
import { WlButton, WlCalendar, WlDialog, WlEmpty, WlField, WlInput, WlTimePicker } from "legato-ui";
import { computed, ref } from "vue";
import type { ApplicationExampleProps } from "../../../catalog";

type Meeting = { id: number; date: string; title: string; time: string };
const { locale } = defineProps<ApplicationExampleProps>();
const copy = locale === "ru"
  ? {
      add: "Новая встреча", edit: "Изменить встречу", name: "Название встречи", time: "Время начала",
      schedule: "Расписание дня", cancel: "Отмена", save: "Сохранить", remove: "Удалить встречу",
      empty: "Встреч на этот день нет", saved: "Встреча сохранена", removed: "Встреча удалена",
      meetings: ["Планирование недели", "Ревью интерфейсов", "Подготовка релиза", "Разбор обратной связи"]
    }
  : {
      add: "New meeting", edit: "Edit meeting", name: "Meeting name", time: "Start time",
      schedule: "Daily schedule", cancel: "Cancel", save: "Save", remove: "Delete meeting",
      empty: "No meetings on this day", saved: "Meeting saved", removed: "Meeting deleted",
      meetings: ["Weekly planning", "Interface review", "Release preparation", "Feedback review"]
    };
const day = ref("2026-11-26");
const month = ref("2026-11");
const meetings = ref<Meeting[]>(copy.meetings.map((title, index) => ({
  id: index + 1, title, date: ["2026-11-26", "2026-11-26", "2026-11-27", "2026-11-30"][index]!,
  time: ["10:00", "14:30", "11:15", "16:00"][index]!
})));
const events = computed(() => meetings.value.map(({ id, date, title }) => ({ id: String(id), date, label: title, tone: "blue" as const })));
const agenda = computed(() => meetings.value.filter((meeting) => meeting.date === day.value)
  .sort((left, right) => left.time.localeCompare(right.time)));
const formatDay = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
let nextId = meetings.value.length + 1;
const open = ref(false);
const meetingId = ref<number | null>(null);
const title = ref("");
const time = ref<string | null>("10:00");
const feedback = ref("");
function edit(meeting?: Meeting): void {
  meetingId.value = meeting?.id ?? null;
  title.value = meeting?.title ?? "";
  time.value = meeting?.time ?? "10:00";
  open.value = true;
}
function save(): void {
  const name = title.value.trim();
  if (!name || !time.value) return;
  const existing = meetings.value.find(({ id }) => id === meetingId.value);
  if (existing) Object.assign(existing, { title: name, time: time.value });
  else meetings.value.push({ id: nextId++, date: day.value, title: name, time: time.value });
  feedback.value = copy.saved + " · " + name;
  open.value = false;
}
function remove(): void {
  const index = meetings.value.findIndex(({ id }) => id === meetingId.value);
  if (index === -1) return;
  meetings.value.splice(index, 1);
  feedback.value = copy.removed;
  open.value = false;
}
</script>

<template>
  <div class="wl-stack" data-space="md">
    <div class="app-example-split">
      <div class="app-example-panel wl-fluid">
        <WlCalendar v-model="day" v-model:month="month" :events="events" />
      </div>
      <section class="app-example-panel wl-stack" data-space="md" aria-labelledby="agenda-title">
        <div>
          <h2 id="agenda-title" class="wl-text-subheading">{{ copy.schedule }}</h2>
          <p class="wl-text-small wl-text-muted">{{ formatDay.format(new Date(day + 'T00:00:00Z')) }}</p>
        </div>
        <WlEmpty v-if="agenda.length === 0" icon="calendar" :title="copy.empty" />
        <ul v-else class="meeting-list wl-stack" data-space="sm">
          <li v-for="meeting in agenda" :key="meeting.id">
            <button type="button" class="meeting-button" @click="edit(meeting)">
              <span class="wl-text-small">{{ meeting.time }}</span>
              <span class="wl-text-label">{{ meeting.title }}</span>
            </button>
          </li>
        </ul>
        <div><WlButton size="sm" variant="primary" @click="edit()">{{ copy.add }}</WlButton></div>
      </section>
    </div>
    <p class="wl-text-small wl-text-muted app-example-status" role="status">{{ feedback }}</p>
    <WlDialog v-model:visible="open" size="sm" :header="meetingId === null ? copy.add : copy.edit">
      <form
        id="example-meeting"
        class="wl-stack"
        data-space="md"
        @submit.prevent="save"
      >
        <WlField :label="copy.name" required>
          <template #default="{ id }"><WlInput
            :id="id"
            v-model="title"
            required
            maxlength="80"
            pattern=".*\S.*"
          /></template>
        </WlField>
        <WlField :label="copy.time" required>
          <template #default="{ id }"><WlTimePicker
            :id="id"
            v-model="time"
            required
            show-icon
          /></template>
        </WlField>
      </form>
      <template #footer>
        <WlButton
          v-if="meetingId !== null"
          variant="ghost"
          tone="danger"
          @click="remove"
        >{{ copy.remove }}</WlButton>
        <WlButton v-else variant="ghost" @click="open = false">{{ copy.cancel }}</WlButton>
        <WlButton type="submit" form="example-meeting" variant="primary">{{ copy.save }}</WlButton>
      </template>
    </WlDialog>
  </div>
</template>

<style scoped>
.meeting-list { list-style: none; margin: 0; padding: 0; }
.meeting-button {
  text-align: start;
  display: flex;
  gap: var(--wl-space-sm);
  width: 100%;
  padding: var(--wl-space-sm);
  border: 1px solid var(--wl-border);
  border-radius: var(--wl-radius);
  color: var(--wl-text);
  cursor: pointer;
  background: var(--wl-bg-soft);
}
.meeting-button:hover { border-color: var(--wl-accent-border); }
.meeting-button > :first-child { color: var(--wl-text-accent); }
</style>
