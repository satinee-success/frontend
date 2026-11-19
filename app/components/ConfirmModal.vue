<script setup lang="ts">
const show = defineModel<boolean>({ required: true })
defineProps<{ message: string }>()
const emit = defineEmits<{ confirm: [] }>()
function ok() { show.value = false; emit('confirm') }
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl p-6 w-full max-w-sm space-y-4">
      <h2 class="font-bold text-lg text-red-600">ยืนยันการลบ</h2>
      <p>{{ message }}</p>
      <div class="flex justify-end gap-2">
        <button class="px-4 py-2 border rounded" @click="show = false">ยกเลิก</button>
        <button class="px-4 py-2 bg-red-600 text-white rounded" @click="ok">ลบ</button>
      </div>
    </div>
  </div>
</template>