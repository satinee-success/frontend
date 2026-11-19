<script setup lang="ts">
const auth = useAuthStore()
const open = ref(false)

// เมนูเปลี่ยนตามสิทธิ์
const menus = computed(() => {
  const role = auth.user?.role
  const list = [{ label: 'หน้าหลัก', to: '/' }]
  if (role === 'admin') list.push({ label: 'งานแจ้งซ่อม', to: '/requests' }, { label: 'ผู้ใช้', to: '/users' }, { label: 'หมวดหมู่', to: '/categories' })
  else if (role === 'technician') list.push({ label: 'งานของฉัน', to: '/requests' })
  else list.push({ label: 'แจ้งซ่อมของฉัน', to: '/requests' })
  return list
})

function logout() {
  auth.logout()
  navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <header class="bg-indigo-600 text-white">
      <div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <span class="font-bold">ระบบแจ้งซ่อม</span>
        <button class="md:hidden text-2xl" @click="open = !open">☰</button>
        <nav class="hidden md:flex items-center gap-4">
          <NuxtLink v-for="m in menus" :key="m.to" :to="m.to" class="hover:underline" active-class="font-bold underline">{{ m.label }}</NuxtLink>
          <span class="text-sm opacity-80">{{ auth.user?.username }} ({{ roleLabel[auth.user?.role || ''] }})</span>
          <button class="bg-white/20 px-3 py-1 rounded" @click="logout">ออกจากระบบ</button>
        </nav>
      </div>
      <nav v-if="open" class="md:hidden px-4 pb-3 flex flex-col gap-2">
        <NuxtLink v-for="m in menus" :key="m.to" :to="m.to" @click="open = false">{{ m.label }}</NuxtLink>
        <span class="text-sm opacity-80">{{ auth.user?.username }} ({{ roleLabel[auth.user?.role || ''] }})</span>
        <button class="text-left" @click="logout">ออกจากระบบ</button>
      </nav>
    </header>
    <main class="max-w-6xl mx-auto p-4">
      <slot />
    </main>
  </div>
</template>
