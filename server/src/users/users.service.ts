import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    /**
     * Find user by username
     */
    async findByUsername(username: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { username } });
    }

    /**
     * Find user by ID
     */
    async findById(id: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id } });
    }

    /**
     * Create a new user
     */
    async create(createUserDto: CreateUserDto): Promise<User> {
        const existing = await this.findByUsername(createUserDto.username);
        if (existing) {
            throw new ConflictException('Username already exists');
        }

        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(createUserDto.password, salt);

        const user = this.usersRepository.create({
            username: createUserDto.username,
            passwordHash,
            role: createUserDto.role,
            quotaLimit: createUserDto.quotaLimit,
        });

        return this.usersRepository.save(user);
    }

    /**
     * Update user quota usage
     */
    async updateQuotaUsage(userId: string, tokensUsed: number): Promise<void> {
        const user = await this.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        user.quotaUsed += tokensUsed;
        await this.usersRepository.save(user);
    }

    /**
     * Get user quota status
     */
    async getQuotaStatus(userId: string): Promise<{ limit: number; used: number; remaining: number }> {
        const user = await this.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        return {
            limit: user.quotaLimit,
            used: user.quotaUsed,
            remaining: user.quotaLimit - user.quotaUsed,
        };
    }

    /**
     * Verify user password
     */
    async validatePassword(user: User, password: string): Promise<boolean> {
        return bcrypt.compare(password, user.passwordHash);
    }
}
