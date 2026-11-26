<script setup lang="ts">
import { WlAvatar, WlButton, WlDialog, WlField, WlInput, WlPill, WlSelect } from "legato-ui";
import { computed, ref } from "vue";
import type { ApplicationExampleProps } from "../../../catalog";

type Stage = "todo" | "doing" | "done";
type Task = { id: number; title: string; assignee: string; stage: Stage; category: string };
const { locale } = defineProps<ApplicationExampleProps>();
const ru = locale === "ru";
const copy = ru
  ? {
      columns: ["Нужно сделать", "В работе", "Готово"], moves: ["В работу", "Завершить", "Вернуть в очередь"],
      category: ["Дизайн", "Разработка", "Контент"], add: "Новая задача", name: "Название задачи",
      assignee: "Исполнитель", cancel: "Отмена", save: "Создать задачу", empty: "В этой колонке пока пусто",
      count: "Задач в работе", created: "Задача добавлена",
      names: ["Собрать первый экран", "Проверить форму заказа", "Подготовить сетку карточек", "Описать правила темы", "Настроить тёмную тему", "Согласовать навигацию"],
      people: ["Мария Ким", "Илья Волков", "Анна Белова"]
    }
  : {
      columns: ["To do", "In progress", "Done"], moves: ["Start work", "Complete", "Move to to-do"],
      category: ["Design", "Development", "Content"], add: "New task", name: "Task name",
      assignee: "Assignee", cancel: "Cancel", save: "Create task", empty: "No tasks in this column",
      count: "Tasks in progress", created: "Task added",
      names: ["Build the first screen", "Review the order form", "Lay out the cards", "Document the theme rules", "Set up dark mode", "Review navigation"],
      people: ["Maria Kim", "Ilya Volkov", "Anna Belova"]
    };
const stages: Stage[] = ["todo", "doing", "done"];
const tasks = ref<Task[]>(copy.names.map((title, index) => ({
  id: index + 1, title, assignee: copy.people[index % 3]!, stage: stages[Math.floor(index / 2)]!, category: copy.category[index % 3]!
})));
const board = computed(() => stages.map((stage, index) => ({
  stage, title: copy.columns[index]!, action: copy.moves[index]!, next: stages[(index + 1) % stages.length]!,
  tasks: tasks.value.filter((item) => item.stage === stage)
})));
let nextId = tasks.value.length + 1;
const open = ref(false);
const entry = ref("");
const assignee = ref<string | null>(copy.people[0]!);
const feedback = ref("");
function startTask(): void {
  entry.value = "";
  assignee.value = copy.people[0]!;
  open.value = true;
}
function save(): void {
  const title = entry.value.trim();
  if (!title) return;
  tasks.value.push({ id: nextId++, title, assignee: assignee.value ?? copy.people[0]!, stage: "todo", category: copy.category[0]! });
  feedback.value = copy.created + " · " + title;
  open.value = false;
}
function move(task: Task, stage: Stage): void {
  task.stage = stage;
  feedback.value = task.title + " · " + copy.columns[stages.indexOf(stage)];
}
function initials(name: string): string {
  return name.split(" ").map((word) => word[0]).join("");
}
</script>

<template>
  <div class="wl-stack" data-space="lg">
    <div class="app-example-actions">
      <p class="wl-text-body wl-text-muted">{{ copy.count }} <strong>{{ board[1]?.tasks.length }}</strong></p>
      <WlButton variant="primary" @click="startTask">{{ copy.add }}</WlButton>
    </div>
    <div class="task-board">
      <section
        v-for="column in board"
        :key="column.stage"
        class="task-column wl-stack"
        data-space="sm"
        :aria-label="column.title"
      >
        <div class="app-example-actions">
          <h2 class="wl-text-subheading">{{ column.title }}</h2>
          <span class="task-total">{{ column.tasks.length }}</span>
        </div>
        <p v-if="!column.tasks.length" class="wl-text-small wl-text-muted">{{ copy.empty }}</p>
        <article
          v-for="task in column.tasks"
          :key="task.id"
          class="task-card wl-stack"
          data-space="sm"
        >
          <div><WlPill :label="task.category" :tone="column.stage === 'done' ? 'success' : 'accent'" /></div>
          <h3 class="wl-text-label">{{ task.title }}</h3>
          <div class="wl-inline" data-space="xs">
            <WlAvatar :label="initials(task.assignee)" :size="24" />
            <span class="wl-text-small">{{ task.assignee }}</span>
          </div>
          <div>
            <WlButton
              size="sm"
              :aria-label="column.action + ' · ' + task.title"
              @click="move(task, column.next)"
            >{{ column.action }}</WlButton>
          </div>
        </article>
      </section>
    </div>
    <p class="wl-text-small wl-text-muted app-example-status" role="status">{{ feedback }}</p>
    <WlDialog v-model:visible="open" :header="copy.add" size="sm">
      <form
        id="example-board-task"
        class="wl-stack"
        data-space="md"
        @submit.prevent="save"
      >
        <WlField :label="copy.name" required>
          <template #default="{ id }"><WlInput
            :id="id"
            v-model="entry"
            required
            maxlength="80"
            pattern=".*\S.*"
          /></template>
        </WlField>
        <WlField :label="copy.assignee">
          <template #default="{ labelId }"><WlSelect v-model="assignee" :aria-labelledby="labelId" :options="copy.people" /></template>
        </WlField>
      </form>
      <template #footer>
        <WlButton variant="ghost" @click="open = false">{{ copy.cancel }}</WlButton>
        <WlButton type="submit" form="example-board-task" variant="primary">{{ copy.save }}</WlButton>
      </template>
    </WlDialog>
  </div>
</template>

<style scoped>
.task-board { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--wl-space-md); }
.task-column { align-content: start; padding: var(--wl-space-md); border-radius: var(--wl-radius); background: var(--wl-bg-soft); }
.task-card {
  min-width: 0;
  padding: var(--wl-space-sm);
  background: var(--wl-bg-raised);
  border: 1px solid var(--wl-border);
  border-radius: var(--wl-radius);
}
.task-total { color: var(--wl-text-2); font-variant-numeric: tabular-nums; }
@media (max-width: 670px) { .task-board { grid-template-columns: minmax(0, 1fr); } }
</style>
