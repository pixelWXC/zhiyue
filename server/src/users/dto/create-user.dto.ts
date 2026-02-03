import { IsString, MinLength, MaxLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
    @IsString()
    @MinLength(3)
    @MaxLength(20)
    username: string;

    @IsString()
    @MinLength(6)
    @MaxLength(32)
    password: string;

    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @IsOptional()
    quotaLimit?: number;
}
