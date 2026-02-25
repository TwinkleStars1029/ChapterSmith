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
          <div class="card">
            <h2>對話紀錄上傳</h2>
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
          </div>

          <div class="card settings-grid">
            <div>
              <h2>來源 App</h2>
              <SourcePicker v-model="store.settings.sourceApp" />
            </div>
            <div>
              <h2>章節設定</h2>
              <label class="field">
                <span>每章節訊息數量</span>
                <input type="number" min="1" v-model.number="store.settings.chapterSize" />
              </label>
            </div>
          </div>
        </div>

        <aside class="import-side">
          <div class="card">
            <h2>解析摘要</h2>
            <div class="summary">
              <div>訊息數量：{{ store.messages.length }}</div>
              <div>角色數量：{{ uniqueSpeakers }}</div>
              <div class="status-row">
                <span>解析狀態：</span>
                <span class="status-pill" :class="parseStatusClass">{{ parseStatus }}</span>
              </div>
            </div>
            <p v-if="store.parseError" class="error">失敗原因：{{ store.parseError }}</p>
          </div>
        </aside>
      </div>

      <div class="actions import-actions">
        <button class="primary" type="button" @click="onSegment">開始切章</button>
        <button class="ghost" type="button" @click="onClear">清除</button>
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

const store = useSessionStore();
const router = useRouter();
const fileInput = ref<HTMLInputElement | null>(null);
const fileName = ref("");
const isDragOver = ref(false);

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

onMounted(() => {
  const saved = loadSettings();
  if (saved) {
    store.setSettings({
      sourceApp: saved.sourceApp as typeof store.settings.sourceApp,
      chapterSize: saved.chapterSize
    });
  }
});
</script>
