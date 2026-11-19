<script setup lang="ts">
type Score = {
  id: number; student_id: number; subject_id: number; score: number; grade: string
  remark: string | null; file_url: string | null; student_name: string; subject_code: string; subject_name: string
}

const api = useApi()
const auth = useAuthStore()
const canEdit = computed(() => ['admin', 'user1'].includes(auth.user?.role ?? ''))

const subjectFilter = ref('')
const { items, page, search, errorMsg, totalPages, load } = useList<Score>('/scores', () => ({ subject_id: subjectFilter.value || undefined }))

// ข้อมูลสำหรับ dropdown
const subjects = ref<{ id: number; code: string; name: string }[]>([])
const students = ref<{ id: number; full_name: string }[]>([])
onMounted(async () => {
  const s: any = await api('/subjects', { query: { limit: 100 } })
  subjects.value = s.data.items
  if (canEdit.value) {
    const st: any = await api('/users/students')
    students.value = st.data
  }
})

const showForm = ref(false)
const editing = ref<Score | null>(null)
const form = reactive({ student_id: '' as string | number, subject_id: '' as string | number, score: '' as string | number, remark: '' })
const file = ref<File | null>(null)
const formErrors = reactive<Record<string, string>>({})
const formServerError = ref('')
const showDelete = ref(false)
const deleting = ref<Score | null>(null)

function openCreate() {
  editing.value = null
  Object.assign(form, { student_id: '', subject_id: '', score: '', remark: '' })
  file.value = null
  formServerError.value = ''
  showForm.value = true
}
function openEdit(s: Score) {
  editing.value = s
  Object.assign(form, { student_id: s.student_id, subject_id: s.subject_id, score: s.score, remark: s.remark ?? '' })
  file.value = null
  formServerError.value = ''
  showForm.value = true
}
function onFile(e: Event) { file.value = (e.target as HTMLInputElement).files?.[0] ?? null }

function validate() {
  formErrors.student_id = form.student_id ? '' : 'กรุณาเลือกนักเรียน'
  formErrors.subject_id = form.subject_id ? '' : 'กรุณาเลือกวิชา'
  const n = Number(form.score)
  formErrors.score = form.score !== '' && n >= 0 && n <= 100 ? '' : 'คะแนนต้องเป็นตัวเลข 0-100'
  formErrors.remark = form.remark.length <= 255 ? '' : 'ยาวเกิน 255 ตัวอักษร'
  const f = file.value
  formErrors.file = !f ? '' : f.size > 2 * 1024 * 1024 ? 'ไฟล์ต้องไม่เกิน 2MB' : !/\.(jpe?g|png|pdf)$/i.test(f.name) ? 'รองรับ jpg, png, pdf' : ''
  return !formErrors.student_id && !formErrors.subject_id && !formErrors.score && !formErrors.remark && !formErrors.file
}

async function save() {
  formServerError.value = ''
  if (!validate()) return
  const body = new FormData()
  body.append('student_id', String(form.student_id))
  body.append('subject_id', String(form.subject_id))
  body.append('score', String(form.score))
  body.append('remark', form.remark)
  if (file.value) body.append('file', file.value)
  try {
    if (editing.value) await api(`/scores/${editing.value.id}`, { method: 'PUT', body })
    else await api('/scores', { method: 'POST', body })
    showForm.value = false
    await load()
  } catch (e: any) {
    formServerError.value = e?.data?.message || 'บันทึกไม่สำเร็จ'
  }
}

function askDelete(s: Score) { deleting.value = s; showDelete.value = true }
async function doDelete() {
  try {
    await api(`/scores/${deleting.value!.id}`, { method: 'DELETE' })
    await load()
  } catch (e: any) {
    errorMsg.value = e?.data?.message || 'ลบไม่สำเร็จ'
  }
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-xl font-bold">{{ auth.user?.role === 'user2' ? 'คะแนนของฉัน' : 'คะแนนนักเรียน' }}</h1>
    <div class="flex flex-col sm:flex-row gap-2 justify-between">
      <div class="flex flex-col sm:flex-row gap-2">
        <input v-model="search" placeholder="ค้นหานักเรียน / วิชา" class="border rounded px-3 py-2 sm:w-64" />
        <select v-model="subjectFilter" class="border rounded px-3 py-2">
          <option value="">ทุกวิชา</option>
          <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.code }} {{ s.name }}</option>
        </select>
      </div>
      <button v-if="canEdit" class="bg-indigo-600 text-white px-4 py-2 rounded" @click="openCreate">+ บันทึกคะแนน</button>
    </div>
    <p v-if="errorMsg" class="text-red-600 bg-red-50 p-2 rounded">{{ errorMsg }}</p>

    <div class="bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full text-left">
        <thead class="bg-slate-100">
          <tr><th class="p-3">นักเรียน</th><th class="p-3">วิชา</th><th class="p-3">คะแนน</th><th class="p-3">เกรด</th><th class="p-3">ไฟล์แนบ</th><th class="p-3" /></tr>
        </thead>
        <tbody>
          <tr v-for="s in items" :key="s.id" class="border-t">
            <td class="p-3">{{ s.student_name }}</td>
            <td class="p-3">{{ s.subject_code }} {{ s.subject_name }}</td>
            <td class="p-3">{{ s.score }}</td>
            <td class="p-3 font-bold">{{ s.grade }}</td>
            <td class="p-3"><a v-if="s.file_url" :href="s.file_url" target="_blank" class="text-indigo-600 underline">เปิดไฟล์</a></td>
            <td class="p-3 text-right space-x-2">
              <template v-if="canEdit">
                <button class="text-amber-600" @click="openEdit(s)">แก้ไข</button>
                <button class="text-red-600" @click="askDelete(s)">ลบ</button>
              </template>
            </td>
          </tr>
          <tr v-if="!items.length"><td colspan="6" class="p-6 text-center text-slate-400">ไม่พบข้อมูล</td></tr>
        </tbody>
      </table>
    </div>

    <AppPagination v-model="page" :total-pages="totalPages" />
    <ConfirmModal v-model="showDelete" :message="`ต้องการลบคะแนนของ ${deleting?.student_name} วิชา ${deleting?.subject_name} ใช่หรือไม่?`" @confirm="doDelete" />

    <div v-if="showForm" class="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
      <form class="bg-white rounded-xl p-6 w-full max-w-md space-y-3" @submit.prevent="save">
        <h2 class="font-bold text-lg">{{ editing ? 'แก้ไขคะแนน' : 'บันทึกคะแนน' }}</h2>
        <div>
          <select v-model="form.student_id" :disabled="!!editing" class="w-full border rounded px-3 py-2 disabled:bg-slate-100">
            <option value="">-- เลือกนักเรียน --</option>
            <option v-for="s in students" :key="s.id" :value="s.id">{{ s.full_name }}</option>
          </select>
          <p class="text-red-500 text-sm">{{ formErrors.student_id }}</p>
        </div>
        <div>
          <select v-model="form.subject_id" :disabled="!!editing" class="w-full border rounded px-3 py-2 disabled:bg-slate-100">
            <option value="">-- เลือกวิชา --</option>
            <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.code }} {{ s.name }}</option>
          </select>
          <p class="text-red-500 text-sm">{{ formErrors.subject_id }}</p>
        </div>
        <div><input v-model="form.score" type="number" step="0.01" placeholder="คะแนน (0-100)" class="w-full border rounded px-3 py-2" /><p class="text-red-500 text-sm">{{ formErrors.score }}</p></div>
        <div><textarea v-model="form.remark" placeholder="หมายเหตุ" class="w-full border rounded px-3 py-2" /><p class="text-red-500 text-sm">{{ formErrors.remark }}</p></div>
        <div>
          <p v-if="editing?.file_url" class="text-sm">ไฟล์เดิม: <a :href="editing.file_url" target="_blank" class="text-indigo-600 underline">เปิดไฟล์</a> (เลือกไฟล์ใหม่เพื่อแทนที่)</p>
          <input type="file" accept=".jpg,.jpeg,.png,.pdf" @change="onFile" />
          <p class="text-red-500 text-sm">{{ formErrors.file }}</p>
        </div>
        <p v-if="formServerError" class="text-red-600 text-sm bg-red-50 p-2 rounded">{{ formServerError }}</p>
        <div class="flex justify-end gap-2">
          <button type="button" class="px-4 py-2 border rounded" @click="showForm = false">ยกเลิก</button>
          <button class="px-4 py-2 bg-indigo-600 text-white rounded">บันทึก</button>
        </div>
      </form>
    </div>
  </div>
</template>