# 调试 webext-bridge 通信问题

## 🔍 问题诊断步骤

### 步骤1: 加载扩展并检查基础功能

1. **重新加载扩展**
   ```
   打开 chrome://extensions/
   找到 zhiyue 扩展
   点击刷新图标 🔄
   ```

2. **打开 Background Service Worker 控制台**
   ```
   在扩展卡片上点击 "Service Worker"
   应该看到: "Zhiyue Background Service Worker initialized"
   应该看到: "✅ Event listeners registered"
   ```

3. **打开 Side Panel**
   ```
   点击浏览器工具栏的扩展图标
   Side Panel 应该在右侧打开
   ```

4. **打开 Side Panel 的 DevTools**
   ```
   在 Side Panel 上右键 → "检查"
   切换到 Console 标签页
   应该看到: "[Side Panel] Initializing..."
   应该看到: "[Side Panel] Mounted successfully"
   ```

### 步骤2: 测试 Ping 功能并查看日志

1. **发送 Ping 消息**
   - 在 Side Panel 中点击"发送 Ping"按钮

2. **查看 Side Panel Console**
   - 应该看到:
     ```
     [IPC] Sending ping: Hello from Side Panel!
     ```
   - 如果出现错误，记录完整的错误stack trace

3. **查看 Background Console**
   - 切换到 Background Service Worker 的Console
   - 应该看到:
     ```
     📩 Received ping: Hello from Side Panel! at [时间戳]
     ```

4. **如果有错误，检查网络标签页**
   - 在 Background DevTools 中切换到 Network 标签
   - 查看是否有失败的请求

### 步骤3: 检查 webext-bridge 初始化

在 **Side Panel Console** 中运行以下命令：

```javascript
// 检查 webext-bridge 是否已加载
console.log('webext-bridge loaded:', typeof chrome !== 'undefined')

// 测试直接发送消息
import('webext-bridge/window').then(bridge => {
    console.log('Bridge module:', bridge)
    bridge.sendMessage('ping', { message: 'Test', timestamp: Date.now() }, 'background')
        .then(res => console.log('✅ Direct ping success:', res))
        .catch(err => console.error('❌ Direct ping failed:', err))
})
```

### 步骤4: 检查manifest权限

查看 `dist/manifest.json` 文件，确认：
- ✅ `"permissions"` 包含 `"storage"`
- ✅ `"background"` 正确配置了 service_worker
- ✅ `"side_panel"` 正确配置了 default_path

## 🐛 常见错误及解决方案

### 错误1: "Failed to establish connection. Receiving end does not exist."

**原因**: Background Service Worker 未激活或已休眠

**解决方案**:
1. 在 `chrome://extensions/` 中点击 "Service Worker" 重新激活
2. 添加 keep-alive 机制（后续优化）

### 错误2: "TypeError: Cannot read property 'sendMessage' of undefined"

**原因**: webext-bridge 未正确初始化

**解决方案**:
1. 检查 `src/side-panel/main.ts` 的import顺序
2. 确保 `import 'webext-bridge/window'` 在最前面

### 错误3: 消息发送但无响应

**原因**: Background中没有对应的消息处理器

**解决方案**:
1. 检查 `src/background/index.ts` 中是否有 `onMessage('ping', ...)` 
2. 检查 Background Console 是否有错误日志

### 错误4: "Uncaught (in promise) Error: Unknown endpoint"

**原因**: 目标端点名称不正确

**解决方案**:
- 确认第三个参数是 `'background'` 而不是其他值
- webext-bridge v6 使用 `'background'` 作为background端点名

## 🔧 临时调试版本

如果上述方法仍无法解决，可以尝试使用最简化的测试代码：

### 修改 `src/lib/ipc.ts`:

```typescript
import { sendMessage } from 'webext-bridge/window'

export async function pingBackground(message: string) {
    console.log('[PING] Starting, message:', message)
    console.log('[PING] sendMessage function:', typeof sendMessage)
    
    try {
        const payload = { message, timestamp: Date.now() }
        console.log('[PING] Payload:', payload)
        
        const response = await sendMessage('ping', payload, 'background')
        console.log('[PING] Success! Response:', response)
        return response
    } catch (error) {
        console.error('[PING] Failed!', error)
        console.error('[PING] Error stack:', error.stack)
        throw error
    }
}
```

## 📊 预期的完整日志流

### ✅ 正常情况

**Background Console:**
```
Zhiyue Background Service Worker initialized
✅ Event listeners registered
📩 Received ping: Hello from Side Panel! at 2025-12-25T09:52:30.123Z
```

**Side Panel Console:**
```
[Side Panel] Initializing...
[Side Panel] Mounted successfully
[IPC] Sending ping: Hello from Side Panel!
[IPC] Ping response: { pong: "Received: \"Hello from Side Panel!\"", receivedAt: 1735102350456 }
```

### ❌ 异常情况

如果看到以下任何错误，请将**完整的错误信息**和**stack trace**发给我：

- `Error: Could not establish connection`
- `TypeError: ... is not a function`
- `NetworkError`
- 任何其他红色错误

## 🔄 下一步

1. 按照上述步骤操作后，将Console截图或错误日志发给我
2. 如果仍然无法工作，我们可以考虑使用原生 `chrome.runtime.sendMessage` API 作为backup方案
3. 或者升级/降级 webext-bridge 版本进行测试

---
**调试日期**: 2025-12-25
