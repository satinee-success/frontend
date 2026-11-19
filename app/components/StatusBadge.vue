<script setup lang="ts">
defineProps<{ status: string }>()
</script>

<template>
  <span class="px-2 py-1 rounded-full text-xs whitespace-nowrap" :class="statusColor[status]">{{ statusLabel[status] || status }}</span>
</template>
