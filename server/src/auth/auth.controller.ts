import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService, AuthResponse } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    /**
     * Login endpoint
     * POST /auth/login
     */
    @Public()
    @Post('login')
    async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
        return this.authService.login(loginDto);
    }

    /**
     * Get current user profile
     * GET /auth/profile
     */
    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getProfile(@CurrentUser('id') userId: string) {
        return this.authService.getProfile(userId);
    }
}
