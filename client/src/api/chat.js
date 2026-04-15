// src/api/chat.js
import { request } from './index'

export const chatApi = {
  // 初始化数据
  initData() {
    return request('/chat/initData', { method: 'POST' })
  },
  // 发送聊天信息
  sendChatMessage(query, conversation_id) {
    return request('/chat/chatAI', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, conversation_id })
    })
  },

  // 语音合成
  textToSpeech(text) {
    return request('/chat/TTS', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `text=${encodeURIComponent(text)}`
    })
  },

  // 保存数据
  saveData(payload) {
    return request('/chat/saveData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  },

  // 获取所有存档列表
  getLoadList() {
    return request('/chat/loadData', { method: 'GET' })
  }
}