<script setup lang="ts">
import { ref, computed, watch } from "vue";
import {
  Cpu,
  Key,
  Zap,
  Sparkles,
  Check,
} from "lucide-vue-next";
import { useModelConfig } from "@/logic/storage";
import {
  PRESET_MODELS,
  type ProviderName,
  type ModelSelection,
} from "@/types/model-config";

const { providerCredentials, sceneConfig } = useModelConfig();

// 供应商配置展开状态


// 临时输入值
const apiKeyInputs = ref<Record<ProviderName, string>>({
  gemini: "",
  openai: "",
  doubao: "",
  deepseek: "",
});

const openaiBaseUrl = ref("");

// 已启用的供应商列表
const enabledProviders = computed(() => {
  const providers: ProviderName[] = [];
  if (providerCredentials.value?.gemini?.apiKey) providers.push("gemini");
  if (providerCredentials.value?.openai?.apiKey) providers.push("openai");
  if (providerCredentials.value?.doubao?.apiKey) providers.push("doubao");
  if (providerCredentials.value?.deepseek?.apiKey) providers.push("deepseek");
  return providers;
});

// 获取供应商可用的模型列表
function getTextModels(provider: ProviderName) {
  return PRESET_MODELS[provider]?.text || [];
}

function getImageModels(provider: ProviderName) {
  return PRESET_MODELS[provider]?.image || [];
}


// 保存供应商凭证
async function saveProviderCredential(provider: ProviderName) {
  const current = JSON.parse(JSON.stringify(providerCredentials.value || {}));
  const wasFirstProvider = enabledProviders.value.length === 0;

  if (provider === "openai") {
    current.openai = {
      apiKey: apiKeyInputs.value.openai,
      baseUrl: openaiBaseUrl.value || undefined,
    };
  } else {
    current[provider] = { apiKey: apiKeyInputs.value[provider] };
  }

  providerCredentials.value = current;

  // 检查是否需要自动更新场景配置
  const hasNewKey = provider === "openai" 
    ? !!apiKeyInputs.value.openai 
    : !!apiKeyInputs.value[provider];
  
  if (hasNewKey) {
    // 情况1: 首次配置供应商
    // 情况2: 当前场景配置使用的供应商没有有效密钥
    const shouldAutoConfigure = wasFirstProvider || !isCurrentSceneConfigValid(current);
    
    if (shouldAutoConfigure) {
      autoConfigureScenes(provider);
    }
  }
}

// 检查当前场景配置使用的供应商是否都有有效密钥
function isCurrentSceneConfigValid(credentials: Record<string, any>): boolean {
  const config = sceneConfig.value;
  if (!config) return false;

  // 检查所有场景使用的供应商是否都有密钥
  const providersInUse = new Set<ProviderName>();
  
  if (config.qualityFirst?.text?.provider) {
    providersInUse.add(config.qualityFirst.text.provider);
  }
  if (config.qualityFirst?.image?.provider) {
    providersInUse.add(config.qualityFirst.image.provider);
  }
  if (config.speedFirst?.text?.provider) {
    providersInUse.add(config.speedFirst.text.provider);
  }

  // 检查每个使用中的供应商是否有有效密钥
  for (const p of providersInUse) {
    if (!credentials[p]?.apiKey) {
      return false;
    }
  }

  return true;
}

// 自动配置场景（首次配置供应商时调用）
function autoConfigureScenes(provider: ProviderName) {
  const textModels = getTextModels(provider);
  const imageModels = getImageModels(provider);
  
  if (textModels.length === 0) return;

  const currentConfig = JSON.parse(JSON.stringify(sceneConfig.value));
  
  // 为 qualityFirst 和 speedFirst 场景选择合适的模型
  // 通常第一个是快速模型，第二个（如果有）是高质量模型
  const speedModel = textModels[0];
  const qualityModel = textModels.length > 1 ? textModels[1] : textModels[0];

  if (speedModel && qualityModel) {
    currentConfig.qualityFirst.text = { provider, model: qualityModel.id };
    currentConfig.speedFirst.text = { provider, model: speedModel.id };
  }
  
  // 如果有图像模型，也配置图像场景
  if (imageModels.length > 0 && imageModels[0]) {
    currentConfig.qualityFirst.image = { provider, model: imageModels[0].id };
  }

  sceneConfig.value = currentConfig;
}

// 更新场景配置
function updateSceneConfig(
  scene: "qualityFirst" | "speedFirst",
  capability: "text" | "image",
  selectionString: string,
) {
  const [provider, model] = selectionString.split(":") as [ProviderName, string];
  const selection: ModelSelection = { provider, model };

  const current = JSON.parse(JSON.stringify(sceneConfig.value));
  if (capability === "text") {
    current[scene].text = selection;
  } else if (scene === "qualityFirst") {
    current[scene].image = selection;
  }
  sceneConfig.value = current;
}

// 获取当前选择的模型值（用于 select 绑定）
function getSelectionValue(scene: "qualityFirst" | "speedFirst", capability: "text" | "image") {
    if (capability === 'text') {
        const s = sceneConfig.value?.[scene]?.text;
        return s ? `${s.provider}:${s.model}` : '';
    } else if (scene === 'qualityFirst') {
         const s = sceneConfig.value?.[scene]?.image;
        return s ? `${s.provider}:${s.model}` : '';
    }
    return '';
}

// 监听配置加载并初始化输入值（解决异步加载时序问题）
watch(
  () => providerCredentials.value,
  (credentials) => {
    if (credentials?.gemini?.apiKey && !apiKeyInputs.value.gemini) {
      apiKeyInputs.value.gemini = credentials.gemini.apiKey;
    }
    if (credentials?.openai?.apiKey && !apiKeyInputs.value.openai) {
      apiKeyInputs.value.openai = credentials.openai.apiKey;
      openaiBaseUrl.value = credentials.openai.baseUrl || '';
    }
    if (credentials?.doubao?.apiKey && !apiKeyInputs.value.doubao) {
      apiKeyInputs.value.doubao = credentials.doubao.apiKey;
    }
    if (credentials?.deepseek?.apiKey && !apiKeyInputs.value.deepseek) {
      apiKeyInputs.value.deepseek = credentials.deepseek.apiKey;
    }
  },
  { immediate: true, deep: true }
);
</script>

<template>
  <section
    class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6"
  >
    <!-- Header -->
    <div class="flex items-center gap-2 mb-4">
      <Cpu class="w-4 h-4 text-purple-600 dark:text-purple-400" />
      <h2
        class="text-sm font-semibold tracking-wide uppercase text-purple-600 dark:text-purple-400"
      >
        AI 模型配置
      </h2>
    </div>

    <p class="text-xs text-gray-500 dark:text-gray-400 mb-6">
      配置 AI 供应商凭证，并为不同场景选择合适的模型。
    </p>

    <!-- Provider Credentials Section -->
    <div class="space-y-4 mb-8">
      <h3 class="text-sm font-medium flex items-center gap-2">
        <Key class="w-4 h-4" />
        供应商 API 配置
      </h3>

      <!-- Gemini -->
      <div class="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
        <div class="flex items-center justify-between">
          <span class="font-medium">Google Gemini</span>
          <span
            v-if="enabledProviders.includes('gemini')"
            class="text-xs text-green-600 flex items-center gap-1"
          >
            <Check class="w-3 h-3" /> 已配置
          </span>
        </div>
        <input
          v-model="apiKeyInputs.gemini"
          type="password"
          placeholder="输入 API Key"
          class="mt-2 w-full px-3 py-2 rounded-lg border bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-700"
          @blur="saveProviderCredential('gemini')"
        />
      </div>

      <!-- OpenAI -->
      <div class="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
        <div class="flex items-center justify-between">
          <span class="font-medium">OpenAI</span>
          <span
            v-if="enabledProviders.includes('openai')"
            class="text-xs text-green-600 flex items-center gap-1"
          >
            <Check class="w-3 h-3" /> 已配置
          </span>
        </div>
        <input
          v-model="apiKeyInputs.openai"
          type="password"
          placeholder="输入 API Key"
          class="mt-2 w-full px-3 py-2 rounded-lg border bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-700"
          @blur="saveProviderCredential('openai')"
        />
        <input
          v-model="openaiBaseUrl"
          type="text"
          placeholder="Base URL (可选，用于代理或 Azure)"
          class="mt-2 w-full px-3 py-2 rounded-lg border bg-white dark:bg-zinc-900 text-sm border-gray-300 dark:border-zinc-700"
          @blur="saveProviderCredential('openai')"
        />
      </div>

      <!-- Doubao -->
      <div class="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
        <div class="flex items-center justify-between">
          <span class="font-medium">豆包 (字节跳动)</span>
          <span
            v-if="enabledProviders.includes('doubao')"
            class="text-xs text-green-600 flex items-center gap-1"
          >
            <Check class="w-3 h-3" /> 已配置
          </span>
        </div>
        <input
          v-model="apiKeyInputs.doubao"
          type="password"
          placeholder="输入 API Key"
          class="mt-2 w-full px-3 py-2 rounded-lg border bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-700"
          @blur="saveProviderCredential('doubao')"
        />
      </div>

      <!-- DeepSeek -->
      <div class="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
        <div class="flex items-center justify-between">
          <span class="font-medium">DeepSeek</span>
          <span
            v-if="enabledProviders.includes('deepseek')"
            class="text-xs text-green-600 flex items-center gap-1"
          >
            <Check class="w-3 h-3" /> 已配置
          </span>
        </div>
        <input
          v-model="apiKeyInputs.deepseek"
          type="password"
          placeholder="输入 API Key"
          class="mt-2 w-full px-3 py-2 rounded-lg border bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-700"
          @blur="saveProviderCredential('deepseek')"
        />
      </div>
    </div>

    <!-- Scene Configuration Section -->
    <div class="space-y-4">
      <h3 class="text-sm font-medium flex items-center gap-2">
        <Sparkles class="w-4 h-4" />
        场景模型选择
      </h3>

      <!-- Quality First Scene -->
      <div
        class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
      >
        <div class="flex items-center gap-2 mb-3">
          <Sparkles class="w-4 h-4 text-purple-600" />
          <span class="font-medium text-purple-700 dark:text-purple-300"
            >深度分析场景</span
          >
        </div>
        <p class="text-xs text-gray-500 mb-3 dark:text-gray-400">
          语法分析、卡片生成等需要高质量输出的场景
        </p>

        <!-- Text Model -->
        <div class="mb-2">
          <label class="text-xs text-gray-500 dark:text-gray-400">文本模型</label>
          <select
            :value="getSelectionValue('qualityFirst', 'text')"
            @change="(e) => updateSceneConfig('qualityFirst', 'text', (e.target as HTMLSelectElement).value)"
            class="w-full mt-1 px-3 py-2 rounded-lg border bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-700 text-sm"
          >
            <optgroup
              v-for="provider in enabledProviders"
              :key="provider"
              :label="provider"
            >
              <option
                v-for="model in getTextModels(provider)"
                :key="model.id"
                :value="`${provider}:${model.id}`"
              >
                {{ model.name }} - {{ model.description }}
              </option>
            </optgroup>
          </select>
        </div>

        <!-- Image Model -->
        <div>
          <label class="text-xs text-gray-500 dark:text-gray-400">图像模型</label>
          <select
             :value="getSelectionValue('qualityFirst', 'image')"
             @change="(e) => updateSceneConfig('qualityFirst', 'image', (e.target as HTMLSelectElement).value)"
            class="w-full mt-1 px-3 py-2 rounded-lg border bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-700 text-sm"
          >
            <optgroup
              v-for="provider in enabledProviders"
              :key="provider"
              :label="provider"
            >
              <option
                v-for="model in getImageModels(provider)"
                :key="model.id"
                :value="`${provider}:${model.id}`"
              >
                {{ model.name }}
              </option>
            </optgroup>
          </select>
        </div>
      </div>

      <!-- Speed First Scene -->
      <div
        class="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
      >
        <div class="flex items-center gap-2 mb-3">
          <Zap class="w-4 h-4 text-amber-600" />
          <span class="font-medium text-amber-700 dark:text-amber-300"
            >快速响应场景</span
          >
        </div>
        <p class="text-xs text-gray-500 mb-3 dark:text-gray-400">
          翻译、词汇查询、Q&A 等需要快速响应的场景
        </p>

        <div>
          <label class="text-xs text-gray-500 dark:text-gray-400">文本模型</label>
          <select
            :value="getSelectionValue('speedFirst', 'text')"
            @change="(e) => updateSceneConfig('speedFirst', 'text', (e.target as HTMLSelectElement).value)"
            class="w-full mt-1 px-3 py-2 rounded-lg border bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-700 text-sm"
          >
            <optgroup
              v-for="provider in enabledProviders"
              :key="provider"
              :label="provider"
            >
              <option
                v-for="model in getTextModels(provider)"
                :key="model.id"
                :value="`${provider}:${model.id}`"
              >
                {{ model.name }} - {{ model.description }}
              </option>
            </optgroup>
          </select>
        </div>
      </div>
    </div>
  </section>
</template>
