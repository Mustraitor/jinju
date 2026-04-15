import { useUserStore } from '@/stores/user.js' 
const fetchWrapper = async(url, options = {}) => {
    let baseUrl = import.meta.env.VITE_APP_API_URL || '';
    // if (baseUrl.endsWith('/')) {
    //     baseUrl = baseUrl.slice(0, -1);
    // }
    const isStaticResource = url.startsWith('/TTS_sound') || url.startsWith('/audio') || url.startsWith('/videos');
    let apiUrl = url;
    if (!isStaticResource && !url.startsWith('/api')) {
        apiUrl = `/api${url}`;
    }
    const userStore = useUserStore()
    const token = userStore.token
    const headers = new Headers(options.headers || {});
    if (token) {
        headers.append('Authorization', `${token}`);
    }
    const response = await fetch(`${baseUrl}${apiUrl}`, {
        ...options,
        headers,
    })

    // 处理未授权响应
    if (response['status'] === 401) { 
      userStore.removeToken()
      throw new Error('会话已过期，请重新登录')
    }
    
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`)
    }
    const contentType = response.headers.get('content-type');
    if (contentType.includes('application/json')) {
        return response.json()
    } else {
        const audioBlob = await response.blob();
        const url = URL.createObjectURL(audioBlob);
        return url
    }

}
export default fetchWrapper