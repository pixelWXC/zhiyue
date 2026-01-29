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
    if (role.includes('主语')) return 'text-deep-tea bg-matcha/20 dark:bg-deep-tea/40 border-matcha/30 dark:border-deep-tea/60'
    if (role.includes('谓语')) return 'text-deep-tea bg-deep-tea/10 dark:bg-deep-tea/30 border-deep-tea/20 dark:border-deep-tea/60'
    if (role.includes('宾语')) return 'text-deep-tea bg-rice-paper dark:bg-[#17201c] border-matcha/20 dark:border-deep-tea/50'
    if (role.includes('修饰')) return 'text-deep-tea bg-matcha/10 dark:bg-deep-tea/20 border-matcha/20 dark:border-deep-tea/50'
    return 'text-charcoal/70 bg-rice-paper/70 dark:bg-[#17201c] border-matcha/10 dark:border-deep-tea/40'
})

const isHighlighted = computed(() => props.activeNodeIds?.has(props.node.id) ?? false)

const highlightClass = computed(() => {
    return isHighlighted.value
        ? 'bg-matcha/10 dark:bg-deep-tea/30 ring-1 ring-matcha/30 dark:ring-matcha/30'
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
            class="flex items-center gap-2 py-1.5 px-2 hover:bg-matcha/10 dark:hover:bg-deep-tea/40 rounded-lg cursor-pointer transition-colors group"
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
                    class="w-3.5 h-3.5 text-charcoal/40 group-hover:text-deep-tea dark:text-matcha/50 dark:group-hover:text-matcha"
                />
                <Circle 
                    v-else 
                    class="w-1.5 h-1.5 text-matcha/30 dark:text-matcha/40 fill-current" 
                />
            </div>

            <!-- Token & Meta -->
            <div class="flex items-baseline gap-2 min-w-0 flex-1">
                 <!-- Main Token -->
                <span class="font-medium text-deep-tea dark:text-rice-paper truncate">
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
                <span class="text-[10px] text-charcoal/50 dark:text-matcha/60 truncate shrink-0">
                    {{ node.partOfSpeech }}
                </span>
            </div>
        </div>

        <!-- Recursive Children -->
        <div v-if="hasChildren && isOpen" class="relative">
             <!-- Guide Line -->
            <div 
                class="absolute left-0 top-0 bottom-0 border-l border-matcha/20 dark:border-deep-tea/50"
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
