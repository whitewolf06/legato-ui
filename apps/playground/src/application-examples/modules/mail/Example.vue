<script setup lang="ts">
import { WlAvatar, WlButton, WlDialog, WlField, WlIcon, WlIconButton, WlInput, WlTextarea } from "legato-ui";
import { computed, nextTick, reactive, ref } from "vue";
import { type ApplicationModuleProps, applicationRecipesHref } from "../../catalog";
import { createInbox, mailCopy, type MailMessage } from "./content";

const { locale } = defineProps<ApplicationModuleProps>();
const copy = mailCopy[locale];
const messages = ref(createInbox(locale));
const folders = [
  { id: "inbox", icon: "inbox" }, { id: "starred", icon: "star" },
  { id: "sent", icon: "send" }, { id: "archive", icon: "box" }
] as const;
type Folder = typeof folders[number]["id"];
type Draft = { to: string; subject: string; body: string };
const folder = ref<Folder>("inbox");
const query = ref("");
const selected = ref<string | undefined>("shoot");
const smallView = ref<"folders" | "list" | "reader">("list");
const header = ref<HTMLHeadingElement>();
const readerTitle = ref<HTMLHeadingElement>();
const folderNav = ref<HTMLElement>();
const list = ref<HTMLElement>();
const opened = ref(false);
const drafts = reactive<Record<string, Draft>>({});
const draftKey = ref("new");
const draft = computed(() => drafts[draftKey.value]);
const feedback = ref("");
let sentId = 1;

function inFolder(message: MailMessage, location: Folder): boolean {
  if (location === "starred") return message.starred;
  if (location === "inbox") return !message.archived && !message.sent;
  return location === "sent" ? message.sent : message.archived;
}

const unread = computed(() => messages.value.filter((message) => inFolder(message, "inbox") && message.unread).length);
const visible = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase(locale);
  return messages.value.filter((message) =>
    inFolder(message, folder.value) && [message.person, message.subject, message.body].join(" ").toLocaleLowerCase(locale).includes(needle));
});
const selectedMessage = computed(() => visible.value.find(({ id }) => id === selected.value));

function focusOnPhone(element: HTMLElement | undefined): void {
  if (window.matchMedia("(max-width: 665px)").matches) element?.focus({ preventScroll: true });
}

function openMessage(message: MailMessage): void {
  message.unread = false;
  selected.value = message.id;
  smallView.value = "reader";
  void nextTick(() => {
    if (list.value) list.value.scrollTop = 0;
    focusOnPhone(readerTitle.value);
  });
}

function showList(): void {
  smallView.value = "list";
  void nextTick(() => focusOnPhone(header.value));
}

function chooseFolder(id: Folder): void {
  folder.value = id;
  query.value = "";
  selected.value = undefined;
  showList();
}

function showFolders(): void {
  smallView.value = "folders";
  void nextTick(() => folderNav.value?.querySelector<HTMLButtonElement>('button[aria-current="true"]')?.focus());
}

function toggleArchive(message: MailMessage): void {
  message.archived = !message.archived;
  feedback.value = message.archived ? copy.archived : copy.restored;
  closeIfMoved(message);
}

function toggleStar(message: MailMessage): void {
  message.starred = !message.starred;
  closeIfMoved(message);
}

function closeIfMoved(message: MailMessage): void {
  if (!inFolder(message, folder.value)) {
    selected.value = undefined;
    showList();
  }
}

function startCompose(message?: MailMessage): void {
  const key = message?.id ?? "new";
  drafts[key] ??= {
    to: message?.address ?? "",
    subject: message ? (message.subject.startsWith("Re: ") ? message.subject : "Re: " + message.subject) : "",
    body: ""
  };
  draftKey.value = key;
  opened.value = true;
}

function send(): void {
  const current = draft.value;
  if (!current || !current.to.trim() || !current.subject.trim() || !current.body.trim()) return;
  const id = "sent-" + sentId++;
  messages.value.unshift({
    id, person: current.to.trim(), address: current.to.trim(), subject: current.subject.trim(), body: current.body.trim(),
    date: copy.today, unread: false, archived: false, starred: false, sent: true
  });
  delete drafts[draftKey.value];
  opened.value = false;
  folder.value = "sent";
  query.value = "";
  selected.value = id;
  smallView.value = "reader";
  feedback.value = copy.delivered;
}

function attachmentHref(body: string): string {
  return "data:text/plain;charset=utf-8," + encodeURIComponent(body);
}
</script>

<template>
  <div class="mail-app">
    <header class="mail-topbar">
      <div class="mail-brand">
        <span class="mail-mark"><WlIcon name="message" :size="21" /></span>
        <strong>{{ copy.brand }}</strong>
        <span>{{ copy.address }}</span>
      </div>
      <div class="mail-account">
        <a v-if="!embedded" class="demo-return" :href="applicationRecipesHref(locale)">{{ copy.back }}</a>
        <WlAvatar :name="copy.user" :size="28" />
      </div>
    </header>

    <main class="mail-shell" :data-phone-view="smallView">
      <nav ref="folderNav" class="mail-sidebar" :aria-label="copy.folders">
        <WlButton class="mail-write" variant="primary" @click="startCompose()">
          <template #icon><WlIcon name="edit" :size="17" /></template>
          {{ copy.write }}
        </WlButton>
        <button
          v-for="item in folders"
          :key="item.id"
          type="button"
          class="mail-folder"
          :aria-current="folder === item.id ? 'true' : undefined"
          @click="chooseFolder(item.id)"
        >
          <WlIcon :name="item.icon" :size="18" />
          <span>{{ copy.folder[item.id] }}</span>
          <span v-if="item.id === 'inbox' && unread" class="mail-unread">{{ unread }}</span>
        </button>
      </nav>

      <section class="mail-list" aria-labelledby="mail-folder-title">
        <div class="mail-list-header">
          <div class="mail-list-title">
            <WlIconButton
              class="mail-mobile"
              icon="bars"
              :aria-label="copy.folders"
              @click="showFolders"
            />
            <h1 id="mail-folder-title" ref="header" tabindex="-1">{{ copy.folder[folder] }}</h1>
            <WlIconButton
              class="mail-mobile"
              icon="edit"
              variant="secondary"
              :aria-label="copy.write"
              @click="startCompose()"
            />
          </div>
          <WlInput
            v-model="query"
            :aria-label="copy.search"
            :placeholder="copy.search"
            clearable
          />
        </div>
        <ul>
          <li v-for="message in visible" :key="message.id">
            <button
              type="button"
              class="mail-row"
              :aria-current="message.id === selected ? 'true' : undefined"
              :data-unread="message.unread"
              @click="openMessage(message)"
            >
              <span class="mail-row-person">
                <span v-if="message.unread" class="mail-dot"><span class="wl-visually-hidden">{{ copy.unread }}</span></span>
                <strong>{{ message.person }}</strong>
                <span class="mail-date">{{ message.date }}</span>
              </span>
              <span class="mail-row-subject">
                <span>{{ message.subject }}</span>
                <WlIcon
                  v-if="message.starred"
                  name="star"
                  :size="15"
                  :aria-label="copy.star"
                />
                <WlIcon v-if="message.attachment" name="paperclip" :size="15" />
              </span>
              <span class="mail-row-preview">{{ message.body }}</span>
            </button>
          </li>
        </ul>
        <p v-if="!visible.length" class="mail-empty">{{ query.trim() ? copy.noMatches : copy.empty }}</p>
      </section>

      <section class="mail-reader" :aria-label="copy.reader">
        <div v-if="selectedMessage" ref="list" class="mail-letter">
          <div class="mail-tools">
            <WlIconButton
              class="mail-mobile"
              icon="arrow-left"
              :aria-label="copy.backToList"
              @click="showList"
            />
            <div class="mail-tools-spacer"></div>
            <WlIconButton
              v-if="!selectedMessage.sent"
              :icon="selectedMessage.archived ? 'inbox' : 'box'"
              :aria-label="selectedMessage.archived ? copy.restore : copy.archive"
              variant="secondary"
              @click="toggleArchive(selectedMessage)"
            />
            <WlIconButton
              icon="star"
              :active="selectedMessage.starred"
              :aria-pressed="selectedMessage.starred"
              :aria-label="copy.star"
              variant="secondary"
              @click="toggleStar(selectedMessage)"
            />
          </div>
          <h2 ref="readerTitle" tabindex="-1">{{ selectedMessage.subject }}</h2>
          <div class="mail-byline">
            <WlAvatar :name="selectedMessage.person" :size="36" aria-hidden="true" />
            <div>
              <strong>{{ selectedMessage.person }}</strong>
              <small>{{ selectedMessage.sent ? copy.to : selectedMessage.address }}</small>
            </div>
            <span class="mail-date">{{ selectedMessage.date }}</span>
          </div>
          <div class="mail-letter-body">{{ selectedMessage.body }}</div>
          <a
            v-if="selectedMessage.attachment"
            class="mail-attachment"
            :href="attachmentHref(selectedMessage.attachment.body)"
            :download="selectedMessage.attachment.name"
          >
            <WlIcon name="file" :size="20" />
            <span>{{ selectedMessage.attachment.name }}</span>
            <WlIcon name="download" :size="17" />
          </a>
          <div v-if="!selectedMessage.sent" class="mail-reply">
            <WlButton variant="secondary" @click="startCompose(selectedMessage)">
              <template #icon><WlIcon name="arrow-left" :size="16" /></template>
              {{ copy.reply }}
            </WlButton>
          </div>
        </div>
        <div v-else class="mail-placeholder">
          <WlIcon name="inbox" :size="30" />
          <p>{{ copy.select }}</p>
          <WlButton class="mail-mobile" variant="secondary" @click="showList">{{ copy.backToList }}</WlButton>
        </div>
      </section>
      <p v-if="feedback" class="wl-visually-hidden" role="status">{{ feedback }}</p>
    </main>

    <WlDialog v-model:visible="opened" :header="copy.write" size="lg">
      <form
        v-if="draft"
        class="mail-form demo-dialog-form wl-stack"
        data-space="md"
        @submit.prevent="send"
      >
        <WlField :label="copy.to" required>
          <template #default="{ id }"><WlInput
            :id="id"
            v-model="draft.to"
            type="email"
            maxlength="180"
            required
          /></template>
        </WlField>
        <WlField :label="copy.subject" required>
          <template #default="{ id }"><WlInput
            :id="id"
            v-model="draft.subject"
            maxlength="120"
            required
          /></template>
        </WlField>
        <WlField :label="copy.body" required>
          <template #default="{ id }"><WlTextarea
            :id="id"
            v-model="draft.body"
            :rows="5"
            maxlength="2400"
            required
          /></template>
        </WlField>
        <div class="demo-line">
          <p class="wl-text-muted wl-text-small">{{ copy.local }}</p>
          <WlButton type="submit" variant="primary" :disabled="!draft.body.trim() || !draft.subject.trim()">{{ copy.send }}</WlButton>
        </div>
      </form>
    </WlDialog>
  </div>
</template>

<style scoped src="./mail.css"></style>
