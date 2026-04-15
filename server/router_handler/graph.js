import pool from '../config/database.js'

export const graph = async (req, res) => {
  const { Id: playId } = req.params;

  try {
    // 1. 获取中心剧目节点
    const [plays] = await pool.query(`SELECT id, name FROM plays WHERE id = ?`, [playId]);
    if (plays.length === 0) return res.json({ code: 1, msg: "未找到剧目" });

    // 2. 获取关系
    const [relations] = await pool.query(
      `SELECT * FROM relations 
       WHERE (entity_a_type = 'play' AND entity_a_id = ?)
          OR (entity_a_type = 'actor' AND entity_b_type = 'role' AND entity_b_id IN (SELECT id FROM roles WHERE play_id = ?))
          OR (entity_a_type = 'role' AND entity_a_id IN (SELECT id FROM roles WHERE play_id = ?))`,
      [playId, playId, playId]
    );

    const roleIds = new Set();
    const actorIds = new Set();

    relations.forEach(r => {
      if (r.entity_a_type === 'role') roleIds.add(r.entity_a_id);
      if (r.entity_b_type === 'role') roleIds.add(r.entity_b_id);
      if (r.entity_a_type === 'actor') actorIds.add(r.entity_a_id);
      if (r.entity_b_type === 'actor') actorIds.add(r.entity_b_id);
    });

    let nodes = [
      { id: `play_${plays[0].id}`, name: plays[0].name, category: 0 }
    ];
    let extraLinks = []; // 用于存放自动生成的“角色-行当”连线
    const hangdangSet = new Set(); // 用于行当节点去重

    // 4. 查询角色（带上 role_type）
    if (roleIds.size > 0) {
      const [roleRows] = await pool.query(
        `SELECT id, role_name AS name, role_type FROM roles WHERE id IN (?)`, 
        [[...roleIds]]
      );
      
      roleRows.forEach(r => {
        // 添加角色节点 (Category 1)
        nodes.push({ id: `role_${r.id}`, name: r.name, category: 1 });

        // 处理行当：如果该角色有行当信息，生成行当节点并连线
        if (r.role_type) {
          const hdId = `hd_${r.role_type}`; // 行当节点ID前缀hd_
          
          // 如果这个行当还没生成过节点，则创建 (Category 3)
          if (!hangdangSet.has(hdId)) {
            nodes.push({ id: hdId, name: r.role_type, category: 3 });
            hangdangSet.add(hdId);
          }
          
          // 自动生成一条：角色 -> 行当 的连线
          extraLinks.push({
            source: `role_${r.id}`,
            target: hdId,
            name: '属于行当'
          });
        }
      });
    }

    // 5. 查询演员
    if (actorIds.size > 0) {
      const [actorRows] = await pool.query(`SELECT id, name FROM actors WHERE id IN (?)`, [[...actorIds]]);
      nodes.push(...actorRows.map(a => ({ id: `actor_${a.id}`, name: a.name, category: 2 })));
    }

    // 6. 构建最终 links (源节点 => 目标节点)
    const baseLinks = relations.map(r => ({
      source: `${r.entity_a_type.toLowerCase()}_${r.entity_a_id}`,
      target: `${r.entity_b_type.toLowerCase()}_${r.entity_b_id}`,
      name: r.relation_type
    }));

    return res.json({
      code: 0,
      data: { 
        nodes, 
        links: [...baseLinks, ...extraLinks]  
      }
    });

  } catch (err) {
    console.error("Graph Error:", err);
    return res.status(500).json({ error: "构建图谱失败" });
  }
};
export const graphlist = async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT p.id, p.name FROM plays p`);
    const data = rows.map(row => ({
      id: row.id,
      name: row.name,
    }));

    res.json({
      code: 0,
      data: data
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 1, msg: "获取列表失败" });
  }
};

export const getRolesByPlay = async (req, res) => {
  const playId = req.params.Id;

  try {
    const [rows] = await pool.query(
      `SELECT id, role_name, role_type, description 
       FROM roles 
       WHERE play_id = ?`,
      [playId]
    );

    res.json({ code: 0, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 1, msg: "获取角色失败" });
  }
};

export const getActorsByPlay = async (req, res) => {
  const playId = req.params.Id;

  try {
    // 通过角色反查演员
    const [rows] = await pool.query(
      `SELECT DISTINCT a.id, a.name, a.avatar, a.bio
       FROM actors a
       JOIN relations r ON r.entity_a_id = a.id AND r.entity_a_type = 'actor'
       WHERE (r.entity_b_type = 'role' AND r.entity_b_id IN (
            SELECT id FROM roles WHERE play_id = ?
       ))
          OR (r.entity_b_type = 'play' AND r.entity_b_id = ?)`,
      [playId, playId]
    );

    res.json({ code: 0, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 1, msg: "获取演员失败" });
  }
};

export const getVideosByPlay = async (req, res) => {
  const playId = req.params.Id;

  try {
    const [rows] = await pool.query(
      `SELECT v.id, v.title, v.cover_url, v.video_url, v.description
       FROM videos v
       JOIN relations r 
         ON r.entity_b_type = 'video' 
        AND r.entity_b_id = v.id
       WHERE r.entity_a_type = 'play' AND r.entity_a_id = ?`,
      [playId]
    );

    res.json({ code: 0, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 1, msg: "获取视频失败" });
  }
};


export const getPlayDetail = async (req, res) => {
  const { id } = req.params; // 这里的 id 是剧目自身的 id
  try {
    const [rows] = await pool.query(
      `SELECT id, name, alias, description FROM plays WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.json({ code: 1, msg: "未找到该剧目详情" });
    }

    // 如果该剧目有关联视频，通常在这里也可以顺便查出来返回给前端
    const [videos] = await pool.query(
      `SELECT v.id, v.title, v.video_url as url FROM videos v
       JOIN relations r ON r.entity_b_id = v.id AND r.entity_b_type = 'video'
       WHERE r.entity_a_id = ? AND r.entity_a_type = 'play'`,
      [id]
    );

    res.json({ 
      code: 0, 
      data: { 
        ...rows[0], 
        videos: videos || [] 
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 1, msg: "获取剧目详情失败" });
  }
};

export const getRoleDetail = async (req, res) => {
  const { id } = req.params;
  try {
    // 联合查询：查出角色信息，并关联出出演该角色的演员出生年份
    const [rows] = await pool.query(
      `SELECT r.id, r.role_name, r.role_type, r.description, a.birth_year 
       FROM roles r
       LEFT JOIN relations rel ON r.id = rel.entity_b_id AND rel.entity_b_type = 'role'
       LEFT JOIN actors a ON rel.entity_a_id = a.id AND rel.entity_a_type = 'actor'
       WHERE r.id = ?`,
      [id]
    );
    res.json({ code: 0, data: rows[0] || {} });
  } catch (err) {
    res.status(500).json({ code: 1, msg: "获取角色详情失败" });
  }
};

export const getActorDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT id, name, avatar, bio, birth_year, death_year FROM actors WHERE id = ?`,
      [id]
    );
    res.json({ code: 0, data: rows[0] || {} });
  } catch (err) {
    res.status(500).json({ code: 1, msg: "获取演员详情失败" });
  }
};