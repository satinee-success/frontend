export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()

  if (to.path === '/login') {
    return auth.isLoggedIn ? navigateTo('/') : undefined
  }
  if (!auth.isLoggedIn) return navigateTo('/login')

  const roles = to.meta.roles as string[] | undefined
  if (roles && !roles.includes(auth.user!.role)) return navigateTo('/')
})