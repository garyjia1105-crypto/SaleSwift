# SaleSwift Backend

Node.js + Express + TypeScript 后端，使用 **Firebase Firestore** 作为数据库，提供认证、CRUD 与 AI 代理接口。

## 环境要求

- Node.js 18+
- npm 或 pnpm
- Firebase 项目（Firestore 已启用）

## 配置

1. 复制 `.env.example` 为 `.env`
2. 填写 `JWT_SECRET`、`GEMINI_API_KEY`（AI 功能需要）、`GOOGLE_OAUTH_CLIENT_ID`（与前端 Google 登录 Client ID 一致，用于校验 ID Token）
3. 配置 Firebase 凭证（任选其一）：
   - **本地开发**：在 [Firebase 控制台](https://console.firebase.google.com) → 项目设置 → 服务账号 → 生成新的私钥，下载 JSON 后设置 `GOOGLE_APPLICATION_CREDENTIALS=./path-to-service-account.json`
   - **无文件环境**：将上述 JSON 内容字符串化后填入 `FIREBASE_SERVICE_ACCOUNT_JSON`
   - 或分别设置 `FIREBASE_PROJECT_ID`、`FIREBASE_CLIENT_EMAIL`、`FIREBASE_PRIVATE_KEY`

## 安装与运行

```bash
npm install
npm run dev
```

默认服务地址：`http://localhost:4000`

### 数据库连接验证

```bash
npm run db:init
```

成功会输出「Firestore 连接成功」，失败会输出错误并退出码 1。

## Firestore 集合

- `users`：用户（email 用于登录查询；含 `authProvider: 'email' | 'google'`）
- `customers`：客户（字段 `userId` 隔离）
- `interactions`：互动（`userId`、可选 `customerId`）
- `schedules`：日程（`userId`、可选 `customerId`）
- `coursePlans`：课程规划（`userId`、`customerId`）

### Firestore 安全规则

当前仅后端通过 Admin SDK 访问 Firestore，前端不直连。规则文件：`firestore.rules`（禁止客户端直接读写）。部署规则：

```bash
firebase deploy --only firestore:rules
```

（需在项目根目录配置 `firebase.json` 指向本 backend 或规则文件路径。）

### Firestore 复合索引

带 `userId` + `customerId` 的列表查询需要复合索引。索引定义见 `firestore.indexes.json`。部署索引：

```bash
firebase deploy --only firestore:indexes
```

若未建索引，相关接口会报错，可按控制台错误中的链接在 Firebase 控制台一键创建。

## API 概览

- `POST /api/auth/register` - 注册（email, password）
- `POST /api/auth/login` - 登录（email, password），返回 JWT
- `POST /api/auth/google` - Google 登录（body: `{ idToken }`），校验 ID Token 后查/建用户，返回 JWT
- `GET /api/users/me` - 当前用户（需 Authorization: Bearer &lt;token&gt;）
- `PATCH /api/users/me` - 更新头像/语言/主题
- `GET|POST|GET/:id|PATCH/:id|DELETE/:id /api/customers` - 客户 CRUD
- `GET|POST|GET/:id|DELETE/:id /api/interactions` - 互动 CRUD
- `GET|POST|PATCH/:id|DELETE/:id /api/schedules` - 日程 CRUD
- `GET|POST|GET/:id|DELETE/:id /api/course-plans` - 课程规划 CRUD
- `POST /api/ai/*` - AI 代理（analyze-sales-interaction, role-play-init, role-play-message, evaluate-role-play, transcribe-audio, deep-dive-interest, continue-deep-dive, ask-about-interaction, generate-course-plan, parse-schedule-voice, parse-customer-voice, extract-search-keywords）

前端开发时设置 `VITE_API_URL=http://localhost:4000`（或对应后端地址）。
