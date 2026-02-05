import type { ITextProvider, IImageProvider } from "./providers/types";
import type { SceneConfig, ProviderCredentials } from "@/types/model-config";
import { createTextProvider, createImageProvider } from "./providers/factory";

export type SceneType = "qualityFirst" | "speedFirst";
export type CapabilityType = "text" | "image";

import { ServerProxyTextProvider, ServerProxyImageProvider } from "./providers/server-proxy";
import { getAuthState } from "@/logic/auth";
import { apiClient } from "@/logic/api/client";

/**
 * 场景服务 - 根据场景获取对应的 Provider
 */
export class SceneService {
    private credentials: ProviderCredentials;
    private sceneConfig: SceneConfig;
    private isAuthenticated: boolean;

    constructor(credentials: ProviderCredentials, sceneConfig: SceneConfig, isAuthenticated: boolean) {
        this.credentials = credentials;
        this.sceneConfig = sceneConfig;
        this.isAuthenticated = isAuthenticated;
    }

    private get isAuthProxy(): boolean {
        return this.isAuthenticated;
    }

    /**
     * 获取质量优先场景的文本 Provider
     */
    getQualityTextProvider(): ITextProvider {
        if (this.isAuthProxy) {
            return new ServerProxyTextProvider('quality');
        }
        const { provider, model } = this.sceneConfig.qualityFirst.text;
        return createTextProvider(provider, model, this.credentials);
    }

    /**
     * 获取质量优先场景的图像 Provider
     * 注意：已废弃 gemini-2.0-flash-preview-image-generation，如果失败不再兼容
     */
    getQualityImageProvider(): IImageProvider {
        if (this.isAuthProxy) {
            return new ServerProxyImageProvider();
        }
        const imageConfig = this.sceneConfig.qualityFirst.image;
        if (!imageConfig) {
            throw new Error('图像生成功能未配置');
        }
        return createImageProvider(imageConfig.provider, imageConfig.model, this.credentials);
    }

    /**
     * 获取速度优先场景的文本 Provider
     */
    getSpeedTextProvider(): ITextProvider {
        if (this.isAuthProxy) {
            return new ServerProxyTextProvider('speed');
        }
        const { provider, model } = this.sceneConfig.speedFirst.text;
        return createTextProvider(provider, model, this.credentials);
    }
}

/**
 * 解析存储的值（可能是 JSON 字符串或原生对象）
 * useStorageAsync 会将对象序列化为 JSON 字符串存储
 */
function parseStoredValue<T>(value: unknown): T | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'object') return value as T;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value) as T;
        } catch {
            return undefined;
        }
    }
    return undefined;
}

/**
 * 从 storage 获取配置并创建 SceneService
 */
export async function getSceneService(): Promise<SceneService> {
    const CREDENTIALS_KEY = "zhiyue:providerCredentials";
    const SCENE_CONFIG_KEY = "zhiyue:sceneConfig";
    const LEGACY_API_KEY = "zhiyue:apiKey"; // 向后兼容

    const result = await chrome.storage.local.get([
        CREDENTIALS_KEY,
        SCENE_CONFIG_KEY,
        LEGACY_API_KEY,
    ]);

    console.log('[SceneService] Raw storage result:', {
        credentials: result[CREDENTIALS_KEY],
        sceneConfig: result[SCENE_CONFIG_KEY],
        legacyApiKey: result[LEGACY_API_KEY] ? '***' : undefined
    });

    // 解析可能是 JSON 字符串格式的存储值
    let credentials = parseStoredValue<ProviderCredentials>(result[CREDENTIALS_KEY]) || {};
    let sceneConfig = parseStoredValue<SceneConfig>(result[SCENE_CONFIG_KEY]);

    console.log('[SceneService] Parsed values:', {
        credentials: Object.keys(credentials),
        sceneConfig: sceneConfig ? {
            qualityFirst: sceneConfig.qualityFirst?.text?.provider,
            speedFirst: sceneConfig.speedFirst?.text?.provider
        } : 'undefined'
    });

    // 向后兼容：如果有旧的单一 API Key，自动迁移到新配置
    if (!credentials.gemini?.apiKey && result[LEGACY_API_KEY]) {
        credentials = {
            ...credentials,
            gemini: { apiKey: result[LEGACY_API_KEY] as string },
        };
        // 保存迁移后的配置
        await chrome.storage.local.set({ [CREDENTIALS_KEY]: credentials });
    }

    // 如果没有场景配置，使用默认配置
    if (!sceneConfig) {
        console.log('[SceneService] Using default sceneConfig (Gemini)');
        sceneConfig = {
            qualityFirst: {
                text: { provider: "gemini", model: "gemini-3-pro-preview" },
            },
            speedFirst: {
                text: { provider: "gemini", model: "gemini-3-flash-preview" },
            },
        };
    }

    console.log('[SceneService] Final config:', {
        speedProvider: sceneConfig.speedFirst.text.provider,
        speedModel: sceneConfig.speedFirst.text.model,
        hasCredentials: !!credentials[sceneConfig.speedFirst.text.provider as keyof ProviderCredentials]?.apiKey
    });

    // 获取当前认证状态
    const { token, user } = await getAuthState();
    const isAuthenticated = !!token;

    // 确保 API Client 在 Background Context 中也有 Token
    if (token) {
        apiClient.setToken(token);
    }

    console.log('[SceneService] Auth state:', { isAuthenticated, hasToken: !!token, hasUser: !!user });

    return new SceneService(credentials, sceneConfig, isAuthenticated);
}
