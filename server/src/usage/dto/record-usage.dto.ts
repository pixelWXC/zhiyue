import { IsString, IsNumber, IsOptional, Min, IsObject } from 'class-validator';

export class RecordUsageDto {
    @IsString()
    action: string;

    @IsNumber()
    @Min(1)
    callCount: number;

    @IsOptional()
    @IsString()
    model?: string;

    @IsOptional()
    @IsObject()
    metadata?: Record<string, unknown>;
}
