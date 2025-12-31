<script setup lang="ts">
import type { SyntaxNode } from '@/stores/ai-store'
import SyntaxTreeNode from './SyntaxTreeNode.vue'
// import { Network, Maximize, Minimize } from 'lucide-vue-next'

const props = defineProps<{
    data: SyntaxNode
    isLoading?: boolean
}>()

</script>

<template>
    <div class="syntax-tree-container">
        <!-- Toolbar (Optional, placeholder for future actions like expand all) -->
        <!-- 
        <div class="flex items-center justify-end px-4 py-2 border-b border-gray-100 dark:border-zinc-800">
             <button class="p-1 hover:bg-gray-100 rounded">
                <Maximize class="w-3 h-3 text-gray-400" />
             </button>
        </div>
        -->

        <div class="p-2">
            <SyntaxTreeNode 
                :node="data" 
                :depth="0" 
            />
        </div>
    </div>
</template>
