import { jwtDecode } from 'jwt-decode'

type Payload = { id: number; username: string; role: string; exp: number }

export const useAuthStore = defineStore('auth', () => {
  const token = useCookie<string | null>('token', {
    default: () => null,
    maxAge: 60 * 60 * 8
  })

  const user = computed<Payload | null>(() => {
    if (!token.value) return null
    try {
      const p = jwtDecode<Payload>(token.value)
      return p.exp * 1000 > Date.now() ? p : null
    } catch {
      return null
    }
  })

  const isLoggedIn = computed(() => !!user.value)

  function logout() {
    token.value = null
  }

  return { token, user, isLoggedIn, logout }
})