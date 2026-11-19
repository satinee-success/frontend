<script setup lang="ts">
type Item = { id: number; name: string; description: string; file_url?: string }

const api = useApi()
const auth = useAuthStore()

const items = ref<Item[]>([])
const total = ref(0)
const page = ref(1)
const limit = 10
const search = ref('')
const errorMsg = ref('')

const showForm = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({ name: '', description: '' })
const file = ref<File | null>(null)
const formErrors = reactive<Record<string, string>>({})

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit)))
const canEdit = computed(() => ['admin', 'user1'].includes(auth.user?.role ?? ''))

async function load() {
  errorMsg.value = ''
  try {
    const res: any = await api('/items', { query: { page: page.value, limit, search: search.value } })
    items.value = res.data.items
    total.value = res.data.total
  } catch (e: any) {
    errorMsg.value = e?.data?.message || 'โหลดข้อมูลไม่สำเร็จ'
  }
}

watch(page, load)
let timer: any
watch(search, () => {
  clearTimeout(timer)
  timer = setTimeout(() => { page.value = 1; load() }, 400)
})
onMounted(load)

function openCreate() {
  editingId.value = null
  Object.assign(form, { name: '', description: '' })
  file.value = null
  showForm.value = true
}

function openEdit(it: Item) {
  editingId.value = it.id
  Object.assign(form, { name: it.name, description: it.description })
  file.value = null
  showForm.value = true
}

function onFile(e: Event) {
  file.value = (e.target as HTMLInputElement).files?.[0] ?? null
}

function validate() {
  formErrors.name = form.name.trim() ? '' : 'กรุณากรอกชื่อ'
  formErrors.description = form.description.length <= 255 ? '' : 'ยาวเกิน 255 ตัวอักษร'
  if (file.value && file.value.size > 2 * 1024 * 1024) formErrors.file = 'ไฟล์ต้องไม่เกิน 2MB'
  else formErrors.file = ''
  return !formErrors.name && !formErrors.description && !formErrors.file
}

async function save() {
  if (!validate()) return
  const body = new FormData()
  body.append('name', form.name)
  body.append('description', form.description)
  if (file.value) body.append('file', file.value)
  try {
    if (editingId.value) await api(`/items/${editingId.value}`, { method: 'PUT', body })
    else await api('/items', { method: 'POST', body })
    showForm.value = false
    await load()
  } catch (e: any) {
    errorMsg.value = e?.data?.message || 'บันทึกไม่สำเร็จ'
  }
}

async function remove(it: Item) {
  if (!confirm(`ยืนยันการลบ "${it.name}" ?`)) return
  try {
    await api(`/items/${it.id}`, { method: 'DELETE' })
    await load()
  } catch (e: any) {
    errorMsg.value = e?.data?.message || 'ลบไม่สำเร็จ'
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col sm:flex-row gap-2 justify-between">
      <input v-model="search" placeholder="ค้นหา..." class="border rounded px-3 py-2 sm:w-64" />
      <button v-if="canEdit" class="bg-indigo-600 text-white px-4 py-2 rounded" @click="openCreate">+ เพิ่มข้อมูล</button>
    </div>

    <p v-if="errorMsg" class="text-red-600 bg-red-50 p-2 rounded">{{ errorMsg }}</p>

    <div class="bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full text-left">
        <thead class="bg-slate-100">
          <tr><th class="p-3">ชื่อ</th><th class="p-3">รายละเอียด</th><th class="p-3">ไฟล์</th><th class="p-3"></th></tr>
        </thead>
        <tbody>
          <tr v-for="it in items" :key="it.id" class="border-t">
            <td class="p-3">{{ it.name }}</td>
            <td class="p-3">{{ it.description }}</td>
            <td class="p-3"><a v-if="it.file_url" :href="it.file_url" target="_blank" class="text-indigo-600 underline">เปิดไฟล์</a></td>
            <td class="p-3 text-right space-x-2">
              <button v-if="canEdit" class="text-amber-600" @click="openEdit(it)">แก้ไข</button>
              <button v-if="auth.user?.role === 'admin'" class="text-red-600" @click="remove(it)">ลบ</button>
            </td>
          </tr>
          <tr v-if="!items.length"><td colspan="4" class="p-6 text-center text-slate-400">ไม่พบข้อมูล</td></tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-center gap-3">
      <button :disabled="page <= 1" class="px-3 py-1 border rounded disabled:opacity-40" @click="page--">ก่อนหน้า</button>
      <span>หน้า {{ page }} / {{ totalPages }}</span>
      <button :disabled="page >= totalPages" class="px-3 py-1 border rounded disabled:opacity-40" @click="page++">ถัดไป</button>
    </div>

    <div v-if="showForm" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
      <form class="bg-white rounded-xl p-6 w-full max-w-md space-y-3" @submit.prevent="save">
        <h2 class="font-bold text-lg">{{ editingId ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูล' }}</h2>
        <div>
          <input v-model="form.name" placeholder="ชื่อ" class="w-full border rounded px-3 py-2" />
          <p class="text-red-500 text-sm">{{ formErrors.name }}</p>
        </div>
        <div>
          <textarea v-model="form.description" placeholder="รายละเอียด" class="w-full border rounded px-3 py-2" />
          <p class="text-red-500 text-sm">{{ formErrors.description }}</p>
        </div>
        <div>
          <input type="file" @change="onFile" />
          <p class="text-red-500 text-sm">{{ formErrors.file }}</p>
        </div>
        <div class="flex justify-end gap-2">
          <button type="button" class="px-4 py-2 border rounded" @click="showForm = false">ยกเลิก</button>
          <button class="px-4 py-2 bg-indigo-600 text-white rounded">บันทึก</button>
        </div>
      </form>
    </div>
  </div>
</template>