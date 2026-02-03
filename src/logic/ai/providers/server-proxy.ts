import { apiClient } from '@/logic/api/client';
import type { ITextProvider, IImageProvider, TextGenerationOptions } from './types';

type ModelScene = 'speed' | 'quality';

/**
 * 服务器代理文本 Provider
 * 支持通过 scene 参数选择速度优先或质量优先模型
 */
export class ServerProxyTextProvider implements ITextProvider {
    readonly name: string;
    private scene: ModelScene;

    constructor(scene: ModelScene = 'quality') {
        this.scene = scene;
        this.name = scene === 'speed'
            ? "Server Proxy (Seed 1.6 Flash)"
            : "Server Proxy (Seed 1.8)";
    }

    async *generateStream(prompt: string, options?: TextGenerationOptions): AsyncGenerator<string, void, unknown> {
        const token = apiClient.getToken();
        if (!token) throw new Error("Authentication required");

        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

        const messages = [];
        if (options?.systemPrompt) {
            messages.push({ role: 'system', content: options.systemPrompt });
        }

        if (options?.images && options.images.length > 0) {
            const content: any[] = [];
            for (const img of options.images) {
                content.push({ type: 'image_url', image_url: { url: img.data } });
            }
            content.push({ type: 'text', text: prompt });
            messages.push({ role: 'user', content });
        } else {
            messages.push({ role: 'user', content: prompt });
        }

        const response = await fetch(`${baseUrl}/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                messages,
                stream: true,
                scene: this.scene // 传递场景参数
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Server proxy request failed');
        }

        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim() === '') continue;
                if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6);
                    if (dataStr === '[DONE]') return;
                    try {
                        const data = JSON.parse(dataStr);
                        const content = data.choices?.[0]?.delta?.content || '';
                        if (content) yield content;
                    } catch (e) {
                        // ignore
                    }
                }
            }
        }
    }

    async generate(prompt: string, options?: TextGenerationOptions): Promise<string> {
        let text = '';
        for await (const chunk of this.generateStream(prompt, options)) {
            text += chunk;
        }
        return text;
    }
}

/**
 * 服务器代理图像 Provider
 */
export class ServerProxyImageProvider implements IImageProvider {
    readonly name = "Server Proxy (Seedream)";

    async generate(prompt: string): Promise<string> {
        const token = apiClient.getToken();
        if (!token) throw new Error("Authentication required");

        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

        const response = await fetch(`${baseUrl}/ai/image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                prompt,
                size: '1024x768'
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Image generation failed');
        }

        const result = await response.json();
        if (result.data && result.data[0] && result.data[0].url) {
            return result.data[0].url;
        }
        throw new Error("Invalid image response format");
    }
}
