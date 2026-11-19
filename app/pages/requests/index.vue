<script setup lang="ts">
type Req = {
  id: number; title: string; description: string | null; location: string | null; priority: string; status: string
  category_id: number | null; category_name: string | null; requester_name: string; technician_name: string | null
  tech_note: string | null; file_url: string | null; created_at: string
  logs?: { id: number; action: string; note: string | null; created_at: string; actor_name: string | null }[]
}

const api = useApi()
const auth = useAuthStore()
const role = computed(() => auth.user?.role)
const isAdmin = computed(() => role.value === 'admin')
const isTech = computed(() => role.value === 'technician')
const canCreate = computed(() => role.value === 'admin' || role.value === 'user')

const statusFilter = ref('')
const { items, page, search, errorMsg, totalPages, load } = useList<Req>('/requests', () => ({ status: statusFilter.value || undefined }))
const pageTitle = computed(() => (isAdmin.value ? 'งานแจ้งซ่อมทั้งหมด' : isTech.value ? 'งานของฉัน' : 'แจ้งซ่อมของฉัน'))

// ข้อมูลสำหรับ dropdown
const categories = ref<{ id: number; name: string }[]>([])
const technicians = ref<{ id: number; full_name: string }[]>([])
onMounted(async () => {
  const c: any = await api('/categories', { query: { limit: 100 } })
  categories.value = c.data.items
  if (isAdmin.value) technicians.value = ((await api('/users/technicians')) as any).data
})

// ---------- สิทธิ์ของปุ่มแต่ละแถว ----------
const canEditRow = (r: Req) => (isAdmin.value && !['done', 'cancelled'].includes(r.status)) || (role.value === 'user' && r.status === 'pending')
const canDeleteRow = (r: Req) => isAdmin.value || (role.value === 'user' && r.status === 'pending')

// ---------- ฟอร์มแจ้งซ่อม / แก้ไข ----------
const showForm = ref(false)
const editing = ref<Req | null>(null)
const form = reactive({ title: '', description: '', location: '', category_id: '' as string | number, priority: 'normal' })
const file = ref<File | null>(null)
const formErrors = reactive<Record<string, string>>({})
const formServerError = ref('')

function openCreate() {
  editing.value = null
  Object.assign(form, { title: '', description: '', location: '', category_id: '', priority: 'normal' })
  file.value = null; formServerError.value = ''; showForm.value = true
}
function openEdit(r: Req) {
  editing.value = r
  Object.assign(form, { title: r.title, description: r.description ?? '', location: r.location ?? '', category_id: r.category_id ?? '', priority: r.priority })
  file.value = null; formServerError.value = ''; showForm.value = true
}
function onFile(e: Event) { file.value = (e.target as HTMLInputElement).files?.[0] ?? null }
function validate() {
  formErrors.title = form.title.trim() ? (form.title.length <= 150 ? '' : 'ยาวเกิน 150 ตัวอักษร') : 'กรุณากรอกหัวข้อแจ้งซ่อม'
  formErrors.description = form.description.length <= 1000 ? '' : 'ยาวเกิน 1000 ตัวอักษร'
  formErrors.location = form.location.length <= 150 ? '' : 'ยาวเกิน 150 ตัวอักษร'
  const f = file.value
  formErrors.file = !f ? '' : f.size > 2 * 1024 * 1024 ? 'ไฟล์ต้องไม่เกิน 2MB' : !/\.(jpe?g|png|pdf)$/i.test(f.name) ? 'รองรับ jpg, png, pdf' : ''
  return !formErrors.title && !formErrors.description && !formErrors.location && !formErrors.file
}
async function save() {
  formServerError.value = ''
  if (!validate()) return
  const body = new FormData()
  body.append('title', form.title)
  body.append('description', form.description)
  body.append('location', form.location)
  body.append('category_id', String(form.category_id))
  body.append('priority', form.priority)
  if (file.value) body.append('file', file.value)
  try {
    if (editing.value) await api(`/requests/${editing.value.id}`, { method: 'PUT', body })
    else await api('/requests', { method: 'POST', body })
    showForm.value = false
    await load()
  } catch (e: any) {
    formServerError.value = e?.data?.message || 'บันทึกไม่สำเร็จ'
  }
}

// ---------- ลบ ----------
const showDelete = ref(false)
const deleting = ref<Req | null>(null)
function askDelete(r: Req) { deleting.value = r; showDelete.value = true }
async function doDelete() {
  try {
    await api(`/requests/${deleting.value!.id}`, { method: 'DELETE' })
    await load()
  } catch (e: any) {
    errorMsg.value = e?.data?.message || 'ลบไม่สำเร็จ'
  }
}

// ---------- การดำเนินการตามสิทธิ์: มอบหมายช่าง / รับงาน / ปฏิเสธ / เสร็จสิ้น / ยกเลิก ----------
type ActType = 'assign' | 'reject' | 'complete' | 'cancel'
const act = ref<{ type: ActType; req: Req } | null>(null)
const actForm = reactive({ technician_id: '' as string | number, priority: '', note: '' })
const actError = ref('')
const actTitle: Record<ActType, string> = { assign: 'มอบหมายช่าง', reject: 'ปฏิเสธงาน', complete: 'แจ้งซ่อมเสร็จ', cancel: 'ยกเลิกงาน' }

function openAct(type: ActType, r: Req) {
  act.value = { type, req: r }
  Object.assign(actForm, { technician_id: '', priority: r.priority, note: '' })
  actError.value = ''
}
async function submitAct() {
  if (!act.value) return
  const { type, req } = act.value
  if (type === 'assign' && !actForm.technician_id) { actError.value = 'กรุณาเลือกช่าง'; return }
  if (type === 'reject' && !actForm.note.trim()) { actError.value = 'กรุณาระบุเหตุผลที่ปฏิเสธ'; return }
  const body = type === 'assign'
    ? { technician_id: actForm.technician_id, priority: actForm.priority, note: actForm.note }
    : { note: actForm.note }
  try {
    await api(`/requests/${req.id}/${type}`, { method: 'PUT', body })
    act.value = null
    await load()
  } catch (e: any) {
    actError.value = e?.data?.message || 'ทำรายการไม่สำเร็จ'
  }
}
async function accept(r: Req) {
  try {
    await api(`/requests/${r.id}/accept`, { method: 'PUT', body: {} })
    await load()
  } catch (e: any) {
    errorMsg.value = e?.data?.message || 'รับงานไม่สำเร็จ'
  }
}

// ---------- รายละเอียด + ประวัติ ----------
const detail = ref<Req | null>(null)
async function openDetail(r: Req) {
  try {
    detail.value = ((await api(`/requests/${r.id}`)) as any).data
  } catch (e: any) {
    errorMsg.value = e?.data?.message || 'โหลดรายละเอียดไม่สำเร็จ'
  }
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-xl font-bold">{{ pageTitle }}</h1>
    <div class="flex flex-col sm:flex-row gap-2 justify-between">
      <div class="flex flex-col sm:flex-row gap-2">
        <input v-model="search" placeholder="ค้นหาหัวข้อ / สถานที่ / ผู้แจ้ง" class="border rounded px-3 py-2 sm:w-64" />
        <select v-model="statusFilter" class="border rounded px-3 py-2">
          <option value="">ทุกสถานะ</option>
          <option v-for="(l, k) in statusLabel" :key="k" :value="k">{{ l }}</option>
        </select>
      </div>
      <button v-if="canCreate" class="bg-indigo-600 text-white px-4 py-2 rounded" @click="openCreate">+ แจ้งซ่อม</button>
    </div>
    <p v-if="errorMsg" class="text-red-600 bg-red-50 p-2 rounded">{{ errorMsg }}</p>

    <div class="bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-100">
          <tr>
            <th class="p-3">#</th><th class="p-3">เรื่อง</th><th v-if="role !== 'user'" class="p-3">ผู้แจ้ง</th>
            <th v-if="role !== 'technician'" class="p-3">ช่าง</th><th class="p-3">ความสำคัญ</th>
            <th class="p-3">สถานะ</th><th class="p-3">วันที่แจ้ง</th><th class="p-3" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in items" :key="r.id" class="border-t align-top">
            <td class="p-3">{{ r.id }}</td>
            <td class="p-3">
              <button class="text-indigo-600 underline text-left" @click="openDetail(r)">{{ r.title }}</button>
              <p class="text-xs text-slate-500">{{ r.category_name || '-' }} · {{ r.location || '-' }}</p>
            </td>
            <td v-if="role !== 'user'" class="p-3">{{ r.requester_name }}</td>
            <td v-if="role !== 'technician'" class="p-3">{{ r.technician_name || '-' }}</td>
            <td class="p-3" :class="r.priority === 'high' ? 'text-red-600 font-bold' : ''">{{ priorityLabel[r.priority] }}</td>
            <td class="p-3"><StatusBadge :status="r.status" /></td>
            <td class="p-3 whitespace-nowrap">{{ fmtDate(r.created_at) }}</td>
            <td class="p-3 text-right space-x-2 whitespace-nowrap">
              <!-- ช่าง -->
              <template v-if="isTech">
                <template v-if="r.status === 'assigned'">
                  <button class="text-green-600" @click="accept(r)">รับงาน</button>
                  <button class="text-red-600" @click="openAct('reject', r)">ปฏิเสธ</button>
                </template>
                <button v-if="r.status === 'in_progress'" class="text-green-600" @click="openAct('complete', r)">ซ่อมเสร็จ</button>
              </template>
              <!-- admin -->
              <template v-if="isAdmin">
                <button v-if="['pending', 'assigned'].includes(r.status)" class="text-blue-600" @click="openAct('assign', r)">
                  {{ r.status === 'assigned' ? 'เปลี่ยนช่าง' : 'มอบหมายช่าง' }}
                </button>
                <button v-if="['pending', 'assigned', 'in_progress'].includes(r.status)" class="text-slate-600" @click="openAct('cancel', r)">ยกเลิกงาน</button>
              </template>
              <!-- admin / user -->
              <button v-if="canEditRow(r)" class="text-amber-600" @click="openEdit(r)">แก้ไข</button>
              <button v-if="canDeleteRow(r)" class="text-red-600" @click="askDelete(r)">ลบ</button>
            </td>
          </tr>
          <tr v-if="!items.length"><td colspan="8" class="p-6 text-center text-slate-400">ไม่พบข้อมูล</td></tr>
        </tbody>
      </table>
    </div>

    <AppPagination v-model="page" :total-pages="totalPages" />
    <ConfirmModal v-model="showDelete" :message="`ต้องการลบงาน &quot;${deleting?.title}&quot; ใช่หรือไม่?`" @confirm="doDelete" />

    <!-- ฟอร์มแจ้งซ่อม / แก้ไข -->
    <div v-if="showForm" class="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
      <form class="bg-white rounded-xl p-6 w-full max-w-md space-y-3 max-h-[90vh] overflow-y-auto" @submit.prevent="save">
        <h2 class="font-bold text-lg">{{ editing ? 'แก้ไขงานแจ้งซ่อม' : 'แจ้งซ่อม' }}</h2>
        <div><input v-model="form.title" placeholder="หัวข้อ เช่น คอมพิวเตอร์เปิดไม่ติด" class="w-full border rounded px-3 py-2" /><p class="text-red-500 text-sm">{{ formErrors.title }}</p></div>
        <div><textarea v-model="form.description" placeholder="รายละเอียดอาการ" rows="3" class="w-full border rounded px-3 py-2" /><p class="text-red-500 text-sm">{{ formErrors.description }}</p></div>
        <div><input v-model="form.location" placeholder="สถานที่ เช่น ห้อง 301" class="w-full border rounded px-3 py-2" /><p class="text-red-500 text-sm">{{ formErrors.location }}</p></div>
        <select v-model="form.category_id" class="w-full border rounded px-3 py-2">
          <option value="">-- เลือกหมวดหมู่ --</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <select v-model="form.priority" class="w-full border rounded px-3 py-2">
          <option v-for="(l, k) in priorityLabel" :key="k" :value="k">ความสำคัญ: {{ l }}</option>
        </select>
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

    <!-- มอบหมายช่าง / ปฏิเสธ / ซ่อมเสร็จ / ยกเลิก -->
    <div v-if="act" class="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
      <form class="bg-white rounded-xl p-6 w-full max-w-md space-y-3" @submit.prevent="submitAct">
        <h2 class="font-bold text-lg">{{ actTitle[act.type] }}</h2>
        <p class="text-sm text-slate-500">งาน #{{ act.req.id }}: {{ act.req.title }}</p>
        <template v-if="act.type === 'assign'">
          <select v-model="actForm.technician_id" class="w-full border rounded px-3 py-2">
            <option value="">-- เลือกช่าง --</option>
            <option v-for="t in technicians" :key="t.id" :value="t.id">{{ t.full_name }}</option>
          </select>
          <select v-model="actForm.priority" class="w-full border rounded px-3 py-2">
            <option v-for="(l, k) in priorityLabel" :key="k" :value="k">ความสำคัญ: {{ l }}</option>
          </select>
        </template>
        <textarea v-model="actForm.note" rows="3" class="w-full border rounded px-3 py-2"
          :placeholder="act.type === 'reject' ? 'เหตุผลที่ปฏิเสธ (จำเป็น)' : act.type === 'complete' ? 'สรุปการซ่อม / อะไหล่ที่เปลี่ยน' : 'หมายเหตุ (ไม่บังคับ)'" />
        <p v-if="actError" class="text-red-600 text-sm bg-red-50 p-2 rounded">{{ actError }}</p>
        <div class="flex justify-end gap-2">
          <button type="button" class="px-4 py-2 border rounded" @click="act = null">ยกเลิก</button>
          <button class="px-4 py-2 bg-indigo-600 text-white rounded">ยืนยัน</button>
        </div>
      </form>
    </div>

    <!-- รายละเอียด + ประวัติ -->
    <div v-if="detail" class="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4" @click.self="detail = null">
      <div class="bg-white rounded-xl p-6 w-full max-w-lg space-y-3 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-start gap-2">
          <h2 class="font-bold text-lg">#{{ detail.id }} {{ detail.title }}</h2>
          <StatusBadge :status="detail.status" />
        </div>
        <p class="text-sm whitespace-pre-line">{{ detail.description || '-' }}</p>
        <div class="text-sm text-slate-600 space-y-1">
          <p>หมวดหมู่: {{ detail.category_name || '-' }} · สถานที่: {{ detail.location || '-' }}</p>
          <p>ผู้แจ้ง: {{ detail.requester_name }} · ช่าง: {{ detail.technician_name || '-' }}</p>
          <p>ความสำคัญ: {{ priorityLabel[detail.priority] }}</p>
          <p v-if="detail.tech_note">สรุปการซ่อม: {{ detail.tech_note }}</p>
          <p v-if="detail.file_url"><a :href="detail.file_url" target="_blank" class="text-indigo-600 underline">เปิดไฟล์แนบ</a></p>
        </div>
        <h3 class="font-bold pt-2">ประวัติการดำเนินการ</h3>
        <ul class="text-sm space-y-1">
          <li v-for="l in detail.logs" :key="l.id" class="border-l-2 border-indigo-300 pl-3">
            <span class="font-medium">{{ actionLabel[l.action] || l.action }}</span>
            <span class="text-slate-500"> — {{ l.actor_name || 'ระบบ' }} · {{ fmtDate(l.created_at) }}</span>
            <p v-if="l.note" class="text-slate-600">{{ l.note }}</p>
          </li>
        </ul>
        <div class="text-right"><button class="px-4 py-2 border rounded" @click="detail = null">ปิด</button></div>
      </div>
    </div>
  </div>
</template>
