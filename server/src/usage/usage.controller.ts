import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { UsageService } from './usage.service';
import { RecordUsageDto } from './dto/record-usage.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('usage')
@UseGuards(JwtAuthGuard)
export class UsageController {
    constructor(private usageService: UsageService) { }

    /**
     * Record usage for current user
     * POST /api/usage
     */
    @Post()
    async recordUsage(
        @CurrentUser('id') userId: string,
        @Body() dto: RecordUsageDto,
    ) {
        return this.usageService.recordUsage(userId, dto);
    }

    /**
     * Get usage statistics for current user
     * GET /api/usage/stats?days=30
     */
    @Get('stats')
    async getStats(
        @CurrentUser('id') userId: string,
        @Query('days') days?: string,
    ) {
        return this.usageService.getUserStats(userId, days ? parseInt(days) : 30);
    }

    /**
     * Check quota availability
     * GET /api/usage/check-quota?tokens=1000
     */
    @Get('check-quota')
    async checkQuota(
        @CurrentUser('id') userId: string,
        @Query('tokens') tokens: string,
    ) {
        const hasQuota = await this.usageService.checkQuota(
            userId,
            parseInt(tokens) || 0,
        );
        return { hasQuota };
    }
}
