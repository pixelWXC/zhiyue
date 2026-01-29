<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="handleCancel">
      <div class="modal-content">
        <!-- Header -->
        <div class="modal-header">
          <h3 class="modal-title">
            <Sparkles class="w-5 h-5" />
            制作魔法卡片
          </h3>
          <button @click="handleCancel" class="close-button" :disabled="isCreating">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <!-- Card Preview -->
        <div class="preview-section">
          <!-- Word Info -->
          <div class="word-preview">
            <h2 class="preview-word">{{ context.word }}</h2>
            <p class="preview-reading">{{ context.reading }}</p>
            <p class="preview-meaning">{{ context.meaning }}</p>
            <span v-if="context.pos" class="preview-pos">{{ context.pos }}</span>
          </div>
          
          <!-- Source Sentence -->
          <div v-if="context.sentence" class="sentence-preview">
            <span class="sentence-label">来源句子</span>
            <p class="sentence-text">{{ context.sentence }}</p>
          </div>
        </div>
        
        <!-- Progress Section -->
        <div v-if="isCreating" class="progress-section">
          <div class="progress-spinner"></div>
          <p class="progress-text">{{ progressMessage }}</p>
          <p class="progress-hint">制卡完成后会自动保存到卡片收藏</p>
        </div>
        
        <!-- Completed Section -->
        <div v-else-if="completedCard" class="completed-section">
          <div class="completed-icon">
            <CheckCircle class="w-12 h-12" />
          </div>
          <p class="completed-text">卡片制作完成！</p>
          
          <!-- Thumbnail Preview -->
          <div v-if="completedCard.imageUrl" class="thumbnail-preview" @click="handleViewCard">
            <img :src="completedCard.imageUrl" :alt="completedCard.word" />
            <div class="thumbnail-overlay">
              <Eye class="w-5 h-5" />
              <span>查看卡片</span>
            </div>
          </div>
        </div>
        
        <!-- Error Section -->
        <div v-else-if="error" class="error-section">
          <AlertCircle class="w-10 h-10 text-red-500" />
          <p class="error-text">{{ error }}</p>
          <button @click="handleRetry" class="retry-button">
            <RotateCw class="w-4 h-4" />
            重试
          </button>
        </div>
        
        <!-- Actions -->
        <div class="modal-actions">
          <button 
            v-if="!isCreating && !completedCard" 
            @click="handleCancel" 
            class="cancel-button"
          >
            取消
          </button>
          
          <button 
            v-if="!isCreating && !completedCard && !error" 
            @click="handleConfirm" 
            class="confirm-button"
          >
            <Wand2 class="w-4 h-4" />
            开始制作
          </button>
          
          <button 
            v-if="completedCard" 
            @click="handleViewCard" 
            class="view-button"
          >
            <Layers class="w-4 h-4" />
            查看收藏
          </button>
          
          <button 
            v-if="completedCard" 
            @click="handleClose" 
            class="done-button"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { 
  Sparkles, X, Wand2, CheckCircle, Eye, Layers, 
  AlertCircle, RotateCw 
} from 'lucide-vue-next'
import { useCardCollectionStore } from '@/stores/card-collection-store'
import { storeToRefs } from 'pinia'
import type { CreateCardContext, VocabCard } from '@/types/vocab-card'

interface Props {
  visible: boolean
  context: CreateCardContext
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'view-card', card: VocabCard): void
}>()

const store = useCardCollectionStore()
const { 
  isCreatingCard: isCreating, 
  currentProgressMessage: progressMessage,
  lastCompletedCard: completedCard,
  error 
} = storeToRefs(store)

// 开始制卡
async function handleConfirm() {
  await store.startCardCreation(props.context)
}

// 取消
function handleCancel() {
  if (isCreating.value) return
  emit('close')
}

// 关闭
function handleClose() {
  store.dismissNotification()
  emit('close')
}

// 查看卡片
function handleViewCard() {
  if (completedCard.value) {
    emit('view-card', completedCard.value)
  }
}

// 重试
function handleRetry() {
  store.startCardCreation(props.context)
}

// 关闭弹窗时清理状态
watch(() => props.visible, (visible) => {
  if (!visible) {
    // 弹窗关闭时的清理逻辑
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: #fdfbf7;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(31, 64, 55, 0.18);
}

:root.dark .modal-content {
  background: #111815;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(31, 64, 55, 0.12);
}

:root.dark .modal-header {
  border-bottom-color: #2a3a32;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1f4037;
  margin: 0;
}

:root.dark .modal-title {
  color: #e6f0da;
}

.modal-title svg {
  color: #88c057;
}

.close-button {
  padding: 4px;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-button:hover:not(:disabled) {
  color: #1f4037;
  background: #edf3e6;
}

.close-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

:root.dark .close-button:hover:not(:disabled) {
  background: #27312c;
  color: #e0ead6;
}

/* Preview Section */
.preview-section {
  padding: 20px;
}

.word-preview {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #fdfbf7 0%, #e9f2df 100%);
  border-radius: 12px;
  position: relative;
}

:root.dark .word-preview {
  background: linear-gradient(135deg, rgba(31, 64, 55, 0.25) 0%, rgba(136, 192, 87, 0.12) 100%);
}

.preview-word {
  font-size: 32px;
  font-weight: 700;
  color: #1f4037;
  margin: 0;
}

:root.dark .preview-word {
  color: #e6f0da;
}

.preview-reading {
  font-size: 14px;
  color: #88c057;
  margin: 4px 0 8px 0;
}

.preview-meaning {
  font-size: 16px;
  color: #4b5b52;
  margin: 0;
}

:root.dark .preview-meaning {
  color: #9aa896;
}

.preview-pos {
  display: inline-block;
  margin-top: 8px;
  padding: 2px 8px;
  font-size: 12px;
  background: rgba(136, 192, 87, 0.2);
  color: #1f4037;
  border-radius: 4px;
}

:root.dark .preview-pos {
  background: rgba(31, 64, 55, 0.35);
  color: #cfe6be;
}

.sentence-preview {
  margin-top: 16px;
  padding: 12px;
  background: #f7faf5;
  border-radius: 8px;
}

:root.dark .sentence-preview {
  background: #18211d;
}

.sentence-label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: #8b9a86;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.sentence-text {
  font-size: 14px;
  color: #4b5b52;
  margin: 0;
  line-height: 1.5;
}

:root.dark .sentence-text {
  color: #9aa896;
}

/* Progress Section */
.progress-section {
  padding: 32px 20px;
  text-align: center;
}

.progress-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e3e8dc;
  border-top-color: #88c057;
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.progress-text {
  font-size: 16px;
  font-weight: 500;
  color: #1f4037;
  margin: 0 0 8px 0;
}

:root.dark .progress-text {
  color: #e6f0da;
}

.progress-hint {
  font-size: 13px;
  color: #8b9a86;
  margin: 0;
}

/* Completed Section */
.completed-section {
  padding: 32px 20px;
  text-align: center;
}

.completed-icon {
  color: #88c057;
  margin-bottom: 12px;
}

.completed-text {
  font-size: 18px;
  font-weight: 600;
  color: #1f4037;
  margin: 0 0 16px 0;
}

:root.dark .completed-text {
  color: #e6f0da;
}

.thumbnail-preview {
  position: relative;
  width: 200px;
  height: 150px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.thumbnail-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: white;
  opacity: 0;
  transition: opacity 0.2s;
}

.thumbnail-preview:hover .thumbnail-overlay {
  opacity: 1;
}

.thumbnail-overlay span {
  font-size: 13px;
  font-weight: 500;
}

/* Error Section */
.error-section {
  padding: 32px 20px;
  text-align: center;
}

.error-text {
  font-size: 14px;
  color: #ef4444;
  margin: 12px 0 16px 0;
}

.retry-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #fef2f2;
  color: #ef4444;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-button:hover {
  background: #fee2e2;
}

/* Modal Actions */
.modal-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid rgba(31, 64, 55, 0.12);
}

:root.dark .modal-actions {
  border-top-color: #2a3a32;
}

.cancel-button {
  flex: 1;
  padding: 12px;
  background: #edf3e6;
  color: #1f4037;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-button:hover {
  background: #e1ebd6;
}

:root.dark .cancel-button {
  background: #1f2b26;
  color: #9aa896;
}

:root.dark .cancel-button:hover {
  background: #27312c;
}

.confirm-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  background: linear-gradient(135deg, #88c057 0%, #1f4037 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(31, 64, 55, 0.25);
}

.confirm-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(31, 64, 55, 0.35);
}

.view-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  background: rgba(136, 192, 87, 0.15);
  color: #1f4037;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.view-button:hover {
  background: rgba(136, 192, 87, 0.25);
}

:root.dark .view-button {
  background: rgba(31, 64, 55, 0.35);
  color: #cfe6be;
}

.done-button {
  flex: 1;
  padding: 12px;
  background: #1f4037;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.done-button:hover {
  background: #17342d;
}
</style>
