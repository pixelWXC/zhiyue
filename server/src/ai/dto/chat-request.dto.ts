import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested, Allow, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 聊天消息结构
 */
export class ChatMessage {
    @IsString()
    role: string;

    @Allow() // 允许任意类型内容（可以是字符串或多模态数组）
    content: any;
}

/**
 * 模型场景类型
 */
export type ModelScene = 'speed' | 'quality';

/**
 * 聊天请求 DTO
 */
export class ChatRequestDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ChatMessage)
    messages: ChatMessage[];

    @IsOptional()
    @IsBoolean()
    stream?: boolean;

    @IsOptional()
    @IsString()
    @IsIn(['speed', 'quality'])
    scene?: ModelScene; // 场景：speed=速度优先，quality=质量优先（默认）
}
