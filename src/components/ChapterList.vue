<template>
  <div class="chapter-list">
    <button
      v-for="(chapter, index) in chapters"
      :key="chapter.id"
      class="chapter-item"
      :class="{ active: chapter.id === selectedId }"
      type="button"
      @click="$emit('select', chapter.id)"
    >
      <div class="chapter-title">{{ index + 1 }}. {{ chapter.title }}</div>
      <div class="chapter-meta">{{ chapter.messages.length }} 則訊息</div>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Chapter } from "../types";

defineProps<{ chapters: Chapter[]; selectedId: string | null }>();

defineEmits<{ (e: "select", id: string): void }>();
</script>
