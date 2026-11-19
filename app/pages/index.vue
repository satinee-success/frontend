<script setup lang="ts">
const api = useApi()
const cards = ref<{ label: string; value: number | string }[]>([])
const statuses = ref<Record<string, number>>({})
const errorMsg = ref('')
const maxN = computed(() => Math.max(1, ...Object.values(statuses.value)))

onMounted(async () => {
  try {
    const res: any = await api('/dashboard/summary')
    cards.value = res.data.cards
    statuses.value = res.data.statuses
  } catch (e: any) {
    errorMsg.value = e?.data?.message || 'โหลดข้อมูลไม่สำเร็จ'
  }
})
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-xl font-bold">ภาพรวม</h1>
    <p v-if="errorMsg" class="text-red-600 bg-red-50 p-2 rounded">{{ errorMsg }}</p>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="c in cards" :key="c.label" class="bg-white rounded-xl shadow p-4">
        <p class="text-sm text-slate-500">{{ c.label }}</p>
        <p class="text-2xl font-bold text-indigo-600">{{ c.value }}</p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow p-4">
      <h2 class="font-bold mb-3">จำนวนงานแยกตามสถานะ</h2>
      <div v-for="(n, s) in statuses" :key="s" class="flex items-center gap-2 mb-1">
        <span class="w-28 text-sm">{{ statusLabel[s] }}</span>
        <div class="bg-indigo-500 h-5 rounded" :style="{ width: (n / maxN) * 100 + '%', minWidth: '0.5rem' }" />
        <span class="text-sm">{{ n }}</span>
      </div>
    </div>
  </div>
</template>
