<script setup lang="ts">
import { ref } from 'vue'
import { pingBackground, getSettings, updateSettings } from '../lib/ipc'

// Test state
const testMessage = ref('Hello from Side Panel!')
const testResult = ref('')
const isLoading = ref(false)

// Settings state
const settings = ref<{ apiKey?: string; theme?: string }>({})

/**
 * Test ping-pong communication
 */
async function testPing() {
  isLoading.value = true
  testResult.value = '发送中...'
  
  try {
    const response = await pingBackground(testMessage.value)
    testResult.value = `✅ 成功！\n响应: ${response.pong}\n延迟: ${Date.now() - response.receivedAt}ms`
  } catch (error) {
    testResult.value = `❌ 错误: ${error}`
  } finally {
    isLoading.value = false
  }
}

/**
 * Test settings retrieval
 */
async function testGetSettings() {
  isLoading.value = true
  testResult.value = '读取中...'
  
  try {
    const result = await getSettings()
    settings.value = result
    testResult.value = `✅ 设置已加载:\n${JSON.stringify(result, null, 2)}`
  } catch (error) {
    testResult.value = `❌ 错误: ${error}`
  } finally {
    isLoading.value = false
  }
}

/**
 * Test settings update
 */
async function testUpdateSettings() {
  isLoading.value = true
  testResult.value = '保存中...'
  
  try {
    const result = await updateSettings({
      theme: 'dark',
      apiKey: 'test-key-' + Date.now()
    })
    
    if (result.success) {
      testResult.value = '✅ 设置已保存'
      // Reload settings to confirm
      await testGetSettings()
    }
  } catch (error) {
    testResult.value = `❌ 错误: ${error}`
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="p-6 max-w-2xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-blue-600">Zhiyue Side Panel</h1>
      <p class="mt-2 text-gray-600">IPC Bridge 测试控制台 (Story 1-2)</p>
    </div>

    <!-- Ping Test Section -->
    <div class="mb-6 p-4 border border-gray-200 rounded-lg">
      <h2 class="text-xl font-semibold mb-3">🏓 Ping 测试</h2>
      <div class="space-y-3">
        <input
          v-model="testMessage"
          type="text"
          placeholder="输入测试消息"
          class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          @click="testPing"
          :disabled="isLoading"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {{ isLoading ? '发送中...' : '发送 Ping' }}
        </button>
      </div>
    </div>

    <!-- Settings Test Section -->
    <div class="mb-6 p-4 border border-gray-200 rounded-lg">
      <h2 class="text-xl font-semibold mb-3">⚙️ 设置测试</h2>
      <div class="space-y-3">
        <button
          @click="testGetSettings"
          :disabled="isLoading"
          class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed mr-2"
        >
          读取设置
        </button>
        <button
          @click="testUpdateSettings"
          :disabled="isLoading"
          class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          保存测试设置
        </button>
      </div>
    </div>

    <!-- Result Display -->
    <div class="p-4 bg-gray-50 rounded-lg">
      <h3 class="font-semibold mb-2">测试结果:</h3>
      <pre class="text-sm whitespace-pre-wrap font-mono text-gray-800">{{ testResult || '等待测试...' }}</pre>
    </div>

    <!-- Info -->
    <div class="mt-6 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
      <strong>ℹ️ 说明:</strong> 此页面用于测试 Side Panel 与 Background Script 之间的 webext-bridge 通信。
      点击按钮验证消息收发是否正常工作。
    </div>
  </div>
</template>
