<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { SyntaxNode } from '@/stores/ai-store'
import SyntaxTreeNode from './SyntaxTreeNode.vue'
// import { Network, Maximize, Minimize } from 'lucide-vue-next'

type SyntaxNodeWithId = Omit<SyntaxNode, 'children'> & { id: string; children: SyntaxNodeWithId[] }

interface TokenMatch {
    nodeId: string
    start: number
    end: number
}

interface SentenceSegment {
    text: string
    nodeId?: string
}

const props = defineProps<{
    data: SyntaxNode
    sentence?: string
    isLoading?: boolean
}>()

const hoveredNodeId = ref<string | null>(null)
const hoveredSentenceNodeId = ref<string | null>(null)

const sentenceText = computed(() => props.sentence ?? '')
const isBusy = computed(() => Boolean(props.isLoading))

function handleNodeHover(id: string | null) {
    hoveredNodeId.value = id
}

function handleSentenceHover(id: string | null) {
    hoveredSentenceNodeId.value = id
}

watch(
    () => [props.data, props.sentence],
    () => {
        hoveredNodeId.value = null
        hoveredSentenceNodeId.value = null
    }
)

function assignIds(node: SyntaxNode, path: string): SyntaxNodeWithId {
    return {
        ...node,
        id: path,
        children: (node.children || []).map((child, index) => assignIds(child, `${path}-${index}`))
    }
}

function flattenTree(node: SyntaxNodeWithId): SyntaxNodeWithId[] {
    const nodes: SyntaxNodeWithId[] = []
    const visit = (current: SyntaxNodeWithId) => {
        nodes.push(current)
        current.children.forEach(visit)
    }
    visit(node)
    return nodes
}

function buildTokenMatches(sentence: string, nodes: SyntaxNodeWithId[]): TokenMatch[] {
    if (!sentence) return []

    const remaining = nodes
        .map((node) => ({ node, token: (node.token || '').trim() }))
        .filter((entry) => entry.token.length > 0)

    const matches: TokenMatch[] = []
    let cursor = 0

    while (cursor < sentence.length && remaining.length > 0) {
        let bestIndex = -1
        let bestToken = ''

        for (let i = 0; i < remaining.length; i += 1) {
            const entry = remaining[i]
            if (!entry) continue
            
            const token = entry.token
            if (sentence.startsWith(token, cursor)) {
                if (token.length > bestToken.length) {
                    bestToken = token
                    bestIndex = i
                }
            }
        }

        if (bestIndex >= 0) {
            const match = remaining[bestIndex]
            if (match) {
                matches.push({
                    nodeId: match.node.id,
                    start: cursor,
                    end: cursor + bestToken.length
                })
                remaining.splice(bestIndex, 1)
                cursor += bestToken.length
            } else {
                cursor += 1 // Should not happen if logic is correct
            }
        } else {
            cursor += 1
        }
    }

    return matches
}

function buildSentenceSegments(sentence: string, matches: TokenMatch[]): SentenceSegment[] {
    if (!sentence) return []
    if (!matches.length) return [{ text: sentence }]

    const ordered = [...matches].sort((a, b) => a.start - b.start)
    const segments: SentenceSegment[] = []
    let cursor = 0

    ordered.forEach((match) => {
        if (match.start > cursor) {
            segments.push({ text: sentence.slice(cursor, match.start) })
        }
        segments.push({
            text: sentence.slice(match.start, match.end),
            nodeId: match.nodeId
        })
        cursor = match.end
    })

    if (cursor < sentence.length) {
        segments.push({ text: sentence.slice(cursor) })
    }

    return segments
}

const treeWithIds = computed(() => assignIds(props.data, '0'))

const flatNodes = computed(() => flattenTree(treeWithIds.value))

const nodeIdToSubtreeIds = computed(() => {
    const map = new Map<string, Set<string>>()

    const visit = (node: SyntaxNodeWithId): Set<string> => {
        const ids = new Set<string>([node.id])
        node.children.forEach((child) => {
            const childIds = visit(child)
            childIds.forEach((childId) => ids.add(childId))
        })
        map.set(node.id, ids)
        return ids
    }

    visit(treeWithIds.value)
    return map
})

const activeNodeId = computed(() => hoveredNodeId.value ?? hoveredSentenceNodeId.value)
const emptySet = new Set<string>()

const activeNodeIds = computed(() => {
    const id = activeNodeId.value
    if (!id) return emptySet
    return nodeIdToSubtreeIds.value.get(id) || emptySet
})

const sentenceSegments = computed<SentenceSegment[]>(() => {
    const sentence = sentenceText.value
    if (!sentence) return []
    const matches = buildTokenMatches(sentence, flatNodes.value)
    return buildSentenceSegments(sentence, matches)
})
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

        <div v-if="isBusy" class="flex items-center gap-2 px-3 py-2 text-[10px] text-indigo-600 dark:text-indigo-400">
            <span class="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
            正在生成语法树...
        </div>

        <div class="p-2 space-y-3" :class="isBusy ? 'opacity-60 pointer-events-none' : ''">
            <div v-if="sentenceText" class="rounded-lg border border-gray-100 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-900/40 px-3 py-2.5">
                <div class="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500">原句</div>
                <div class="mt-2 text-sm leading-relaxed text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    <template v-for="(segment, index) in sentenceSegments" :key="index">
                        <span
                            v-if="segment.nodeId"
                            class="inline-block rounded px-0.5 transition-colors cursor-pointer"
                            :class="activeNodeIds.has(segment.nodeId)
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200'
                                : 'text-gray-800 dark:text-gray-100 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'"
                            @mouseenter="handleSentenceHover(segment.nodeId)"
                            @mouseleave="handleSentenceHover(null)"
                        >
                            {{ segment.text }}
                        </span>
                        <span v-else>{{ segment.text }}</span>
                    </template>
                </div>
                <div class="mt-2 text-[10px] text-gray-400 dark:text-gray-500">悬停词语或节点，可联动高亮</div>
            </div>

            <SyntaxTreeNode 
                :node="treeWithIds" 
                :depth="0"
                :active-node-ids="activeNodeIds"
                :on-hover="handleNodeHover"
            />
        </div>
    </div>
</template>
