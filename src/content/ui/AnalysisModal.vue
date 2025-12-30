<script setup lang="ts">
import { X, ExternalLink } from 'lucide-vue-next'
import AnalysisResult from '@/components/Analysis/AnalysisResult.vue'
import type { AnalysisData } from '@/stores/ai-store'

defineProps<{
  visible: boolean
  analysisData: AnalysisData | null
  isStreaming: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'open-sidebar'): void
}>()
</script>

<template>
  <div v-if="visible" class="absolute inset-0 z-[100000] flex items-center justify-center pointer-events-none">
    <!-- Backdrop (Optional, maybe specific to modal area to allow clicking outside) -->
    <!-- We use pointer-events-none on container and pointer-events-auto on modal to allow clicking through background -->
    
    <div 
        class="relative w-full max-w-lg max-h-[85vh] bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 pointer-events-auto animate-in zoom-in-95 duration-200"
    >
        <!-- Header -->
        <div class="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-100 dark:border-zinc-800/50">
            <h3 class="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                智能分析
            </h3>
            
            <div class="flex items-center gap-1">
                <button 
                    @click="$emit('open-sidebar')"
                    class="p-1.5 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                    title="在侧边栏打开"
                >
                    <ExternalLink class="w-4 h-4" />
                </button>
                <button 
                    @click="$emit('close')"
                    class="p-1.5 text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                >
                    <X class="w-4 h-4" />
                </button>
            </div>
        </div>

        <!-- Content -->
        <div class="p-4">
            <AnalysisResult :data="analysisData" :is-loading="isStreaming" />
            
             <!-- Error/Empty State fallback (if needed, though AnalysisResult handles loading) -->
             <div v-if="!isStreaming && !analysisData" class="flex flex-col items-center justify-center py-8 text-zinc-400">
                <p class="text-xs">暂无分析结果</p>
            </div>
        </div>
    </div>
  </div>
</template>
