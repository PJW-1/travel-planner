import bcrypt from "bcryptjs";
import { createLocalUser, findUserByEmail, touchLastLoginAt } from "./auth.repository.js";
import { createUserSession } from "./session.store.js";

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

  const session = await createUserSession(user);

  return {
    user: sanitizeUser(user),
    sessionId: session.id,
  };
}

export async function loginUser({ email, password }) {
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
  const session = await createUserSession(user);

  return {
    user: sanitizeUser({
      ...user,
      lastLoginAt: new Date().toISOString(),
    }),
    sessionId: session.id,
  };
}
