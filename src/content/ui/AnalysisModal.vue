<script setup lang="ts">
import { X, ExternalLink } from 'lucide-vue-next'
import AnalysisResult from '@/components/Analysis/AnalysisResult.vue'
import TokenDetail from '@/components/Analysis/TokenDetail.vue'
import type { AnalysisData } from '@/stores/ai-store'

interface Props {
  visible: boolean
  analysisData: AnalysisData | null
  isStreaming: boolean
  // Q&A state from parent (for content script mode)
  selectedToken?: any
  qaHistory?: { question: string, answer: string }[]
  isQaStreaming?: boolean
  qaStreamText?: string
  // Rapid Translation state
  rapidTranslationText?: string
  isRapidTranslating?: boolean
  rapidTranslationError?: string
  // Token Detail Rapid Query state
  tokenDetailData?: any
  isTokenDetailLoading?: boolean
  tokenDetailError?: string
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'open-sidebar'): void
  (e: 'select-token', token: any): void
  (e: 'back'): void
  (e: 'ask-question', question: string): void
}>()
</script>

<template>
  <div v-if="visible" class="absolute inset-0 z-[100000] flex items-center justify-center pointer-events-none">
    <!-- Backdrop (Optional, maybe specific to modal area to allow clicking outside) -->
    <!-- We use pointer-events-none on container and pointer-events-auto on modal to allow clicking through background -->
    
    <div 
        class="relative w-full max-w-lg max-h-[85vh] bg-rice-paper dark:bg-[#111815] rounded-2xl shadow-2xl border border-matcha/20 dark:border-[#243128] pointer-events-auto animate-in zoom-in-95 duration-200"
    >
        <!-- Header -->
        <div class="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-rice-paper/80 dark:bg-[#111815]/80 backdrop-blur-sm border-b border-matcha/20 dark:border-[#243128]">
            <h3 class="text-sm font-bold text-deep-tea dark:text-rice-paper flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-matcha"></span>
                智能分析
            </h3>
            
            <div class="flex items-center gap-1">
                <button 
                    @click="$emit('open-sidebar')"
                    class="p-1.5 text-charcoal/60 hover:text-deep-tea hover:bg-matcha/10 dark:text-matcha/70 dark:hover:bg-deep-tea/40 rounded-lg transition-colors"
                    title="在侧边栏打开"
                >
                    <ExternalLink class="w-4 h-4" />
                </button>
                <button 
                    @click="$emit('close')"
                    class="p-1.5 text-charcoal/60 hover:text-rose-500 hover:bg-rose-50 dark:text-matcha/70 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                >
                    <X class="w-4 h-4" />
                </button>
            </div>
        </div>

        <!-- Content -->
        <div class="p-4 flex flex-col">
            <!-- Rapid Translation Section (Top Priority Display) - Only show when NOT viewing token detail -->
            <div 
                v-if="!selectedToken && (rapidTranslationText || isRapidTranslating || rapidTranslationError)" 
                class="mb-4 p-3 bg-matcha/10 dark:bg-deep-tea/30 border border-matcha/30 dark:border-deep-tea/50 rounded-lg"
            >
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-deep-tea/80 dark:text-matcha">⚡</span>
                    <h4 class="text-xs font-semibold text-deep-tea dark:text-matcha">快速翻译</h4>
                </div>
                
                <!-- Loading State -->
                <div v-if="isRapidTranslating && !rapidTranslationText" class="flex items-center gap-2 text-xs text-deep-tea/80 dark:text-matcha/80">
                    <div class="w-3 h-3 border-2 border-deep-tea/70 border-t-transparent rounded-full animate-spin"></div>
                    <span>翻译中...</span>
                </div>
                
                <!-- Translation Result -->
                <p v-else-if="rapidTranslationText" class="text-sm text-deep-tea/90 dark:text-rice-paper/90 leading-relaxed">
                    {{ rapidTranslationText }}
                </p>
                
                <!-- Error State -->
                <p v-else-if="rapidTranslationError" class="text-xs text-rose-600 dark:text-rose-400">
                    ⚠️ {{ rapidTranslationError }}（不影响深度分析）
                </p>
            </div>

            <!-- Main Analysis View -->
            <div v-show="!selectedToken" class="animate-in fade-in zoom-in-95 duration-200">
                <AnalysisResult 
                    :data="analysisData" 
                    :is-loading="isStreaming" 
                    @select-token="$emit('select-token', $event)"
                />
                
                 <!-- Error/Empty State fallback -->
                 <div v-if="!isStreaming && !analysisData" class="flex flex-col items-center justify-center py-8 text-charcoal/50 dark:text-matcha/50">
                    <p class="text-xs">暂无分析结果</p>
                </div>
            </div>

            <!-- Token Detail View -->
            <TokenDetail 
                v-if="selectedToken" 
                :external-selected-token="selectedToken"
                :external-qa-history="qaHistory"
                :external-is-qa-streaming="isQaStreaming"
                :external-qa-stream-text="qaStreamText"
                :token-detail-data="tokenDetailData"
                :is-token-detail-loading="isTokenDetailLoading"
                :token-detail-error="tokenDetailError"
                @back="$emit('back')"
                @ask-question="$emit('ask-question', $event)"
            />
        </div>
    </div>
  </div>
</template>
