/**
 * 用户配额管理脚本
 * 
 * 功能:
 *   - list: 列出所有用户
 *   - set-quota <username> <limit>: 设置用户配额限制
 *   - add-quota <username> <amount>: 增加用户配额
 *   - reset-usage <username>: 重置用户已使用配额为0
 * 
 * 示例:
 *   npx ts-node src/scripts/manage-users.ts list
 *   npx ts-node src/scripts/manage-users.ts set-quota john 50000
 *   npx ts-node src/scripts/manage-users.ts add-quota john 10000
 *   npx ts-node src/scripts/manage-users.ts reset-usage john
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'zhiyue',
    entities: [User],
    synchronize: false,
});

function printUsage() {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    智阅 - 用户管理脚本                         ║
╚═══════════════════════════════════════════════════════════════╝

命令:
  list                           - 列出所有用户
  set-quota <username> <limit>   - 设置用户配额限制
  add-quota <username> <amount>  - 增加用户配额
  reset-usage <username>         - 重置用户已使用配额为0

示例:
  npx ts-node src/scripts/manage-users.ts list
  npx ts-node src/scripts/manage-users.ts set-quota john 50000
  npx ts-node src/scripts/manage-users.ts add-quota john 10000
  npx ts-node src/scripts/manage-users.ts reset-usage john
`);
}

async function listUsers() {
    console.log('\n🔌 正在连接数据库...');

    await dataSource.initialize();
    const userRepository = dataSource.getRepository(User);

    const users = await userRepository.find({
        order: { createdAt: 'DESC' }
    });

    if (users.length === 0) {
        console.log('\n📭 暂无用户\n');
    } else {
        console.log(`
╔════════════════════════════════════════════════════════════════════════════════════════╗
║                                    用户列表                                             ║
╠══════════════════╦══════════╦════════════════╦════════════════╦════════════════════════╣
║      用户名      ║   角色   ║   配额/已用    ║     剩余       ║        创建时间        ║
╠══════════════════╬══════════╬════════════════╬════════════════╬════════════════════════╣`);

        for (const user of users) {
            const remaining = user.quotaLimit - user.quotaUsed;
            const percentage = user.quotaLimit > 0
                ? Math.round((user.quotaUsed / user.quotaLimit) * 100)
                : 0;
            const quotaStr = `${user.quotaUsed}/${user.quotaLimit}`;
            const remainingStr = `${remaining} (${percentage}%用)`;
            const createdAt = user.createdAt.toISOString().slice(0, 19).replace('T', ' ');

            console.log(`║ ${user.username.padEnd(16)} ║ ${user.role.padEnd(8)} ║ ${quotaStr.padEnd(14)} ║ ${remainingStr.padEnd(14)} ║ ${createdAt} ║`);
        }

        console.log(`╚══════════════════╩══════════╩════════════════╩════════════════╩════════════════════════╝`);
        console.log(`\n📊 共 ${users.length} 个用户\n`);
    }

    await dataSource.destroy();
}

async function setQuota(username: string, limit: number) {
    console.log('\n🔌 正在连接数据库...');

    await dataSource.initialize();
    const userRepository = dataSource.getRepository(User);

    const user = await userRepository.findOne({ where: { username } });

    if (!user) {
        console.log(`\n❌ 错误: 用户 "${username}" 不存在\n`);
        await dataSource.destroy();
        process.exit(1);
    }

    const oldLimit = user.quotaLimit;
    user.quotaLimit = limit;
    await userRepository.save(user);

    console.log(`\n✅ 已更新用户 "${username}" 的配额限制: ${oldLimit} → ${limit}\n`);

    await dataSource.destroy();
}

async function addQuota(username: string, amount: number) {
    console.log('\n🔌 正在连接数据库...');

    await dataSource.initialize();
    const userRepository = dataSource.getRepository(User);

    const user = await userRepository.findOne({ where: { username } });

    if (!user) {
        console.log(`\n❌ 错误: 用户 "${username}" 不存在\n`);
        await dataSource.destroy();
        process.exit(1);
    }

    const oldLimit = user.quotaLimit;
    user.quotaLimit += amount;
    await userRepository.save(user);

    console.log(`\n✅ 已为用户 "${username}" 增加配额: ${oldLimit} + ${amount} = ${user.quotaLimit}\n`);

    await dataSource.destroy();
}

async function resetUsage(username: string) {
    console.log('\n🔌 正在连接数据库...');

    await dataSource.initialize();
    const userRepository = dataSource.getRepository(User);

    const user = await userRepository.findOne({ where: { username } });

    if (!user) {
        console.log(`\n❌ 错误: 用户 "${username}" 不存在\n`);
        await dataSource.destroy();
        process.exit(1);
    }

    const oldUsed = user.quotaUsed;
    user.quotaUsed = 0;
    await userRepository.save(user);

    console.log(`\n✅ 已重置用户 "${username}" 的已使用配额: ${oldUsed} → 0\n`);

    await dataSource.destroy();
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
    printUsage();
    process.exit(1);
}

const command = args[0];

async function main() {
    switch (command) {
        case 'list':
            await listUsers();
            break;

        case 'set-quota':
            if (args.length < 3) {
                console.error('\n❌ 错误: 缺少参数，用法: set-quota <username> <limit>\n');
                process.exit(1);
            }
            const setLimit = parseInt(args[2], 10);
            if (isNaN(setLimit) || setLimit < 0) {
                console.error('\n❌ 错误: 配额限制必须是正整数\n');
                process.exit(1);
            }
            await setQuota(args[1], setLimit);
            break;

        case 'add-quota':
            if (args.length < 3) {
                console.error('\n❌ 错误: 缺少参数，用法: add-quota <username> <amount>\n');
                process.exit(1);
            }
            const addAmount = parseInt(args[2], 10);
            if (isNaN(addAmount)) {
                console.error('\n❌ 错误: 配额数量必须是整数\n');
                process.exit(1);
            }
            await addQuota(args[1], addAmount);
            break;

        case 'reset-usage':
            if (args.length < 2) {
                console.error('\n❌ 错误: 缺少参数，用法: reset-usage <username>\n');
                process.exit(1);
            }
            await resetUsage(args[1]);
            break;

        default:
            console.error(`\n❌ 错误: 未知命令 "${command}"\n`);
            printUsage();
            process.exit(1);
    }
}

main().catch((error) => {
    console.error('\n❌ 操作失败:', error.message);
    process.exit(1);
});
