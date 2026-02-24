ChapterSmith 對話整理工具 開發手冊

本手冊以 `Vue 3 + Vite` 為基礎（你提到的 `cue` 這裡先視為 `Vue`）。若需改為其他框架或工具鏈，請告訴我。

**Scope**
本工具為純前端靜態網站，提供上傳 txt 對話紀錄、依來源 app 解析、依設定切章節、章節微調、章節命名、下載整理後章節檔案。

**Goals**
1. 全部處理在瀏覽器端完成，不依賴後端。
2. 不同 app 解析規則可擴充。
3. 章節切分可自動化，也可手動微調。
4. 章節名稱可編輯，輸出檔名一致且可讀。

**Tech Stack**
1. `Vue 3`
2. `Vite`
3. `TypeScript`（建議）
4. `Pinia`（可選，用於狀態管理）

**Project Structure**
1. `src/main.ts`: 初始化 Vue、掛載 `App`、註冊路由與狀態（若使用 Pinia）。
2. `src/App.vue`: 全域布局與路由容器，提供頂部導覽與主要內容區。
3. `src/pages/ImportSettings.vue`: 上傳與設定頁。
   - 檔案上傳區（支援拖拉）。
   - 來源 app 選擇（gpt、卿卿我我、酒館、Gemini）。
   - 章節設定（每章訊息數量）。
   - 解析摘要（訊息數、角色數、預覽前幾則）。
   - 主要操作：開始切章、清除檔案。
4. `src/pages/ChapterEditor.vue`: 章節預覽與微調頁。
   - 左側章節清單（序號、章節名、訊息數）。
   - 右側章節內容預覽（對話內容列表）。
   - 章節名可編輯。
   - 微調切點（增加/減少訊息，或拖拉切點）。
   - 下載操作（本章、全部）。
5. `src/components/SourcePicker.vue`: 來源 app 選擇器。
6. `src/components/MessageList.vue`: 對話內容清單顯示。
7. `src/components/ChapterList.vue`: 章節列表與選取。
8. `src/components/ChapterTitleInput.vue`: 章節名稱編輯輸入框。
9. `src/utils/parsers/`: 各 app 的解析器。
10. `src/utils/segmenter.ts`: 切章節邏輯（自動與手動）。
11. `src/utils/filename.ts`: 檔名清理與生成。
12. `src/utils/storage.ts`: localStorage 包裝。

**Core Data Model**
```ts
export type ChatRole = "user" | "assistant" | "system" | "unknown";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  speaker: string;
  content: string;
  source: string;
  raw: string;
}

export interface Chapter {
  id: string;
  title: string;
  messages: ChatMessage[];
}

export interface ImportSettings {
  sourceApp: "gpt" | "qingqing" | "tavern" | "gemini";
  chapterSize: number;
}
```

**Parsing Strategy**
1. 每個 app 一個解析器檔案，例如 `src/utils/parsers/gpt.ts`。
2. 解析器輸入原始文字，輸出 `ChatMessage[]`。
3. 解析流程建議為「逐行掃描 → 判斷前綴 → 合併多行內容」。
4. 解析失敗或未知前綴統一歸到 `role: "unknown"`，避免丟失資料。

**Segmenting Strategy**
1. 先依 `chapterSize` 自動切分 `ChatMessage[]`。
2. 產生 `Chapter[]` 後提供手動微調切點。
3. 微調結果直接更新對應章節的 `messages`。

**Chapter Title Strategy**
1. 預設標題可取「章{n} + 第一則訊息前 N 字」。
2. 章節標題可直接編輯，更新後即生效。
3. 標題變更不影響訊息內容，只影響顯示與檔名。

**Filename Rules**
1. 檔名格式：`ch{index}_{title}.txt`
2. 需先清理標題中的非法字元，避免下載失敗。
3. 無標題則使用 `ch{index}_untitled.txt`

**Filename Sanitizer**
```ts
export function sanitizeFilename(input: string): string {
  const trimmed = input.trim();
  const safe = trimmed.replace(/[\\/:*?"<>|]/g, "_");
  return safe.length ? safe : "untitled";
}
```

**Download Strategy**
1. 每章節可單獨下載。
2. 提供「下載全部章節」功能，逐一觸發下載。
3. 下載內容為「角色名稱 + 分隔 + 內容」的行格式。

**Recommended UI Flow**
1. `ImportSettings` 頁：上傳 txt，選擇 app，設定章節訊息數。
2. `ChapterEditor` 頁：左側章節列表，右側章節內容與標題編輯。
3. 下載區塊：`下載本章節` 與 `下載全部章節`。

**Example Rendering Format**
```txt
[User] 你好
[Assistant] 你好，今天想冒險去哪裡？
```

**Local Storage**
1. 記錄 `sourceApp` 與 `chapterSize`。
2. 使用 `src/utils/storage.ts` 包裝 `localStorage`。

**Scripts**
1. `npm install`
2. `npm run dev`
3. `npm run build`
4. `npm run preview`

**Manual Test Checklist**
1. 上傳空白檔案時顯示友善提示。
2. 上傳非 txt 檔案時顯示錯誤。
3. 切章後章節總訊息數一致。
4. 章節名變更後，下載檔名同步更新。
5. 不同來源 app 解析結果合理。

**Automated Test Tasks**
1. `npm run test:unit`: 執行單元測試（解析器、切章、檔名清理）。
2. `npm run test:e2e`: 執行端到端測試（匯入 → 切章 → 編輯 → 下載）。
3. `npm run test`: 一次跑完所有測試。

**Extension Guide**
1. 新增解析器檔案到 `src/utils/parsers/`。
2. 在解析器索引匯出新解析器。
3. 在來源選單中新增選項並綁定解析器。
