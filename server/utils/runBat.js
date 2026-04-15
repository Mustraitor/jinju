import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

// 锁文件路径（保存在当前目录）
const LOCK_FILE = path.join(process.cwd(), '.bat.lock');
export const runBat = (batPath) => {
  // console.log(process.cwd());
  if (fs.existsSync(LOCK_FILE)) {
    return; 
  }
  // 创建锁文件
  fs.writeFileSync(LOCK_FILE, 'locked');
  exec(`start "" "${batPath}"`, (error) => {
      if (error) {
    console.error('执行失败:', error);
    process.exit(1);
  }

    process.on('SIGINT', () => {
    fs.unlink(LOCK_FILE).catch(() => {});
  });
  }); 
};