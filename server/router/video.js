import express from 'express'
import { getVideolist, getVideoById } from '../router_handler/video.js'

const router = express.Router()

router.get('/list', getVideolist)
router.get('/list/:id', getVideoById)


export default router