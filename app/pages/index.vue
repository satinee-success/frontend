<script setup lang="ts">
const api = useApi()
const profile = ref<any>(null)
const errorMsg = ref('')

onMounted(async () => {
  try {
    profile.value = await api('/get_user_data', { method: 'POST' })
  } catch (e: any) {
    errorMsg.value = e?.data?.message || 'โหลดข้อมูลไม่สำเร็จ'
  }
})
</script>

<template>
  <div class="bg-white rounded-xl shadow p-6 space-y-2">
    <h1 class="text-xl font-bold">ข้อมูลผู้ใช้ (จาก Back-end)</h1>
    <p v-if="errorMsg" class="text-red-600">{{ errorMsg }}</p>
    <pre v-if="profile" class="bg-slate-100 p-3 rounded">{{ profile }}</pre>
  </div>
</template>