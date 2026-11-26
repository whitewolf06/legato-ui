<script setup lang="ts">
import { WlButton, WlCalendar, WlDialog, WlField, WlIcon, WlInput, WlPill } from "legato-ui";
import { computed, ref, watch } from "vue";
import { type ApplicationModuleProps, applicationRecipesHref } from "../../catalog";

const { locale } = defineProps<ApplicationModuleProps>();
const text = locale === "ru"
  ? {
      brand: "Маяк", title: "Забронировать переговорную", lead: "Выберите комнату, день и один свободный час.",
      back: "К примерам", room: "Комната", day: "Дата", time: "Свободное время", submit: "Продолжить",
      confirm: "Подтвердить бронь", name: "Имя", reserved: "Бронь в демонстрации", cancel: "Отменить бронь",
      north: "Север", south: "Юг", capacity: "Мест", facilities: ["Экран и видеосвязь", "Доска и проектор"]
    }
  : {
      brand: "Lighthouse", title: "Book a meeting room", lead: "Choose a room, date and one available hour.",
      back: "Back to examples", room: "Room", day: "Date", time: "Available times", submit: "Continue",
      confirm: "Confirm booking", name: "Name", reserved: "Demo booking", cancel: "Cancel booking",
      north: "North", south: "South", capacity: "Seats", facilities: ["Screen and video calls", "Whiteboard and projector"]
    };
const rooms = [
  { id: "north", label: text.north, seats: 6, details: text.facilities[0] },
  { id: "south", label: text.south, seats: 10, details: text.facilities[1] }
] as const;
const slots = ["09:30", "10:30", "12:00", "13:30", "15:00", "16:30"] as const;
type Room = typeof rooms[number];
type Slot = typeof slots[number];
type Booking = { id: number; room: Room; day: string; time: Slot; name: string };

const today = new Date().toISOString().slice(0, 10);
function unavailable(iso: string): boolean {
  const weekday = new Date(iso + "T00:00:00Z").getUTCDay();
  return iso < today || weekday === 0 || weekday === 6;
}
const start = new Date(today + "T00:00:00Z");
while (unavailable(start.toISOString().slice(0, 10))) start.setUTCDate(start.getUTCDate() + 1);
const day = ref(start.toISOString().slice(0, 10));
const month = ref(day.value.slice(0, 7));
const room = ref<Room>(rooms[0]);
const time = ref<Slot>();
const name = ref("");
const open = ref(false);
const bookings = ref<Booking[]>([]);
let nextBooking = 1;
const dateFormat = new Intl.DateTimeFormat(locale, { weekday: "short", month: "long", day: "numeric", timeZone: "UTC" }).format;
const shortDate = (iso: string): string => dateFormat(new Date(iso + "T00:00:00Z"));
const description = computed(() => [room.value.label, shortDate(day.value), time.value].filter(Boolean).join(" · "));
watch([day, room], () => {
  time.value = undefined;
});

function occupied(slot: Slot): boolean {
  return slot === (room.value.id === "north" ? "12:00" : "15:00")
    || bookings.value.some((booking) => booking.room.id === room.value.id && booking.day === day.value && booking.time === slot);
}
function book(): void {
  const entered = name.value.trim();
  if (!entered || !time.value || occupied(time.value) || unavailable(day.value)) return;
  bookings.value.push({ id: nextBooking++, room: room.value, day: day.value, time: time.value, name: entered });
  time.value = undefined;
  open.value = false;
}
</script>

<template>
  <div class="booking-demo">
    <header class="demo-header">
      <div>
        <span class="demo-brand"><WlIcon name="building" :size="22" />{{ text.brand }}</span>
        <a v-if="!embedded" class="demo-return" :href="applicationRecipesHref(locale)">{{ text.back }}</a>
      </div>
    </header>
    <main class="demo-content wl-stack" data-space="xl">
      <div class="wl-stack" data-space="xs">
        <h1 class="wl-text-title">{{ text.title }}</h1><p class="wl-text-muted">{{ text.lead }}</p>
      </div>
      <div class="booking-grid">
        <section class="demo-panel booking-calendar wl-stack" data-space="md" :aria-label="text.day">
          <h2 class="wl-text-subheading">{{ text.day }}</h2>
          <WlCalendar v-model="day" v-model:month="month" :disabled-dates="unavailable" />
        </section>
        <section class="demo-panel wl-stack" data-space="lg" :aria-label="text.room">
          <div class="wl-stack" data-space="sm">
            <h2 class="wl-text-subheading">{{ text.room }}</h2>
            <div class="booking-rooms">
              <button
                v-for="option in rooms"
                :key="option.id"
                type="button"
                class="booking-room"
                :aria-pressed="room.id === option.id"
                @click="room = option"
              >
                <strong>{{ option.label }}</strong>
                <span>{{ text.capacity }} {{ option.seats }} · {{ option.details }}</span>
              </button>
            </div>
          </div>
          <div class="wl-stack" data-space="sm">
            <div class="demo-line"><h2 class="wl-text-subheading">{{ text.time }}</h2><span>{{ shortDate(day) }}</span></div>
            <div class="booking-slots">
              <WlButton
                v-for="slot in slots"
                :key="slot"
                size="sm"
                :variant="time === slot ? 'primary' : 'secondary'"
                :aria-pressed="time === slot"
                :disabled="occupied(slot)"
                @click="time = slot"
              >{{ slot }}</WlButton>
            </div>
          </div>
          <div><WlButton variant="primary" :disabled="!time" @click="open = true">{{ text.submit }}</WlButton></div>
        </section>
      </div>
      <section
        v-if="bookings.length"
        class="demo-panel wl-stack"
        data-space="md"
        :aria-label="text.reserved"
      >
        <h2 class="wl-text-subheading">{{ text.reserved }}</h2>
        <div v-for="booking in bookings" :key="booking.id" class="demo-line">
          <div>
            <strong>{{ booking.room.label }} · {{ shortDate(booking.day) }} · {{ booking.time }}</strong>
            <p class="wl-text-small wl-text-muted">{{ booking.name }}</p>
          </div>
          <WlButton
            size="sm"
            variant="ghost"
            @click="bookings = bookings.filter(({ id }) => id !== booking.id)"
          >{{ text.cancel }}</WlButton>
        </div>
      </section>
    </main>
    <WlDialog v-model:visible="open" :header="text.confirm" size="sm">
      <form class="demo-dialog-form wl-stack" data-space="md" @submit.prevent="book">
        <WlPill :label="description" tone="accent" />
        <WlField :label="text.name" required>
          <template #default="{ id }"><WlInput
            :id="id"
            v-model="name"
            required
            maxlength="70"
          /></template>
        </WlField>
        <div><WlButton variant="primary" type="submit">{{ text.confirm }}</WlButton></div>
      </form>
    </WlDialog>
  </div>
</template>

<style scoped>
.booking-demo { min-height: 100dvh; background: color-mix(in srgb, var(--wl-bg) 78%, var(--wl-bg-soft)); }
.booking-grid { display: grid; grid-template-columns: minmax(0, .94fr) minmax(0, 1.06fr); gap: var(--wl-space-md); }
.booking-calendar :deep(.wl-cal) { width: 100%; }
.booking-rooms { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--wl-space-sm); }
.booking-room {
  min-width: 0;
  background: var(--wl-bg);
  color: var(--wl-text);
  border: 1px solid var(--wl-border);
  border-radius: var(--wl-corner-control);
  text-align: start;
  padding: 12px;
  cursor: pointer;
}
.booking-room[aria-pressed="true"] { background: var(--wl-accent-soft); border-color: var(--wl-accent-border-hover); }
.booking-room span { display: block; margin-top: 5px; color: var(--wl-text-2); font-size: var(--wl-type-small-size); }
.booking-slots { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--wl-space-xs); }
@media (max-width: 700px) { .booking-grid { grid-template-columns: minmax(0, 1fr); } }
</style>
