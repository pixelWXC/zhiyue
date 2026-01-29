<template>
  <Teleport to="body">
    <Transition name="notification">
      <div 
        v-if="visible" 
        class="notification-bubble bg-rice-paper dark:bg-zinc-800"
        @click="handleClick"
      >
        <!-- Thumbnail -->
        <div class="notification-thumbnail">
          <img 
            v-if="card?.imageUrl" 
            :src="card.imageUrl" 
            :alt="card.word"
          />
          <div v-else class="thumbnail-placeholder">
            <Layers class="w-6 h-6" />
          </div>
        </div>
        
        <!-- Content -->
        <div class="notification-content">
          <p class="notification-title">
            <CheckCircle class="w-4 h-4 text-matcha" />
            制卡完成
          </p>
          <p class="notification-word text-deep-tea">「{{ card?.word }}」</p>
          <p class="notification-hint text-charcoal/60">点击查看卡片详情</p>
        </div>
        
        <!-- Close Button -->
        <button @click.stop="handleClose" class="notification-close hover:bg-matcha/10 hover:text-deep-tea">
          <X class="w-4 h-4" />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, onMounted, ref } from 'vue'
import { Layers, CheckCircle, X } from 'lucide-vue-next'
import type { VocabCard } from '@/types/vocab-card'

interface Props {
  visible: boolean
  card?: VocabCard | null
  autoCloseDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoCloseDelay: 5000
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'click', card: VocabCard): void
}>()

const autoCloseTimer = ref<ReturnType<typeof setTimeout> | null>(null)

function handleClick() {
  if (props.card) {
    emit('click', props.card)
  }
  emit('close')
}

function handleClose() {
  emit('close')
}

function startAutoCloseTimer() {
  clearAutoCloseTimer()
  if (props.autoCloseDelay > 0) {
    autoCloseTimer.value = setTimeout(() => {
      emit('close')
    }, props.autoCloseDelay)
  }
}

function clearAutoCloseTimer() {
  if (autoCloseTimer.value) {
    clearTimeout(autoCloseTimer.value)
    autoCloseTimer.value = null
  }
}

watch(() => props.visible, (visible) => {
  if (visible) {
    startAutoCloseTimer()
  } else {
    clearAutoCloseTimer()
  }
})

onMounted(() => {
  if (props.visible) {
    startAutoCloseTimer()
  }
})
</script>

<style scoped>
.notification-bubble {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 10000;
  
  display: flex;
  align-items: center;
  gap: 12px;
  
  padding: 12px 16px;
  /* background set by utility classes */
  border-radius: 16px;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.08);
  
  cursor: pointer;
  transition: all 0.2s ease;
  max-width: 320px;
}

:root.dark .notification-bubble {
  background: #27272a;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.3),
    0 2px 8px rgba(0, 0, 0, 0.2);
}

.notification-bubble:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 6px 24px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.1);
}

.notification-thumbnail {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
}

.notification-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #88C057 0%, #1F4037 100%);
  color: white;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  /* color handled by utility */
  margin: 0 0 2px 0;
}

:root.dark .notification-title {
  color: #f3f4f6;
}

.notification-word {
  font-size: 16px;
  font-weight: 700;
  /* color handled by utility */
  margin: 0 0 2px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notification-hint {
  font-size: 11px;
  /* color handled by utility */
  margin: 0;
}

.notification-close {
  padding: 4px;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  flex-shrink: 0;
}



:root.dark .notification-close:hover {
  color: #d1d5db;
  background: #3f3f46;
}

/* Transition Animation */
.notification-enter-active {
  animation: slideInFromRight 0.4s ease-out;
}

.notification-leave-active {
  animation: slideOutToRight 0.3s ease-in;
}

@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOutToRight {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}
</style>
