import { request } from './index'

export const videoApi = {
  // 获取视频列表数据
  getVideoList() {
    return request('/video/list',{
      method: 'GET'
    })
  },

  getVideoById(id) {
    return request(`/video/list/${id}`, {
      method: 'GET'
    })
  }
}