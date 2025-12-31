<template>
  <div class="card-test-panel">
    <h3>🧪 卡片生成测试面板</h3>
    
    <div class="test-input">
      <label>测试句子:</label>
      <input 
        v-model="testSentence" 
        type="text" 
        placeholder="输入日语句子，例如：猫がりんごを食べる"
      />
    </div>

    <div class="test-input">
      <label>目标词汇 (可选):</label>
      <input 
        v-model="testTargetWord" 
        type="text" 
        placeholder="例如：食べる"
      />
    </div>

    <button 
      @click="runTest" 
      :disabled="aiStore.isGeneratingCard || !testSentence"
      class="test-button"
    >
      {{ aiStore.isGeneratingCard ? '生成中...' : '🚀 生成卡片' }}
    </button>

    <!-- Loading State -->
    <div v-if="aiStore.isGeneratingCard" class="loading">
      ⏳ 正在生成卡片内容...
    </div>

    <!-- Error Display -->
    <div v-if="aiStore.cardError" class="error">
      ❌ 错误: {{ aiStore.cardError }}
    </div>

    <!-- Success Result -->
    <div v-if="aiStore.cardData" class="result">
      <h4>✅ 生成成功！</h4>
      
      <div class="card-preview">
        <div class="field">
          <strong>目标词汇:</strong> {{ aiStore.cardData.targetWord }}
        </div>
        <div class="field">
          <strong>读音:</strong> {{ aiStore.cardData.reading }}
        </div>
        <div class="field">
          <strong>例句:</strong> {{ aiStore.cardData.sentence }}
        </div>
        <div class="field">
          <strong>含义:</strong> {{ aiStore.cardData.meaning }}
        </div>
        <div class="field">
          <strong>提示:</strong> {{ aiStore.cardData.hint }}
        </div>
        <div class="field scene-desc">
          <strong>场景描述:</strong> 
          <p>{{ aiStore.cardData.sceneDescription }}</p>
          <div class="validation">
            <span :class="{ valid: hasMinimalist }">
              {{ hasMinimalist ? '✓' : '✗' }} minimalist/sketch
            </span>
            <span :class="{ valid: hasDoodle }">
              {{ hasDoodle ? '✓' : '✗' }} doodle/hand-drawn
            </span>
            <span :class="{ valid: hasWhite }">
              {{ hasWhite ? '✓' : '✗' }} white background
            </span>
          </div>
        </div>
      </div>

      <!-- Raw JSON for debugging -->
      <details class="raw-json">
        <summary>📄 查看原始 JSON</summary>
        <pre>{{ JSON.stringify(aiStore.cardData, null, 2) }}</pre>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAiStore } from '@/stores/ai-store'

const aiStore = useAiStore()

const testSentence = ref('猫がりんごを食べる')
const testTargetWord = ref('食べる')

async function runTest() {
  const targetToken = testTargetWord.value 
    ? { 
        word: testTargetWord.value, 
        reading: '', 
        romaji: '', 
        pos: '' 
      } 
    : undefined

  await aiStore.generateCard(testSentence.value, targetToken)
}

// Validation computed properties
const hasMinimalist = computed(() => {
  const desc = aiStore.cardData?.sceneDescription?.toLowerCase() || ''
  return desc.includes('minimalist') || desc.includes('sketch')
})

const hasDoodle = computed(() => {
  const desc = aiStore.cardData?.sceneDescription?.toLowerCase() || ''
  return desc.includes('doodle') || desc.includes('hand-drawn')
})

const hasWhite = computed(() => {
  const desc = aiStore.cardData?.sceneDescription?.toLowerCase() || ''
  return desc.includes('white background') || desc.includes('white backdrop')
})
</script>

<style scoped>
.card-test-panel {
  padding: 20px;
  border: 2px solid #4a90e2;
  border-radius: 8px;
  margin: 16px;
  background: #f8f9fa;
}

h3 {
  margin-top: 0;
  color: #2c3e50;
}

.test-input {
  margin-bottom: 12px;
}

.test-input label {
  display: block;
  font-weight: 600;
  margin-bottom: 4px;
  color: #555;
}

.test-input input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.test-button {
  padding: 10px 20px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  margin-top: 8px;
}

.test-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.test-button:hover:not(:disabled) {
  background: #357abd;
}

.loading {
  margin-top: 16px;
  padding: 12px;
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  color: #856404;
}

.error {
  margin-top: 16px;
  padding: 12px;
  background: #f8d7da;
  border-left: 4px solid #dc3545;
  color: #721c24;
}

.result {
  margin-top: 20px;
  padding: 16px;
  background: white;
  border-radius: 6px;
  border: 1px solid #28a745;
}

.result h4 {
  margin-top: 0;
  color: #28a745;
}

.card-preview .field {
  margin-bottom: 12px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.field strong {
  color: #495057;
}

.scene-desc {
  background: #e7f3ff;
}

.scene-desc p {
  margin: 8px 0;
  font-style: italic;
  color: #333;
}

.validation {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  font-size: 12px;
}

.validation span {
  padding: 4px 8px;
  border-radius: 3px;
  background: #f8d7da;
  color: #721c24;
}

.validation span.valid {
  background: #d4edda;
  color: #155724;
}

.raw-json {
  margin-top: 16px;
  border-top: 1px solid #dee2e6;
  padding-top: 12px;
}

.raw-json summary {
  cursor: pointer;
  color: #007bff;
  font-weight: 600;
}

.raw-json pre {
  background: #f4f4f4;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  max-height: 300px;
  overflow-y: auto;
}
</style>
