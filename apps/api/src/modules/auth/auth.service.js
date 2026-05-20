import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import {
  createLocalUser,
  findUserByEmail,
  findUserById,
  markUserDeleted,
  touchLastLoginAt,
  updateUserPassword,
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

function assertActiveUser(user) {
  if (!user || user.status !== "active") {
    const error = new Error("사용할 수 없는 계정입니다.");
    error.status = 403;
    throw error;
  }
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

  assertActiveUser(user);

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

  assertActiveUser(user);
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

  const currentUser = await findUserById(userId);
  assertActiveUser(currentUser);

  const user = await updateUserProfile(userId, {
    nickname: normalizedNickname.slice(0, 30),
  });

  await updateUserSession(sessionId, {
    nickname: user.nickname,
  });

  return sanitizeUser(user);
}

export async function changeCurrentUserPassword({ userId, currentPassword, nextPassword }) {
  const current = String(currentPassword ?? "");
  const next = String(nextPassword ?? "");

  if (!current || !next) {
    const error = new Error("현재 비밀번호와 새 비밀번호를 모두 입력해 주세요.");
    error.status = 400;
    throw error;
  }

  if (next.length < 8) {
    const error = new Error("새 비밀번호는 최소 8자 이상이어야 합니다.");
    error.status = 400;
    throw error;
  }

  if (current === next) {
    const error = new Error("새 비밀번호는 현재 비밀번호와 다르게 입력해 주세요.");
    error.status = 400;
    throw error;
  }

  const user = await findUserById(userId);
  assertActiveUser(user);

  const passwordMatches = await bcrypt.compare(current, user.passwordHash);

  if (!passwordMatches) {
    const error = new Error("현재 비밀번호가 올바르지 않습니다.");
    error.status = 401;
    throw error;
  }

  const passwordHash = await bcrypt.hash(next, 12);
  await updateUserPassword(userId, passwordHash);
}

export async function deleteCurrentUserAccount({ userId, password }) {
  const currentPassword = String(password ?? "");

  if (!currentPassword) {
    const error = new Error("회원 탈퇴를 위해 현재 비밀번호를 입력해 주세요.");
    error.status = 400;
    throw error;
  }

  const user = await findUserById(userId);
  assertActiveUser(user);

  const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!passwordMatches) {
    const error = new Error("현재 비밀번호가 올바르지 않습니다.");
    error.status = 401;
    throw error;
  }

  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 12);
  const deletedEmail = `deleted_${user.id}_${Date.now()}@deleted.local`;
  const deleted = await markUserDeleted(userId, {
    email: deletedEmail,
    passwordHash,
  });

  if (!deleted) {
    const error = new Error("회원 탈퇴 처리 중 오류가 발생했습니다.");
    error.status = 400;
    throw error;
  }
}
