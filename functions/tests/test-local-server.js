/**
 * 本地測試服務器
 * 用於在沒有 Firebase 模擬器的情況下測試函數
 */

const express = require("express");
const cors = require("cors");
const { initializeApp } = require("firebase-admin/app");

// 初始化 Firebase Admin（本地模式）
initializeApp();

// 導入你的函數
const { status, health, tokenStatus } = require("../src/index.js");

const app = express();
const PORT = process.env.PORT || 3000;

// 中間件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 模擬 Firebase Functions 的 onRequest 包裝器
function createHandler(firebaseFunction) {
  return async (req, res) => {
    try {
      await firebaseFunction(req, res);
    } catch (error) {
      console.error("Function error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  };
}

// 路由
app.get("/status", createHandler(status));
app.get("/health", createHandler(health));
app.get("/tokenStatus", createHandler(tokenStatus));

// 測試端點
app.get("/", (req, res) => {
  res.json({
    message: "Local Firebase Functions Test Server",
    endpoints: {
      status: "/status",
      health: "/health",
      tokenStatus: "/tokenStatus",
    },
    instructions: "Use these endpoints to test your functions locally",
  });
});

// 啟動服務器
app.listen(PORT, () => {
  console.log(`🚀 Local test server running on http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/status`);
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`   GET  http://localhost:${PORT}/tokenStatus`);
  console.log(`\n💡 You can test these endpoints with:`);
  console.log(`   curl http://localhost:${PORT}/status`);
  console.log(`   curl http://localhost:${PORT}/health`);
  console.log(`   curl http://localhost:${PORT}/tokenStatus`);
});
