import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * Usage record entity for tracking API usage
 */
@Entity('usage_records')
export class UsageRecord {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    /**
     * Type of API call (e.g., 'grammar-analysis', 'translation', 'card-generation')
     */
    @Column()
    action: string;

    /**
     * 本次调用计数（通常为1）
     */
    @Column({ default: 1 })
    callCount: number;

    /**
     * AI model used
     */
    @Column({ nullable: true })
    model: string;

    /**
     * Request metadata (optional)
     */
    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, unknown>;

    @CreateDateColumn()
    createdAt: Date;
}
