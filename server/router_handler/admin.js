import pool from '../config/database.js'
import bcrypt from 'bcryptjs'
import XLSX from "xlsx";
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

// 1. 获取所有用户 (已实现)
export const getAllUsers = async (req, res) => {
    const sqlStr = 'SELECT id, username, user_pic, user_type FROM user WHERE is_delete = 0'
    const [result] = await pool.query(sqlStr)
    res.json({ status: 0, message: '获取列表成功', data: result })
}

// 2. 修改用户身份 (已实现 - 兼容禁用逻辑)
// user_type: 1(管理), 0(普通),
export const updateUserRole = async (req, res) => {
    const { id, user_type } = req.body
    const sqlStr = 'UPDATE user SET user_type = ? WHERE id = ?'
    const [result] = await pool.query(sqlStr, [user_type, id])
    if (result.affectedRows !== 1) return res.json({ status: 1, message: '操作失败' })
    res.json({ status: 0, message: '权限更新成功' })
}

// 3. 增加新用户 
export const addUser = async (req, res) => {
    const { username, password, user_type } = req.body
    
    // 检查用户名是否被占用
    const checkSql = 'SELECT * FROM user WHERE username = ?'
    const [rows] = await pool.query(checkSql, [username])
    if (rows.length > 0) return res.json({ status: 1, message: '用户名已存在' })

    // 密码加密
    const hashPwd = bcrypt.hashSync(password, 10)
    const insertSql = 'INSERT INTO user (username, password, user_type) VALUES (?, ?, ?)'
    const [result] = await pool.query(insertSql, [username, hashPwd, user_type || 0])
    
    if (result.affectedRows !== 1) return res.json({ status: 1, message: '添加失败' })
    res.json({ status: 0, message: '用户添加成功' })
}

// 4. 逻辑删除
export const deleteUser = async (req, res) => {
    const { id } = req.body
    const sqlStr = 'UPDATE user SET is_delete = 1 WHERE id = ?'
    const [result] = await pool.query(sqlStr, [id])
    if (result.affectedRows !== 1) return res.json({ status: 1, message: '删除失败' })
    res.json({ status: 0, message: '用户已从系统移除' })
}

export const restoreUser = async (req, res) => {
    const { id } = req.body
    // 将状态位置回 0
    const sqlStr = 'UPDATE user SET is_delete = 0 WHERE id = ?'
    const [result] = await pool.query(sqlStr, [id])
    
    if (result.affectedRows !== 1) {
        return res.json({ status: 1, message: '恢复失败，用户可能不存在' })
    }
    res.json({ status: 0, message: '用户账号已成功恢复' })
}

const FIELD_MAP = {
  plays: { "剧目名称": "name", "别名": "alias", "起源": "origin", "剧情简介": "description" },
  play_versions: { "剧目ID": "play_id", "版本名称": "version_name", "版本说明": "description", "年份": "year" },
  roles: { "剧目ID": "play_id", "角色名称": "role_name", "对应行当": "role_type", "角色描述": "description" },
  actors: { "演员名称": "name", "头像": "avatar", "简介": "bio", "出生年份": "birth_year", "去世年份": "death_year" },
  relations: { "实体A_ID": "entity_a_id", "实体A_type": "entity_a_type", "实体B_ID": "entity_b_id", "实体B_type": "entity_b_type", "关系类型": "relation_type", "关系描述": "description" }
};

const sheetToTable = {
  "剧目": "plays",
  "剧目版本": "play_versions",
  "角色": "roles",
  "演员": "actors",
  "关系表": "relations"
};

// 2. 核心接口逻辑
export const importGraphData = async (req, res) => {
  const conn = await pool.getConnection(); // 获取连接以支持事务

  try {
    const file = req.file;
    if (!file) return res.json({ status: 1, message: '请上传文件' });

    // A. 读取上传的 Buffer
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    let totalImported = 0;

    // B. 开启事务及关闭外键检查
    await conn.beginTransaction();
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");

    // C. 遍历 Sheet 逻辑 (对应原脚本循环)
    for (const sheetName of workbook.SheetNames) {
      const tableName = sheetToTable[sheetName];
      if (!tableName) continue;

      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet);
      const fieldMap = FIELD_MAP[tableName];

      // 数据清洗：中文表头转英文
      const rows = json.map(row => {
        const newRow = {};
        for (const key in row) {
          const dbField = fieldMap[key];
          if (dbField) newRow[dbField] = row[key];
        }
        return newRow;
      });

      if (rows.length > 0) {
        // 先清空
        await conn.query(`TRUNCATE TABLE ${tableName}`);
        
        // 批量插入 (直接写在这里，避免 defined 错误)
        for (const row of rows) {
          const fields = Object.keys(row).join(",");
          const values = Object.values(row);
          const placeholders = values.map(() => "?").join(",");
          const sql = `INSERT INTO ${tableName} (${fields}) VALUES (${placeholders})`;
          await conn.query(sql, values);
        }
        totalImported += rows.length;
      }
    }

    // D. 恢复检查并提交
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");
    await conn.commit();

    res.json({ status: 0, message: '同步完成', total: totalImported });

  } catch (err) {
    await conn.rollback(); // 出错回滚
    console.error("导入失败，已回滚:", err);
    res.json({ status: 1, message: '导入异常：' + err.message });
  } finally {
    conn.release(); // 释放连接
  }
};



export const syncVideos = async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const videoDir = path.join(process.cwd(), 'videos');
    const coverDir = path.join(process.cwd(), 'covers');

    const files = fs.readdirSync(videoDir).filter(f =>
      ['.mp4', '.mov', '.webm', '.mkv'].includes(path.extname(f))
    );

    const [dbVideos] = await conn.query("SELECT id, video_url FROM videos");

    const dbMap = new Map(
      dbVideos.map(v => [v.video_url, v.id])
    );

    const fileSet = new Set(files.map(f => `/videos/${f}`));

    // =========================
    // 1️⃣ 删除数据库中“文件不存在”的记录
    // =========================
    const toDelete = dbVideos.filter(v => !fileSet.has(v.video_url));

    for (const v of toDelete) {
      await conn.query("DELETE FROM videos WHERE id = ?", [v.id]);
    }

    // =========================
    // 2️⃣ 插入新文件
    // =========================
    const newFiles = files.filter(f =>
      !dbMap.has(`/videos/${f}`)
    );

    let inserted = 0;

    for (const file of newFiles) {
      const title = path.parse(file).name;
      const coverName = `${title}.jpg`;

      await new Promise((resolve) => {
        ffmpeg(path.join(videoDir, file))
          .screenshots({
            count: 1,
            timemarks: ['2'],
            filename: coverName,
            folder: coverDir,
            size: '320x?'
          })
          .on('end', resolve)
          .on('error', resolve);
      });

      await conn.query(
        `INSERT INTO videos (title, play_id, description, cover_url, video_url)
         VALUES (?, ?, ?, ?, ?)`,
        [title, 0, title, `/covers/${coverName}`, `/videos/${file}`]
      );

      inserted++;
    }

    res.json({
      status: 0,
      message: `新增 ${inserted} 个视频，删除 ${toDelete.length} 个无效记录`
    });

  } catch (err) {
    res.json({ status: 1, message: err.message });
  } finally {
    conn.release();
  }
};


export const importSubtitles = async (req, res) => {
  const conn = await pool.getConnection()

  try {
    const { video_id, subtitles = [] } = req.body
  // console.log("🔥 后端收到 req.body：", req.body);
    await conn.beginTransaction()

    // 1️⃣ 删除旧字幕（包括翻译）
    await conn.query(
      `DELETE st FROM subtitle_translations st
       JOIN subtitles s ON st.subtitle_id = s.id
       WHERE s.video_id = ?`,
      [video_id]
    )

    await conn.query(
      "DELETE FROM subtitles WHERE video_id = ?",
      [video_id]
    )

    // 2️⃣ 批量插入字幕
    const values = subtitles.map(s => [
      video_id,
      s.start_time,
      s.end_time,
      s.content
    ])

    if (values.length > 0) {
      const [result] = await conn.query(
        `INSERT INTO subtitles (video_id, start_time, end_time, content)
         VALUES ?`,
        [values]
      )

      // 3️⃣ 插入翻译
      const firstId = result.insertId

      const transValues = subtitles.map((s, i) => [
        firstId + i,
        s.translation || ""
      ])

      await conn.query(
        `INSERT INTO subtitle_translations (subtitle_id, content)
         VALUES ?`,
        [transValues]
      )
    }

    await conn.commit()

    res.json({
      code: 0,
      msg: "字幕更新成功"
    })

  } catch (err) {
    await conn.rollback()
    res.json({
      code: 1,
      msg: err.message
    })
  } finally {
    conn.release()
  }
}
