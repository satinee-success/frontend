<script setup lang="ts">
type Subject = { id: number; code: string; name: string; credit: number; teacher_id: number | null; teacher_name: string | null }
type Teacher = { id: number; full_name: string }

const api = useApi()
const auth = useAuthStore()
const isAdmin = computed(() => auth.user?.role === 'admin')
const { items, page, search, errorMsg, totalPages, load } = useList<Subject>('/subjects')

const teachers = ref<Teacher[]>([])
onMounted(async () => {
  if (!isAdmin.value) return
  const res: any = await api('/users', { query: { role: 'user1', limit: 100 } })
  teachers.value = res.data.items
})

const showForm = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({ code: '', name: '', credit: 3, teacher_id: '' as string | number })
const formErrors = reactive<Record<string, string>>({})
const formServerError = ref('')
const showDelete = ref(false)
const deleting = ref<Subject | null>(null)

function openCreate() {
  editingId.value = null
  Object.assign(form, { code: '', name: '', credit: 3, teacher_id: '' })
  formServerError.value = ''
  showForm.value = true
}
function openEdit(s: Subject) {
  editingId.value = s.id
  Object.assign(form, { code: s.code, name: s.name, credit: s.credit, teacher_id: s.teacher_id ?? '' })
  formServerError.value = ''
  showForm.value = true
}
function validate() {
  formErrors.code = form.code.trim() ? '' : 'กรุณากรอกรหัสวิชา'
  formErrors.name = form.name.trim() ? '' : 'กรุณากรอกชื่อวิชา'
  formErrors.credit = form.credit >= 1 && form.credit <= 6 ? '' : 'หน่วยกิต 1-6'
  return !formErrors.code && !formErrors.name && !formErrors.credit
}
async function save() {
  formServerError.value = ''
  if (!validate()) return
  try {
    if (editingId.value) await api(`/subjects/${editingId.value}`, { method: 'PUT', body: form })
    else await api('/subjects', { method: 'POST', body: form })
    showForm.value = false
    await load()
  } catch (e: any) {
    formServerError.value = e?.data?.message || 'บันทึกไม่สำเร็จ'
  }
}
function askDelete(s: Subject) { deleting.value = s; showDelete.value = true }
async function doDelete() {
  try {
    await api(`/subjects/${deleting.value!.id}`, { method: 'DELETE' })
    await load()
  } catch (e: any) {
    errorMsg.value = e?.data?.message || 'ลบไม่สำเร็จ'
  }
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-xl font-bold">วิชา</h1>
    <div class="flex flex-col sm:flex-row gap-2 justify-between">
      <input v-model="search" placeholder="ค้นหารหัส / ชื่อวิชา" class="border rounded px-3 py-2 sm:w-64" />
      <button v-if="isAdmin" class="bg-indigo-600 text-white px-4 py-2 rounded" @click="openCreate">+ เพิ่มวิชา</button>
    </div>
    <p v-if="errorMsg" class="text-red-600 bg-red-50 p-2 rounded">{{ errorMsg }}</p>

    <div class="bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full text-left">
        <thead class="bg-slate-100"><tr><th class="p-3">รหัส</th><th class="p-3">ชื่อวิชา</th><th class="p-3">หน่วยกิต</th><th class="p-3">ครูผู้สอน</th><th class="p-3" /></tr></thead>
        <tbody>
          <tr v-for="s in items" :key="s.id" class="border-t">
            <td class="p-3">{{ s.code }}</td>
            <td class="p-3">{{ s.name }}</td>
            <td class="p-3">{{ s.credit }}</td>
            <td class="p-3">{{ s.teacher_name || '-' }}</td>
            <td class="p-3 text-right space-x-2">
              <template v-if="isAdmin">
                <button class="text-amber-600" @click="openEdit(s)">แก้ไข</button>
                <button class="text-red-600" @click="askDelete(s)">ลบ</button>
              </template>
            </td>
          </tr>
          <tr v-if="!items.length"><td colspan="5" class="p-6 text-center text-slate-400">ไม่พบข้อมูล</td></tr>
        </tbody>
      </table>
    </div>

    <AppPagination v-model="page" :total-pages="totalPages" />
    <ConfirmModal v-model="showDelete" :message="`ต้องการลบวิชา &quot;${deleting?.name}&quot; (คะแนนของวิชานี้จะถูกลบด้วย) ใช่หรือไม่?`" @confirm="doDelete" />

    <div v-if="showForm" class="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
      <form class="bg-white rounded-xl p-6 w-full max-w-md space-y-3" @submit.prevent="save">
        <h2 class="font-bold text-lg">{{ editingId ? 'แก้ไขวิชา' : 'เพิ่มวิชา' }}</h2>
        <div><input v-model="form.code" placeholder="รหัสวิชา" class="w-full border rounded px-3 py-2" /><p class="text-red-500 text-sm">{{ formErrors.code }}</p></div>
        <div><input v-model="form.name" placeholder="ชื่อวิชา" class="w-full border rounded px-3 py-2" /><p class="text-red-500 text-sm">{{ formErrors.name }}</p></div>
        <div><input v-model.number="form.credit" type="number" min="1" max="6" placeholder="หน่วยกิต" class="w-full border rounded px-3 py-2" /><p class="text-red-500 text-sm">{{ formErrors.credit }}</p></div>
        <select v-model="form.teacher_id" class="w-full border rounded px-3 py-2">
          <option value="">-- ไม่ระบุครูผู้สอน --</option>
          <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.full_name }}</option>
        </select>
        <p v-if="formServerError" class="text-red-600 text-sm bg-red-50 p-2 rounded">{{ formServerError }}</p>
        <div class="flex justify-end gap-2">
          <button type="button" class="px-4 py-2 border rounded" @click="showForm = false">ยกเลิก</button>
          <button class="px-4 py-2 bg-indigo-600 text-white rounded">บันทึก</button>
        </div>
      </form>
    </div>
  </div>
</template>