import axios from 'axios'
import fs from 'fs/promises'  
import path from 'path';
import pool from '../config/database.js'
import redis from '../config/redis.js'
import { insertMessage, insertAudio, loadFullSlot } from '../model/saveData.js'
import { v4 as uuidv4 } from 'uuid'
import OpenAI from "openai";
import { log } from 'console';
const ENABLE_TTS = true; 

// 创建 GPT 客户端（支持第三方）
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.chatanywhere.org" 
});

// 创建新的对话
export const newConversation = async (req, res) => {
  const conversationId = uuidv4();

  await redis.set(conversationId, JSON.stringify([]));

  res.json({
    message: "success",
    data: { conversation_id: conversationId }
  });
};


// 对话接口
export const chatAI = async (req, res) => {
  const { conversation_id, query } = req.body;

  let messages = JSON.parse(await redis.get(conversation_id) || "[]");

  messages = messages.filter(msg => msg.role !== "system");

  messages.push({ role: "user", content: query });

  messages = messages.slice(-10);

  const systemPrompt = {
    role: "system",
    content: `              角色设定：
              你是一位在晋剧戏班里泡大的“非典型”专家。你对晋剧的四大须生、各种唱腔了如指掌，但你讨厌死板的说教。你更像是一个陪用户在戏台下边嗑瓜子边看戏的老友，说话风趣、接地气，偶尔还会甩两句山西韵味的俏皮话。

              回复原则：
              老友式聊天： 语气要松弛，多用“咱们”、“嘿”、“你说巧不巧”这类词。
              专业而不说教： 讲知识点要像讲八卦或者讲故事。比如讲丁果仙，别只说她是大师，可以说她是“当年晋剧界的顶流，开口就是教科书”。
              短小精悍： 每次回答控制在 2-4 句话以内，别像写毕业论文。
              山西味儿： 适度加入一点山西人的豪爽和幽默（比如：这唱腔听起来比吃顿剔尖儿还顺滑）。`
  };
  messages.unshift(systemPrompt); 

  // 💡 调用 GPT
  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",   
      messages,
      temperature: 0.7,
      max_tokens: 1000
    });
  } catch (err) {
    // ... 你的报错处理逻辑
  }

  const answer = completion.choices[0].message.content || "抱歉，我刚刚没听清楚，请再问一次好吗？";

  // 6. 把模型答案加入历史记录准备存入 Redis
  messages.push({
    role: "assistant",
    content: answer
  });

  // 存回 redis (此时存入的记录包含了本次的 system，但下次读取时会被第二步过滤掉并替换为最新版)
  await redis.set(conversation_id, JSON.stringify(messages));

  res.json({
    message: "success",
    data: {
      conversation_id,
      answer
    }
  });
};

// // 创建新的对话
// export const newConversation = async (req, res) => {
//     const conversationId = uuidv4()

//     // 初始值：空数组（稍后第一次请求会加入 system）
//     await redis.set(conversationId, JSON.stringify([]))

//     res.json({
//         message: 'success',
//         data: { conversation_id: conversationId }
//     })
// }
// // 对话接口
// export const chatAI = async (req, res) => {
//     const { conversation_id, query } = req.body
//     console.log(query);
    
//     // 读取历史记录
//     let messages = JSON.parse(await redis.get(conversation_id) || '[]')

//     // 如果没历史记录，加上系统指令
//     if (messages.length === 0) {
//         messages.push({
//             role: "system",
//             content: `
//               角色设定：
//               你是一位在晋剧戏班里泡大的“非典型”专家。你对晋剧的四大须生、各种唱腔了如指掌，但你讨厌死板的说教。你更像是一个陪用户在戏台下边嗑瓜子边看戏的老友，说话风趣、接地气，偶尔还会甩两句山西韵味的俏皮话。

//               回复原则：
//               老友式聊天： 语气要松弛，多用“咱们”、“嘿”、“你说巧不巧”这类词。
//               专业而不说教： 讲知识点要像讲八卦或者讲故事。比如讲丁果仙，别只说她是大师，可以说她是“当年晋剧界的顶流，开口就是教科书”。
//               短小精悍： 每次回答控制在 2-4 句话以内，别像写毕业论文。
//               山西味儿： 适度加入一点山西人的豪爽和幽默（比如：这唱腔听起来比吃顿剔尖儿还顺滑）。
//         `
            
//         })
//     }
// //
//     // 加入用户消息
//     messages.push({
//         role: "user",
//         content: query
//     })

//     // ——上下文控制——
//     // 保留最近 10 条即可，让对话更简短自然
//     messages = messages.slice(-10)

//     // 调用 GLM-4
//     const response = await axios({
//         method: 'POST',
//         url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
//         headers: {
//             "Content-Type": "application/json",
//             "Authorization": `Bearer ${process.env.GLM_KEY}`
//         },
//         data: {
//             model: "glm-4.7",
//             messages,
//             temperature: 0.7, // 越低越简洁
//             top_p: 0.8,
//             max_tokens: 1000, // 限制内容长度
//         },
//         timeout: 60000
//     }) 

//     const answer = response.data.choices[0].message.content
//     let finalAnswer = answer;
//     if (!answer || answer.trim() === "") {
//         finalAnswer = "抱歉，刚刚这部分关于晋剧的内容我需要重新整理一下，请您再问我一次好吗？";
//     }

//     // 把模型回答加入历史
//     messages.push({
//         role: "assistant",
//         content: answer
//     })

//     // 存回 redis
//     await redis.set(conversation_id, JSON.stringify(messages))

//     // 返回结果
//     res.json({
//         message: "success",
//         data: {
//             conversation_id,
//             answer
//         }
//     })
// }


const modelName = 'resona';
const CONTAINER_WORKSPACE = '/root/GPT-SoVITS'; // 确认 AutoDL 根目录
const SOVITS_API_URL = process.env.SOVITS_API_URL || 'http://127.0.0.1:9880';
// 记录当前显存中的模型，避免重复加载
let currentLoadedModel = null;

const PROMPT_TEXT = "その寄付金を得るために一部のお嬢様たちは受験なしで入れるみたいです";

export const initRefer = async () => {
    try {
        console.log("[初始化] 加载参考音频...");

        const res = await axios.get(`${SOVITS_API_URL}/change_refer`, {
            params: {
                refer_wav_path: "/root/GPT-SoVITS/ref_audio/resona.wav",
                prompt_text: PROMPT_TEXT,
                prompt_language: "ja"
            },
            timeout: 10000
        });

        console.log("[成功] 参考音频加载完成");
    } catch (err) {
        console.error("[失败] 参考音频加载失败");

        if (err.response) {
            console.error(err.response.data);
        } else {
            console.error(err.message);
        }
    }
};
 
export const update_model = async () => {
    if (currentLoadedModel === modelName) {
        console.log(`[OK] ${modelName} 模型已在显存中，无需切换`);
        return;
    }

    console.log(`[切换模型] 发送到 SoVITS: ${modelName}`);

    try {
        const res = await axios.post(
            `${SOVITS_API_URL}/set_model`,
            { model: modelName },  // ← body，符合你的 openapi 文档
            { timeout: 10000 }
        );

        if (res.status === 200) {
            currentLoadedModel = modelName;
            console.log(`[成功] SoVITS 已加载模型: ${modelName}`);
        } else {
            console.error(`[失败] 返回状态码: ${res.status}`);
        }
    } catch (err) {
        console.error("--- 切换模型失败 ---");

        if (err.code === "ECONNREFUSED") {
            console.error("无法连接到 SoVITS API，请检查 9880 是否开启");
        } else if (err.response) {
            console.error("业务错误：", err.response.data);
        } else {
            console.error("错误详情：", err.message);
        }
    }
};

// 最精简的语音合成接口
export const TTS = async (req, res) => {
    try {
        let text = req.body.text;

        if (!text || text.trim() === "") {
            return res.status(400).json({ error: "文本不能为空" });
        }

        // ✅ 文本清洗（保留节奏）
        text = text
            .replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]+/g, "")
            .replace(/[^\u4e00-\u9fa5a-zA-Z0-9，。！？；：,.!?;\n]/g, " ")
            .trim()
            .replace(/\s+/g, " ");

        // ✅ 自动判断语言
        const hasChinese = /[\u4e00-\u9fa5]/.test(text);
        const textLanguage = hasChinese ? "zh" : "en";

        // ✅ 参数（稳定优先）
        const params = new URLSearchParams({
            text: text,
            text_language: textLanguage,
            cut_punc: "，。！？；：,.!?;\n",
            top_k: 20,
            top_p: 0.7,
            temperature: 0.4,
            speed: 1.0
        }); 

        const finalUrl = `${SOVITS_API_URL}/?${params.toString()}`;

        const response = await fetch(finalUrl);

        const contentType = response.headers.get('content-type');

        if (response.ok && contentType && contentType.includes('audio')) {
            const audioBuffer = await response.arrayBuffer();

            const fileName = `tts_${Date.now()}.wav`;
            const outputDir = path.join(process.cwd(), 'TTS_sound');

            try {
                await fs.access(outputDir);
            } catch {
                await fs.mkdir(outputDir);
            }

            const filePath = path.join(outputDir, fileName);
            await fs.writeFile(filePath, Buffer.from(audioBuffer));

            res.json({
                success: true,
                filePath: `/TTS_sound/${fileName}`
            });

        } else {
            const errText = await response.text();
            console.error("[TTS错误]", errText);

            res.status(500).json({
                error: "TTS生成失败",
                detail: errText
            });
        }

    } catch (err) {
        console.error("[TTS异常]", err);
        res.status(500).json({ error: "服务器错误" });
    }
};

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
  const { conversation_id, slot, timestamp, data = {} } = req.body
  const textList = Array.isArray(data.textList) ? data.textList : []
  const audioUrl = Array.isArray(data.audioUrl) ? data.audioUrl : []
  const timestampDate = new Date(timestamp)

  if (isNaN(timestampDate.getTime())) {
      return res.status(400).json({ error: 'Invalid timestamp format' });
  }

  const [[saveRow]] = await pool.query(
      `SELECT id FROM save_data WHERE user_id = ? AND slot = ?`,
      [user_id, slot]
  );
  if (!saveRow) {
      return res.status(404).json({ error: 'Save slot not found' });
  }
  const saveDataId = saveRow.id;

  // 1. 更新 save_data 元信息
  await pool.query(
      `UPDATE save_data SET conversation_id=?, timestamp=? WHERE id=?`,
      [conversation_id, timestampDate, saveDataId]
  );

  // 2. 写入 message
  await pool.query(`DELETE FROM save_data_message WHERE save_data_id = ?`, [saveDataId]);
  for (const item of textList) {
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
  await pool.query(`DELETE FROM save_data_audio WHERE save_data_id = ?`, [saveDataId]);
  for (const audio of audioUrl) {
      if (audio) {
          await insertAudio(saveDataId, audio);
      }
  }
  deleteTTSFile().catch(err => console.error("", err));
  res.json({ message: 'success' });

}
export const LoadData = async (req, res) => {
  const rows = await loadFullSlot(req.auth.id);
  res.json({ message: 'success', data: rows });
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