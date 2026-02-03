import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

/**
 * User roles for access control
 */
export enum UserRole {
    GUEST = 'guest',
    USER = 'user',
    ADMIN = 'admin',
}

/**
 * User entity for database persistence
 */
@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    username: string;

    @Column()
    passwordHash: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.USER,
    })
    role: UserRole;

    @Column({ default: true })
    isActive: boolean;

    /**
     * 用户配额限制 - 总调用次数上限
     */
    @Column({ default: 1000 })
    quotaLimit: number;

    /**
     * 已使用的调用次数
     */
    @Column({ default: 0 })
    quotaUsed: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    /**
     * 剩余调用次数
     */
    get quotaRemaining(): number {
        return this.quotaLimit - this.quotaUsed;
    }
}
