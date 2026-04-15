import express from 'express'
import { register,login } from '../router_handler/user.js'
import { reg_login_schema } from '../schema/user.js'
import expressJoi from '@escook/express-joi'

const router = express.Router()
// 注册新用户的路由
router.post('/register', expressJoi(reg_login_schema), register)
//登录路由
router.post('/login', expressJoi(reg_login_schema), login)


export default router