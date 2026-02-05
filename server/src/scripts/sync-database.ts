/**
 * Database schema synchronization script
 * Use this to sync database schema in production without running the full seed
 * Run with: npx ts-node src/scripts/sync-database.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
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
    synchronize: true, // This will create/update tables
});

async function syncDatabase() {
    console.log('🔄 Starting database schema synchronization...');
    console.log(`📍 Database: ${process.env.DATABASE_HOST || 'localhost'}:${process.env.DATABASE_PORT || '5432'}/${process.env.DATABASE_NAME || 'zhiyue'}`);

    try {
        await dataSource.initialize();
        console.log('✅ Database schema synchronized successfully!');
        console.log('📋 Tables created/updated:');
        console.log('   - users');
        console.log('   - usage_records');
    } catch (error) {
        console.error('❌ Database sync failed:', error);
        process.exit(1);
    } finally {
        await dataSource.destroy();
    }
}

syncDatabase();
