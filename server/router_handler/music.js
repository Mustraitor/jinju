// 建议修改后的 music.js
import { parseFile } from 'music-metadata';
import fs from 'fs/promises'
import path from 'path';

// 直接基于项目根目录查找，不管你在哪个子文件夹里
const audioDir = path.join(process.cwd(), 'audio'); 

const getMusicInfo = async (req, res) => {
    try {
        // 检查目录是否存在，不存在就报错提示，而不是直接崩溃
        await fs.access(audioDir).catch(() => {
            throw new Error(`目录不存在: ${audioDir}`);
        });

        const files = (await fs.readdir(audioDir))
        // 过滤掉隐藏文件（如 .gitkeep 或 .DS_Store）
        const audioFiles = files.filter(f => f.endsWith('.mp3') || f.endsWith('.wav'));

        const data = await Promise.all(audioFiles.map(async (file, index) => {
            const filePath = path.join(audioDir, file);
            const metadata = await parseFile(filePath);
            return  {
                id: index + 1,
                title: metadata.common.title || file, // 防止没有 metadata 时显示为空
                duration: metadata.format.duration,
                filename: file,
                audioSource: `/audio/${file}` // 这里的 URL 应该是相对于 Web 根目录的
            }
        }))   
        res.json({ 
            message: '获取音频数据成功', 
            success: true, 
            data: data
        })
    } catch(error) {
        console.error("读取音频错误:", error.message);
        res.status(500).json({ error: error.message });
    }
} 

export { getMusicInfo }