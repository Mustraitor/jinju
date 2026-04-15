import pool from '../config/database.js'

export const insertMessage = async (saveDataId, { message_id, user, AI }) => {
    const sql = `
        INSERT INTO save_data_message (save_data_id, message_id, user_text, ai_text)
        VALUES (?, ?, ?, ?)
    `;
    await pool.query(sql, [saveDataId, message_id, user || null, AI || null]);
};

export const insertAudio = async (saveDataId, filePath) => {
    const sql = `
        INSERT INTO save_data_audio (save_data_id, audio_url)
        VALUES (?, ?)
    `;
    await pool.query(sql, [saveDataId, filePath]);
};

export const loadFullSlot = async (userId) => {
    const sql = `
        SELECT sd.id AS saveDataId, sd.slot, sd.timestamp, sd.conversation_id,  -- 这里加上 conversation_id
               m.message_id, m.user_text, m.ai_text,
               a.audio_url
        FROM save_data sd
        LEFT JOIN save_data_message m ON sd.id = m.save_data_id
        LEFT JOIN save_data_audio a ON sd.id = a.save_data_id
        WHERE sd.user_id = ?
        ORDER BY sd.slot, m.message_id 
    `;
    const [rows] = await pool.query(sql, [userId]);
    return formatRows(rows); // 确保 formatRows 也会保留这个字段
};

// 🔥 格式化为前端需要的结构
function formatRows(rows) {
    const result = {};

    for (const row of rows) {
        if (!result[row.slot]) {
            result[row.slot] = {
                slot: row.slot,
                conversation_id: row.conversation_id,
                timestamp: row.timestamp,
                textList: [],
                audioUrl: []
            };
        }

        const slotObj = result[row.slot];

        // ⭐ 去重添加文本：通过 message_id 判断是否已存在
        if (row.message_id !== null) {
            const isTextExist = slotObj.textList.some(msg => msg.id === row.message_id);
            if (!isTextExist) {
                slotObj.textList.push({
                    id: row.message_id,
                    user: row.user_text,
                    AI: row.ai_text
                });
            }
        }

        // ⭐ 去重添加音频：通过 URL 判断是否已存在
        if (row.audio_url !== null) {
            if (!slotObj.audioUrl.includes(row.audio_url)) {
                slotObj.audioUrl.push(row.audio_url);
            }
        }
    }
    return Object.values(result);
}
