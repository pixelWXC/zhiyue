<template>
  <div class="magic-card-container">
    <!-- Loading State -->
    <div v-if="isLoading" class="card-skeleton">
      <MagicCardSkeleton />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="card-error">
      <div class="humble-robot">
        <AlertCircle class="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          哎呀，创建卡片时出了点小问题
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {{ error }}
        </p>
        <button
          @click="$emit('retry')"
          class="retry-button"
        >
          <RotateCw class="w-4 h-4" />
          重试
        </button>
      </div>
    </div>

    <!-- Card Content -->
    <div v-else-if="data" class="magic-card">
      <!-- Image Section -->
      <div v-if="image" class="card-image-container">
        <Transition name="fade">
          <img
            :src="image"
            alt="Card illustration"
            class="card-image"
          />
        </Transition>
      </div>
      <div v-else class="card-image-placeholder">
        <ImageIcon class="w-16 h-16 text-gray-300" />
        <p class="text-xs text-gray-400 mt-2">等待图片生成...</p>
      </div>

      <!-- Card Content -->
      <div class="card-content">
        <!-- Target Word -->
        <div class="card-field card-target">
          <h2 class="target-word">{{ data.targetWord }}</h2>
          <p class="reading">{{ data.reading }}</p>
        </div>

        <!-- Meaning -->
        <div class="card-field">
          <label class="field-label">含义</label>
          <p class="field-value">{{ data.meaning }}</p>
        </div>

        <!-- Sentence -->
        <div class="card-field">
          <label class="field-label">例句</label>
          <p class="field-value sentence">{{ data.sentence }}</p>
        </div>

        <!-- Hint -->
        <div class="card-field">
          <label class="field-label">提示</label>
          <p class="field-value hint">{{ data.hint }}</p>
        </div>
      </div>

      <!-- Footer Actions (for Story 3.4) -->
      <div class="card-footer">
        <button
          disabled
          class="export-button"
          title="导出功能即将推出"
        >
          <Download class="w-4 h-4" />
          导出 Anki
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="card-empty">
      <Sparkles class="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p class="text-sm text-gray-500">等待卡片生成...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertCircle, RotateCw, Download, ImageIcon, Sparkles } from 'lucide-vue-next'
import type { FlashcardData } from '@/types/card'
import MagicCardSkeleton from './MagicCardSkeleton.vue'

interface Props {
  data: FlashcardData | null
  isLoading: boolean
  image: string | null
  error?: string | null
}

defineProps<Props>()

defineEmits<{
  retry: []
}>()

</script>

<style scoped>
.magic-card-container {
  width: 100%;
  max-width: 400px;
  min-width: 320px;
}

/* Loading Skeleton */
.card-skeleton {
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

/* Error State */
.card-error {
  background: white;
  border-radius: 16px;
  border: 1px solid #fbbf24;
  padding: 32px 24px;
  text-align: center;
}

.humble-robot {
  max-width: 280px;
  margin: 0 auto;
}

.retry-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  px: 16px;
  py: 8px;
  background: #fbbf24;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-button:hover {
  background: #f59e0b;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
}

/* Magic Card */
.magic-card {
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
  border-radius: 16px;
  border: 2px solid #e5e7eb;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.magic-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

/* Image Section */
.card-image-container {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #f3f4f6;
  overflow: hidden;
  position: relative;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-image-placeholder {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Card Content */
.card-content {
  padding: 24px;
  space-y: 16px;
}

.card-field {
  margin-bottom: 16px;
}

.card-field:last-child {
  margin-bottom: 0;
}

/* Target Word */
.card-target {
  text-align: center;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 20px;
}

.target-word {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.reading {
  font-size: 16px;
  color: #6b7280;
  font-weight: 500;
}

/* Field Labels */
.field-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #9ca3af;
  margin-bottom: 6px;
}

.field-value {
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
  margin: 0;
}

.field-value.sentence {
  font-size: 15px;
  font-weight: 500;
  color: #1f2937;
}

.field-value.hint {
  font-size: 13px;
  color: #6b7280;
  font-style: italic;
}

/* Card Footer */
.card-footer {
  padding: 16px 24px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
}

.export-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  px: 12px;
  py: 6px;
  background: #e5e7eb;
  color: #9ca3af;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Empty State */
.card-empty {
  background: white;
  border: 2px dashed #e5e7eb;
  border-radius: 16px;
  padding: 48px 24px;
  text-align: center;
}

/* Fade Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .magic-card {
    background: linear-gradient(135deg, #18181b 0%, #27272a 100%);
    border-color: #3f3f46;
  }

  .card-error {
    background: #18181b;
    border-color: #f59e0b;
  }

  .card-target {
    border-bottom-color: #3f3f46;
  }

  .target-word {
    color: #f9fafb;
  }

  .reading {
    color: #a1a1aa;
  }

  .field-label {
    color: #71717a;
  }

  .field-value {
    color: #d4d4d8;
  }

  .field-value.sentence {
    color: #e4e4e7;
  }

  .field-value.hint {
    color: #a1a1aa;
  }

  .card-footer {
    background: #27272a;
    border-top-color: #3f3f46;
  }

  .card-image-placeholder {
    background: linear-gradient(135deg, #27272a 0%, #3f3f46 100%);
  }

  .card-empty {
    background: #18181b;
    border-color: #3f3f46;
  }

  .humble-robot h3 {
    color: #f9fafb;
  }

  .humble-robot p {
    color: #a1a1aa;
  }
}
</style>
