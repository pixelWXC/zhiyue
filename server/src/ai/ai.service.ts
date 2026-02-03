import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { UsageService } from '../usage/usage.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ImageRequestDto } from './dto/image-request.dto';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AiService {
    constructor(
        private configService: ConfigService,
        private httpService: HttpService,
        private usageService: UsageService,
    ) { }

    private getHeaders() {
        const apiKey = this.configService.get<string>('ai.apiKey');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        };
    }

    /**
     * 根据场景获取模型
     * @param scene 场景：speed=速度优先，quality=质量优先
     */
    private getModelByScene(scene?: 'speed' | 'quality'): string {
        if (scene === 'speed') {
            // 速度优先：使用快速模型
            return this.configService.get<string>('ai.chatModelFast') ||
                this.configService.get<string>('ai.chatModel') || '';
        }
        // 质量优先：使用标准模型
        return this.configService.get<string>('ai.chatModel') || '';
    }

    async chat(userId: string, dto: ChatRequestDto) {
        // 检查用户是否还有剩余调用次数配额
        const hasQuota = await this.usageService.checkQuota(userId, 1);
        if (!hasQuota) {
            throw new UnauthorizedException('配额不足，请联系管理员');
        }

        const endpoint = this.configService.get<string>('ai.chatEndpoint') || '';
        const model = this.getModelByScene(dto.scene);

        console.log(`[AI] Chat request - Scene: ${dto.scene || 'quality'}, Model: ${model}`);

        const payload = {
            model: model,
            messages: dto.messages,
            stream: dto.stream || false,
        };

        try {
            const response = await lastValueFrom(
                this.httpService.post(endpoint, payload, {
                    headers: this.getHeaders(),
                    responseType: dto.stream ? 'stream' : 'json'
                })
            );

            // 记录使用次数（每次调用计为1次）
            await this.usageService.recordUsage(userId, {
                action: 'chat',
                callCount: 1,
                model: model,
            });

            return response.data;
        } catch (error) {
            console.error('AI Chat Error:', error.response?.data || error.message);
            throw new InternalServerErrorException('Failed to call AI service');
        }
    }

    async generateImage(userId: string, dto: ImageRequestDto) {
        // 检查用户是否还有剩余调用次数配额
        const hasQuota = await this.usageService.checkQuota(userId, 1);
        if (!hasQuota) {
            throw new UnauthorizedException('配额不足，请联系管理员');
        }

        const endpoint = this.configService.get<string>('ai.imageEndpoint') || '';
        const model = this.configService.get<string>('ai.imageModel') || '';

        const payload = {
            model: model,
            prompt: dto.prompt,
            size: dto.size || '1024x768', // 默认 4:3 比例
            sequential_image_generation: "disabled",
            response_format: "url",
            stream: false,
            watermark: true
        };

        try {
            const response = await lastValueFrom(
                this.httpService.post(endpoint, payload, { headers: this.getHeaders() })
            );

            // 记录使用次数（每次调用计为1次）
            await this.usageService.recordUsage(userId, {
                action: 'image',
                callCount: 1,
                model: model,
            });

            return response.data;
        } catch (error) {
            console.error('AI Image Error:', error.response?.data || error.message);
            throw new InternalServerErrorException('Failed to generate image');
        }
    }
}
