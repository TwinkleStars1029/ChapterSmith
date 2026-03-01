<template>
  <section class="page import-page">
    <div class="panel">
      <header class="import-header">
        <div>
          <h1>載入設定</h1>
          <p class="muted">上傳你的對話檔案，選擇來源 app，設定每章節訊息數量。</p>          
          
        </div>
      </header>

      <div class="import-layout">
        <div class="import-main">
          <div class="card tab-card">
            <div class="tab-header">
              <button
                type="button"
                class="tab-button"
                :class="{ active: activeTab === 'upload' }"
                @click="activeTab = 'upload'"
              >
                A. 載入對話內容
              </button>
              <button
                type="button"
                class="tab-button"
                :class="{ active: activeTab === 'project' }"
                @click="activeTab = 'project'"
              >
                B. 載入專案
              </button>
            </div>            
            <div v-if="activeTab === 'upload'" class="tab-body">
              
            <div>
              <h2>來源 App</h2>
              <p class="muted">- 卿卿我我 / 酒館 支援官方對話紀錄<br>- GPT / Gemini / Grok / perplexity / Claude 使用 <a class="inline-link" href="https://chromewebstore.google.com/detail/chatgpt-ai-backup-export/oedpeddiacomhhfieanenlmdghkolgng">Chat backup</a> 備份格式</p>
              <SourcePicker v-model="store.settings.sourceApp" />
            </div>
            <h2>上傳對話紀錄</h2>
            <div
              class="upload-area"
              :class="{ active: isDragOver }"
              @click="triggerFile"
              @dragenter.prevent="onDragEnter"
              @dragleave.prevent="onDragLeave"
              @dragover.prevent
              @drop.prevent="onDrop"
            >
              <input
                ref="fileInput"
                type="file"
                :accept="fileAccept"
                @change="onFileChange"
              />
              <div>
                <strong>拖拉 {{ fileLabel }} 檔案</strong>
                <div class="muted">或點擊選擇檔案</div>
              </div>
              <div v-if="fileName" class="file-name">已載入：{{ fileName }}</div>
            </div>

            <div class="settings-grid">
              <div>
                <h2>章節設定</h2>
                <label class="field">
                  <span>每章節訊息數量</span>
                  <input type="number" min="1" v-model.number="store.settings.chapterSize" />
                </label>
              </div>
            </div>

            <div class="actions import-actions">
              <button class="primary" type="button" @click="onSegment">開始切章</button>
              <button class="ghost" type="button" @click="onClear">清除</button>
            </div>
            </div>

            <div v-else class="tab-body">
              <div class="project-actions">
                <button type="button" class="ghost" @click="triggerImportProject">匯入專案</button>
                <button type="button" class="ghost" @click="onClearProject">清除本機進度</button>
                <input
                  ref="projectInput"
                  type="file"
                  accept=".json"
                  class="hidden-file"
                  @change="onImportProject"
                />
              </div>
              <p class="muted">匯入後會覆蓋目前的載入內容與切分結果。</p>
            </div>
          </div>
        </div>

        <aside class="import-side">
          <div class="card">
            <h2>解析摘要</h2>
            <div class="summary">
              <div>訊息數量：{{ store.messages.length }}</div>
              <div>角色數量：{{ uniqueSpeakers }}</div>
              <div>章節數量：{{ store.chapters.length }}</div>
              <div class="status-row">
                <span>解析狀態：</span>
                <span class="status-pill" :class="parseStatusClass">{{ parseStatus }}</span>
              </div>
            </div>
            <p v-if="store.parseError" class="error">失敗原因：{{ store.parseError }}</p>
          </div>
        </aside>
      </div>

    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import SourcePicker from "../components/SourcePicker.vue";
import { useSessionStore } from "../stores/session";
import { parseBySource } from "../utils/parsers";
import { segmentMessages } from "../utils/segmenter";
import { loadSettings, saveSettings } from "../utils/storage";
import { buildProject, clearProject, loadProject, saveProject, validateProjectFile } from "../utils/project";
import { downloadBlob } from "../utils/download";

const store = useSessionStore();
const router = useRouter();
const fileInput = ref<HTMLInputElement | null>(null);
const projectInput = ref<HTMLInputElement | null>(null);
const fileName = ref("");
const isDragOver = ref(false);
const activeTab = ref<"upload" | "project">("upload");

const uniqueSpeakers = computed(() =>
  new Set(store.messages.map((msg) => msg.speaker || msg.role)).size
);
const parseStatus = computed(() => {
  if (store.parseError) return "失敗";
  if (store.messages.length > 0) return "成功";
  return "尚未解析";
});
const parseStatusClass = computed(() => {
  if (store.parseError) return "is-fail";
  if (store.messages.length > 0) return "is-success";
  return "is-idle";
});
const fileAccept = computed(() =>
  store.settings.sourceApp === "chatbackup" ? ".md" : ".txt"
);
const fileLabel = computed(() =>
  store.settings.sourceApp === "chatbackup" ? "md" : "txt"
);

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function validateGptFormat(rawText: string): string | null {
  const roleSet = new Set<string>();
  let matches = 0;
  for (const line of rawText.split(/\r?\n/)) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(User|Assistant|System)(:|：)\s*/);
    if (match) {
      matches += 1;
      roleSet.add(match[1].toLowerCase());
    }
  }
  if (matches < 2 || roleSet.size < 2) {
    return "GPT 需至少 2 行前綴，且含 user/assistant 兩種角色。";
  }
  return null;
}

function validateGeminiFormat(rawText: string): string | null {
  let userCount = 0;
  let assistantCount = 0;
  for (const line of rawText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (/^你[:：]/.test(trimmed)) userCount += 1;
    if (/^.+\(GEMINI\)[:：]/.test(trimmed)) assistantCount += 1;
  }
  if (userCount < 1 || assistantCount < 1) {
    return "Gemini 需至少 1 行「你：」與 1 行「(GEMINI)：」。";
  }
  return null;
}

function validateTavernFormat(rawText: string): string | null {
  const speakerSet = new Set<string>();
  let matches = 0;
  for (const line of rawText.split(/\r?\n/)) {
    const trimmed = line.trim();
    const match = trimmed.match(/^([^:：]{1,40})[:：]\s+(.*)$/);
    if (match) {
      matches += 1;
      speakerSet.add(match[1].trim());
    }
  }
  if (matches < 2 || speakerSet.size < 2) {
    return "酒館需至少 2 行「角色名: 內容」，且角色數量至少 2。";
  }
  return null;
}

function validateQingqingFormat(rawText: string): string | null {
  const speakerSet = new Set<string>();
  let matches = 0;
  for (const line of rawText.split(/\r?\n/)) {
    const trimmed = line.trim();
    const match = trimmed.match(/^\[\d{4}-\d{2}-\d{2}[^\]]*\]\s*(.+?):\s*(.*)$/);
    if (match) {
      matches += 1;
      speakerSet.add(match[1].trim());
    }
  }
  if (matches < 2 || speakerSet.size < 2) {
    return "卿卿我我需至少 2 行「[時間] 角色: 內容」，且角色數量至少 2。";
  }
  return null;
}

function validateChatBackupFormat(rawText: string): string | null {
  let qCount = 0;
  let aCount = 0;
  for (const line of rawText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (/^#{2,}\s*Q\s*:/i.test(trimmed)) qCount += 1;
    if (/^#{2,}\s*A\s*:/i.test(trimmed)) aCount += 1;
  }
  if (qCount < 1 || aCount < 1) {
    return "ChatBackup 需至少 1 行「## Q:」與 1 行「## A:」。";
  }
  return null;
}

function validateFormat(rawText: string): string | null {
  switch (store.settings.sourceApp) {
    case "gpt":
      return validateGptFormat(rawText);
    case "gemini":
      return validateGeminiFormat(rawText);
    case "tavern":
      return validateTavernFormat(rawText);
    case "qingqing":
      return validateQingqingFormat(rawText);
    case "chatbackup":
      return validateChatBackupFormat(rawText);
    default:
      return "來源未知，無法判斷格式。";
  }
}

function parseNow() {
  if (!store.rawText) {
    store.setMessages([]);
    return;
  }
  const formatError = validateFormat(store.rawText);
  if (formatError) {
    store.setParseError(`不符合格式：${formatError}`);
    store.setMessages([]);
    return;
  }
  const parsed = parseBySource(store.settings.sourceApp, store.rawText);
  store.setMessages(parsed);
  if (!parsed.length) {
    store.setParseError("不符合格式：解析結果為空，請確認檔案格式或來源 app 是否正確。");
  } else {
    store.setParseError("");
  }
}

function handleFile(file: File) {
  const lowerName = file.name.toLowerCase();
  const isChatBackup = store.settings.sourceApp === "chatbackup";
  const validExtension = isChatBackup ? lowerName.endsWith(".md") : lowerName.endsWith(".txt");
  if (!validExtension) {
    store.setParseError(isChatBackup ? "僅支援 .md 檔案。" : "僅支援 .txt 檔案。");
    store.setRawText("");
    store.setMessages([]);
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    store.setParseError("檔案內容太大，請縮小後再上傳。");
    store.setRawText("");
    store.setMessages([]);
    return;
  }
  fileName.value = file.name;
  const reader = new FileReader();
  reader.onload = () => {
    const content = typeof reader.result === "string" ? reader.result : "";
    if (!content.trim()) {
      store.setParseError("檔案內容為空。");
      store.setRawText("");
      store.setMessages([]);
      return;
    }
    store.setRawText(content);
    parseNow();
  };
  reader.readAsText(file);
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
    selectedChapterId: store.selectedChapterId,
    fileName: fileName.value
  });
  const blob = new Blob([JSON.stringify(project, null, 2)], {
    type: "application/json;charset=utf-8"
  });
  downloadBlob(buildProjectFilename(), blob);
}

function triggerImportProject() {
  projectInput.value?.click();
}

function onImportProject(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const content = typeof reader.result === "string" ? reader.result : "";
      const parsed = JSON.parse(content);
      if (!validateProjectFile(parsed)) {
        store.setParseError("專案檔格式錯誤。");
        return;
      }
      store.setSettings(parsed.settings);
      store.setRawText(parsed.rawText);
      store.setMessages(parsed.messages ?? []);
      store.setChapters(parsed.chapters ?? []);
      if (parsed.selectedChapterId) {
        store.selectChapter(parsed.selectedChapterId);
      }
      store.setParseError("");
      fileName.value = parsed.meta?.fileName ?? "";
    } catch {
      store.setParseError("專案檔讀取失敗，請確認檔案內容。");
    }
  };
  reader.readAsText(file);
  if (target) target.value = "";
}

function onClearProject() {
  store.resetAll();
  clearProject();
  fileName.value = "";
  if (fileInput.value) fileInput.value.value = "";
  if (projectInput.value) projectInput.value.value = "";
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) handleFile(file);
}

function onDragEnter() {
  isDragOver.value = true;
}

function onDragLeave() {
  isDragOver.value = false;
}

function onDrop(event: DragEvent) {
  isDragOver.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) handleFile(file);
}

function triggerFile() {
  fileInput.value?.click();
}

function onSegment() {
  if (!store.messages.length) {
    store.setParseError("沒有可切章的訊息，請先載入並解析檔案。");
    return;
  }
  const chapters = segmentMessages(store.messages, store.settings.chapterSize);
  store.setChapters(chapters);
  router.push("/chapters");
}

function onClear() {
  store.resetAll();
  fileName.value = "";
  if (fileInput.value) fileInput.value.value = "";
}

watch(
  () => store.settings,
  (settings) => {
    saveSettings(settings);
    if (store.rawText) parseNow();
  },
  { deep: true }
);

watch(
  () => ({
    settings: store.settings,
    rawText: store.rawText,
    messages: store.messages,
    chapters: store.chapters,
    selectedChapterId: store.selectedChapterId
  }),
  (state) => {
    const project = buildProject({
      settings: state.settings,
      rawText: state.rawText,
      messages: state.messages,
      chapters: state.chapters,
      selectedChapterId: state.selectedChapterId,
      fileName: fileName.value
    });
    saveProject(project);
  },
  { deep: true }
);

onMounted(() => {
  const project = loadProject();
  if (project) {
    store.setSettings(project.settings);
    store.setRawText(project.rawText);
    store.setMessages(project.messages ?? []);
    store.setChapters(project.chapters ?? []);
    if (project.selectedChapterId) {
      store.selectChapter(project.selectedChapterId);
    }
    fileName.value = project.meta?.fileName ?? "";
    return;
  }
  const saved = loadSettings();
  if (saved) {
    store.setSettings({
      sourceApp: saved.sourceApp as typeof store.settings.sourceApp,
      chapterSize: saved.chapterSize
    });
  }
});
</script>
