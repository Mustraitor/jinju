// src/api/user.js
import { request } from './index'

export const userApi = {
  /**
   * 用户注册
   * @param {string} username 
   * @param {string} password 
   */
  register(username, password) {
    return request('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      // 后端如果是 express.urlencoded 解析，则需要这种格式
      body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    })
  },

  /**
   * 用户登录
   * @param {string} username 
   * @param {string} password 
   */
  login(username, password) {
    return request('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    })
  }
}