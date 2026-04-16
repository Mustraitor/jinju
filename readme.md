# 晋韵智传平台——部署与运行指南

本指南将协助你快速部署并运行“晋韵智传”平台。项目采用了前后端分离架构，前端代码位于 `client/`，后端代码位于 `server/`。

---

## 方式一：Docker 部署 (推荐)

使用 Docker 部署可以一键自动化配置 MySQL、Redis 及 Node.js 环境，避免本地环境冲突。

### 前置要求
* 系统中需安装 **Docker**。
* 系统中需安装 **Docker Compose**。

### 运行步骤
1. **进入项目根目录**（确保目录下存在 `docker-compose.yaml`）。
2. **执行构建与启动命令**：
   ```bash
   docker-compose up --build