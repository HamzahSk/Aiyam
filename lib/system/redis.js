// File: lib/system/redis.js
const { createClient } = require('redis');

const redisUrl = process.env.REDIS_URL; // Format: redis://username:password@host:port
let redis = null;
let isConnected = false;

async function initializeRedis() {
    try {
        if (!redisUrl) {
            console.warn('[ REDIS ] No REDIS_URL provided. Skipping Redis connection.');
            return;
        }

        redis = createClient({ url: redisUrl });

        redis.on('connect', () => {
            console.log('[ REDIS ] Connected!');
            isConnected = true;
        });

        redis.on('error', (err) => {
            console.error('[ REDIS ] Error:', err);
            isConnected = false;
        });

        redis.on('reconnecting', () => {
            console.log('[ REDIS ] Reconnecting...');
            isConnected = false;
        });

        await redis.connect();
    } catch (e) {
        console.error('[ REDIS ] Initialization failed:', e);
        isConnected = false;
    }
}

initializeRedis().catch(console.error);

module.exports = {
    redis,
    redisConnected: () => isConnected
};