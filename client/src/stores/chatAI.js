import { defineStore } from 'pinia'
import { ref } from 'vue'
import fetchWrapper from '@/utils/fetchWrapper'
export const usechatAIstore = defineStore('chatAI', () => {
//创建对话
const conversation_id = ref(null)
async function createConversation () {
    const newConversation = await fetchWrapper('/chat/newConversation', { method: 'POST' }) 
    conversation_id.value = newConversation.data.conversation_id
    // console.log( conversation_id.value);
        
}
return { conversation_id, createConversation }

})