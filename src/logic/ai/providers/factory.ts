import type { ITextProvider, IImageProvider } from "./types";
import type { ProviderName, ProviderCredentials } from "@/types/model-config";
import { GeminiTextProvider, GeminiImageProvider } from "./gemini";
import { OpenAITextProvider } from "./openai";
import { DoubaoTextProvider, DoubaoImageProvider } from "./doubao";
import { DeepSeekTextProvider } from "./deepseek";

/**
 * 创建文本 Provider
 */
export function createTextProvider(
    providerName: ProviderName,
    model: string,
    credentials: ProviderCredentials,
): ITextProvider {
    switch (providerName) {
        case "gemini": {
            const apiKey = credentials.gemini?.apiKey;
            if (!apiKey) throw new Error("未配置 Gemini API Key");
            return new GeminiTextProvider(apiKey, model);
        }
        case "openai": {
            const config = credentials.openai;
            if (!config?.apiKey) throw new Error("未配置 OpenAI API Key");
            return new OpenAITextProvider(config.apiKey, model, config.baseUrl);
        }
        case "doubao": {
            const apiKey = credentials.doubao?.apiKey;
            if (!apiKey) throw new Error("未配置豆包 API Key");
            return new DoubaoTextProvider(apiKey, model);
        }
        case "deepseek": {
            const apiKey = credentials.deepseek?.apiKey;
            if (!apiKey) throw new Error("未配置 DeepSeek API Key");
            return new DeepSeekTextProvider(apiKey, model);
        }
        default:
            throw new Error(`不支持的供应商: ${providerName}`);
    }
}

/**
 * 创建图像 Provider
 */
export function createImageProvider(
    providerName: ProviderName,
    model: string,
    credentials: ProviderCredentials,
): IImageProvider {
    switch (providerName) {
        case "gemini": {
            const apiKey = credentials.gemini?.apiKey;
            if (!apiKey) throw new Error("未配置 Gemini API Key");
            return new GeminiImageProvider(apiKey, model);
        }
        case "openai":
            throw new Error("OpenAI 不支持图像生成");
        case "doubao": {
            const apiKey = credentials.doubao?.apiKey;
            if (!apiKey) throw new Error("未配置豆包 API Key");
            return new DoubaoImageProvider(apiKey, model);
        }
        case "deepseek":
            throw new Error("DeepSeek 不支持图像生成");
        default:
            throw new Error(`不支持的供应商: ${providerName}`);
    }
}
