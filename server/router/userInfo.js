import express from 'express'
import { getUserInfo, updataUserInfo, updatePassword } from '../router_handler/userInfo.js'
import expressJoi from '@escook/express-joi'
import { update_userInfo_schema, update_password_schema } from '../schema/user.js'

const router = express.Router()
//获取用户信息的路由
router.get('/userInfo', getUserInfo)
//修改用户信息的路由
router.post('/userInfo', expressJoi(update_userInfo_schema), updataUserInfo)
//重置密码的路由
router.post('/updatepwd', expressJoi(update_password_schema), updatePassword)



export default router