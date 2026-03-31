import { Router } from "express";
import { env } from "../../config/env.js";
import { clearSessionCookie, setSessionCookie } from "./auth.cookies.js";
import { requireAuth } from "./auth.middleware.js";
import { loginUser, registerUser } from "./auth.service.js";
import { deleteUserSession } from "./session.store.js";

export const authRouter = Router();

function validateRegisterBody(body) {
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";

  if (!email || !password || !nickname) {
    const error = new Error("이메일, 비밀번호, 닉네임은 모두 필수입니다.");
    error.status = 400;
    throw error;
  }

  if (password.length < 8) {
    const error = new Error("비밀번호는 최소 8자 이상이어야 합니다.");
    error.status = 400;
    throw error;
  }

  return { email, password, nickname };
}

function validateLoginBody(body) {
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    const error = new Error("이메일과 비밀번호를 입력해주세요.");
    error.status = 400;
    throw error;
  }

  return { email, password };
}

authRouter.post("/register", async (req, res, next) => {
  try {
    const payload = validateRegisterBody(req.body);
    const result = await registerUser(payload);

    setSessionCookie(res, result.sessionId);

    res.status(201).json({
      message: "회원가입이 완료되었습니다.",
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const payload = validateLoginBody(req.body);
    const result = await loginUser(payload);

    setSessionCookie(res, result.sessionId);

    res.status(200).json({
      message: "로그인에 성공했습니다.",
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, async (req, res) => {
  res.status(200).json({
    user: req.auth,
  });
});

authRouter.post("/logout", async (req, res, next) => {
  try {
    await deleteUserSession(req.cookies?.[env.session.cookieName]);
    clearSessionCookie(res);

    res.status(200).json({
      message: "로그아웃되었습니다.",
    });
  } catch (error) {
    next(error);
  }
});
