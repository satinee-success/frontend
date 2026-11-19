<script setup lang="ts">
definePageMeta({ roles: ['admin'] }) // เฉพาะผู้ดูแลระบบ

type User = { id: number; username: string; full_name: string; role: string }
const api = useApi()
const roleFilter = ref('')
const { items, page, search, errorMsg, totalPages, load } = useList<User>('/users', () => ({ role: roleFilter.value || undefined }))
const roleLabel: Record<string, string> = { admin: 'ผู้ดูแลระบบ', user1: 'ครู', user2: 'นักเรียน' }

const showForm = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({ username: '', password: '', full_name: '', role: 'user2' })
const formErrors = reactive<Record<string, string>>({})
const formServerError = ref('')

const showDelete = ref(false)
const deleting = ref<User | null>(null)

function openCreate() {
  editingId.value = null
  Object.assign(form, { username: '', password: '', full_name: '', role: 'user2' })
  formServerError.value = ''
  showForm.value = true
}
function openEdit(u: User) {
  editingId.value = u.id
  Object.assign(form, { username: u.username, password: '', full_name: u.full_name, role: u.role })
  formServerError.value = ''
  showForm.value = true
}
function validate() {
  formErrors.username = editingId.value || /^[a-zA-Z0-9_]{3,50}$/.test(form.username) ? '' : 'a-z, 0-9, _ ยาว 3-50 ตัว'
  formErrors.password = (!editingId.value || form.password) && form.password.length < 4 ? 'รหัสผ่านอย่างน้อย 4 ตัวอักษร' : ''
  formErrors.full_name = form.full_name.trim() ? '' : 'กรุณากรอกชื่อ-นามสกุล'
  return !formErrors.username && !formErrors.password && !formErrors.full_name
}
async function save() {
  formServerError.value = ''
  if (!validate()) return
  try {
    if (editingId.value) await api(`/users/${editingId.value}`, { method: 'PUT', body: form })
    else await api('/users', { method: 'POST', body: form })
    showForm.value = false
    await load()
  } catch (e: any) {
    formServerError.value = e?.data?.message || 'บันทึกไม่สำเร็จ'
  }
}
function askDelete(u: User) { deleting.value = u; showDelete.value = true }
async function doDelete() {
  try {
    await api(`/users/${deleting.value!.id}`, { method: 'DELETE' })
    await load()
  } catch (e: any) {
    errorMsg.value = e?.data?.message || 'ลบไม่สำเร็จ'
  }
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-xl font-bold">จัดการผู้ใช้</h1>
    <div class="flex flex-col sm:flex-row gap-2 justify-between">
      <div class="flex gap-2">
        <input v-model="search" placeholder="ค้นหาชื่อ / username" class="border rounded px-3 py-2 sm:w-64" />
        <select v-model="roleFilter" class="border rounded px-3 py-2">
          <option value="">ทุกสิทธิ์</option>
          <option v-for="(l, k) in roleLabel" :key="k" :value="k">{{ l }}</option>
        </select>
      </div>
      <button class="bg-indigo-600 text-white px-4 py-2 rounded" @click="openCreate">+ เพิ่มผู้ใช้</button>
    </div>

    <p v-if="errorMsg" class="text-red-600 bg-red-50 p-2 rounded">{{ errorMsg }}</p>

    <div class="bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full text-left">
        <thead class="bg-slate-100"><tr><th class="p-3">Username</th><th class="p-3">ชื่อ-นามสกุล</th><th class="p-3">สิทธิ์</th><th class="p-3" /></tr></thead>
        <tbody>
          <tr v-for="u in items" :key="u.id" class="border-t">
            <td class="p-3">{{ u.username }}</td>
            <td class="p-3">{{ u.full_name }}</td>
            <td class="p-3">{{ roleLabel[u.role] }}</td>
            <td class="p-3 text-right space-x-2">
              <button class="text-amber-600" @click="openEdit(u)">แก้ไข</button>
              <button class="text-red-600" @click="askDelete(u)">ลบ</button>
            </td>
          </tr>
          <tr v-if="!items.length"><td colspan="4" class="p-6 text-center text-slate-400">ไม่พบข้อมูล</td></tr>
        </tbody>
      </table>
    </div>

    <AppPagination v-model="page" :total-pages="totalPages" />
    <ConfirmModal v-model="showDelete" :message="`ต้องการลบผู้ใช้ &quot;${deleting?.username}&quot; ใช่หรือไม่?`" @confirm="doDelete" />

    <div v-if="showForm" class="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
      <form class="bg-white rounded-xl p-6 w-full max-w-md space-y-3" @submit.prevent="save">
        <h2 class="font-bold text-lg">{{ editingId ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้' }}</h2>
        <div>
          <input v-model="form.username" :disabled="!!editingId" placeholder="Username" class="w-full border rounded px-3 py-2 disabled:bg-slate-100" />
          <p class="text-red-500 text-sm">{{ formErrors.username }}</p>
        </div>
        <div>
          <input v-model="form.password" type="password" :placeholder="editingId ? 'รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)' : 'รหัสผ่าน'" class="w-full border rounded px-3 py-2" />
          <p class="text-red-500 text-sm">{{ formErrors.password }}</p>
        </div>
        <div>
          <input v-model="form.full_name" placeholder="ชื่อ-นามสกุล" class="w-full border rounded px-3 py-2" />
          <p class="text-red-500 text-sm">{{ formErrors.full_name }}</p>
        </div>
        <select v-model="form.role" class="w-full border rounded px-3 py-2">
          <option v-for="(l, k) in roleLabel" :key="k" :value="k">{{ l }}</option>
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