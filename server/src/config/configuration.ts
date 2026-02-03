/**
 * Application configuration factory
 * Provides typed configuration from environment variables
 */
export default () => ({
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    database: {
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        username: process.env.DATABASE_USERNAME || 'postgres',
        password: process.env.DATABASE_PASSWORD || 'postgres',
        name: process.env.DATABASE_NAME || 'zhiyue',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'change-this-secret',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    ai: {
        apiKey: process.env.AI_API_KEY,
        chatEndpoint: process.env.AI_CHAT_ENDPOINT,
        imageEndpoint: process.env.AI_IMAGE_ENDPOINT,
        // 质量优先模型（深度思考）
        chatModel: process.env.AI_CHAT_MODEL,
        // 速度优先模型（快速响应）
        chatModelFast: process.env.AI_CHAT_MODEL_FAST,
        imageModel: process.env.AI_IMAGE_MODEL,
    },
});
