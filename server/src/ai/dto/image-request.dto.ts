import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class ImageRequestDto {
    @IsString()
    prompt: string;

    @IsOptional()
    @IsString()
    size?: string;

    @IsOptional()
    @IsBoolean()
    stream?: boolean;
}
