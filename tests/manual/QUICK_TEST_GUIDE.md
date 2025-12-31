# Story 3-1 测试快速指南

## 🎯 最快速的测试方法（5 分钟）

### 方式 1: 浏览器控制台测试（推荐）

1. **打开侧边面板**
   - 加载浏览器扩展
   - 打开 Side Panel（Ctrl+Shift+P 或点击扩展图标）

2. **打开开发者工具**
   - 按 F12 或右键 → 检查
   - 切换到 Console 标签

3. **在控制台运行以下代码**:

```javascript
// 导入 Store
const { useAiStore } = await import('./stores/ai-store.js')
const aiStore = useAiStore()

// 测试 1: 基本生成（带目标词汇）
console.log('🧪 测试 1: 开始生成卡片...')
await aiStore.generateCard('猫がりんごを食べる', {
  word: '食べる',
  reading: '',
  romaji: '',
  pos: ''
})

// 检查结果
if (aiStore.cardData) {
  console.log('✅ 成功! 生成的卡片数据:')
  console.log(aiStore.cardData)
  
  // 验证场景描述
  const desc = aiStore.cardData.sceneDescription.toLowerCase()
  console.log('📝 场景描述验证:')
  console.log('  - Minimalist/Sketch:', desc.includes('minimalist') || desc.includes('sketch') ? '✓' : '✗')
  console.log('  - Doodle/Hand-drawn:', desc.includes('doodle') || desc.includes('hand-drawn') ? '✓' : '✗')
  console.log('  - White background:', desc.includes('white') ? '✓' : '✗')
} else if (aiStore.cardError) {
  console.error('❌ 错误:', aiStore.cardError)
}

// 测试 2: 自动选择目标词汇
console.log('\n🧪 测试 2: AI 自动选择目标词汇...')
await aiStore.generateCard('私は学校へ行きます')
console.log(aiStore.cardData ? '✅ 成功!' : '❌ 失败')

// 测试 3: 复杂句子
console.log('\n🧪 测试 3: 复杂句子...')
await aiStore.generateCard('昨日友達と一緒に映画を見に行きました', {
  word: '見る',
  reading: '',
  romaji: '',
  pos: ''
})
console.log(aiStore.cardData ? '✅ 成功!' : '❌ 失败')

console.log('\n✨ 所有测试完成!')
```

---

### 方式 2: 使用测试组件（可视化）

我已经创建了 `CardGeneratorTest.vue` 组件，您需要将其集成到 Side Panel 中：

**步骤**:

1. **临时添加到 Side Panel 主页**

编辑 `src/side-panel/App.vue` 或主页面，添加：

```vue
<script setup>
import CardGeneratorTest from './components/CardGeneratorTest.vue'
</script>

<template>
  <!-- 现有内容 -->
  
  <!-- 测试面板（开发阶段临时添加） -->
  <CardGeneratorTest v-if="import.meta.env.DEV" />
</template>
```

2. **重新加载扩展**
   - 在 Chrome 扩展管理页面点击"重新加载"
   - 打开 Side Panel

3. **使用测试面板**
   - 输入测试句子
   - 点击生成按钮
   - 查看结果和验证信息

---

### 方式 3: 运行单元测试

```bash
# 运行所有测试
pnpm test

# 只运行卡片生成相关测试
pnpm test card-generator

# 运行特定测试文件
pnpm test src/logic/ai/card-generator.test.ts

# 观察模式（自动重新运行）
pnpm test --watch
```

---

## ✅ 快速验证清单（1 分钟）

运行以下检查来快速验证实现：

### 1. 文件存在性检查
```bash
# 在项目根目录运行
ls src/types/card.ts
ls src/logic/prompts/card-gen.ts
ls src/logic/ai/card-generator.ts
```

期望：所有文件都存在 ✓

### 2. 编译检查
```bash
pnpm build
```

期望：无错误，构建成功 ✓

### 3. 类型检查
```bash
pnpm type-check
```

期望：无 TypeScript 错误 ✓

### 4. Store 导出检查

在控制台运行：
```javascript
const { useAiStore } = await import('./stores/ai-store.js')
const store = useAiStore()
console.log('generateCard' in store) // 应该输出 true
console.log('cardData' in store)      // 应该输出 true
console.log('isGeneratingCard' in store) // 应该输出 true
```

---

## 🐛 常见问题排查

### 问题 1: "未配置 API Key"
**解决**: 
1. 打开扩展设置
2. 输入有效的 Gemini API Key
3. 保存设置

### 问题 2: "API 调用失败"
**可能原因**:
- API Key 无效或已过期
- 网络连接问题
- API 速率限制

**排查**:
```javascript
// 检查 API Key
const { getSettings } = await import('./logic/storage/index.js')
const settings = await getSettings()
console.log('API Key 存在:', !!settings.apiKey)
console.log('API Key 前 8 位:', settings.apiKey?.substring(0, 8))
```

### 问题 3: JSON 解析错误
**排查**:
- 查看控制台的完整错误信息
- 检查是否有网络错误
- 尝试使用不同的句子

---

## 📊 预期测试结果

### 成功示例

**输入**:
- 句子: `猫がりんごを食べる`
- 目标词汇: `食べる`

**输出**:
```json
{
  "targetWord": "食べる",
  "reading": "たべる",
  "sentence": "猫がりんごを食べる",
  "meaning": "吃",
  "hint": "动词，表示进食动作。常见搭配：ご飯を食べる（吃饭）",
  "sceneDescription": "A minimalist hand-drawn sketch on white background: A cute cat sitting at a table, eating a bright red apple with a happy expression. Simple doodle-style lines with minimal details, warm and playful atmosphere."
}
```

**验证点**:
- ✅ 所有字段都有值
- ✅ reading 是假名
- ✅ meaning 简洁（< 30 字）
- ✅ hint 实用
- ✅ sceneDescription 包含关键词

---

## 🎓 下一步

测试通过后：

1. **运行代码审查**: `@workflow code-review`
2. **继续 Story 3-2**: AI 图片生成集成
3. **更新文档**: 记录任何发现的特殊情况

**测试愉快！** 🚀
