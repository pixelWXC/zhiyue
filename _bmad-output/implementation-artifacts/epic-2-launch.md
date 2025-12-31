# Epic 2: Deep Syntax Visualization - 启动文档

**日期**: 2025-12-30
**状态**: 🚀 启动中
**前置依赖**: Epic 1 (已完成)

---

## 🎯 目标与愿景 (Goal & Vision)

**目标**: 为进阶学习者提供深度的句法结构洞察。
**愿景**: 用户不再面对复杂的长难句感到迷茫，而是通过可视化的"依存关系树"（Dependency Tree）清晰地理解句子成分（主谓宾、修饰关系）及运作机制。如果说 Epic 1 是"阅读助手"，Epic 2 就是"语法导师"。

---

## 📋 范围 (Scope)

本 Epic 包含两个核心 Story：

### 1. Story 2.1: Gemini 3 Pro "Thinking Mode" Service Integration
- **核心任务**: 升级 AI 服务层，集成 `gemini-3-pro-preview` 模型。
- **关键点**:
    - **模型选择**: 使用最新的 `gemini-3-pro-preview`，支持推理能力。
    - 使用 `thinkingConfig` 配置（`thinkingLevel` 支持 "low" 和 "high"），确保分析的深度和准确性。
    - 输出严格嵌套的 JSON 格式，用于构建树形结构。
    - 处理长延迟（Latency）：设计针对思考过程的加载状态。

### 2. Story 2.2: Recursive Syntax Visualization Component
- **核心任务**: 开发侧边栏专用的递归树形组件。
- **关键点**:
    - **UI 设计**: 采用文件系统（FileSystem）风格的折叠树，适应 300px 窄宽度的侧边栏。
    - **交互**: 点击节点展开/折叠，高亮显示词元和语法角色（Grammar Role）。
    - **组件复用**: 复用 Epic 1 的 UI 设计语言（Shadcn/Tailwind）。

---

## 🛠️ 技术策略与架构 (Technical Strategy)

基于 Epic 1 回顾会（Retrospective）的经验教训，我们制定以下技术策略：

### 1. API 与 数据处理 (Story 2.1)
- **模型选择**: `gemini-3-pro-preview`，启用原生推理能力（Thinking）。
- **配置项**:
    - 使用 `thinkingConfig: { thinkingLevel: "low" }` 进行标准语法分析。
    - 对于复杂长句，可切换至 `"high"` 级别以提升准确度。
- **Prompt 工程**:
    - **Prompt内容**: `"Analyze the syntax tree using dependency grammar. Output in nested JSON format."`
    - 结合模型自带的推理能力，强制要求输出递归 JSON 结构（例如：`{ token: "我", children: [...] }`）。
    - **JSON Robustness**: 继续集成 `json-repair` 库。由于 Gemini Pro 输出可能更长且结构更复杂，必须确保 JSON 解析的健壮性。
- **状态管理**:
    - 针对 **Pinia Store 隔离问题**（Epic 1 教训），确保语法树的数据状态在 Side Panel 中独立管理。如果 Content Script 需要访问，必须通过 `webext-bridge` 明确传递。

### 2. UI 渲染与组件 (Story 2.2)
- **递归组件**: Vue 3 的递归组件是核心。
    - 组件名: `SyntaxTreeNode.vue`
    - Props: `node` (Object), `depth` (Number)
    - 样式: 使用缩进（Padding-left）表示层级，避免过深的层级导致内容被截断。
- **窄屏适配**:
    - 侧边栏宽度有限，避免横向滚动条。
    - 长文本处理：使用省略号（ellipsis）+ Tooltip 悬浮显示完整内容。
- **加载体验**:
    - 由于 Pro 模型较慢，需要实现 "Skeleton Loading" 或 "Thinking..." 动画，明确告知 user AI 正在进行深度推理，而非卡死。

---

## ⚠️ 风险与缓解措施 (Risk Management)

| 风险点 | 来源 | 缓解措施 |
|--------|------|----------|
| **API 延迟过高** | Gemini Pro 模型特性 | 优化加载 UI；考虑在 Prompt 中限制分析层级或 tokens 数量；由 user 主动触发深度分析（而非自动）。 |
| **JSON 格式错误** | LLM 输出不确定性 | 严格的 Prompt 约束；强制使用 JSON Mode（如果 API 支持）；客户端 `json-repair` + Zod Schema 验证。 |
| **树形结构过深** | 复杂长句 | UI 上提供 "全部展开/折叠" 按钮；限制初始展开层级；优化递归组件的性能。 |
| **Store 状态混乱** | 多上下文架构 | 严格遵守 `useAiService` 模式，状态变更仅在 Store Action 中进行；明确界定 Side Panel 与 Content Script 的职责边界。 |

---

## 📅 执行计划 (Execution Plan)

### Phase 1: AI 服务升级 (Story 2.1)
1.  [ ] **Prompt 开发**: 在 AI Studio 中调试 Gemini Pro 的依存语法分析 Prompt，确保 JSON 结构稳定。
2.  [ ] **API 集成**: 扩展 `useAiService`，添加 `analyzeSyntax(text)` 方法，连接 Gemini Pro。
3.  [ ] **单元测试**: 针对 `analyzeSyntax` 编写测试，验证 JSON 解析和错误处理。

### Phase 2: UI 组件开发 (Story 2.2)
1.  [ ] **组件原型**: 创建 `SyntaxTree.vue` 和 `SyntaxTreeNode.vue` 的静态原型。
2.  [ ] **数据联调**: 将 Mock 数据替换为 `useAiService` 的真实返回数据。
3.  [ ] **交互优化**: 调整缩进、颜色（区分主谓宾颜色）、字体大小，确保在侧边栏的可读性。

### Phase 3: 集成与测试
1.  [ ] **集成测试**: 验证从"文本分析"（Epic 1）到"深度语法分析"（Epic 2）的流程切换。
2.  [ ] **性能检查**: 确保递归组件渲染不会导致 UI 卡顿。

---

## 🚀 启动确认

- [x] Epic 1 已完成并回顾。
- [x] 核心技术栈 (Vue3, Pinia, Gemini API) 验证稳定。
- [x] 开发者已准备好处理更复杂的 Prompt 和 UI 逻辑。

**Let's decode the matrix of language!**
