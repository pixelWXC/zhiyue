import { Controller, Post, Body, UseGuards, Request, Res } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ImageRequestDto } from './dto/image-request.dto';
import type { Response } from 'express';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('chat')
    async chat(@Request() req, @Body() dto: ChatRequestDto, @Res() res: Response) {
        const userId = req.user.id;
        const result = await this.aiService.chat(userId, dto);

        if (dto.stream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            // Assuming result is a stream
            (result as any).pipe(res);
        } else {
            res.json(result);
        }
    }

    @Post('image')
    async generateImage(@Request() req, @Body() dto: ImageRequestDto) {
        const userId = req.user.id;
        return this.aiService.generateImage(userId, dto);
    }
}
