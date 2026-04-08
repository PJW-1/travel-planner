import crypto from "node:crypto";
import { env } from "../../config/env.js";
import { connectRedis } from "../../database/redis.js";

const memorySessions = new Map();

function createSessionId() {
  return crypto.randomUUID();
}

function getExpiresAt(ttlSeconds) {
  return Date.now() + ttlSeconds * 1000;
}

function isRedisSessionStore() {
  return env.session.store === "redis";
}

async function saveMemorySession(session, ttlSeconds) {
  memorySessions.set(session.id, {
    ...session,
    expiresAt: getExpiresAt(ttlSeconds),
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

async function saveRedisSession(session, ttlSeconds) {
  const client = await connectRedis();
  await client.set(`session:${session.id}`, JSON.stringify(session), {
    EX: ttlSeconds,
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

async function updateMemorySession(sessionId, patch, ttlSeconds = env.session.defaultTtlSeconds) {
  const session = await readMemorySession(sessionId);

  if (!session) {
    return null;
  }

  const nextSession = {
    ...session,
    ...patch,
    expiresAt: getExpiresAt(ttlSeconds),
  };

  memorySessions.set(sessionId, nextSession);
  return nextSession;
}

async function updateRedisSession(sessionId, patch, ttlSeconds = env.session.defaultTtlSeconds) {
  const session = await readRedisSession(sessionId);

  if (!session) {
    return null;
  }

  const nextSession = {
    ...session,
    ...patch,
  };

  const client = await connectRedis();
  await client.set(`session:${sessionId}`, JSON.stringify(nextSession), {
    EX: ttlSeconds,
  });

  return nextSession;
}

export async function createUserSession(user, options = {}) {
  const ttlSeconds = options.rememberMe
    ? env.session.rememberTtlSeconds
    : env.session.defaultTtlSeconds;
  const session = {
    id: createSessionId(),
    userId: user.id,
    email: user.email,
    nickname: user.nickname,
    provider: user.provider,
    status: user.status,
    createdAt: new Date().toISOString(),
    ttlSeconds,
    rememberMe: Boolean(options.rememberMe),
  };

  if (isRedisSessionStore()) {
    await saveRedisSession(session, ttlSeconds);
  } else {
    await saveMemorySession(session, ttlSeconds);
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

export async function updateUserSession(sessionId, patch) {
  if (!sessionId) {
    return null;
  }

  if (isRedisSessionStore()) {
    const currentSession = await readRedisSession(sessionId);
    return updateRedisSession(
      sessionId,
      patch,
      Number(currentSession?.ttlSeconds ?? env.session.defaultTtlSeconds),
    );
  }

  const currentSession = await readMemorySession(sessionId);
  return updateMemorySession(
    sessionId,
    patch,
    Number(currentSession?.ttlSeconds ?? env.session.defaultTtlSeconds),
  );
}
