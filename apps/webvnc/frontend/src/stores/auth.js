import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('auth_token'))
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!token.value)

  const initializeAuth = async () => {
    if (token.value) {
      try {
        const response = await api.get('/auth/profile')
        user.value = response.data.user
      } catch (err) {
        logout()
      }
    }
  }

  const login = async (credentials) => {
    loading.value = true
    error.value = null

    try {
      // Prevent Axios from throwing on 4xx/5xx
      const response = await api.post('/auth/login', credentials, {
        validateStatus: () => true
      })

      if (response.status === 201 && response.data.access_token) {
        const { access_token, user: userData } = response.data
        token.value = access_token
        user.value = userData
        localStorage.setItem('auth_token', access_token)

        return { success: true }
      } else {
        // Handle failed login gracefully without reload
        error.value = response.data.message || 'Invalid credentials'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Login failed'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (err) {
      // Ignore logout errors
    }

    token.value = null
    user.value = null
    localStorage.removeItem('auth_token')
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    initializeAuth,
    login,
    logout
  }
})
