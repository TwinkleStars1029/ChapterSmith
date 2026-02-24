# ChapterSmith

靜態網頁工具：上傳 AI RPG 對話紀錄（txt/md），解析、切章節、命名與下載。

## 開發

```bash
npm install
npm run dev
```

## 建置

```bash
npm run build
```

產出在 `dist/`。

## GitHub Pages 部署

此專案已設定 Vite `base: "/ChapterSmith/"`，對應 GitHub Pages repo 名稱。

### 自動部署（GitHub Actions）

1. 將此 repo 推到 GitHub：`ChapterSmith`
2. 進入 GitHub → Settings → Pages
3. Build and deployment → Source 選擇 **GitHub Actions**
4. 每次推送 `main` 會自動部署

---

若你需要 CNAME / 自訂網域，可再加 `public/CNAME`。
