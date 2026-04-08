import bcrypt from "bcryptjs";
import {
  createLocalUser,
  findUserByEmail,
  findUserById,
  touchLastLoginAt,
  updateUserProfile,
} from "./auth.repository.js";
import { createUserSession, updateUserSession } from "./session.store.js";

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    provider: user.provider,
    status: user.status,
    lastLoginAt: user.lastLoginAt ?? null,
  };
}

export async function registerUser({ email, password, nickname }) {
  const normalizedEmail = normalizeEmail(email);
  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser) {
    const error = new Error("이미 가입한 이메일입니다.");
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createLocalUser({
    email: normalizedEmail,
    nickname,
    passwordHash,
  });

  const session = await createUserSession(user, {
    rememberMe: false,
  });

  return {
    user: sanitizeUser(user),
    sessionId: session.id,
    ttlSeconds: session.ttlSeconds,
  };
}

export async function loginUser({ email, password, rememberMe = false }) {
  const normalizedEmail = normalizeEmail(email);
  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    const error = new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    error.status = 401;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    const error = new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    error.status = 401;
    throw error;
  }

  await touchLastLoginAt(user.id);
  const session = await createUserSession(user, {
    rememberMe,
  });

  return {
    user: sanitizeUser({
      ...user,
      lastLoginAt: new Date().toISOString(),
    }),
    sessionId: session.id,
    ttlSeconds: session.ttlSeconds,
  };
}

export async function getCurrentUser(userId) {
  const user = await findUserById(userId);

  if (!user) {
    const error = new Error("사용자 정보를 찾지 못했습니다.");
    error.status = 404;
    throw error;
  }

  return sanitizeUser(user);
}

export async function updateCurrentUserProfile({ userId, sessionId, nickname }) {
  const normalizedNickname = String(nickname ?? "").trim();

  if (!normalizedNickname) {
    const error = new Error("닉네임을 입력해주세요.");
    error.status = 400;
    throw error;
  }

  if (normalizedNickname.length < 2) {
    const error = new Error("닉네임은 최소 2자 이상이어야 합니다.");
    error.status = 400;
    throw error;
  }

  const user = await updateUserProfile(userId, {
    nickname: normalizedNickname.slice(0, 30),
  });

  await updateUserSession(sessionId, {
    nickname: user.nickname,
  });

  return sanitizeUser(user);
}
