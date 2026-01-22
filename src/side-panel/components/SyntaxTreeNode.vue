<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronRight, ChevronDown, Circle } from 'lucide-vue-next'
import type { SyntaxNode } from '@/stores/ai-store'

interface SyntaxTreeNodeData extends SyntaxNode {
    id: string
    children: SyntaxTreeNodeData[]
}

const props = defineProps<{
    node: SyntaxTreeNodeData
    depth: number
    activeNodeIds?: Set<string>
    onHover?: (id: string | null) => void
}>()

const isOpen = ref(true)
const hasChildren = computed(() => props.node.children && props.node.children.length > 0)

function toggle() {
    if (hasChildren.value) {
        isOpen.value = !isOpen.value
    }
}

// Dynamic indentation style
const indentStyle = computed(() => ({
    paddingLeft: `${props.depth * 12}px`
}))

// Color coding for roles
const roleColor = computed(() => {
    const role = props.node.role
    if (role.includes('主语')) return 'text-rose-500 bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30'
    if (role.includes('谓语')) return 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30'
    if (role.includes('宾语')) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30'
    if (role.includes('修饰')) return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30'
    return 'text-gray-500 bg-gray-50 dark:bg-zinc-800 border-gray-100 dark:border-zinc-700'
})

const isHighlighted = computed(() => props.activeNodeIds?.has(props.node.id) ?? false)

const highlightClass = computed(() => {
    return isHighlighted.value
        ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-200/80 dark:ring-indigo-700/40'
        : ''
})

function handleHover(id: string | null) {
    props.onHover?.(id)
}
</script>

<template>
    <div class="syntax-node select-none">
        
        <!-- Node Content -->
        <div 
            class="flex items-center gap-2 py-1.5 px-2 hover:bg-gray-100 dark:hover:bg-zinc-800/50 rounded-lg cursor-pointer transition-colors group"
            :class="highlightClass"
            :style="indentStyle"
            @click="toggle"
            @mouseenter="handleHover(node.id)"
            @mouseleave="handleHover(null)"
        >
            <!-- Toggle Icon / Spacer -->
            <div class="w-4 h-4 flex items-center justify-center shrink-0">
                <component 
                    v-if="hasChildren" 
                    :is="isOpen ? ChevronDown : ChevronRight" 
                    class="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                />
                <Circle 
                    v-else 
                    class="w-1.5 h-1.5 text-gray-300 dark:text-gray-600 fill-current" 
                />
            </div>

            <!-- Token & Meta -->
            <div class="flex items-baseline gap-2 min-w-0 flex-1">
                 <!-- Main Token -->
                <span class="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {{ node.token }}
                </span>
                
                <!-- Role Badge -->
                <span 
                    class="text-[10px] px-1.5 py-0.5 rounded border font-medium truncate shrink-0"
                    :class="roleColor"
                >
                    {{ node.role }}
                </span>

                <!-- POS (faded) -->
                <span class="text-[10px] text-gray-400 dark:text-gray-500 truncate shrink-0">
                    {{ node.partOfSpeech }}
                </span>
            </div>
        </div>

        <!-- Recursive Children -->
        <div v-if="hasChildren && isOpen" class="relative">
             <!-- Guide Line -->
            <div 
                class="absolute left-0 top-0 bottom-0 border-l border-gray-100 dark:border-zinc-800"
                :style="{ left: `${(depth + 1) * 12 - 4}px` }"
            ></div>

            <SyntaxTreeNode 
                v-for="(child, index) in node.children" 
                :key="index" 
                :node="child"
                :depth="depth + 1"
                :active-node-ids="activeNodeIds"
                :on-hover="onHover"
            />
        </div>

    </div>
</template>
