# Story 1-2 测试指南

## 🎯 测试目标

验证Side Panel与Background Script之间的webext-bridge通信是否正常工作。

## 📋 测试前准备

1. 确保开发服务器正在运行：
   ```bash
   npm run dev
   ```

2. 在Chrome浏览器中：
   - 打开 `chrome://extensions/`
   - 启用"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目的 `dist` 文件夹

## ✅ 测试步骤

### 测试1: Ping-Pong通信

1. **打开Side Panel**
   - 点击浏览器工具栏的扩展图标
   - Side Panel应该在右侧打开，显示"Zhiyue Side Panel - IPC Bridge 测试控制台"

2. **发送Ping消息**
   - 在"🏓 Ping 测试"区域
   - 输入框中默认有"Hello from Side Panel!"
   - 点击"发送 Ping"按钮

3. **验证响应**
   - 测试结果区域应显示：
     ```
     ✅ 成功！
     响应: Received: "Hello from Side Panel!"
     延迟: [数字]ms
     ```

4. **查看Background日志**（可选）
   - 右键点击扩展图标 → "检查弹出内容" → 选择"Service Worker"
   - Console中应显示：
     ```
     📩 Received ping: Hello from Side Panel! at [时间戳]
     ```

### 测试2: 设置读写

1. **读取设置**
   - 在"⚙️ 设置测试"区域
   - 点击"读取设置"按钮

2. **验证响应**
   - 首次运行时，结果应显示：
     ```
     ✅ 设置已加载:
     {}
     ```
   - 或者如果之前有保存，会显示已保存的设置

3. **保存测试设置**
   - 点击"保存测试设置"按钮
   - 结果应显示：
     ```
     ✅ 设置已保存
     ✅ 设置已加载:
     {
       "theme": "dark",
       "apiKey": "test-key-[时间戳]"
     }
     ```

4. **验证持久化**
   - 关闭Side Panel
   - 重新打开
   - 点击"读取设置"
   - 应能看到之前保存的设置

### 测试3: 类型安全验证

1. **查看TypeScript编译**
   ```bash
   npm run build
   ```
   应该无严重错误（部分警告可接受）

2. **代码智能提示测试**
   - 打开 `src/lib/ipc.ts`
   - 在IDE中应能看到 `sendMessage` 的类型提示
   - 消息类型应有自动补全

## 🎉 预期结果

- ✅ Ping-Pong测试成功，延迟 < 50ms
- ✅ 设置读写功能正常
- ✅ 数据在浏览器重启后仍然保留
- ✅ TypeScript类型检查通过
- ✅ 控制台无严重错误

## 🐛 常见问题

### Q: Side Panel打不开
**A**: 检查manifest.json中的side_panel配置，确保路径正确

### Q: 点击按钮无响应
**A**: 
1. 打开Side Panel的DevTools查看Console错误
2. 检查Background Service Worker的日志
3. 确认webext-bridge已正确初始化

### Q: 设置无法保存
**A**: 检查chrome.storage.local权限是否在manifest.json中声明

## 📸 截图参考

测试成功时，Side Panel应该显示类似如下界面：

```
┌─────────────────────────────────────┐
│ Zhiyue Side Panel                   │
│ IPC Bridge 测试控制台 (Story 1-2)    │
├─────────────────────────────────────┤
│ 🏓 Ping 测试                         │
│ [Hello from Side Panel!  ]          │
│ [发送 Ping]                          │
├─────────────────────────────────────┤
│ ⚙️ 设置测试                          │
│ [读取设置] [保存测试设置]             │
├─────────────────────────────────────┤
│ 测试结果:                            │
│ ✅ 成功！                            │
│ 响应: Received: "Hello..."          │
│ 延迟: 15ms                           │
├─────────────────────────────────────┤
│ ℹ️ 说明: 此页面用于测试...           │
└─────────────────────────────────────┘
```

## 🔍 下一步

Story 1-2 完成后，可以继续：
- Story 1-3: 安全设置与API密钥管理
- Story 1-4: AI服务层与Token流式传输

---
**测试完成日期**: 2025-12-25  
**测试人员**: Developer
