import { createRouter, createWebHashHistory } from "vue-router";
import ImportSettings from "./pages/ImportSettings.vue";
import ChapterEditor from "./pages/ChapterEditor.vue";

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "import", component: ImportSettings },
    { path: "/chapters", name: "chapters", component: ChapterEditor }
  ]
});
