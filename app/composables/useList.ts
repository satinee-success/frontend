// ตัวช่วยโหลดรายการ + ค้นหา + แบ่งหน้า ใช้ซ้ำได้ทุกหน้า
export function useList<T = any>(path: string, extra: () => Record<string, any> = () => ({})) {
  const api = useApi()
  const items = ref<T[]>([])
  const total = ref(0)
  const page = ref(1)
  const limit = 10
  const search = ref('')
  const errorMsg = ref('')
  const loading = ref(false)
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit)))

  async function load() {
    errorMsg.value = ''
    loading.value = true
    try {
      const res: any = await api(path, {
        query: { page: page.value, limit, search: search.value || undefined, ...extra() }
      })
      items.value = res.data.items
      total.value = res.data.total
    } catch (e: any) {
      errorMsg.value = e?.data?.message || 'โหลดข้อมูลไม่สำเร็จ'
    } finally {
      loading.value = false
    }
  }

  let timer: any
  watch(page, load)
  watch(search, () => {
    clearTimeout(timer)
    timer = setTimeout(() => { page.value = 1; load() }, 400)
  })
  watch(extra, () => { page.value = 1; load() })
  onMounted(load)

  return { items, total, page, limit, search, errorMsg, loading, totalPages, load }
}