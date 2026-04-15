import express from 'express'
import cors from 'cors'
import pool from './config/database.js'
import 'dotenv/config'

import adminRouter from './router/admin.js'
import userRouter from './router/user.js'
import userInfoRouter from './router/userInfo.js'
import musicRouter from './router/music.js'
import chatAIRouter from './router/chatAI.js'
import graphRouter from './router/graph.js'
import videoRouter from './router/video.js'
import subtitleRouter from './router/subtitles.js'

import joi from 'joi'   
// 解析Token的包
import { expressjwt } from 'express-jwt' 
import config from './config/config.js' 

import path from 'path'
import { fileURLToPath } from 'url'
// import { runSovits } from './utils/runSovits.js';
// runSovits() 

import { ensureAdminExists } from './utils/initAdmin.js'
 
const app = express()   
app.use(cors({  
  origin: '*',  
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));  
 

app.use(express.json())

// app.use('/videos', express.static(path.join(process.cwd(), 'videos')))
// app.use('/covers', express.static(path.join(process.cwd(), 'covers')))

app.use('/videos', express.static(path.join(process.cwd(), 'videos')));
app.use('/covers', express.static(path.join(process.cwd(), 'covers')));

// 配置表单数据的中间件
app.use(express.urlencoded({ extended: false }))
// 解析Token的中间件，解析结果在req.auth
app.use(expressjwt({ 
    secret: config.jwtSecretKey, 
    algorithms: ['HS256'] 
}).unless({ 
    path: [
        /^\/api\/login/,    // 只排除登录
        /^\/api\/register/, // 只排除注册
        /^\/TTS_sound\//, 
        /^\/audio\//,
        /^\/videos\//,
        /^\/covers\//
    ] 
}))  


app.use('/audio', express.static(path.join(process.cwd(), 'audio')));
app.use('/TTS_sound', express.static(path.join(process.cwd(), 'TTS_sound')));


// 数据库测试连接
pool.getConnection() 
  .then(connection => {
    console.log('Connected to database');
    connection.release();
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });
 
 
 
// 路由配置
app.use('/api', userRouter)
app.use('/api/my', userInfoRouter)
app.use('/api/music', musicRouter)
app.use('/api/chat', chatAIRouter)
app.use('/api/graph', graphRouter)
app.use("/api/video", videoRouter)
app.use("/api/admin", adminRouter)
app.use("/api/subtitles", subtitleRouter)
// 全局错误捕获
// app.use((err, req, res, next) => {
//   if(err instanceof joi.ValidationError){
//     return res.json({ error: err })
//   }
//   if(err.name === 'UnauthorizedError'){
//     res.status(401).json({ error: '身份认证失败' })
//   }
//   res.json({ error: err })
// })
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  // 2. Joi 校验错误
  if (err instanceof joi.ValidationError) {
    return res.status(400).json({ 
      status: 1,
      message: '参数校验失败',
      error: err.message 
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      status: 1,
      message: '身份认证失败' 
    });
  }

  console.error('未捕获错误:', err);
  res.status(500).json({ 
    status: 1,
    message: '服务器内部错误',
    error: err.message || err 
  });
})

app.listen(8080, async () => {
    console.log(`api server running at ${ config.BASE_URL } `);
    await ensureAdminExists();
})