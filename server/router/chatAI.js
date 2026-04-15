import express from 'express'
import { chatAI, newConversation, TTS, getTTS,update_model, initData, saveData, LoadData, deleteTTSFile } from '../router_handler/chatAI.js'

const router = express.Router()

router.post('/newConversation', newConversation )
router.post('/chatAI', chatAI )
// router.post('/set_refer_audio', set_refer_audio)
router.post('/update_model', update_model)
router.post('/TTS', TTS)
router.get('/getTTS', getTTS)
router.delete('/deleteTTSFile', deleteTTSFile)
router.post('/initData', initData)
router.post('/saveData', saveData)
router.get('/LoadData', LoadData)
export default router