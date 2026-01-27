/**
 * 文本生成 Provider 接口
 */
export interface ITextProvider {
    readonly name: string;

    /**
     * 流式生成文本
     * @param prompt 提示词
     * @param options 生成选项
     * @returns 文本片段的异步迭代器
     */
    generateStream(
        prompt: string,
        options?: TextGenerationOptions,
    ): AsyncGenerator<string, void, unknown>;

    /**
     * 一次性生成完整响应
     */
    generate(prompt: string, options?: TextGenerationOptions): Promise<string>;
}

export interface TextGenerationOptions {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: "text" | "json";
    /** Gemini 专用：thinking level */
    thinkingLevel?: "low" | "medium" | "high";
    /** 用于多模态输入的图像数据 */
    images?: { mimeType: string; data: string }[];
}

/**
 * 图像生成 Provider 接口
 */
export interface IImageProvider {
    readonly name: string;

    /**
     * 生成图像
     * @param prompt 图像描述
     * @returns Base64 数据 URL
     */
    generate(prompt: string): Promise<string>;
}
