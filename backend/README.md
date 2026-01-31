# SaleSwift Backend

Node.js + Express + TypeScript 后端，使用 **Firebase Firestore** 作为数据库，提供认证、CRUD 与 AI 代理接口。

## 环境要求

- Node.js 18+
- npm 或 pnpm
- Firebase 项目（Firestore 已启用）

## 配置

1. 复制 `.env.example` 为 `.env`
2. 填写 `JWT_SECRET`、`GEMINI_API_KEY`（AI 功能需要）
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

## Firestore 集合

- `users`：用户（email 用于登录查询）
- `customers`：客户（字段 `userId` 隔离）
- `interactions`：互动（`userId`、可选 `customerId`）
- `schedules`：日程（`userId`、可选 `customerId`）
- `coursePlans`：课程规划（`userId`、`customerId`）

若使用带 `customerId` 的列表查询，需在 Firebase 控制台为对应集合创建复合索引（按控制台提示链接创建即可）。

## API 概览

- `POST /api/auth/register` - 注册（email, password）
- `POST /api/auth/login` - 登录（email, password），返回 JWT
- `GET /api/users/me` - 当前用户（需 Authorization: Bearer &lt;token&gt;）
- `PATCH /api/users/me` - 更新头像/语言/主题
- `GET|POST|GET/:id|PATCH/:id|DELETE/:id /api/customers` - 客户 CRUD
- `GET|POST|GET/:id|DELETE/:id /api/interactions` - 互动 CRUD
- `GET|POST|PATCH/:id|DELETE/:id /api/schedules` - 日程 CRUD
- `GET|POST|GET/:id|DELETE/:id /api/course-plans` - 课程规划 CRUD
- `POST /api/ai/*` - AI 代理（analyze-sales-interaction, role-play-init, role-play-message, evaluate-role-play, transcribe-audio, deep-dive-interest, continue-deep-dive, ask-about-interaction, generate-course-plan, parse-schedule-voice, parse-customer-voice, extract-search-keywords）

前端开发时设置 `VITE_API_URL=http://localhost:4000`（或对应后端地址）。
