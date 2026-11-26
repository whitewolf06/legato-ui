<script setup lang="ts">
import { WlAvatar, WlButton, WlIcon, WlIconButton, WlInput, WlTextarea } from "legato-ui";
import { computed, nextTick, ref } from "vue";
import { type ApplicationModuleProps, applicationRecipesHref } from "../../catalog";
import { chatCopy, type ChatMessage, people, type RoomId, rooms } from "./content";

const { locale } = defineProps<ApplicationModuleProps>();
const copy = chatCopy[locale];
const messages = ref<ChatMessage[]>(copy.messages.map((message) => ({ ...message })));
const nextId = ref(messages.value.length + 1);
const activeRoom = ref<RoomId>("studio");
const unread = ref<Record<RoomId, number>>({ studio: 0, launch: 2, ideas: 1, mira: 0, dan: 0 });
const drafts = ref<Record<RoomId, string>>({ studio: "", launch: "", ideas: "", mira: "", dan: "" });
const replyTo = ref<number>();
const query = ref("");
const searching = ref(false);
const showConversation = ref(true);
const list = ref<HTMLOListElement>();
const roomNav = ref<HTMLElement>();
const heading = ref<HTMLHeadingElement>();
const searchArea = ref<HTMLElement>();
const composer = ref<HTMLElement>();
const time = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" });
const room = computed(() => rooms.find(({ id }) => id === activeRoom.value) ?? rooms[0]);
const channels = rooms.filter((item) => "icon" in item);
const directRooms = rooms.filter((item) => "person" in item);
const directPerson = computed(() => "person" in room.value ? people[room.value.person] : undefined);
const roomMessages = computed(() => messages.value.filter(({ room }) => room === activeRoom.value));
const visibleMessages = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase(locale);
  return needle
    ? roomMessages.value.filter((message) =>
        (people[message.by][locale] + " " + message.text).toLocaleLowerCase(locale).includes(needle))
    : roomMessages.value;
});
const byId = computed(() => new Map(messages.value.map((message) => [message.id, message])));
const reply = computed(() => replyTo.value === undefined ? undefined : byId.value.get(replyTo.value));

function focusComposer(): void {
  composer.value?.querySelector("textarea")?.focus();
}

function openRoom(id: RoomId): void {
  activeRoom.value = id;
  unread.value[id] = 0;
  replyTo.value = undefined;
  query.value = "";
  searching.value = false;
  showConversation.value = true;
  void nextTick(() => {
    if (window.matchMedia("(max-width: 620px)").matches) heading.value?.focus({ preventScroll: true });
    if (list.value) list.value.scrollTop = 0;
  });
}

function showRooms(): void {
  showConversation.value = false;
  void nextTick(() => roomNav.value?.querySelector<HTMLButtonElement>('button[aria-current="true"]')?.focus());
}

function toggleSearch(): void {
  searching.value = !searching.value;
  query.value = "";
  if (searching.value) void nextTick(() => searchArea.value?.querySelector("input")?.focus());
}

function startReply(message: ChatMessage): void {
  replyTo.value = message.id;
  void nextTick(focusComposer);
}

function send(): void {
  const id = activeRoom.value;
  const text = drafts.value[id].trim();
  if (!text) return;
  messages.value.push({
    id: nextId.value++, room: id, by: "you", time: time.format(new Date()), text,
    ...(replyTo.value === undefined ? {} : { reply: replyTo.value })
  });
  drafts.value[id] = "";
  replyTo.value = undefined;
  query.value = "";
  searching.value = false;
  void nextTick(() => {
    if (list.value) list.value.scrollTop = list.value.scrollHeight;
    focusComposer();
  });
}
</script>

<template>
  <div class="chat-app">
    <header class="chat-topbar">
      <div class="chat-brand">
        <span class="chat-brand-icon"><WlIcon name="comment" :size="20" /></span>
        <strong>{{ copy.brand }}</strong>
        <span class="chat-workspace">{{ copy.workspace }}</span>
      </div>
      <div class="chat-profile">
        <a v-if="!embedded" class="demo-return" :href="applicationRecipesHref(locale)">{{ copy.back }}</a>
        <WlAvatar :name="people.you[locale]" :size="28" presence="online" />
      </div>
    </header>

    <main class="chat-shell" :class="{ 'chat-shell--conversation': showConversation }">
      <nav ref="roomNav" class="chat-sidebar" :aria-label="copy.rooms">
        <h2>{{ copy.channels }}</h2>
        <button
          v-for="channel in channels"
          :key="channel.id"
          type="button"
          class="chat-room"
          :aria-current="activeRoom === channel.id ? 'true' : undefined"
          @click="openRoom(channel.id)"
        >
          <WlIcon :name="channel.icon" :size="17" />
          <span>{{ channel[locale].title }}</span>
          <span v-if="unread[channel.id]" class="chat-unread">
            {{ unread[channel.id] }}<span class="wl-visually-hidden"> {{ copy.unread }}</span>
          </span>
        </button>
        <h2>{{ copy.direct }}</h2>
        <button
          v-for="channel in directRooms"
          :key="channel.id"
          type="button"
          class="chat-room"
          :aria-current="activeRoom === channel.id ? 'true' : undefined"
          @click="openRoom(channel.id)"
        >
          <WlAvatar :name="channel[locale].title" :size="24" aria-hidden="true" />
          <span>{{ channel[locale].title }}</span>
        </button>
      </nav>

      <section class="chat-conversation" aria-labelledby="chat-title">
        <div class="chat-room-heading">
          <WlIconButton
            class="chat-room-back"
            icon="arrow-left"
            :aria-label="copy.rooms"
            @click="showRooms"
          />
          <div class="chat-room-caption">
            <h1 id="chat-title" ref="heading" tabindex="-1">{{ room[locale].title }}</h1>
            <p>{{ room[locale].description }}</p>
          </div>
          <WlAvatar
            v-if="directPerson"
            class="chat-room-avatar"
            :name="directPerson[locale]"
            :size="28"
            presence="online"
          />
          <WlIconButton
            icon="search"
            variant="secondary"
            :aria-label="copy.search"
            :aria-expanded="searching"
            aria-controls="chat-search"
            @click="toggleSearch"
          />
        </div>

        <div
          v-show="searching"
          id="chat-search"
          ref="searchArea"
          class="chat-search"
        >
          <WlInput
            v-model="query"
            :aria-label="copy.search"
            :placeholder="copy.search"
            clearable
          />
        </div>

        <div v-if="activeRoom === 'studio' && !query.trim()" class="chat-pin">
          <WlIcon name="pin" :size="17" />
          <p><strong>{{ copy.pinned }}</strong> {{ copy.pinText }}</p>
        </div>

        <ol
          ref="list"
          class="chat-messages"
          aria-live="polite"
          aria-relevant="additions"
        >
          <li v-if="!visibleMessages.length" class="chat-no-results">{{ copy.noResults }}</li>
          <li v-for="message in visibleMessages" :key="message.id" class="chat-message">
            <WlAvatar
              class="chat-message-avatar"
              :class="'chat-avatar--' + message.by"
              :name="people[message.by][locale]"
              :size="36"
              aria-hidden="true"
            />
            <div class="chat-message-main">
              <div class="chat-byline">
                <strong>{{ people[message.by][locale] }}</strong>
                <span>{{ message.time }}</span>
              </div>
              <blockquote v-if="message.reply !== undefined" class="chat-quote">{{ byId.get(message.reply)?.text }}</blockquote>
              <p>{{ message.text }}</p>
              <div class="chat-message-actions">
                <WlButton
                  size="sm"
                  :variant="message.liked ? 'soft' : 'ghost'"
                  :aria-pressed="Boolean(message.liked)"
                  :aria-label="copy.react + ' · ' + message.time"
                  @click="message.liked = !message.liked"
                >
                  <template #icon><WlIcon name="heart" :size="15" /></template>
                  {{ (message.reactions ?? 0) + Number(Boolean(message.liked)) }}
                </WlButton>
                <WlButton size="sm" variant="ghost" @click="startReply(message)">{{ copy.reply }}</WlButton>
              </div>
            </div>
          </li>
        </ol>

        <div ref="composer" class="chat-composer">
          <form @submit.prevent="send">
            <div v-if="reply" class="chat-reply">
              <p><strong>{{ copy.replyTo }} {{ people[reply.by][locale] }}</strong><br />{{ reply.text }}</p>
              <WlIconButton
                icon="x"
                size="sm"
                :aria-label="copy.cancelReply"
                @click="replyTo = undefined"
              />
            </div>
            <div class="chat-compose-line">
              <WlTextarea
                v-model="drafts[activeRoom]"
                :aria-label="copy.message"
                :placeholder="copy.message"
                :rows="2"
                maxlength="1200"
              />
              <WlButton type="submit" variant="primary" :disabled="!drafts[activeRoom].trim()">
                <template #icon><WlIcon name="send" :size="17" /></template>
                {{ copy.send }}
              </WlButton>
            </div>
          </form>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped src="./chat.css"></style>
