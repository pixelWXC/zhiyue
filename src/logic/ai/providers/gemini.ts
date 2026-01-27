import { GoogleGenAI } from "@google/genai";
import type {
    ITextProvider,
    IImageProvider,
    TextGenerationOptions,
} from "./types";

export class GeminiTextProvider implements ITextProvider {
    readonly name = "gemini";
    private client: GoogleGenAI;
    private model: string;

    constructor(apiKey: string, model: string) {
        this.client = new GoogleGenAI({ apiKey });
        this.model = model;
    }

    async *generateStream(
        prompt: string,
        options?: TextGenerationOptions,
    ): AsyncGenerator<string, void, unknown> {
        const config: any = {};

        if (options?.responseFormat === "json") {
            config.responseMimeType = "application/json";
        }

        if (options?.thinkingLevel) {
            config.thinkingConfig = {
                thinkingLevel: options.thinkingLevel,
                includeThoughts: false,
            };
        }

        const contents = [];
        if (options?.systemPrompt) {
            contents.push({ role: "user", parts: [{ text: options.systemPrompt }] });
        }

        const userParts: any[] = [];
        if (options?.images) {
            options.images.forEach(img => {
                userParts.push({
                    inlineData: {
                        mimeType: img.mimeType,
                        data: img.data
                    }
                });
            });
        }
        userParts.push({ text: prompt });
        contents.push({ role: "user", parts: userParts });

        const stream = await this.client.models.generateContentStream({
            model: this.model,
            contents,
            config,
        });

        for await (const chunk of stream) {
            if (chunk.text) {
                yield chunk.text;
            }
        }
    }

    async generate(
        prompt: string,
        options?: TextGenerationOptions,
    ): Promise<string> {
        let result = "";
        for await (const chunk of this.generateStream(prompt, options)) {
            result += chunk;
        }
        return result;
    }
}

export class GeminiImageProvider implements IImageProvider {
    readonly name = "gemini";
    private client: GoogleGenAI;
    private model: string;

    constructor(apiKey: string, model: string) {
        this.client = new GoogleGenAI({ apiKey });
        this.model = model;
    }

    async generate(prompt: string): Promise<string> {
        const response = await this.client.models.generateContent({
            model: this.model,
            contents: prompt,
        });

        // 提取 inline image data
        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("图像生成失败：API 未返回图像数据");
    }
}
