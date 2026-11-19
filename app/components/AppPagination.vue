<script setup lang="ts">
const page = defineModel<number>({ required: true })
defineProps<{ totalPages: number }>()
</script>

<template>
  <div class="flex items-center justify-center gap-3">
    <button :disabled="page <= 1" class="px-3 py-1 border rounded disabled:opacity-40" @click="page--">ก่อนหน้า</button>
    <span>หน้า {{ page }} / {{ totalPages }}</span>
    <button :disabled="page >= totalPages" class="px-3 py-1 border rounded disabled:opacity-40" @click="page++">ถัดไป</button>
  </div>
</template>