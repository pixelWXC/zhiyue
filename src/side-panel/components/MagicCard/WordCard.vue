<template>
  <div class="word-card-container">
    <!-- Card Info Preview -->
    <div class="card-preview">
      <div class="word-info">
        <h2 class="preview-word">{{ context.word }}</h2>
        <p class="preview-kana">{{ context.kana }}</p>
        <p class="preview-meaning">{{ context.meaning }}</p>
      </div>
      
      <div v-if="context.sentence" class="sentence-preview">
        <span class="sentence-label">来源句子</span>
        <p class="sentence-text">{{ context.sentence }}</p>
      </div>
    </div>

    <!-- Action Button -->
    <div class="action-section">
      <button @click="handleCreateCard" class="create-button">
        <Sparkles class="w-5 h-5" />
        制作魔法卡片
      </button>
      <p class="action-hint">卡片将保存到收藏夹中</p>
    </div>

    <!-- Card Creation Confirm Modal -->
    <CardCreationConfirm 
      v-if="cardContext"
      :visible="showConfirmModal" 
      :context="cardContext"
      @close="showConfirmModal = false"
      @view-card="handleViewCard"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Sparkles } from 'lucide-vue-next'
import CardCreationConfirm from './CardCreationConfirm.vue'
import type { CreateCardContext, VocabCard } from '@/types/vocab-card'
import type { WordContext } from '@/logic/prompts'

interface Props {
  context: WordContext
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'view-card', card: VocabCard): void
}>()

const showConfirmModal = ref(false)

// 将 WordContext 转换为 CreateCardContext
const cardContext = computed<CreateCardContext | null>(() => {
  if (!props.context.word) return null
  
  return {
    word: props.context.word,
    reading: props.context.kana || '',
    meaning: props.context.meaning || '',
    pos: '',
    sentence: props.context.sentence || ''
  }
})

function handleCreateCard() {
  showConfirmModal.value = true
}

function handleViewCard(card: VocabCard) {
  showConfirmModal.value = false
  emit('view-card', card)
}
</script>

<style scoped>
.word-card-container {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.card-preview {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 16px;
}

:root.dark .card-preview {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
}

.word-info {
  text-align: center;
  margin-bottom: 16px;
}

.preview-word {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px 0;
}

:root.dark .preview-word {
  color: #f3f4f6;
}

.preview-kana {
  font-size: 14px;
  color: #f97316;
  margin: 0 0 8px 0;
}

.preview-meaning {
  font-size: 16px;
  color: #4b5563;
  margin: 0;
}

:root.dark .preview-meaning {
  color: #a1a1aa;
}

.sentence-preview {
  padding: 12px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
}

:root.dark .sentence-preview {
  background: rgba(0, 0, 0, 0.2);
}

.sentence-label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.sentence-text {
  font-size: 14px;
  color: #4b5563;
  margin: 0;
  line-height: 1.5;
}

:root.dark .sentence-text {
  color: #a1a1aa;
}

.action-section {
  text-align: center;
}

.create-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.create-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
}

.action-hint {
  font-size: 12px;
  color: #9ca3af;
  margin: 12px 0 0 0;
}
</style>
