/**
 * 手动添加用户脚本
 * 
 * 使用方法:
 *   npx ts-node src/scripts/add-user.ts <username> <password> [role] [quotaLimit]
 * 
 * 参数:
 *   username   - 用户名 (必需)
 *   password   - 密码 (必需)
 *   role       - 角色: user | admin (默认: user)
 *   quotaLimit - 配额限制 (默认: 10000)
 * 
 * 示例:
 *   npx ts-node src/scripts/add-user.ts john pass123
 *   npx ts-node src/scripts/add-user.ts admin admin123 admin 100000
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
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

用法:
  npx ts-node src/scripts/add-user.ts <username> <password> [role] [quotaLimit]

参数:
  username   - 用户名 (必需)
  password   - 密码 (必需)
  role       - 角色: user | admin (默认: user)
  quotaLimit - 配额限制，即可调用次数 (默认: 10000)

示例:
  npx ts-node src/scripts/add-user.ts john pass123
  npx ts-node src/scripts/add-user.ts admin admin123 admin 100000
  npx ts-node src/scripts/add-user.ts tester test123 user 50000
`);
}

async function addUser(
    username: string,
    password: string,
    role: UserRole = UserRole.USER,
    quotaLimit: number = 10000
) {
    console.log('\n🔌 正在连接数据库...');

    await dataSource.initialize();
    const userRepository = dataSource.getRepository(User);

    // Check if user exists
    const existing = await userRepository.findOne({
        where: { username },
    });

    if (existing) {
        console.log(`\n❌ 错误: 用户名 "${username}" 已存在!`);
        await dataSource.destroy();
        process.exit(1);
    }

    // Hash password
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = userRepository.create({
        username,
        passwordHash,
        role,
        quotaLimit,
        quotaUsed: 0,
        isActive: true,
    });

    await userRepository.save(user);

    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                      ✅ 用户创建成功                           ║
╠═══════════════════════════════════════════════════════════════╣
║  用户名:     ${username.padEnd(46)}║
║  角色:       ${role.padEnd(46)}║
║  配额限制:   ${String(quotaLimit).padEnd(46)}║
║  用户ID:     ${user.id.padEnd(46)}║
╚═══════════════════════════════════════════════════════════════╝
`);

    await dataSource.destroy();
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
    printUsage();
    process.exit(1);
}

const [username, password, roleArg, quotaArg] = args;

// Validate role
let role = UserRole.USER;
if (roleArg) {
    if (roleArg === 'admin') {
        role = UserRole.ADMIN;
    } else if (roleArg === 'user') {
        role = UserRole.USER;
    } else {
        console.error(`\n❌ 错误: 无效的角色 "${roleArg}"，请使用 "user" 或 "admin"`);
        process.exit(1);
    }
}

// Parse quota limit
let quotaLimit = 10000;
if (quotaArg) {
    quotaLimit = parseInt(quotaArg, 10);
    if (isNaN(quotaLimit) || quotaLimit < 0) {
        console.error(`\n❌ 错误: 无效的配额限制 "${quotaArg}"，请输入正整数`);
        process.exit(1);
    }
}

// Run
addUser(username, password, role, quotaLimit).catch((error) => {
    console.error('\n❌ 添加用户失败:', error.message);
    process.exit(1);
});
