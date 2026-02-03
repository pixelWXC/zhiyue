import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';

export interface JwtPayload {
    sub: string;
    username: string;
    role: string;
}

export interface AuthResponse {
    accessToken: string;
    user: {
        id: string;
        username: string;
        role: string;
        quotaLimit: number;
        quotaUsed: number;
        quotaRemaining: number;
    };
}

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    /**
     * Validate user credentials
     */
    async validateUser(username: string, password: string): Promise<User | null> {
        const user = await this.usersService.findByUsername(username);
        if (!user || !user.isActive) {
            return null;
        }

        const isPasswordValid = await this.usersService.validatePassword(user, password);
        if (!isPasswordValid) {
            return null;
        }

        return user;
    }

    /**
     * Login and return JWT token
     */
    async login(loginDto: LoginDto): Promise<AuthResponse> {
        const user = await this.validateUser(loginDto.username, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload: JwtPayload = {
            sub: user.id,
            username: user.username,
            role: user.role,
        };

        return {
            accessToken: this.jwtService.sign(payload),
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                quotaLimit: user.quotaLimit,
                quotaUsed: user.quotaUsed,
                quotaRemaining: user.quotaLimit - user.quotaUsed,
            },
        };
    }

    /**
     * Verify JWT token and return user
     */
    async verifyToken(token: string): Promise<User | null> {
        try {
            const payload = this.jwtService.verify<JwtPayload>(token);
            return this.usersService.findById(payload.sub);
        } catch {
            return null;
        }
    }

    /**
     * Refresh user info (for frontend to fetch latest quota etc.)
     */
    async getProfile(userId: string): Promise<AuthResponse['user'] | null> {
        const user = await this.usersService.findById(userId);
        if (!user) {
            return null;
        }

        return {
            id: user.id,
            username: user.username,
            role: user.role,
            quotaLimit: user.quotaLimit,
            quotaUsed: user.quotaUsed,
            quotaRemaining: user.quotaLimit - user.quotaUsed,
        };
    }
}
