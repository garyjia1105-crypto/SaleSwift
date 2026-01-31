/**
 * Firestore 连接验证脚本。
 * 运行：npm run db:init（需在 backend 目录下，且已配置 .env / Firebase 凭证）
 */
import 'dotenv/config';
import { db, COLLECTIONS } from '../src/lib/firebase.js';

async function main() {
  try {
    await db.collection(COLLECTIONS.users).limit(1).get();
    console.log('Firestore 连接成功');
  } catch (e) {
    console.error('Firestore 连接失败:', e);
    process.exit(1);
  }
}

main();
