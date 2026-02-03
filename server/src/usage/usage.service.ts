import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { UsageRecord } from './entities/usage-record.entity';
import { RecordUsageDto } from './dto/record-usage.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class UsageService {
    constructor(
        @InjectRepository(UsageRecord)
        private usageRepository: Repository<UsageRecord>,
        private usersService: UsersService,
    ) { }

    /**
     * 记录一次API调用
     */
    async recordUsage(userId: string, dto: RecordUsageDto): Promise<UsageRecord> {
        // 检查配额
        const quotaStatus = await this.usersService.getQuotaStatus(userId);
        if (quotaStatus.remaining < dto.callCount) {
            throw new BadRequestException('配额不足');
        }

        // 创建使用记录
        const record = this.usageRepository.create({
            userId,
            action: dto.action,
            callCount: dto.callCount,
            model: dto.model,
            metadata: dto.metadata,
        });

        await this.usageRepository.save(record);

        // 更新用户配额使用量
        await this.usersService.updateQuotaUsage(userId, dto.callCount);

        return record;
    }

    /**
     * 获取用户使用统计
     */
    async getUserStats(userId: string, days: number = 30) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        const records = await this.usageRepository.find({
            where: {
                userId,
                createdAt: MoreThanOrEqual(since),
            },
            order: { createdAt: 'DESC' },
        });

        // 按操作类型汇总
        const byAction: Record<string, { count: number; calls: number }> = {};
        let totalCalls = 0;

        for (const record of records) {
            if (!byAction[record.action]) {
                byAction[record.action] = { count: 0, calls: 0 };
            }
            byAction[record.action].count++;
            byAction[record.action].calls += record.callCount;
            totalCalls += record.callCount;
        }

        return {
            period: { days, since },
            totalRequests: records.length,
            totalCalls,
            byAction,
            recentActivity: records.slice(0, 10),
        };
    }

    /**
     * 检查用户是否有足够的配额
     */
    async checkQuota(userId: string, requiredCalls: number): Promise<boolean> {
        const quotaStatus = await this.usersService.getQuotaStatus(userId);
        return quotaStatus.remaining >= requiredCalls;
    }
}
