<template>
  <label class="chapter-title-input">
    <input
      type="text"
      :value="modelValue"
      placeholder="輸入章節名稱"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </label>
</template>

<script setup lang="ts">
defineProps<{ modelValue: string }>();

defineEmits<{ (e: "update:modelValue", value: string): void }>();
</script>
