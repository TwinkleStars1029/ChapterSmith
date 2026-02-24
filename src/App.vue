<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="header-inline">
        <div class="brand-title">AI RPG 對話整理工具</div>
        <nav class="nav">
          <RouterLink to="/" class="nav-link">載入與設定</RouterLink>
          <RouterLink to="/chapters" class="nav-link">章節編輯</RouterLink>
        </nav>
      </div>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
</script>
