<template>
  <div class="message-list">
    <div v-for="message in messages" :key="message.id" class="message-item">
      <div class="message-meta">
        <span class="message-role" :data-role="message.role">{{ roleLabel(message.role) }}</span>
        <span class="message-speaker">{{ message.speaker || "Unknown" }}</span>
      </div>
      <div class="message-content markdown" v-html="renderMarkdown(message.content)"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage, ChatRole } from "../types";
import { renderMarkdown } from "../utils/markdown";

defineProps<{ messages: ChatMessage[] }>();

function roleLabel(role: ChatRole): string {
  switch (role) {
    case "user":
      return "User";
    case "assistant":
      return "Assistant";
    case "system":
      return "System";
    default:
      return "Unknown";
  }
}
</script>
