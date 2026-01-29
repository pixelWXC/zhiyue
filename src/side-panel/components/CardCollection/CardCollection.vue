<template>
  <div class="card-collection">
    <!-- Header -->
    <div class="collection-header">
      <h2 class="collection-title">
        <Layers class="w-5 h-5" />
        卡片收藏
        <span v-if="cardCount > 0" class="card-count">{{ cardCount }}</span>
      </h2>
      
      <!-- Search Bar -->
      <div class="search-bar">
        <Search class="search-icon w-4 h-4" />
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索卡片..."
          class="search-input"
          @input="handleSearch"
        />
        <button
          v-if="searchKeyword"
          @click="clearSearch"
          class="clear-button"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载卡片中...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!hasCards" class="empty-state">
      <Sparkles class="empty-icon w-16 h-16" />
      <h3>暂无收藏卡片</h3>
      <p>在词汇详情页面点击"魔法卡片"按钮来制作你的第一张卡片吧！</p>
    </div>

    <!-- Card Detail View -->
    <CardDetail
      v-else-if="selectedCard"
      :card="selectedCard"
      @back="closeDetail"
      @delete="handleDelete"
    />

    <!-- Card Grid -->
    <div v-else class="card-grid">
      <CardItem
        v-for="card in displayCards"
        :key="card.id"
        :card="card"
        @click="openDetail(card)"
        @delete="handleDelete"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Layers, Search, X, Sparkles } from 'lucide-vue-next'
import { useCardCollectionStore } from '@/stores/card-collection-store'
import { storeToRefs } from 'pinia'
import CardItem from './CardItem.vue'
import CardDetail from './CardDetail.vue'
import type { VocabCard } from '@/types/vocab-card'

interface Props {
  /** 目标卡片ID（用于通知跳转） */
  targetCardId?: number
}

const props = defineProps<Props>()

const store = useCardCollectionStore()
const { cards, isLoading, hasCards, cardCount } = storeToRefs(store)

const searchKeyword = ref('')
const searchResults = ref<VocabCard[]>([])
const selectedCard = ref<VocabCard | null>(null)

// 显示的卡片列表
const displayCards = computed(() => {
  if (searchKeyword.value.trim()) {
    return searchResults.value
  }
  return cards.value
})

// 搜索处理
let searchTimeout: ReturnType<typeof setTimeout> | null = null
function handleSearch() {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(async () => {
    if (searchKeyword.value.trim()) {
      searchResults.value = await store.search(searchKeyword.value)
    } else {
      searchResults.value = []
    }
  }, 300)
}

function clearSearch() {
  searchKeyword.value = ''
  searchResults.value = []
}

// 打开卡片详情
function openDetail(card: VocabCard) {
  selectedCard.value = card
  // 更新复习时间
  if (card.id) {
    store.updateReviewTime(card.id)
  }
}

// 关闭详情
function closeDetail() {
  selectedCard.value = null
}

// 删除卡片
async function handleDelete(cardId: number) {
  if (confirm('确定要删除这张卡片吗？')) {
    await store.deleteCard(cardId)
    if (selectedCard.value?.id === cardId) {
      selectedCard.value = null
    }
  }
}

// 加载卡片
onMounted(async () => {
  await store.loadCards()
  
  // 如果有目标卡片ID，自动打开
  if (props.targetCardId) {
    const target = await store.getCard(props.targetCardId)
    if (target) {
      selectedCard.value = target
    }
  }
})

// 监听 targetCardId 变化
watch(() => props.targetCardId, async (newId) => {
  if (newId) {
    const target = await store.getCard(newId)
    if (target) {
      selectedCard.value = target
    }
  }
})
</script>

<style scoped>
.card-collection {
  min-height: 100%;
  padding: 0;
  background: #fdfbf7;
}

:root.dark .card-collection {
  background: #0f1412;
}

.collection-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: linear-gradient(180deg, #fdfbf7 0%, #ffffff 100%);
  padding: 16px;
  border-bottom: 1px solid rgba(31, 64, 55, 0.12);
}

:root.dark .collection-header {
  background: #121816;
  border-bottom-color: #1f2b26;
}

.collection-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1f4037;
  margin: 0 0 12px 0;
}

:root.dark .collection-title {
  color: #e6f0da;
}

.card-count {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  background: linear-gradient(135deg, #88c057, #1f4037);
  color: white;
  border-radius: 10px;
}

.search-bar {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #6b7c6a;
}

.search-input {
  width: 100%;
  padding: 10px 36px;
  border: 1px solid rgba(31, 64, 55, 0.2);
  border-radius: 10px;
  font-size: 14px;
  background: #fbfdf9;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #1f4037;
  background: white;
  box-shadow: 0 0 0 3px rgba(136, 192, 87, 0.18);
}

:root.dark .search-input {
  background: #1a211e;
  border-color: #2a3a32;
  color: #f3f4f6;
}

:root.dark .search-input:focus {
  border-color: #88c057;
  background: #141a18;
}

.clear-button {
  position: absolute;
  right: 8px;
  padding: 4px;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.clear-button:hover {
  color: #1f4037;
  background: #edf3e6;
}

:root.dark .clear-button:hover {
  background: #27312c;
  color: #d8e7cc;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: #6b7c6a;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e3e8dc;
  border-top-color: #88c057;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-icon {
  color: #c8d5be;
  margin-bottom: 16px;
}

:root.dark .empty-icon {
  color: #3a4a41;
}

.empty-state h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1f4037;
  margin: 0 0 8px 0;
}

:root.dark .empty-state h3 {
  color: #cfe6be;
}

.empty-state p {
  font-size: 14px;
  color: #7a8a75;
  margin: 0;
  max-width: 280px;
  line-height: 1.5;
}

:root.dark .empty-state p {
  color: #9aa896;
}

/* Card Grid */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  padding: 16px;
}
</style>
