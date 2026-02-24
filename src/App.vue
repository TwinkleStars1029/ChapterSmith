<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="brand">
        <div class="brand-mark">CS</div>
        <div>
          <div class="brand-title">ChapterSmith</div>
          <div class="brand-subtitle">AI RPG 對話整理工具</div>
        </div>
      </div>
      <nav class="nav">
        <RouterLink to="/" class="nav-link">載入與設定</RouterLink>
        <RouterLink to="/chapters" class="nav-link">章節編輯</RouterLink>
      </nav>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
</script>
