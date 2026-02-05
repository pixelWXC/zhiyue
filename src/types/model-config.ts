export type ProviderName = "gemini" | "openai" | "doubao" | "deepseek";

// 供应商凭证配置
export interface ProviderCredentials {
    gemini?: { apiKey: string };
    openai?: { apiKey: string; baseUrl?: string };
    doubao?: { apiKey: string };
    deepseek?: { apiKey: string };
}

// 模型选择
export interface ModelSelection {
    provider: ProviderName;
    model: string;
}

// 场景配置
export interface SceneConfig {
    qualityFirst: {
        text: ModelSelection;
        image?: ModelSelection; // 可选，已废弃 gemini-2.0-flash-preview-image-generation
    };
    speedFirst: {
        text: ModelSelection;
    };
}

// 预设模型列表
export const PRESET_MODELS: Record<
    ProviderName,
    {
        text: { id: string; name: string; description: string }[];
        image?: { id: string; name: string; description: string }[];
    }
> = {
    gemini: {
        text: [
            {
                id: "gemini-3-flash-preview",
                name: "Gemini 3 Flash",
                description: "速度快，适合日常使用",
            },
            {
                id: "gemini-3-pro-preview",
                name: "Gemini 3 Pro",
                description: "质量高，适合深度分析",
            },
        ],
        image: [
            {
                id: "gemini-3-pro-image-preview",
                name: "Gemini 3 Pro Image",
                description: "目前质量最高的图像生成模型",
            },
        ],
    },
    openai: {
        text: [
            { id: "gpt-5.1", name: "GPT-5.1", description: "快速且稳定" },
            { id: "gpt-5.2", name: "GPT-5.2", description: "最新高质量模型" },
        ],
    },
    doubao: {
        text: [
            {
                id: "doubao-seed-1-6-lite-251015",
                name: "豆包 Seed 1.6 Lite",
                description: "快速响应（无深度思考）",
            },
            {
                id: "doubao-seed-1-8-251228",
                name: "豆包 Seed 1.8",
                description: "高性能深度思考模型",
            },
        ],
        image: [
            {
                id: "doubao-seedream-4-5-251128",
                name: "豆包 Seedream 4.5",
                description: "最新图像生成模型",
            },
        ],
    },
    deepseek: {
        text: [
            {
                id: "deepseek-chat",
                name: "DeepSeek Chat",
                description: "标准对话模型",
            }
        ],
    },
};
