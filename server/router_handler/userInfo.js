import pool from '../config/database.js'
import bcrypt from 'bcryptjs'

// 获取用户的基本信息
const getUserInfo = async (req, res) => {
    const sqlStr = 'SELECT id, username, user_pic FROM user WHERE id =?'
    // expressJWT中间件
    const [result] = await pool.query(sqlStr, req.auth.id) 
    if(result.length !== 1){
        return res.json({ message: '获取用户信息失败' })
    }
    res.json({ 
        message: '获取用户信息成功',
        data: result[0]
    })
}
// 更新用户名与邮箱
const updataUserInfo = async (req, res) => {
    try {
        const sqlStr = 'UPDATE user SET ? WHERE id = ?'   
        const [result] = await pool.query(sqlStr, [req.body, req.body.id]) 
        if(result.affectedRows !== 1){
            return res.json({ message: '修改用户信息失败', success: false })
        }
        return res.json({ message: '修改用户信息成功', success: true })
    }catch(error){
        res.json({ message: '用户名已被占用', success: false })
    }

}
// 重置密码
const updatePassword = async (req, res) => {
    const sqlStr = 'SELECT * FROM user WHERE id = ?'
    const [result] = await pool.query(sqlStr, req.auth.id) 
    if(result.length !== 1){
        return res.json({ message: '获取用户信息失败' })
    }
    // 判断提交的旧密码是否正确
    const compareResult = bcrypt.compareSync(req.body.oldPwd, result[0].password )
    if(!compareResult){
        return res.json({ message: '原密码错误' })
    }
    // 对新密码加密
    const newPwd = bcrypt.hashSync(req.body.newPwd, 10)
    const sqlStr2 = 'UPDATE user SET password = ? WHERE id = ?'
    const [result2] = await pool.query(sqlStr2, [newPwd, req.auth.id]) 
    if(result2.affectedRows !== 1){
        return res.json({ message: '重置密码失败', success: false })
    }
    return res.json({ message: '重置密码成功', success: true })
}

export { getUserInfo, updataUserInfo, updatePassword }