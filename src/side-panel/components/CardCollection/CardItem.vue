<template>
  <div class="card-item" @click="$emit('click')">
    <!-- Thumbnail -->
    <div class="card-thumbnail">
      <img
        v-if="card.imageUrl"
        :src="card.imageUrl"
        :alt="card.word"
        class="thumbnail-image"
      />
      <div v-else class="thumbnail-placeholder">
        <ImageIcon class="w-8 h-8" />
      </div>
      
      <!-- Level Badge -->
      <span v-if="card.level" class="level-badge" :class="`level-${card.level}`">
        N{{ card.level }}
      </span>
      
      <!-- Delete Button -->
      <button
        class="delete-button"
        @click.stop="card.id && $emit('delete', card.id)"
        title="删除卡片"
      >
        <Trash2 class="w-3.5 h-3.5" />
      </button>
    </div>
    
    <!-- Card Info -->
    <div class="card-info">
      <h3 class="card-word">{{ card.word }}</h3>
      <p class="card-reading">{{ card.reading }}</p>
      <p class="card-meaning">{{ truncateMeaning(card.meaning) }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Trash2, ImageIcon } from 'lucide-vue-next'
import type { VocabCard } from '@/types/vocab-card'

interface Props {
  card: VocabCard
}

defineProps<Props>()

defineEmits<{
  (e: 'click'): void
  (e: 'delete', cardId: number): void
}>()

function truncateMeaning(meaning: string): string {
  if (meaning.length > 20) {
    return meaning.slice(0, 20) + '...'
  }
  return meaning
}
</script>

<style scoped>
.card-item {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(31, 64, 55, 0.12);
  cursor: pointer;
  transition: all 0.2s;
}

.card-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(31, 64, 55, 0.12);
  border-color: rgba(136, 192, 87, 0.4);
}

:root.dark .card-item {
  background: #1a1f1d;
  border-color: #2a3a32;
}

:root.dark .card-item:hover {
  border-color: #3a4a41;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.35);
}

.card-thumbnail {
  position: relative;
  aspect-ratio: 4 / 3;
  background: #f1f5ee;
  overflow: hidden;
}

:root.dark .card-thumbnail {
  background: #141a18;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #c8d5be;
}

:root.dark .thumbnail-placeholder {
  color: #3a4a41;
}

.level-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
  color: white;
}

.level-1 { background: linear-gradient(135deg, #1f4037, #0e1f1a); color: #fdfbf7; } /* N1 - 最深 */
.level-2 { background: linear-gradient(135deg, #2d3748, #1f4037); color: #fdfbf7; } /* N2 */
.level-3 { background: linear-gradient(135deg, #88c057, #1f4037); color: #fdfbf7; } /* N3 */
.level-4 { background: linear-gradient(135deg, #c6df9f, #7ab14f); color: #1f4037; } /* N4 */
.level-5 { background: linear-gradient(135deg, #d8e8bf, #88c057); color: #1f4037; } /* N5 - 最浅 */

.delete-button {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 6px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
}

.card-item:hover .delete-button {
  opacity: 1;
}

.delete-button:hover {
  background: rgba(239, 68, 68, 0.9);
}

.card-info {
  padding: 12px;
}

.card-word {
  font-size: 16px;
  font-weight: 600;
  color: #1f4037;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:root.dark .card-word {
  color: #f3f4f6;
}

.card-reading {
  font-size: 12px;
  color: #88c057;
  margin: 0 0 4px 0;
  font-family: 'Noto Sans JP', sans-serif;
}

.card-meaning {
  font-size: 12px;
  color: #6b7c6a;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:root.dark .card-meaning {
  color: #9aa896;
}
</style>
