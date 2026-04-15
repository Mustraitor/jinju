import pool from '../config/database.js'

// 1. 获取所有视频列表 
const getVideolist = async(req, res) => {
  try {
    const [rows] = await pool.query(`SELECT v.id, v.title, v.description, v.video_url, v.cover_url FROM videos v`);
    const data = rows.map(row => ({
      id: row.id,
      title: row.title,
      desc: row.description,
      url: row.video_url,
      cover: row.cover_url
    }));

    res.json({ code: 0, data: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 1, msg: "获取列表失败" });
  }
}

// 2. 获取单个视频详情 (用于播放页展示) 
const getVideoById = async(req, res) => {
  try {
    const { id } = req.params; // 从路由参数中获取 id
    const [rows] = await pool.query(`SELECT * FROM videos WHERE id = ?`, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ code: 1, msg: "未找到该视频" });
    }

    const video = rows[0];
    res.json({
      code: 0,
      data: {
        id: video.id,
        title: video.title,
        desc: video.description,
        url: video.video_url,
        cover: video.cover_url
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 1, msg: "查询详情失败" });
  }
}

export { getVideolist, getVideoById };