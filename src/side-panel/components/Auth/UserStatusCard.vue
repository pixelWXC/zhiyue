<script setup lang="ts">
import { computed } from 'vue'
import { User, LogOut, Zap, BarChart3, Crown } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth-store'

const authStore = useAuthStore()

// Quota bar color based on usage percentage
const quotaBarColor = computed(() => {
  const percentage = authStore.quotaInfo?.percentage || 0
  if (percentage >= 90) return 'bg-red-500'
  if (percentage >= 70) return 'bg-amber-500'
  return 'bg-matcha'
})

// Format token count - 直接显示次数，不使用 K/M 单位
function formatTokens(tokens: number): string {
  return tokens.toLocaleString()
}

/**
 * Handle logout
 */
async function handleLogout() {
  await authStore.logout()
}
</script>

<template>
  <div class="p-4 bg-gradient-to-br from-matcha/10 to-deep-tea/10 dark:from-matcha/20 dark:to-deep-tea/20 rounded-xl border border-matcha/30 dark:border-[#2a3a32]">
    <!-- User Info -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="p-2.5 bg-deep-tea/10 dark:bg-matcha/20 rounded-full">
          <User class="w-5 h-5 text-deep-tea dark:text-matcha" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-semibold text-charcoal dark:text-gray-100">
              你好，用户{{ authStore.authUser?.username || 'xxx' }}
            </span>
            <span 
              v-if="authStore.isAdmin"
              class="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full flex items-center gap-1"
            >
              <Crown class="w-3 h-3" />
              管理员
            </span>
          </div>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            官方配额已激活
          </span>
        </div>
      </div>
      <button
        @click="handleLogout"
        class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
        title="退出登录"
      >
        <LogOut class="w-4 h-4" />
      </button>
    </div>

    <!-- Quota Status -->
    <div v-if="authStore.quotaInfo" class="space-y-2">
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
          <Zap class="w-4 h-4" />
          <span>配额使用</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="font-medium text-charcoal dark:text-gray-100">
            {{ formatTokens(authStore.quotaInfo.used) }}
          </span>
          <span class="text-gray-400">/</span>
          <span class="text-gray-500 dark:text-gray-400">
            {{ formatTokens(authStore.quotaInfo.limit) }}
          </span>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="h-2 bg-gray-200 dark:bg-[#1a2420] rounded-full overflow-hidden">
        <div 
          :class="['h-full transition-all duration-500', quotaBarColor]"
          :style="{ width: `${Math.min(authStore.quotaInfo.percentage, 100)}%` }"
        />
      </div>

      <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>剩余 {{ formatTokens(authStore.quotaInfo.remaining) }} 次</span>
        <span>{{ authStore.quotaInfo.percentage }}% 已使用</span>
      </div>
    </div>

    <!-- Quick Stats (placeholder) -->
    <div class="mt-4 pt-4 border-t border-matcha/20 dark:border-[#2a3a32]">
      <button 
        class="w-full flex items-center justify-center gap-2 py-2 text-sm text-deep-tea dark:text-matcha hover:bg-matcha/10 dark:hover:bg-deep-tea/20 rounded-lg transition-colors"
      >
        <BarChart3 class="w-4 h-4" />
        <span>查看使用统计</span>
      </button>
    </div>
  </div>
</template>
