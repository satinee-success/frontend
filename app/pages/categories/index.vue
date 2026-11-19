<script setup lang="ts">
definePageMeta({ roles: ['admin'] })

type Cat = { id: number; name: string }
const api = useApi()
const { items, page, search, errorMsg, totalPages, load } = useList<Cat>('/categories')

const showForm = ref(false)
const editingId = ref<number | null>(null)
const name = ref('')
const nameError = ref('')
const serverError = ref('')
const showDelete = ref(false)
const deleting = ref<Cat | null>(null)

function openCreate() { editingId.value = null; name.value = ''; nameError.value = serverError.value = ''; showForm.value = true }
function openEdit(c: Cat) { editingId.value = c.id; name.value = c.name; nameError.value = serverError.value = ''; showForm.value = true }

async function save() {
  nameError.value = name.value.trim() ? '' : 'กรุณากรอกชื่อหมวดหมู่'
  if (nameError.value) return
  try {
    if (editingId.value) await api(`/categories/${editingId.value}`, { method: 'PUT', body: { name: name.value } })
    else await api('/categories', { method: 'POST', body: { name: name.value } })
    showForm.value = false
    await load()
  } catch (e: any) {
    serverError.value = e?.data?.message || 'บันทึกไม่สำเร็จ'
  }
}
function askDelete(c: Cat) { deleting.value = c; showDelete.value = true }
async function doDelete() {
  try {
    await api(`/categories/${deleting.value!.id}`, { method: 'DELETE' })
    await load()
  } catch (e: any) {
    errorMsg.value = e?.data?.message || 'ลบไม่สำเร็จ'
  }
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-xl font-bold">หมวดหมู่งานซ่อม</h1>
    <div class="flex flex-col sm:flex-row gap-2 justify-between">
      <input v-model="search" placeholder="ค้นหาหมวดหมู่" class="border rounded px-3 py-2 sm:w-64" />
      <button class="bg-indigo-600 text-white px-4 py-2 rounded" @click="openCreate">+ เพิ่มหมวดหมู่</button>
    </div>
    <p v-if="errorMsg" class="text-red-600 bg-red-50 p-2 rounded">{{ errorMsg }}</p>

    <div class="bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full text-left">
        <thead class="bg-slate-100"><tr><th class="p-3">ชื่อหมวดหมู่</th><th class="p-3" /></tr></thead>
        <tbody>
          <tr v-for="c in items" :key="c.id" class="border-t">
            <td class="p-3">{{ c.name }}</td>
            <td class="p-3 text-right space-x-2">
              <button class="text-amber-600" @click="openEdit(c)">แก้ไข</button>
              <button class="text-red-600" @click="askDelete(c)">ลบ</button>
            </td>
          </tr>
          <tr v-if="!items.length"><td colspan="2" class="p-6 text-center text-slate-400">ไม่พบข้อมูล</td></tr>
        </tbody>
      </table>
    </div>

    <AppPagination v-model="page" :total-pages="totalPages" />
    <ConfirmModal v-model="showDelete" :message="`ต้องการลบหมวดหมู่ &quot;${deleting?.name}&quot; ใช่หรือไม่?`" @confirm="doDelete" />

    <div v-if="showForm" class="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
      <form class="bg-white rounded-xl p-6 w-full max-w-md space-y-3" @submit.prevent="save">
        <h2 class="font-bold text-lg">{{ editingId ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่' }}</h2>
        <div><input v-model="name" placeholder="ชื่อหมวดหมู่" class="w-full border rounded px-3 py-2" /><p class="text-red-500 text-sm">{{ nameError }}</p></div>
        <p v-if="serverError" class="text-red-600 text-sm bg-red-50 p-2 rounded">{{ serverError }}</p>
        <div class="flex justify-end gap-2">
          <button type="button" class="px-4 py-2 border rounded" @click="showForm = false">ยกเลิก</button>
          <button class="px-4 py-2 bg-indigo-600 text-white rounded">บันทึก</button>
        </div>
      </form>
    </div>
  </div>
</template>
