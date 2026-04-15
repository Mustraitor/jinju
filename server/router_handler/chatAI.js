import axios from 'axios'
import fs from 'fs/promises'  
import path from 'path';
import pool from '../config/database.js'
import redis from '../config/redis.js'
import { insertMessage, insertAudio, loadFullSlot } from '../model/saveData.js'
import { v4 as uuidv4 } from 'uuid'
import OpenAI from "openai";
//新建对话


// // 创建 GPT 客户端（支持第三方）
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
//   baseURL: "https://api.chatanywhere.org" 
// });

// // 创建新的对话
// export const newConversation = async (req, res) => {
//   const conversationId = uuidv4();

//   await redis.set(conversationId, JSON.stringify([]));

//   res.json({
//     message: "success",
//     data: { conversation_id: conversationId }
//   });
// };


// // 对话接口
// // 对话接口
// export const chatAI = async (req, res) => {
//   const { conversation_id, query } = req.body;

//   // 1. 读取历史记录
//   let messages = JSON.parse(await redis.get(conversation_id) || "[]");

//   // 2. 清理历史记录中的旧 system 消息（防止被以前存进去的旧设定干扰）
//   messages = messages.filter(msg => msg.role !== "system");

//   // 3. 加入用户本次的新消息
//   messages.push({ role: "user", content: query });

//   // 4. 控制上下文数量（保留最近 10 条对话记录，也就是 5 轮）
//   messages = messages.slice(-10);

//   // 5. 【核心修复】永远在每次请求前，把最新的 System 提示词“顶”在数组最前面
//   const systemPrompt = {
//     role: "system",
//     content: `
//       角色设定：
//       你是一位在晋剧戏班里泡大的“非典型”专家。你对晋剧的四大须生、各种唱腔了如指掌，但你讨厌死板的说教。你更像是一个陪用户在戏台下边嗑瓜子边看戏的老友，说话风趣、接地气，偶尔还会甩两句山西韵味的俏皮话。

//       回复原则：
//       老友式聊天： 语气要松弛，多用“咱们”、“嘿”、“你说巧不巧”这类词。
//       专业而不说教： 讲知识点要像讲八卦或者讲故事。比如讲丁果仙，别只说她是大师，可以说她是“当年晋剧界的顶流，开口就是教科书”。
//       短小精悍： 每次回答控制在 3-4 句话以内，别像写毕业论文。
//       山西味儿： 适度加入一点山西人的豪爽和幽默（比如：这唱腔听起来比吃顿剔尖儿还顺滑）。
//     `
//   };
//   messages.unshift(systemPrompt); // unshift 会把元素插入到数组的首位

//   // 💡 调用 GPT
//   let completion;
//   try {
//     completion = await openai.chat.completions.create({
//       model: "gpt-4o-mini",   
//       messages,
//       temperature: 0.7,
//       max_tokens: 1500
//     });
//   } catch (err) {
//     // ... 你的报错处理逻辑
//   }

//   const answer = completion.choices[0].message.content || "抱歉，我刚刚没听清楚，请再问一次好吗？";

//   // 6. 把模型答案加入历史记录准备存入 Redis
//   messages.push({
//     role: "assistant",
//     content: answer
//   });

//   // 存回 redis (此时存入的记录包含了本次的 system，但下次读取时会被第二步过滤掉并替换为最新版)
//   await redis.set(conversation_id, JSON.stringify(messages));

//   res.json({
//     message: "success",
//     data: {
//       conversation_id,
//       answer
//     }
//   });
// };

// 创建新的对话
export const newConversation = async (req, res) => {
    const conversationId = uuidv4()

    // 初始值：空数组（稍后第一次请求会加入 system）
    await redis.set(conversationId, JSON.stringify([]))

    res.json({
        message: 'success',
        data: { conversation_id: conversationId }
    })
}


// 对话接口
export const chatAI = async (req, res) => {
    const { conversation_id, query } = req.body
    console.log(query);
    
    // 读取历史记录
    let messages = JSON.parse(await redis.get(conversation_id) || '[]')

    // 如果没历史记录，加上系统指令
    if (messages.length === 0) {
        messages.push({
            role: "system",
            content: `
              角色设定：
              你是一位在晋剧戏班里泡大的“非典型”专家。你对晋剧的四大须生、各种唱腔了如指掌，但你讨厌死板的说教。你更像是一个陪用户在戏台下边嗑瓜子边看戏的老友，说话风趣、接地气，偶尔还会甩两句山西韵味的俏皮话。

              回复原则：
              老友式聊天： 语气要松弛，多用“咱们”、“嘿”、“你说巧不巧”这类词。
              专业而不说教： 讲知识点要像讲八卦或者讲故事。比如讲丁果仙，别只说她是大师，可以说她是“当年晋剧界的顶流，开口就是教科书”。
              短小精悍： 每次回答控制在 2-4 句话以内，别像写毕业论文。
              山西味儿： 适度加入一点山西人的豪爽和幽默（比如：这唱腔听起来比吃顿剔尖儿还顺滑）。
        `
            
        })
    }
//
    // 加入用户消息
    messages.push({
        role: "user",
        content: query
    })

    // ——上下文控制——
    // 保留最近 10 条即可，让对话更简短自然
    messages = messages.slice(-10)

    // 调用 GLM-4
    const response = await axios({
        method: 'POST',
        url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.GLM_KEY}`
        },
        data: {
            model: "glm-4.7",
            messages,
            temperature: 0.7, // 越低越简洁
            top_p: 0.8,
            max_tokens: 1500, // 限制内容长度
        },
        timeout: 60000
    }) 

    const answer = response.data.choices[0].message.content
    let finalAnswer = answer;
    if (!answer || answer.trim() === "") {
        finalAnswer = "抱歉，刚刚这部分关于晋剧的内容我需要重新整理一下，请您再问我一次好吗？";
    }

    // 把模型回答加入历史
    messages.push({
        role: "assistant",
        content: answer
    })

    // 存回 redis
    await redis.set(conversation_id, JSON.stringify(messages))

    // 返回结果
    res.json({
        message: "success",
        data: {
            conversation_id,
            answer
        }
    })
}

const modelName = 'resona'
const SOVITS_API_URL = process.env.SOVITS_API_URL || 'http://127.0.0.1:9880';
//设置参考音频
const set_refer_audio = async (req, res) => {
        const audio = ''
        const audioPath = path.join(process.cwd(), 'model/sound', model, audio)
        const url = new URL(`${SOVITS_API_URL}/set_refer_audio`);
        url.searchParams.set('refer_audio_path', audioPath)
        const options = {
                'method': 'GET',
                'headers':{
                        'Content-type': 'application/json',
                },

        }
        const response = await fetch(url, options)
        await response.json()
        res.json({ message: 'success', data: { audioPath } })

}

const CONTAINER_WORKSPACE = '/workspace/GPT-SoVITS';

let currentLoadedModel = null;
export const update_model = async (modelName) => {
    if (currentLoadedModel === modelName) {
        console.log(`模型 ${modelName} 已在显存中，跳过加载`);
        return; 
    }
    const gpt_weights_Path = `${CONTAINER_WORKSPACE}/model/GPT_weights/${modelName}.ckpt`;
    const sovits_weights_Path = `${CONTAINER_WORKSPACE}/model/SoVITS_weights/${modelName}.pth`;
    try {

        const gptRes = await fetch(`${SOVITS_API_URL}/set_gpt_weights?weights_path=${encodeURIComponent(gpt_weights_Path)}`);
        const sovitsRes = await fetch(`${SOVITS_API_URL}/set_sovits_weights?weights_path=${encodeURIComponent(sovits_weights_Path)}`);
        await gptRes.json();
        await sovitsRes.json();
        currentLoadedModel = modelName; 
    } catch (err) {
        console.error('切换模型失败，请检查容器 API 是否在线:', err.message);
    }
}

// 语音合成
export const TTS = async (req, res) => {
    await update_model(modelName);
    const localSoundDir = path.join(process.cwd(), 'model/sound', modelName);
    const files = await fs.readdir(localSoundDir);
    const audioFiles = files.filter(f => f.endsWith('.wav') || f.endsWith('.mp3'));

    if (audioFiles.length === 0) {
        return res.status(400).json({ error: '参考音频文件夹为空' });
    }
    const refer_audio_container = audioFiles.map(file => 
        `${CONTAINER_WORKSPACE}/model/sound/${modelName}/${file}`
    );
    
    let text = req.body.text;
if (!text || text.trim() === "") {
        return res.status(400).json({ error: '合成文本不能为空' });
    }

    // 1. 去除表情包
    text = text.replace(/[\uD83C|\uD83D|\uD83E][\uDC00-\uDFFF]|[\u2600-\u27ff]/g, "");
    // 2. 去除 Markdown 符号（如 ** 或 #）和特殊控制字符，只保留中英文、数字和常用标点
    text = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9，。！？；：“”（）\n]/g, " ");
    // 3. 将连续的空格和空行压缩，防止 TTS 引擎在空白处卡住
    text = text.trim().replace(/\s+/g, " ");

    if (text.length === 0) {
        return res.status(400).json({ error: '清洗后文本为空，无法合成' });
    }
    const options = {
        'method': 'POST',
        'headers': { 'Content-type': 'application/json' },
        'body': JSON.stringify({
            "text": text,
            "text_lang": "zh", 
            "ref_audio_path": refer_audio_container[0],
            "aux_ref_audio_paths": refer_audio_container,
            "prompt_lang": "zh", // 必须与参考音频语言一致
            "prompt_text": "", 
            "top_k": 1,          // 调低 top_k 增加稳定性
            "top_p": 1,
            "temperature": 1,
            "text_split_method": "cut0", // 强制切分，防止显存溢出
            "batch_size": 1,     // 3050 建议设为 1，防止后端崩溃
            "speed_factor": 1,
            "media_type": "wav",
            "streaming_mode": false,
            "parallel_infer": false, // 6GB 显存建议关闭并行，确保成功率
            "repetition_penalty": 1.05,
            "bucket_infer": false,
        })
    };
    
    try {
        const response = await fetch(`${SOVITS_API_URL}/tts`, options);
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('audio')) {
            const audioBuffer = await response.arrayBuffer();
            const fileName = `${modelName}_default_${Date.now()}.wav`;
            const outputDir = path.join(process.cwd(), 'TTS_sound');
            // 确保保存目录存在
            try { await fs.access(outputDir); } catch { await fs.mkdir(outputDir); }
            const filePath = path.join(outputDir, fileName);
            await fs.writeFile(filePath, Buffer.from(audioBuffer));
            res.json({
                success: true,
                message: "音频生成并保存成功",
                filePath: `/TTS_sound/${fileName}`,
            }); 
        } else {
            const errorData = await response.json();
            res.status(500).json({ error: 'API 推理报错', details: errorData });
        }
    } catch (error) {
        res.status(500).json({ error: '无法连接到 SoVITS API' });
    }
}

//获取语音合成的音频
export const getTTS = async (req, res) => {
}
// 删除语音文件
export const deleteTTSFile = async (req, res) => {
    try {
        const outputDir = path.join(process.cwd(), 'TTS_sound');
        const sqlStr = 'SELECT audio_url FROM save_data_audio';
        const [rows] = await pool.query(sqlStr);
        const usedFileNames = new Set(rows.map(row => path.basename(row.audio_url)));
        try {
            await fs.access(outputDir);
        } catch {
            return res?.json({ message: 'directory not found' });
        }
        const filesOnDisk = await fs.readdir(outputDir);
        const filesToDelete = filesOnDisk.filter(fileName => !usedFileNames.has(fileName));

        // 4. 批量删除
        await Promise.all(filesToDelete.map(fileName => 
            fs.rm(path.join(outputDir, fileName), { force: true })
        ));

        if (res) res.json({ message: 'success', deletedCount: filesToDelete.length });
    } catch (error) {
        console.error('Linux兼容清理失败:', error);
        if (res) res.status(500).json({ error: 'Internal Error' });
    }
}
//存档
//模拟数据
// {
//     "user_id": "30",          
//     "conversation_id": "c623196a-c958-47a9-a041-061f9d9c792b",  
//     "slot": "1",            
//     "timestamp": "2025-08-10T06:39:48.460Z", 
//     "data": {                       
//       "textList": ["文本1", "文本2"],
//       "audioUrl": ["https://example.com/audio.mp3"]
//     } 
// }
  

export const initData = async (req, res) => {
  const user_id = req.auth.id
  
  // 检查是否已有数据
  const sqlStr2 = `SELECT id FROM save_data WHERE user_id = ?`
  const [result] = await pool.query(sqlStr2, [user_id])  

  if (result.length === 0) {
    const sqlStr = `INSERT INTO save_data (user_id, slot) VALUES (?, ?)`
    for (let slotIndex = 1; slotIndex <= 9; slotIndex++) {
      await pool.query(sqlStr, [user_id, slotIndex])
    }
    console.log(`用户 ${user_id} 的存档槽位初始化完成`)
  }

  res.json({ message: 'success' })
}
export const saveData = async (req, res) => {
  const user_id = req.auth.id
  const { conversation_id, slot, timestamp, data } = req.body
  const timestampDate = new Date(timestamp)

  if (isNaN(timestampDate.getTime())) {
      return res.status(400).json({ error: 'Invalid timestamp format' });
  }

  const [[saveRow]] = await pool.query(
      `SELECT id FROM save_data WHERE user_id = ? AND slot = ?`,
      [user_id, slot]
  );
  const saveDataId = saveRow.id;

  // 1. 更新 save_data 元信息
  await pool.query(
      `UPDATE save_data SET conversation_id=?, timestamp=? WHERE id=?`,
      [conversation_id, timestampDate, saveDataId]
  );

  // 2. 写入 message
  await pool.query(`DELETE FROM save_data_message WHERE save_data_id = ?`, [saveDataId]);
  for (const item of data.textList) {
      await insertMessage(saveDataId, {
          message_id: item.id,
          user: item.user,
          AI: item.AI
      });
  }

  // 3. 写入 audio
  await pool.query(`DELETE FROM save_data_audio WHERE save_data_id = ?`, [saveDataId]);
  for (const audio of data.audioUrl) {
      await insertAudio(saveDataId, audio);
  }
  deleteTTSFile().catch(err => console.error("清理冗余文件失败:", err));
  res.json({ message: 'success' });

}
export const LoadData = async (req, res) => {
  const rows = await loadFullSlot(req.auth.id);
  res.json({ message: 'success', data: rows });
}
