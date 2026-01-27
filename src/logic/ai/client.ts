import { getSceneService } from "./scene-service";
import { promptService, PROMPT_KEYS } from "../prompts/prompt-service";
import { QA_USER_PROMPT } from "../prompts/qa";
import type { TextGenerationOptions } from "./providers/types";

// 保留向后兼容的常量导出（逐步废弃）
export const MODEL_NAMES = {
    FLASH: "gemini-2.5-flash-preview-05-20",
    PRO_THINKING: "gemini-2.5-pro-preview-05-06",
    IMAGE: "gemini-2.0-flash-preview-image-generation",
} as const;

/**
 * 内部辅助：获取 Provider
 * 注意：不再接受 apiKey 参数，但为了 API 兼容性保留参数占位
 */
export async function getProviderForScene(
    _apiKey: string,
    scene: "quality" | "speed",
) {
    const service = await getSceneService();
    return scene === "quality"
        ? service.getQualityTextProvider()
        : service.getSpeedTextProvider();
}

/**
 * 创建分析流 - 使用质量优先场景
 */
export async function createAnalysisStream(
    _apiKey: string,
    text: string,
    mode: "flash" | "thinking" = "thinking",
) {
    // mode 'flash' 对应 speedFirst 场景，'thinking' 对应 qualityFirst 场景
    const service = await getSceneService();
    const provider =
        mode === "flash"
            ? service.getSpeedTextProvider()
            : service.getQualityTextProvider();

    const systemPrompt = await promptService.getPrompt(
        PROMPT_KEYS.ANALYSIS_SYSTEM,
    );

    return provider.generateStream(`Please analyze this text: "${text}"`, {
        systemPrompt,
        thinkingLevel: mode === "thinking" ? "low" : undefined,
    });
}

/**
 * 创建 Q&A 流 - 使用速度优先场景
 */
export async function createQaStream(
    apiKey: string,
    sentence: string,
    token: string,
    question: string,
) {
    const provider = await getProviderForScene(apiKey, "speed");

    const systemPrompt = await promptService.getPrompt(PROMPT_KEYS.QA_SYSTEM);

    return provider.generateStream(QA_USER_PROMPT(sentence, token, question), {
        systemPrompt,
    });
}

/**
 * 识别图像中的日语文本 - 使用速度优先场景（或质量优先，取决于实现）
 * 注意：这是一个多模态任务
 */
export async function recognizeTextFromImage(
    apiKey: string,
    base64Image: string,
    mimeType: string,
): Promise<string> {
    // OCR 需要较快速度，通常归类为 Utility，暂定使用 SpeedFirst
    // 但如果 SpeedFirst 是 DeepSeek (无 Vision)，则可能失败。
    const provider = await getProviderForScene(apiKey, "speed");

    const systemPrompt = await promptService.getPrompt(PROMPT_KEYS.OCR);

    const options: TextGenerationOptions = {
        systemPrompt,
        images: [{ mimeType, data: base64Image }],
    };

    return provider.generate("", options);
}

/**
 * 创建深度语法分析流 - 使用质量优先场景（Thinking Mode）
 */
export async function createSyntaxStream(apiKey: string, text: string) {
    const provider = await getProviderForScene(apiKey, "quality");

    const systemPrompt = await promptService.getPrompt(
        PROMPT_KEYS.SYNTAX_ANALYSIS_SYSTEM,
    );

    return provider.generateStream(`Analyze this sentence: "${text}"`, {
        systemPrompt,
        thinkingLevel: "high", // 语法分析需要深度思考
        responseFormat: "json", // 强制 JSON
    });
}

/**
 * 生成插图 - 使用 Quality 场景的 Image Capability
 */
export async function generateImage(
    _apiKey: string,
    sceneDescription: string,
): Promise<string> {
    const service = await getSceneService();
    const provider = service.getQualityImageProvider();

    if (!sceneDescription?.trim()) {
        throw new Error("场景描述不能为空");
    }

    try {
        return await provider.generate(sceneDescription);
    } catch (error: any) {
        console.error("[AI Client] Image generation failed:", error);
        throw new Error(error.message || "图像生成失败");
    }
}

/**
 * 快速翻译流 - 使用速度优先场景
 */
export async function createRapidTranslationStream(
    apiKey: string,
    text: string,
) {
    const provider = await getProviderForScene(apiKey, "speed");

    const systemPrompt = await promptService.getPrompt(
        PROMPT_KEYS.RAPID_TRANSLATION,
    );

    return provider.generateStream(`请翻译以下日语文本：\n\n${text}`, {
        systemPrompt,
    });
}

/**
 * 单词详情查询流 - 使用速度优先场景
 */
export async function createTokenDetailStream(apiKey: string, token: string) {
    const provider = await getProviderForScene(apiKey, "speed");

    const systemPrompt = await promptService.getPrompt(PROMPT_KEYS.TOKEN_DETAIL);

    return provider.generateStream(`单词：${token}`, {
        systemPrompt,
        responseFormat: "json",
    });
}
