import { createClient } from "redis";
import { env } from "../config/env.js";

let redisClient;

export function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: env.redis.url,
    });
  }

  return redisClient;
}

export async function connectRedis() {
  const client = getRedisClient();

  if (!client.isOpen) {
    await client.connect();
  }

  return client;
}

export async function verifyRedisConnection() {
  const client = await connectRedis();
  await client.ping();
}
