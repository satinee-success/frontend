<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const config = useRuntimeConfig()
const auth = useAuthStore()
const form = reactive({ username: '', password: '' })
const errors = reactive<Record<string, string>>({})
const serverError = ref('')
const loading = ref(false)

function validate() {
  errors.username = form.username.trim() ? '' : 'กรุณากรอกชื่อผู้ใช้'
  errors.password = form.password.length >= 4 ? '' : 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร'
  return !errors.username && !errors.password
}

async function submit() {
  serverError.value = ''
  if (!validate()) return
  loading.value = true
  try {
    const res = await $fetch<{ data: { token: string } }>('/auth/login', {
      baseURL: config.public.apiBase,
      method: 'POST',
      body: form
    })
    auth.token = res.data.token
    await navigateTo(auth.user?.role === 'admin' ? '/users' : '/scores')
  } catch (e: any) {
    serverError.value = e?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="bg-white p-6 rounded-xl shadow w-full max-w-sm space-y-4" @submit.prevent="submit">
    <h1 class="text-xl font-bold text-center">เข้าสู่ระบบ</h1>
    <div>
      <input v-model="form.username" placeholder="ชื่อผู้ใช้" class="w-full border rounded px-3 py-2" />
      <p v-if="errors.username" class="text-red-500 text-sm">{{ errors.username }}</p>
    </div>
    <div>
      <input v-model="form.password" type="password" placeholder="รหัสผ่าน" class="w-full border rounded px-3 py-2" />
      <p v-if="errors.password" class="text-red-500 text-sm">{{ errors.password }}</p>
    </div>
    <p v-if="serverError" class="text-red-600 text-sm bg-red-50 p-2 rounded">{{ serverError }}</p>
    <button :disabled="loading" class="w-full bg-indigo-600 text-white py-2 rounded disabled:opacity-50">
      {{ loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }}
    </button>
    <p class="text-xs text-slate-400 text-center">ทดลอง: admin / teacher1 / student1 รหัสผ่าน 1234</p>
  </form>
</template>