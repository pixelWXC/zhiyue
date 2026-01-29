<template>
  <div class="card-detail">
    <!-- Header -->
    <div class="detail-header">
      <button @click="$emit('back')" class="back-button">
        <ArrowLeft class="w-4 h-4" />
        返回列表
      </button>
      
      <div class="header-actions">
        <button @click="handleDelete" class="action-button delete">
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>
    
    <!-- Card Flip Container -->
    <CardFlip :card="card" />
    
    <!-- Card Meta Info -->
    <div class="card-meta">
      <div class="meta-item">
        <Clock class="w-4 h-4" />
        <span>创建于 {{ formatDate(card.createdAt) }}</span>
      </div>
      <div v-if="card.lastReviewAt" class="meta-item">
        <RotateCcw class="w-4 h-4" />
        <span>上次复习 {{ formatDate(card.lastReviewAt) }}</span>
      </div>
      <div v-if="card.reviewCount" class="meta-item">
        <Hash class="w-4 h-4" />
        <span>已复习 {{ card.reviewCount }} 次</span>
      </div>
      <div v-if="card.sourceSentence" class="meta-item source">
        <FileText class="w-4 h-4" />
        <span>{{ card.sourceSentence }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, Trash2, Clock, RotateCcw, Hash, FileText } from 'lucide-vue-next'
import CardFlip from './CardFlip.vue'
import type { VocabCard } from '@/types/vocab-card'

interface Props {
  card: VocabCard
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'delete', cardId: number): void
}>()

function handleDelete() {
  emit('delete', props.card.id!)
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // 小于1分钟
  if (diff < 60 * 1000) {
    return '刚刚'
  }
  // 小于1小时
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))} 分钟前`
  }
  // 小于24小时
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))} 小时前`
  }
  // 小于7天
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))} 天前`
  }
  
  // 超过7天显示具体日期
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.card-detail {
  min-height: 100%;
  background: #fdfbf7;
}

:root.dark .card-detail {
  background: #0f1412;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fffefc;
  border-bottom: 1px solid rgba(31, 64, 55, 0.12);
}

:root.dark .detail-header {
  background: #121816;
  border-bottom-color: #1f2b26;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: #6b7c6a;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.back-button:hover {
  color: #1f4037;
  background: #edf3e6;
}

:root.dark .back-button:hover {
  color: #f3f4f6;
  background: #27312c;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  padding: 8px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button.delete {
  background: #fef2f2;
  color: #ef4444;
}

.action-button.delete:hover {
  background: #fee2e2;
}

:root.dark .action-button.delete {
  background: rgba(239, 68, 68, 0.1);
}

:root.dark .action-button.delete:hover {
  background: rgba(239, 68, 68, 0.2);
}

.card-meta {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: #6b7c6a;
}

.meta-item svg {
  flex-shrink: 0;
  margin-top: 2px;
}

:root.dark .meta-item {
  color: #9aa896;
}

.meta-item.source {
  padding-top: 8px;
  border-top: 1px solid rgba(31, 64, 55, 0.12);
}

:root.dark .meta-item.source {
  border-top-color: #1f2b26;
}
</style>
