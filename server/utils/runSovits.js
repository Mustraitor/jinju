import { exec } from "child_process";
import path from 'path';
import fs from 'fs';

export const runSovits = () => {
    const SOVITS_DIR = process.env.SOVITS_DIR
    const PYTHON = path.join(SOVITS_DIR, "runtime/python.exe");
    const API_FILE = path.join(SOVITS_DIR, "api_v2.py");

    console.log("检查 SoVITS 服务...");



    // 检查 pm2 是否安装
    exec("pm2 -v", (err, stdout) => {
        exec("pm2 jlist", (err, stdout) => {
            let list = [];
            try { list = JSON.parse(stdout || "[]"); } catch (e) {}

            const process = list.find(p => p.name === "sovits-api");

            if (process && process.pm2_env.status === "online") {
                console.log("✔ SoVITS 服务已在运行 (127.0.0.1:9880) pm2 log sovits-api");
                return;
            }

            console.log("🚀 正在启动 SoVITS (请稍候，模型加载较慢)...");

            const cmd = 
                `pm2 start "${API_FILE}" ` +
                `--name sovits-api ` +
                `--interpreter "${PYTHON}" ` +
                `--interpreter-args "-I" ` +
                `--cwd "${SOVITS_DIR}" ` +
                `--env PYTHONPATH="${SOVITS_DIR}"`;

            exec(cmd, (err2) => {
                if (err2) {
                    console.error("❌ SoVITS 启动失败:", err2.message);
                } else {
                    console.log("✅ SoVITS 启动指令已发出，请稍后通过 'pm2 logs sovits-api' 查看加载进度");
                }
            });
        });
    });
};