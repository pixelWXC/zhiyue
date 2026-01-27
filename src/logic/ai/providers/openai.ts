import type { ITextProvider, TextGenerationOptions } from "./types";

export class OpenAITextProvider implements ITextProvider {
    readonly name = "openai";
    private apiKey: string;
    private baseUrl: string;
    private model: string;

    constructor(apiKey: string, model: string, baseUrl?: string) {
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = baseUrl || "https://api.openai.com/v1";
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

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: this.model,
                messages,
                stream: true,
                // 不显式设置 temperature，让 API 使用模型默认值
                // 某些模型（如 o1 系列）不支持自定义 temperature
                temperature: options?.temperature,
                max_tokens: options?.maxTokens,
                response_format:
                    options?.responseFormat === "json"
                        ? { type: "json_object" }
                        : undefined,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "OpenAI API 请求失败");
        }

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

