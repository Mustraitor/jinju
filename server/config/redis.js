import { createClient } from 'redis'

const client = createClient({
    socket: {
        // 关键修改：优先读取环境变量 REDIS_HOST，如果没有则回退到 127.0.0.1
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: 6379
    }
});

client.on('error', (err) => {
    // 这里的错误就是你截图里看到的 Redis error: Error: connect ECONNREFUSED
    console.error('Redis error:', err)
})

// 注意：如果你的 Node 环境不支持顶层 await，请确保这段代码在异步函数中
await client.connect()

export default client