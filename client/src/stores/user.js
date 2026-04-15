import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('user_token') || '')

  // 解析 Token 内容（内部辅助）
  const decodedToken = computed(() => {
    if (!token.value) return null;
    try {
      return jwtDecode(token.value);
    } catch (error) {
      return null;
    }
  })

  // 1. 判断 Token 是否有效
  const isTokenValid = computed(() => {
    if (!decodedToken.value) return false;
    const expirationTime = decodedToken.value.exp * 1000;
    return Date.now() < expirationTime;
  })

  // 2. 核心：直接获取 user_type
  const user_type = computed(() => {
    // 如果 Token 有效，则返回解析出的 user_type，否则默认为 0（普通用户）
    return isTokenValid.value ? (decodedToken.value.user_type || 0) : 0;
  })

  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('user_token', newToken)
  }

  const removeToken = () => {
    token.value = ''
    localStorage.removeItem('user_token')
  }
  const logout = () => {
    removeToken()
  }

  // 记得把 user_type 暴露出去
  return { token, setToken, removeToken, isTokenValid, user_type, logout }
})