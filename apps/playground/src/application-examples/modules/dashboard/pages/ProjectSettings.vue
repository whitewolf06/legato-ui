<script setup lang="ts">
import { WlAvatar, WlButton, WlField, WlInput, WlPill, WlSwitch, type WlTabItem, WlTabs } from "legato-ui";
import { ref } from "vue";
import type { ApplicationExampleProps } from "../../../catalog";

const { locale } = defineProps<ApplicationExampleProps>();
const copy = locale === "ru"
  ? {
      profile: "Профиль", alerts: "Уведомления", team: "Команда",
      name: "Название проекта", email: "Рабочая почта", save: "Сохранить изменения", saved: "Изменения сохранены",
      mentions: "Упоминания в задачах", summary: "Еженедельная сводка", news: "Новости проекта",
      invite: "Добавить участника", invited: "Участник добавлен", duplicate: "Такая почта уже есть в команде",
      owner: "Владелец", member: "Участник", studio: "Студия Север", person: "Мария Ким", initials: "МК"
    }
  : {
      profile: "Profile", alerts: "Notifications", team: "Team",
      name: "Project name", email: "Work email", save: "Save changes", saved: "Changes saved",
      mentions: "Task mentions", summary: "Weekly digest", news: "Project updates",
      invite: "Add teammate", invited: "Teammate added", duplicate: "This email is already on the team",
      owner: "Owner", member: "Member", studio: "North Studio", person: "Maria Kim", initials: "MK"
    };
const tabs: WlTabItem[] = [
  { key: "profile", label: copy.profile, icon: "user" },
  { key: "alerts", label: copy.alerts, icon: "bell" },
  { key: "team", label: copy.team, icon: "users" }
];
const storageKey = "legato-ui.example.settings." + locale;
function readSaved(): { name?: string; email?: string; mentions?: boolean; summary?: boolean; news?: boolean } {
  try {
    return JSON.parse(sessionStorage.getItem(storageKey) ?? "{}") ?? {};
  } catch {
    return {};
  }
}
const saved = readSaved();
const active = ref("profile");
const name = ref(typeof saved.name === "string" ? saved.name : copy.studio);
const email = ref(typeof saved.email === "string" ? saved.email : "hello@example.com");
const mentions = ref(typeof saved.mentions === "boolean" ? saved.mentions : true);
const summary = ref(typeof saved.summary === "boolean" ? saved.summary : false);
const news = ref(typeof saved.news === "boolean" ? saved.news : true);
const inviteEmail = ref("");
const members = ref([{ name: copy.person, email: "maria@example.com", initials: copy.initials, role: copy.owner }]);
const feedback = ref("");
function save(): void {
  if (active.value === "profile") {
    name.value = name.value.trim();
    if (!name.value) return;
    Object.assign(saved, { name: name.value, email: email.value.trim() });
  } else {
    Object.assign(saved, { mentions: mentions.value, summary: summary.value, news: news.value });
  }
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(saved));
  } catch { /* The current view keeps its values when storage is unavailable. */ }
  feedback.value = copy.saved;
}
function invite(): void {
  const address = inviteEmail.value.trim().toLowerCase();
  if (!address) return;
  if (members.value.some((member) => member.email === address)) {
    feedback.value = copy.duplicate;
    return;
  }
  members.value.push({ name: address, email: address, initials: address.slice(0, 2).toUpperCase(), role: copy.member });
  inviteEmail.value = "";
  feedback.value = copy.invited + " · " + address;
}
</script>

<template>
  <section class="app-example-panel wl-stack" data-space="md">
    <WlTabs v-model="active" :items="tabs">
      <template #panel="{ item }">
        <form
          v-if="item.key === 'profile'"
          class="settings-panel wl-stack"
          data-space="md"
          @submit.prevent="save"
        >
          <WlField :label="copy.name" required>
            <template #default="{ id }"><WlInput
              :id="id"
              v-model="name"
              required
              maxlength="80"
              pattern=".*\S.*"
            /></template>
          </WlField>
          <WlField :label="copy.email" required>
            <template #default="{ id }"><WlInput
              :id="id"
              v-model="email"
              type="email"
              required
            /></template>
          </WlField>
          <div><WlButton type="submit" variant="primary">{{ copy.save }}</WlButton></div>
        </form>
        <form
          v-if="item.key === 'alerts'"
          class="settings-panel wl-stack"
          data-space="md"
          @submit.prevent="save"
        >
          <WlSwitch v-model="mentions">{{ copy.mentions }}</WlSwitch>
          <WlSwitch v-model="summary">{{ copy.summary }}</WlSwitch>
          <WlSwitch v-model="news">{{ copy.news }}</WlSwitch>
          <div><WlButton type="submit" variant="primary">{{ copy.save }}</WlButton></div>
        </form>
        <div v-if="item.key === 'team'" class="settings-panel wl-stack" data-space="md">
          <ul class="members">
            <li v-for="member in members" :key="member.email">
              <span class="settings-member">
                <WlAvatar :label="member.initials" :size="32" />
                <span>
                  <strong>{{ member.name }}</strong>
                  <small v-if="member.email !== member.name" class="wl-text-muted">{{ member.email }}</small>
                </span>
              </span>
              <WlPill :label="member.role" />
            </li>
          </ul>
          <form class="wl-stack" data-space="sm" @submit.prevent="invite">
            <WlField :label="copy.email" required>
              <template #default="{ id }"><WlInput
                :id="id"
                v-model="inviteEmail"
                type="email"
                required
              /></template>
            </WlField>
            <div><WlButton type="submit" variant="primary">{{ copy.invite }}</WlButton></div>
          </form>
        </div>
      </template>
    </WlTabs>
    <p class="wl-text-small wl-text-muted app-example-status" role="status">{{ feedback }}</p>
  </section>
</template>

<style scoped>
.settings-panel { max-width: 500px; padding-block: var(--wl-space-md); }
.members { list-style: none; margin: 0; padding: 0; }
.settings-member { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: var(--wl-space-sm); }
.settings-member :where(strong, small) { display: block; line-height: 1.3; }
.members li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--wl-space-sm);
  padding: var(--wl-space-sm) 0;
  border-bottom: 1px solid var(--wl-border);
  overflow-wrap: anywhere;
}
</style>
