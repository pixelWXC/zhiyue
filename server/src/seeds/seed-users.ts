/**
 * Database seeder for initial test users
 * Run with: npx ts-node src/seeds/seed-users.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { UsageRecord } from '../usage/entities/usage-record.entity';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'zhiyue',
    entities: [User, UsageRecord],
    synchronize: true, // Auto-create tables if missing
});


async function seed() {
    console.log('🌱 Starting database seed...');

    await dataSource.initialize();
    const userRepository = dataSource.getRepository(User);

    // Create test users
    const testUsers = [
        {
            username: 'admin',
            password: 'admin123',
            role: UserRole.ADMIN,
            quotaLimit: 1000000,
        },
        {
            username: 'tester',
            password: 'test123',
            role: UserRole.USER,
            quotaLimit: 100000,
        },
        {
            username: 'demo',
            password: 'demo123',
            role: UserRole.USER,
            quotaLimit: 50000,
        },
    ];

    for (const userData of testUsers) {
        const existing = await userRepository.findOne({
            where: { username: userData.username },
        });

        if (existing) {
            console.log(`⏭️  User "${userData.username}" already exists, skipping...`);
            continue;
        }

        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(userData.password, salt);

        const user = userRepository.create({
            username: userData.username,
            passwordHash,
            role: userData.role,
            quotaLimit: userData.quotaLimit,
        });

        await userRepository.save(user);
        console.log(`✅ Created user: ${userData.username} (${userData.role})`);
    }

    await dataSource.destroy();
    console.log('🎉 Seed completed!');
}

seed().catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
});
