<script setup lang="ts">
import { WlButton, WlEmpty, WlIcon, WlInput } from "legato-ui";
import { computed, ref, watch } from "vue";
import { type ApplicationModuleProps, applicationRecipesHref } from "../../catalog";

const { locale } = defineProps<ApplicationModuleProps>();
const text = locale === "ru"
  ? {
      brand: "Клевер", title: "Как можем помочь?", intro: "Инструкции по рабочему пространству, доступу и файлам.",
      search: "Поиск по статьям", empty: "Ничего не нашлось. Попробуйте другой запрос.", all: "Все статьи", back: "К примерам",
      helpful: "Статья помогла?", yes: "Да", no: "Не совсем", thanks: "Спасибо за ответ.", topics: ["Рабочее пространство", "Доступ и файлы"],
      articles: [
        ["Создать рабочее пространство", "Первое пространство можно создать из списка команд. Дайте ему короткое название, затем добавьте папки для материалов проекта."],
        ["Пригласить коллегу", "В настройках команды откройте «Участники» и введите рабочую почту. Права можно указать сразу или изменить после приглашения."],
        ["Открыть доступ к папке", "Найдите папку и откройте меню «Поделиться». Для просмотра без входа выберите «По ссылке». Чтобы закрыть доступ, удалите ссылку в том же меню."],
        ["Восстановить файл", "Откройте корзину и найдите файл по имени. Нажмите «Восстановить», чтобы вернуть его в исходную папку вместе с историей."]
      ]
    }
  : {
      brand: "Clover", title: "How can we help?", intro: "Guides to workspaces, permissions and files.",
      search: "Search articles", empty: "No results. Try another search.", all: "All articles", back: "Back to examples",
      helpful: "Was this helpful?", yes: "Yes", no: "Not quite", thanks: "Thanks for the feedback.", topics: ["Workspace", "Permissions and files"],
      articles: [
        ["Create a workspace", "Create your first workspace from the team list. Give it a short name and add folders for your project materials."],
        ["Invite a teammate", "Open Members in team settings and enter a work email. Set permissions now or edit them after sending the invitation."],
        ["Share a folder", "Find a folder and open its Share menu. Select Anyone with the link to let someone view it without signing in."],
        ["Restore a file", "Find the file by name in Trash. Select Restore to return it to its original folder along with its history."]
      ]
    };
const articles = text.articles.map(([title, body], index) => ({ id: index, title: title!, body: body!, topic: Math.floor(index / 2) }));
const query = ref("");
const currentId = ref<number>();
const voted = ref<Record<number, boolean>>({});
const current = computed(() => articles.find(({ id }) => id === currentId.value));
const results = computed(() => {
  const search = query.value.trim().toLocaleLowerCase(locale);
  return articles.filter(({ title, body }) => (title + " " + body).toLocaleLowerCase(locale).includes(search));
});
watch(query, () => {
  currentId.value = undefined;
});
</script>

<template>
  <div class="knowledge-demo">
    <header class="demo-header">
      <div>
        <span class="demo-brand"><WlIcon name="help" :size="22" />{{ text.brand }}</span>
        <a v-if="!embedded" class="demo-return" :href="applicationRecipesHref(locale)">{{ text.back }}</a>
      </div>
    </header>
    <main class="demo-content wl-stack" data-space="xl">
      <section class="knowledge-hero wl-stack" data-space="md" aria-labelledby="help-title">
        <h1 id="help-title">{{ text.title }}</h1>
        <p>{{ text.intro }}</p>
        <div class="knowledge-search">
          <WlInput
            v-model="query"
            :aria-label="text.search"
            :placeholder="text.search"
            clearable
          />
        </div>
      </section>
      <article v-if="current" class="demo-panel knowledge-article wl-stack" data-space="lg">
        <div><WlButton variant="link" @click="currentId = undefined">{{ text.all }}</WlButton></div>
        <div>
          <p class="wl-text-small wl-text-muted">{{ text.topics[current.topic] }}</p>
          <h2 class="wl-text-heading">{{ current.title }}</h2>
        </div>
        <p class="wl-text-body">{{ current.body }}</p>
        <div class="knowledge-question wl-inline" data-space="sm">
          <span>{{ text.helpful }}</span>
          <WlButton size="sm" :aria-pressed="voted[current.id] === true" @click="voted[current.id] = true">{{ text.yes }}</WlButton>
          <WlButton size="sm" :aria-pressed="voted[current.id] === false" @click="voted[current.id] = false">{{ text.no }}</WlButton>
          <p v-if="voted[current.id] !== undefined" class="wl-text-small wl-text-muted" role="status">{{ text.thanks }}</p>
        </div>
      </article>
      <WlEmpty v-else-if="!results.length" icon="search" :title="text.empty" />
      <div v-else class="knowledge-topics">
        <section
          v-for="(topic, index) in text.topics"
          :key="topic"
          class="demo-panel wl-stack"
          data-space="sm"
        >
          <div class="knowledge-topic-icon"><WlIcon :name="index === 0 ? 'folder' : 'shield'" :size="20" /></div>
          <h2 class="wl-text-subheading">{{ topic }}</h2>
          <ul>
            <li v-for="article in results.filter((item) => item.topic === index)" :key="article.id">
              <button type="button" @click="currentId = article.id">{{ article.title }} <span aria-hidden="true">→</span></button>
            </li>
          </ul>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
.knowledge-demo { min-height: 100dvh; background: var(--wl-bg); }
.knowledge-hero {
  text-align: center;
  padding: clamp(20px, 4vw, 46px) 14px;
  border-radius: var(--wl-corner-surface);
  background: var(--wl-accent-soft);
}
.knowledge-hero h1 { font-size: clamp(1.8rem, 4.2vw, 3.4rem); letter-spacing: -.035em; }
.knowledge-hero p { color: var(--wl-text-2); }
.knowledge-search { width: min(100%, 390px); margin-inline: auto; }
.knowledge-search :deep(.wl-input) { max-width: none; }
.knowledge-topics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--wl-space-md); }
.knowledge-topic-icon { color: var(--wl-text-accent); }
.knowledge-topics ul { margin: 0; padding: 0; list-style: none; }
.knowledge-topics li { border-top: 1px solid var(--wl-border); }
.knowledge-topics button {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 10px 0;
  border: 0;
  background: none;
  color: var(--wl-text);
  text-align: start;
  cursor: pointer;
}
.knowledge-topics button:hover, .knowledge-topics button span { color: var(--wl-text-accent); }
.knowledge-article { width: min(100%, 730px); margin-inline: auto; }
.knowledge-question { border-top: 1px solid var(--wl-border); padding-top: 13px; }
@media (max-width: 570px) { .knowledge-topics { grid-template-columns: minmax(0, 1fr); } }
</style>
