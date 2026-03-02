<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="header-inline">
        <div class="brand-title">對話切分工具</div>
        <nav class="nav">
          <RouterLink to="/" class="nav-link">載入</RouterLink>
          <RouterLink to="/chapters" class="nav-link">編輯</RouterLink>
        </nav>
      </div>
    </header>
     <main class="app-main">
      <RouterView />
    </main>
    <footer class="app-footer">
      <a
        class="footer-link"
        href="https://forms.gle/hxZ9LpzwMCyCs3UJ7"
        target="_blank"
        rel="noopener noreferrer"
      >
        問題回報
      </a>
    </footer>
  </div>
 </template> 


<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
</script>
