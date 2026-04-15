import express from 'express'
import { getMusicInfo } from '../router_handler/music.js'


const router = express.Router()
// 注册新用户的路由
router.get('/getMusicInfo', getMusicInfo )

export default router