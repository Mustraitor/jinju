// 导出这个方法
import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
export const ensureAdminExists = async () => {
    try {
        const username = 'admin';
        const password = '123456'; 
        const user_type = 1; // 管理员标识
        const [rows] = await pool.query('SELECT * FROM user WHERE username = ? AND is_delete = 0', [username]);
        
        if (rows.length > 0) {
            // 如果已经有了，就什么都不做
            return;
        }

        // 2. 加密并插入
        // 这里使用 bcrypt.hashSync 是为了在启动时同步处理，简单直观
        const hashPwd = bcrypt.hashSync(password, 10);
        
        const sqlStr = 'INSERT INTO user (username, password, user_type) VALUES (?, ?, ?)';
        await pool.query(sqlStr, [username, hashPwd, user_type]);

        console.log('-----------------------------------------------');
        console.log('  [系统初始化]: 检测到无管理员账号，已自动创建');
        console.log(`  [账号]: ${username}  [密码]: ${password}`);
        console.log('-----------------------------------------------');
    } catch (err) {
        console.error('--- 管理员账号初始化失败 ---');
        console.error(err.message);
    }
};