<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1v2U6n07MbLgpjLDmgnjPpBpkviNOv-Dn

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. 环境变量（可选）：在 `.env` 或 `.env.local` 中设置
   - `VITE_API_URL`：后端地址（默认 `http://localhost:4000`）
   - `VITE_GOOGLE_CLIENT_ID`：Google OAuth 2.0 Web 客户端 ID（与后端 `GOOGLE_OAUTH_CLIENT_ID` 一致，用于登录/注册页 Google 登录）
3. Run the app:
   `npm run dev`
