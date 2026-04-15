# 使用轻量级 Node 镜像
FROM node:18-slim

# 设置工作目录
WORKDIR /app/server

COPY package*.json ./
RUN npm install --production

# 拷贝后端所有代码
COPY . .

# 暴露后端端口
EXPOSE 8080

# 启动命令
CMD ["node", "app.js"]