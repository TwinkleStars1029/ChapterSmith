<template>
  <section class="page chapter-page">
    <div class="panel wide">
      <header class="panel-header">
        <div>
          <h1>章節編輯</h1>
          <p class="muted">微調章節切點、設定章節名稱並下載整理後檔案。</p>
        </div>
        <div v-if="store.chapters.length" class="actions">
          <button
            class="ghost icon-button"
            type="button"
            @click="onExportProject"
            aria-label="匯出專案"
            data-tooltip="匯出專案"
          >
            <span class="button-text">匯出專案</span>
            <span class="button-icon" aria-hidden="true">匯出專案
              <svg viewBox="0 0 24 24" role="presentation" focusable="false">
                <path
                  d="M12 3v12M8 7l4-4 4 4M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
          </button>
          <button
            class="ghost icon-button"
            type="button"
            @click="downloadAll"
            aria-label="下載全部章節 (zip)"
            data-tooltip="下載全部章節 (zip)"
          >
            <span class="button-text">下載全部章節 (zip)</span>
            <span class="button-icon" aria-hidden="true">下載全部
              <svg viewBox="0 0 24 24" role="presentation" focusable="false">
                <path
                  d="M12 3v12M8 11l4 4 4-4M5 19h14"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
          </button>
        </div>
      </header>

      <div class="chapter-layout">
        <aside class="chapter-sidebar">
          <div class="sidebar-scroll">
            <ChapterList
              :chapters="store.chapters"
              :selected-id="store.selectedChapterId"
              @select="store.selectChapter"
            />
          </div>
        </aside>

        <section class="chapter-detail" v-if="selectedChapter">        
          <div class="chapter-header">
            <div class="chapter-controls">
              <div class="chapter-select">
                <label>
                  <span>章節選擇</span>
                  <select v-model="selectedIdModel">
                    <option
                      v-for="(chapter, index) in store.chapters"
                      :key="chapter.id"
                      :value="chapter.id"
                    >
                      ch{{ index + 1 }}
                      <template v-if="chapter.title"> · {{ chapter.title }}</template>
                    </option>
                  </select>
                </label>
              </div>
              <div class="adjust-controls">
                <button type="button" @click="adjust(-5)">-5</button>
                <button type="button" @click="adjust(-1)">-1</button>
                <button type="button" @click="adjust(1)">+1</button>
                <button type="button" @click="adjust(5)">+5</button>
                <span class="muted">共 {{ selectedChapter.messages.length }} 則</span>
              </div>
              <span class="muted">（-X 送出 X 則到下一章，+X 從下一章取 X 則）</span>
            </div>
          </div>
          <ChapterTitleInput v-model="chapterTitle" />
          <button class="primary" type="button" @click="downloadCurrent">下載本章節</button>

          <div class="message-scroll" ref="messageScrollRef">
            <MessageList :messages="selectedChapter.messages" />
            <button class="to-top" type="button" @click="scrollToTop">回到頂部</button>
          </div>
        </section>
        <section class="chapter-detail" v-else>
          <div class="empty">尚未建立章節，請回到載入頁切章。</div>
        </section>
      </div>
    </div>
    <div v-if="showLeaveModal" class="modal-overlay" role="dialog" aria-modal="true">
      <div class="modal-card">
        <h3>切換提醒</h3>
        <p class="muted">手機版切回載入頁可能導致資料清空，建議先存檔或匯出專案。</p>
        <div class="modal-actions">
          <button class="ghost" type="button" @click="cancelLeave">留在本頁</button>
          <button class="primary" type="button" @click="confirmLeave">仍要切換</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import ChapterList from "../components/ChapterList.vue";
import ChapterTitleInput from "../components/ChapterTitleInput.vue";
import MessageList from "../components/MessageList.vue";
import { useSessionStore } from "../stores/session";
import { chapterFilename } from "../utils/filename";
import { formatChapterText } from "../utils/formatter";
import { downloadBlob, downloadText } from "../utils/download";
import { buildProject, loadProject } from "../utils/project";
import JSZip from "jszip";

const store = useSessionStore();
const router = useRouter();

const selectedChapter = computed(() => store.selectedChapter);

const selectedIndex = computed(() =>
  store.chapters.findIndex((chapter) => chapter.id === store.selectedChapterId)
);

const messageScrollRef = ref<HTMLElement | null>(null);
const showLeaveModal = ref(false);
const pendingPath = ref<string | null>(null);
const allowLeaveOnce = ref(false);

const selectedIdModel = computed({
  get: () => store.selectedChapterId ?? "",
  set: (value: string) => {
    if (value) store.selectChapter(value);
  }
});

const chapterTitle = computed({
  get: () => selectedChapter.value?.title ?? "",
  set: (value: string) => {
    if (selectedChapter.value) {
      store.updateChapterTitle(selectedChapter.value.id, value);
    }
  }
});

function adjust(delta: number) {
  if (selectedIndex.value < 0) return;
  store.adjustChapter(selectedIndex.value, delta);
}

function downloadCurrent() {
  if (!selectedChapter.value) return;
  const index = selectedIndex.value + 1;
  const filename = chapterFilename(index, selectedChapter.value.title);
  const content = formatChapterText(selectedChapter.value);
  downloadText(filename, content);
}

function buildProjectFilename() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `chaptersmith_project_${stamp}.json`;
}

function onExportProject() {
  const project = buildProject({
    settings: store.settings,
    rawText: store.rawText,
    messages: store.messages,
    chapters: store.chapters,
    selectedChapterId: store.selectedChapterId
  });
  const blob = new Blob([JSON.stringify(project, null, 2)], {
    type: "application/json;charset=utf-8"
  });
  downloadBlob(buildProjectFilename(), blob);
}

async function downloadAll() {
  const zip = new JSZip();
  store.chapters.forEach((chapter, index) => {
    const filename = chapterFilename(index + 1, chapter.title);
    const content = formatChapterText(chapter);
    zip.file(filename, content);
  });
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob("chapters.zip", blob);
}

function scrollToTop() {
  const el = messageScrollRef.value;
  if (el && el.scrollHeight > el.clientHeight) {
    el.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const appMain = document.querySelector(".app-main") as HTMLElement | null;
  if (appMain && appMain.scrollHeight > appMain.clientHeight) {
    appMain.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const scrollingEl = document.scrollingElement;
  if (scrollingEl) {
    scrollingEl.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

onMounted(() => {
  if (store.chapters.length) return;
  const project = loadProject();
  if (!project) return;
  store.setSettings(project.settings);
  store.setRawText(project.rawText);
  store.setMessages(project.messages ?? []);
  store.setChapters(project.chapters ?? []);
  if (project.selectedChapterId) {
    store.selectChapter(project.selectedChapterId);
  }
});

onBeforeRouteLeave((to) => {
  if (allowLeaveOnce.value) {
    allowLeaveOnce.value = false;
    return true;
  }
  const isMobile = window.matchMedia("(max-width: 960px)").matches;
  if (!isMobile) return true;
  if (to.name !== "import") return true;
  if (!store.messages.length && !store.chapters.length) return true;
  showLeaveModal.value = true;
  pendingPath.value = router.resolve(to).fullPath;
  return false;
});

function confirmLeave() {
  showLeaveModal.value = false;
  if (pendingPath.value) {
    allowLeaveOnce.value = true;
    router.push(pendingPath.value);
  }
  pendingPath.value = null;
}

function cancelLeave() {
  showLeaveModal.value = false;
  pendingPath.value = null;
}

</script>
