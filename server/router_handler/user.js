import pool from '../config/database.js'
import bcrypt from 'bcryptjs'
// 生成Token的包
import jwt from 'jsonwebtoken'
import config from '../config/config.js'
// 注册模块 
const register = async (req, res) => {
    try{
        const userInfo = req.body
        userInfo.password = await bcrypt.hash(userInfo.password, 10)
        const { username } = userInfo

        // console.log(password);
        
        // 查询用户名是否被占用
        const sqlStr = 'SELECT * FROM user WHERE username=?'
        const [result] = await pool.query(sqlStr, username)
        // console.log(result.length);
        if(result.length > 0){
            return res.json({ message: '用户名被占用，请更换其他用户名', success: false})
        }
        
        // 插入新用户的注册信息
        const sqlStr2 = 'INSERT INTO user SET ?'
        await pool.query(sqlStr2, userInfo)
        res.json({ message: '客户添加成功', success: true});
         
    }catch(error){
        res.status(500).json({ error: '添加客户失败' });
        console.log(error);
        
    }


}
// 登录模块
const login = async (req, res) => {
    // res.status(200).json({ message: 'success'})
    try {
        const userInfo = req.body
        const { username, password } = userInfo
        const sqlStr = 'SELECT * FROM user WHERE username=?'
        const [result] = await pool.query(sqlStr, username)
        // 判断用户名
        if(result.length !== 1){
            return res.json({ message: '登录失败'})
        }
        // 判断密码是否正确
        const compareResult = bcrypt.compareSync(password, result[0].password )
        if(!compareResult){
            return res.json({ message: '登录失败'})
        }
        // 剔除敏感数据（密码）
        const user = { ...result[0], password:''}
        delete user.password;
        // 生成Token
        const tokenStr = jwt.sign(user, config.jwtSecretKey, { expiresIn: config.expiresIn })
        res.json({ message: '登录成功！', token: 'Bearer '+ tokenStr, success: true })
        
    }catch(error){
        console.error('登录异常:', error);
        res.status(500).json({ status: 1, message: '服务器内部错误' });
    }
}




export { register, login }