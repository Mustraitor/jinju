// src/api/admin.js
import { request } from './index'

export const adminApi = {
  getAllUsers() {
    return request('/admin/getAllUsers', {
      method: 'GET'
    })
  },
  
  updateUserRole(id, user_type) {
    return request('/admin/updateUserRole', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `id=${id}&user_type=${user_type}`
    })
  },
  addUser(data){
    return request('/admin/addUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  },
  /**
   * 4. 禁用/逻辑删除用户 (D - Delete)
   */
    deleteUser(id) {
        return request('/admin/deleteUser', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }) // 改为 JSON 对象
        })
    },

  /**
   * 5. 恢复/解封用户 (Restore)
   */
  restoreUser(id) {
    return request('/admin/restoreUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `id=${id}`
    })
  },

  /**
   * 导入知识图谱 Excel
   * @param {FormData} formData 包含文件的表单数据
   */
  importGraphData(formData) {
    return request('/admin/importGraphData', {
      method: 'POST',
      body: formData,
    });
  },
  syncVideos (){
    return request('/admin/syncVideos', {
      method: 'POST'
    });
  },
  importSubtitles(data){
    return request('/admin/importSubtitles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data) 
    });
  }
}