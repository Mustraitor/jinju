use jinju_project;
CREATE TABLE user (
    id        int auto_increment primary key,
    username  varchar(255)      null,
    password  varchar(255)      null,
    email     varchar(255)      null,
    user_pic  text              null,
    user_type tinyint default 0 not null,
    is_delete tinyint(1) default 0 not null,
    constraint username_pk unique (username)
);

CREATE TABLE save_data (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NULL,
    conversation_id VARCHAR(36) NULL,
    slot            INT NULL,
    timestamp       DATETIME(3) NULL,
    CONSTRAINT user_id__fk FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE save_data_audio (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    save_data_id    INT NOT NULL,
    audio_url       VARCHAR(255) NOT NULL,
    CONSTRAINT sd_audio__fk FOREIGN KEY (save_data_id) REFERENCES save_data(id)
);

CREATE TABLE save_data_message (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    save_data_id    INT NOT NULL,
    message_id      INT NOT NULL,          -- 原 JSON 中的 id
    user_text       TEXT NULL,
    ai_text         TEXT NULL,
    CONSTRAINT sd_message__fk FOREIGN KEY (save_data_id) REFERENCES save_data(id)
);

CREATE TABLE plays (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL COMMENT '剧目名称',
  alias VARCHAR(255) DEFAULT NULL COMMENT '别名',
  origin TEXT COMMENT '起源/历史',
  description TEXT COMMENT '剧情简介',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  play_id INT NOT NULL COMMENT '所属剧目ID',
  role_name VARCHAR(255) NOT NULL COMMENT '角色名称',
  role_type VARCHAR(50) DEFAULT NULL COMMENT '行当（如：须生、青衣、老旦、花脸等）', -- 放在这里最合适
  description TEXT COMMENT '角色描述',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (play_id) REFERENCES plays(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE actors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL COMMENT '演员姓名',
  avatar VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
  bio TEXT COMMENT '简介',
  birth_year INT DEFAULT NULL COMMENT '出生年份',
  death_year INT DEFAULT NULL COMMENT '去世年份',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE videos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  play_id int DEFAULT 0  not null comment '所属剧目ID',
  title VARCHAR(255) NOT NULL COMMENT '视频标题',
  description TEXT COMMENT '视频描述',
  cover_url VARCHAR(500) DEFAULT NULL COMMENT '封面URL',
  video_url VARCHAR(500) NOT NULL COMMENT '视频文件URL',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE relations (
  id INT PRIMARY KEY AUTO_INCREMENT,

  entity_a_id INT NOT NULL COMMENT '实体A ID',
  entity_a_type VARCHAR(50) NOT NULL COMMENT '实体A类型',
  entity_b_id INT NOT NULL COMMENT '实体B ID',
  entity_b_type VARCHAR(50) NOT NULL COMMENT '实体B类型',

  relation_type VARCHAR(100) NOT NULL COMMENT '关系类型',
  description TEXT COMMENT '关系描述',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE subtitles (
       id INT PRIMARY KEY AUTO_INCREMENT,
       video_id INT NOT NULL,
       start_time FLOAT NOT NULL,
       end_time FLOAT NOT NULL,
       content TEXT NOT NULL,
      FOREIGN KEY (video_id) REFERENCES videos(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
);

CREATE TABLE subtitle_translations (
       id INT PRIMARY KEY AUTO_INCREMENT,
       subtitle_id INT NOT NULL,
       content TEXT NOT NULL,
       FOREIGN KEY (subtitle_id) REFERENCES subtitles(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
);