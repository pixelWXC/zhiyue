<script setup lang="ts">
import { ref } from 'vue'
import { Sparkles } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'analyze'): void
  (e: 'explain'): void
  (e: 'close'): void
}>()

defineProps<{
  visible: boolean
  x: number
  y: number
  hasApiKey?: boolean
}>()

// 悬浮状态
const isExpanded = ref(false)
</script>

<template>
  <div
    v-show="visible"
    class="fixed z-[99999] pointer-events-auto"
    :style="{
      left: `${x}px`,
      top: `${y}px`,
      transform: 'translate(-100%, 8px)',
    }"
    @mouseenter="isExpanded = true"
    @mouseleave="isExpanded = false"
  >
    <div
      class="flex items-center gap-3 px-1.5 py-1.5 shadow-lg transition-all duration-500 ease-in-out"
      :class="{ 'pr-3': isExpanded }"
      :style="{
        width: isExpanded ? 'auto' : '40px',
        height: '40px',
        borderRadius: isExpanded ? '9999px' : '50%',
        background: hasApiKey ? 'linear-gradient(135deg, rgb(59, 130, 246), rgb(79, 70, 229))' : 'linear-gradient(135deg, rgb(245, 158, 11), rgb(234, 88, 12))',
      }"
    >
      <!-- Logo 图标 -->
      <div class="w-7 h-7 flex items-center justify-center flex-shrink-0">
        <Sparkles class="w-5 h-5 text-white" />
      </div>

      <!-- 展开的按钮组 -->
      <div
        class="flex items-center gap-2 overflow-hidden transition-all duration-500 ease-in-out"
        :class="isExpanded ? 'opacity-100 scale-100 delay-100' : 'opacity-0 scale-95 delay-0'"
        :style="{
          width: isExpanded ? 'auto' : '0px',
        }"
      >
        <template v-if="hasApiKey">
            <!-- 分析按钮 -->
            <button
            @click="$emit('analyze')"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white hover:bg-white hover:text-indigo-600 hover:shadow-md transition-all duration-300 ease-out whitespace-nowrap text-sm font-medium"
            >
            <span>快捷分析</span>
            </button>

            <!-- 解释按钮 -->
            <button
            @click="$emit('explain')"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white hover:bg-white hover:text-indigo-600 hover:shadow-md transition-all duration-300 ease-out whitespace-nowrap text-sm font-medium"
            >
            <span>深度分析</span>
            </button>
        </template>
        
        <template v-else>
             <!-- 配置按钮 -->
            <div class="flex items-center gap-2">
                 <span class="text-xs text-white/90 whitespace-nowrap font-medium">未配置 API Key</span>
                 <button
                    @click="$emit('analyze')"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white hover:text-orange-600 text-white transition-all duration-300 ease-out whitespace-nowrap text-sm font-medium"
                    >
                    <span>去配置</span>
                 </button>
            </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 确保动画流畅 */
.delay-100 {
  transition-delay: 100ms;
}

.delay-0 {
  transition-delay: 0ms;
}
</style>
