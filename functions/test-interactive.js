/**
 * 互動式查詢功能測試腳本
 * 讓用戶可以手動輸入查詢進行測試
 */

const readline = require("readline");
const { MockQueryHandler } = require("./test-local-query");

// 創建 readline 接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 模擬 LINE 事件對象
function createMockLineEvent(text) {
  return {
    type: "message",
    message: {
      type: "text",
      text: text,
    },
    replyToken: "mock-reply-token-" + Date.now(),
    source: {
      userId: "mock-user-id",
      type: "user",
    },
  };
}

// 顯示幫助信息
function showHelp() {
  console.log("\n📋 可用的查詢格式：");
  console.log("─".repeat(50));
  console.log("1. 今日行程查詢:");
  console.log("   查詢: 今日行程");
  console.log("");
  console.log("2. 特定日期查詢:");
  console.log("   查詢: 日曆事件");
  console.log("   日期: 2024-01-15");
  console.log("");
  console.log("3. 群組列表查詢:");
  console.log("   查詢: 群組列表");
  console.log("");
  console.log("4. 系統統計查詢:");
  console.log("   查詢: 系統統計");
  console.log("");
  console.log("5. 特殊命令:");
  console.log("   help - 顯示幫助");
  console.log("   exit - 退出測試");
  console.log("   clear - 清空螢幕");
  console.log("─".repeat(50));
}

// 清空螢幕
function clearScreen() {
  console.clear();
  console.log("🧪 互動式查詢功能測試");
  console.log("輸入 'help' 查看幫助，輸入 'exit' 退出\n");
}

// 主測試函數
async function runInteractiveTest() {
  clearScreen();
  
  const handler = new MockQueryHandler();
  
  // 顯示歡迎信息
  console.log("🎉 歡迎使用互動式查詢功能測試！");
  console.log("💡 您可以輸入各種查詢格式來測試功能");
  console.log("📝 支援多行輸入，按 Enter 兩次完成輸入\n");

  // 開始互動循環
  const askQuestion = () => {
    rl.question("🔍 請輸入查詢內容 (輸入 'help' 查看幫助): ", async (input) => {
      const trimmedInput = input.trim();

      // 處理特殊命令
      if (trimmedInput === "exit") {
        console.log("\n👋 感謝使用，再見！");
        rl.close();
        return;
      }

      if (trimmedInput === "help") {
        showHelp();
        askQuestion();
        return;
      }

      if (trimmedInput === "clear") {
        clearScreen();
        askQuestion();
        return;
      }

      if (trimmedInput === "") {
        console.log("⚠️  請輸入有效的查詢內容");
        askQuestion();
        return;
      }

      // 處理多行輸入
      if (trimmedInput.includes("\\n")) {
        const lines = trimmedInput.split("\\n");
        const multiLineInput = lines.join("\n");
        
        console.log(`\n📝 處理多行輸入: ${multiLineInput.replace(/\n/g, "\\n")}`);
        
        const mockEvent = createMockLineEvent(multiLineInput);
        await handler.handleQueryMessage(mockEvent);
      } else {
        // 處理單行輸入
        console.log(`\n📝 處理單行輸入: ${trimmedInput}`);
        
        const mockEvent = createMockLineEvent(trimmedInput);
        await handler.handleQueryMessage(mockEvent);
      }

      console.log("\n" + "─".repeat(60));
      askQuestion();
    });
  };

  // 開始詢問
  askQuestion();
}

// 處理程序退出
process.on("SIGINT", () => {
  console.log("\n\n👋 程序被中斷，再見！");
  rl.close();
  process.exit(0);
});

// 執行測試
if (require.main === module) {
  runInteractiveTest().catch(console.error);
}

module.exports = { runInteractiveTest }; 