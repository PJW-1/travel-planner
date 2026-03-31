import crypto from "node:crypto";
import { env } from "../../config/env.js";
import { connectRedis } from "../../database/redis.js";

const memorySessions = new Map();

function createSessionId() {
  return crypto.randomUUID();
}

function getExpiresAt() {
  return Date.now() + env.session.ttlSeconds * 1000;
}

function isRedisSessionStore() {
  return env.session.store === "redis";
}

async function saveMemorySession(session) {
  memorySessions.set(session.id, {
    ...session,
    expiresAt: getExpiresAt(),
  });
}

async function readMemorySession(sessionId) {
  const session = memorySessions.get(sessionId);

  if (!session) {
    return null;
  }

  if (session.expiresAt <= Date.now()) {
    memorySessions.delete(sessionId);
    return null;
  }

  return session;
}

async function deleteMemorySession(sessionId) {
  memorySessions.delete(sessionId);
}

async function saveRedisSession(session) {
  const client = await connectRedis();
  await client.set(`session:${session.id}`, JSON.stringify(session), {
    EX: env.session.ttlSeconds,
  });
}

async function readRedisSession(sessionId) {
  const client = await connectRedis();
  const rawValue = await client.get(`session:${sessionId}`);

  if (!rawValue) {
    return null;
  }

  return JSON.parse(rawValue);
}

async function deleteRedisSession(sessionId) {
  const client = await connectRedis();
  await client.del(`session:${sessionId}`);
}

export async function createUserSession(user) {
  const session = {
    id: createSessionId(),
    userId: user.id,
    email: user.email,
    nickname: user.nickname,
    provider: user.provider,
    status: user.status,
    createdAt: new Date().toISOString(),
  };

  if (isRedisSessionStore()) {
    await saveRedisSession(session);
  } else {
    await saveMemorySession(session);
  }

  return session;
}

export async function getUserSession(sessionId) {
  if (!sessionId) {
    return null;
  }

  if (isRedisSessionStore()) {
    return readRedisSession(sessionId);
  }

  return readMemorySession(sessionId);
}

export async function deleteUserSession(sessionId) {
  if (!sessionId) {
    return;
  }

  if (isRedisSessionStore()) {
    await deleteRedisSession(sessionId);
  } else {
    await deleteMemorySession(sessionId);
  }
}
