import type {
    ITextProvider,
    IImageProvider,
    TextGenerationOptions,
} from "./types";

/**
 * 豆包 Text Provider
 * API 文档: https://www.volcengine.com/docs/82379/1263482
 */
export class DoubaoTextProvider implements ITextProvider {
    readonly name = "doubao";
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model: string) {
        this.apiKey = apiKey;
        this.model = model;
    }

    async *generateStream(
        prompt: string,
        options?: TextGenerationOptions,
    ): AsyncGenerator<string, void, unknown> {
        const messages = [];
        if (options?.systemPrompt) {
            messages.push({ role: "system", content: options.systemPrompt });
        }


        if (options?.images && options.images.length > 0) {
            const content: any[] = [{ type: "text", text: prompt }];
            options.images.forEach(img => {
                content.push({
                    type: "image_url",
                    image_url: {
                        url: `data:${img.mimeType};base64,${img.data}`
                    }
                });
            });
            messages.push({ role: "user", content });
        } else {
            messages.push({ role: "user", content: prompt });
        }

        // 根据模型配置 thinking 参数
        // doubao-seed-1-8: 使用 enabled（深度思考）
        // doubao-seed-1-6-*: 使用 disabled（快速响应）
        const thinkingType = this.model.includes("seed-1-8") ? "enabled" : "disabled";

        // 豆包使用 OpenAI 兼容接口
        const response = await fetch(
            "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: this.model,
                    messages,
                    stream: true,
                    thinking: {
                        type: thinkingType,
                    },
                }),
            },
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "豆包 API 请求失败");
        }

        // SSE 解析逻辑与 OpenAI 相同
        const reader = response.body?.getReader();
        if (!reader) throw new Error("无法读取响应流");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (line.startsWith("data: ") && line !== "data: [DONE]") {
                    try {
                        const json = JSON.parse(line.slice(6));
                        const content = json.choices?.[0]?.delta?.content;
                        if (content) yield content;
                    } catch { }
                }
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

/**
 * 豆包图像生成 Provider
 */
export class DoubaoImageProvider implements IImageProvider {
    readonly name = "doubao";
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model: string) {
        this.apiKey = apiKey;
        this.model = model;
    }

    async generate(prompt: string): Promise<string> {
        // 豆包图像生成 API
        const response = await fetch(
            "https://ark.cn-beijing.volces.com/api/v3/images/generations",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt,
                    response_format: "b64_json",
                }),
            },
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "豆包图像生成失败");
        }

        const result = await response.json();
        const b64 = result.data?.[0]?.b64_json;
        if (!b64) throw new Error("豆包未返回图像数据");

        return `data:image/png;base64,${b64}`;
    }
}
