const redis = require('redis');
const instance = redis.createClient({ url: process.env.REDIS_URL })
instance.connect().catch(console.error)

module.exports = instance;
