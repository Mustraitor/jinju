import pool from '../config/database.js'

export const getSubtitles = async (req, res) => {
  const { videoId } = req.params;

  try {
    // 查原字幕
    const [originalRows] = await pool.query(
      "SELECT id, start_time, end_time, content FROM subtitles WHERE video_id = ? ORDER BY start_time",
      [videoId]
    );

    // 查趣味翻译
    const [funnyRows] = await pool.query(
      `SELECT st.subtitle_id, st.content
       FROM subtitle_translations st
       JOIN subtitles s ON st.subtitle_id = s.id
       WHERE s.video_id = ?
       ORDER BY s.start_time`,
      [videoId]
    );

    // 合并对应关系
    const merged = originalRows.map((item) => ({
      id: item.id,
      start_time: item.start_time,
      end_time: item.end_time,
      content: item.content,
      translation: funnyRows.find((f) => f.subtitle_id === item.id)?.content || ""
    }));

    res.send({
      code: 0,
      video_id: videoId,
      subtitles: merged,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ code: 1, msg: "数据库查询失败" });
  }
};
