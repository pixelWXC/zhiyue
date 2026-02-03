# Zhiyue Server (智阅后端服务)

智阅浏览器扩展的后端服务，提供用户认证、配额管理和使用量统计功能。

## 技术栈

- **框架**: NestJS 11
- **数据库**: PostgreSQL 16
- **认证**: JWT + Passport
- **ORM**: TypeORM
- **容器化**: Docker + Docker Compose

## 快速开始

### 方式一：Docker Compose（推荐）

```bash
# 一键启动服务和数据库
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 停止服务
docker-compose down
```

### 方式二：本地开发

#### 1. 准备数据库

确保本地运行 PostgreSQL，或使用 Docker 启动一个：

```bash
docker run -d \
  --name zhiyue-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=zhiyue \
  -p 5432:5432 \
  postgres:16-alpine
```

#### 2. 配置环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑 .env 文件，根据需要修改配置
```

#### 3. 安装依赖并启动

```bash
# 安装依赖
npm install

# 开发模式启动
npm run start:dev

# 生产模式构建
npm run build
npm run start:prod
```

#### 4. 初始化测试用户

```bash
# 运行种子脚本创建默认测试用户
npx ts-node src/seeds/seed-users.ts
```

## 用户管理 (手动操作脚本)

我们提供了一系列脚本，方便开发者在没有管理后台的情况下手动管理用户。

### 1. 添加新用户

使用 `user:add` 命令可以快速添加一个新用户。

```bash
# 用法: npm run user:add -- <用户名> <密码> [角色] [配额]
# 示例:
npm run user:add -- john pass123                    # 普通用户，默认配额 10,000
npm run user:add -- admin admin123 admin 1000000    # 管理员，配额 1,000,000
```

### 2. 查看用户列表

使用 `user:list` 命令可以表格形式列出所有注册用户及其配额使用情况。

```bash
npm run user:list
```

### 3. 配额设置与重置

使用 `user:manage` 命令可以对现有用户进行配额调整。

```bash
# 设置用户配额上限
npm run user:manage -- set-quota <用户名> <配额>
npm run user:manage -- set-quota john 50000

# 增加用户配额
npm run user:manage -- add-quota <用户名> <增加数量>
npm run user:manage -- add-quota john 10000

# 重置用户已使用配额为 0 (通常用于每月重置或由于错误导致的调整)
npm run user:manage -- reset-usage <用户名>
```

---

## API 端点

### 认证

| 方法 | 路径              | 描述             | 认证 |
| ---- | ----------------- | ---------------- | ---- |
| POST | /api/auth/login   | 用户登录         | 公开 |
| GET  | /api/auth/profile | 获取当前用户信息 | 需要 |

### 使用量

| 方法 | 路径                   | 描述         | 认证 |
| ---- | ---------------------- | ------------ | ---- |
| POST | /api/usage             | 记录使用量   | 需要 |
| GET  | /api/usage/stats       | 获取统计数据 | 需要 |
| GET  | /api/usage/check-quota | 检查配额     | 需要 |

## 测试账号

| 用户名 | 密码     | 角色   | 配额      |
| ------ | -------- | ------ | --------- |
| admin  | admin123 | 管理员 | 1,000,000 |
| tester | test123  | 用户   | 100,000   |
| demo   | demo123  | 用户   | 50,000    |

## 环境变量

| 变量名            | 描述         | 默认值      |
| ----------------- | ------------ | ----------- |
| DATABASE_HOST     | 数据库主机   | localhost   |
| DATABASE_PORT     | 数据库端口   | 5432        |
| DATABASE_USERNAME | 数据库用户名 | postgres    |
| DATABASE_PASSWORD | 数据库密码   | postgres    |
| DATABASE_NAME     | 数据库名称   | zhiyue      |
| JWT_SECRET        | JWT 签名密钥 | (需要修改)  |
| JWT_EXPIRES_IN    | JWT 过期时间 | 7d          |
| PORT              | 服务端口     | 3000        |
| NODE_ENV          | 运行环境     | development |

## 目录结构

```
server/
├── src/
│   ├── auth/           # 认证模块
│   ├── config/         # 配置
│   ├── seeds/          # 数据库种子
│   ├── usage/          # 使用量统计模块
│   └── users/          # 用户模块
├── Dockerfile          # Docker 构建文件
├── docker-compose.yml  # Docker Compose 配置
└── package.json
```

## 与前端集成

前端扩展通过环境变量 `VITE_API_BASE_URL` 配置后端地址：

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

生产环境需要将此地址改为实际部署的后端服务地址。

## 部署教程 (Deployment Guide)

本教程指导你如何将 "智阅" 系统部署到生产环境（如云服务器）。

### 1. 后端部署 (服务端)

#### 推荐方案：Docker Compose 部署

这是最简单且环境隔离最好的方案。

1.  **上传代码**：将整个项目文件夹上传至服务器（或仅上传 `server` 目录）。
2.  **配置环境**：在 `server` 目录下创建 `.env` 文件。
    ```bash
    cp .env.example .env
    # 修改 JWT_SECRET 为一个随机长字符串
    # 修改 DATABASE_PASSWORD 为更安全的密码
    ```
3.  **启动服务**：
    ```bash
    docker-compose up -d --build
    ```
    该命令会自动启动 PostgreSQL 数据库和 NestJS 服务。
4.  **初始化用户**：
    ```bash
    docker-compose exec app npm run seed
    ```

#### 手动部署方案 (PM2)

如果你不想使用 Docker：

1.  **环境要求**：Node.js 20+, PostgreSQL 16+。
2.  **构建项目**：
    ```bash
    npm install
    npm run build
    ```
3.  **使用 PM2 启动**：
    ```bash
    npm install -g pm2
    pm2 start dist/main.js --name zhiyue-server
    ```

### 2. 前端部署 (浏览器扩展)

浏览器扩展不需要传统的 "部署"，而是打包后并在扩展商店或开发者模式下加载。

1.  **修改 API 地址**：
    在根目录（前端）的 `.env.production` 或 `.env` 中，将 `VITE_API_BASE_URL` 指向你部署的后端真实地址：
    ```env
    VITE_API_BASE_URL=https://api.yourdomain.com/api
    ```
2.  **打包项目**：
    ```bash
    pnpm build
    ```
3.  **获取产物**：
    打包后的文件位于项目根目录的 `dist` 文件夹中。
4.  **发布/安装**：
    - **自用**：将 `dist` 文件夹压缩为 `.zip`，在 Chrome 扩展管理页面开启 "开发者模式"，点击 "加载解压的扩展程序" 选择该文件夹。
    - **发布**：将 `dist` 文件夹打包上传至 Chrome Web Store。

### 3. 反向代理配置 (Nginx 示例)

建议使用 Nginx 为后端提供 HTTPS 支持：

```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. 常见问题 (FAQ)

- **Q: 登录提示 404 或网络错误？**
  A: 请确保前端打包时的 `VITE_API_BASE_URL` 配置正确，且服务器 3000 端口（或 Nginx 端口）已在安全组中开放。
- **Q: 数据库连接失败？**
  A: 如果使用 Docker，请确保环境变量中的 `DATABASE_HOST` 设置为 `db` (docker-compose 中的服务名) 而非 `localhost`。
- **Q: 如何修改用户的初始配额？**
  A: 修改 `user.entity.ts` 中的 `quotaLimit` 默认值，或者使用 `user:manage` 脚本动态调整。
