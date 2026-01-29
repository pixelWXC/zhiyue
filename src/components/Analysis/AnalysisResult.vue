<script setup lang="ts">
import { computed } from 'vue'
import type { AnalysisData } from '@/stores/ai-store'

const props = defineProps<{
  data: AnalysisData | null
  isLoading?: boolean
  showMagicCard?: boolean
}>()

const emit = defineEmits<{
  (e: 'select-token', token: any): void
  (e: 'generate-card'): void
  (e: 'generate-sentence-card'): void
}>()

const tokens = computed(() => props.data?.tokens || [])
const translation = computed(() => props.data?.translation || '')

// POS Color mapping - Using premium palette
const getPosColor = (pos: string) => {
  // Add null check to prevent errors
  if (!pos) return 'border-indigo-500 dark:border-indigo-400'
  
  // Simple substring check for Chinese POS tags
  if (pos.includes('动词')) return 'border-rose-500 dark:border-rose-400'
  if (pos.includes('名词')) return 'border-sky-500 dark:border-sky-400'
  if (pos.includes('形容')) return 'border-emerald-500 dark:border-emerald-400' // Matches 形容词 and 形容动词
  if (pos.includes('助词')) return 'border-zinc-300 dark:border-zinc-600'
  if (pos.includes('副词')) return 'border-violet-500 dark:border-violet-400'
  if (pos.includes('接续')) return 'border-amber-500 dark:border-amber-400'
  return 'border-indigo-500 dark:border-indigo-400'
}
</script>

<template>
  <div class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
    <!-- Tokens Grid -->
    <div v-if="tokens.length > 0" class="flex flex-wrap gap-x-2 gap-y-2 items-end">
      <div
        v-for="(token, index) in tokens"
        :key="index"
        class="group/token relative flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
        @click="$emit('select-token', token)"
      >
        <!-- Ruby (Reading) - Always Visible -->
        <!-- Adjusted text color for better readability in both modes -->
        <span class="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium mb-0.5 select-none leading-none tracking-wide">
          {{ token.reading || '　' }}
        </span>
        
        <!-- Word with colored underline -->
        <div 
            class="px-0.5 pb-0.5 border-b-[2.5px] transition-all duration-300 hover:bg-matcha/10 dark:hover:bg-zinc-800/80 rounded-t"
            :class="[getPosColor(token.pos)]"
        >
            <span class="text-lg font-bold text-charcoal dark:text-zinc-100 leading-tight">
            {{ token.word }}
            </span>
        </div>

        <!-- Tooltip (Romaji & Detailed POS & Click Hint) -->
        <!-- Enhanced glassmorphism heavy tooltip -->
        <div class="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max max-w-[220px] px-3 py-2.5 bg-deep-tea/95 dark:bg-black/95 backdrop-blur-sm text-white text-xs rounded-xl shadow-2xl opacity-0 group-hover/token:opacity-100 transition-all duration-200 transform -translate-y-2 group-hover/token:translate-y-0 pointer-events-none z-50 border border-matcha/20 dark:border-zinc-700/50">
          
          <div class="flex items-center justify-between gap-3 mb-1.5 border-b border-zinc-700/50 pb-1">
             <span v-if="token.romaji" class="font-mono text-zinc-300 text-[11px]">{{ token.romaji }}</span>
             <span v-if="token.pos" class="font-bold text-sky-300 text-[10px] px-1.5 py-0.5 bg-sky-500/10 rounded">{{ token.pos }}</span>
          </div>

          <div v-if="token.meaning" class="text-rice-paper/90 leading-normal">{{ token.meaning }}</div>
          <div v-else class="text-rice-paper/60 italic text-[10px] flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-matcha animate-pulse"></span>
            点击详情 / 提问
          </div>
          
          <!-- Triangle -->
          <div class="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-deep-tea/95 dark:border-b-black/95"></div>
        </div>
      </div>
    </div>
    
    <!-- Empty State / Loading Skeleton -->
    <div v-else-if="isLoading" class="flex flex-wrap gap-2">
        <div v-for="i in 3" :key="i" class="h-14 w-20 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg animate-pulse"></div>
    </div>

    <!-- Translation -->
    <!-- Premium Card Design -->
    <div v-if="translation" class="relative overflow-hidden bg-gradient-to-br from-rice-paper to-white dark:from-zinc-900/80 dark:to-zinc-900 p-5 rounded-2xl border border-matcha/20 dark:border-zinc-800/50 shadow-sm group hover:shadow-md transition-shadow duration-300">
      <div class="absolute top-0 right-0 w-32 h-32 bg-matcha/10 dark:bg-sky-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
      
      <h3 class="text-[10px] font-bold text-charcoal/40 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
        <span class="w-1 h-4 rounded-full bg-deep-tea"></span>
        译文
      </h3>
      <p class="text-sm text-charcoal dark:text-zinc-300 leading-loose font-medium">{{ translation }}</p>
    </div>

    <!-- Magic Card Generation Button -->
    <!-- <button
      v-if="tokens.length > 0 && !isLoading && showMagicCard"
      @click="$emit('generate-card')"
      class="w-full mt-4 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover:rotate-12 transition-transform">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="M7 15h0M2 9.5h20"/>
      </svg>
      生成魔法卡片
    </button> -->

    <!-- Sentence Magic Card Button -->
    <button
      v-if="tokens.length > 0 && !isLoading && showMagicCard"
      @click="$emit('generate-sentence-card')"
      class="w-full mt-3 px-6 py-3 bg-gradient-to-r from-matcha to-deep-tea hover:from-matcha/90 hover:to-deep-tea/90 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover:scale-110 transition-transform">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      生成记忆卡片
    </button>
  </div>
</template>
