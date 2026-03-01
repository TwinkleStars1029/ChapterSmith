<template>
  <div class="source-picker">
    <button
      v-for="option in options"
      :key="option.value"
      class="source-button"
      :class="{ active: modelValue === option.value }"
      type="button"
      @click="$emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { SourceApp } from "../types";

defineProps<{ modelValue: SourceApp }>();

defineEmits<{ (e: "update:modelValue", value: SourceApp): void }>();

const options: { value: SourceApp; label: string }[] = [
  { value: "qingqing", label: "卿卿我我" },
  { value: "tavern", label: "SillyTavern" },
  /*{ value: "gemini", label: "Gemini" },*/
  { value: "chatbackup", label: "ChatBackup" }
];
</script>
