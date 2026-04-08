import { useState } from "react";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "@/lib/authApi";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      await login({ email, password, rememberMe });
      window.dispatchEvent(new Event("auth-changed"));
      setSuccessMessage("로그인되었습니다. 홈으로 이동합니다.");

      window.setTimeout(() => {
        navigate("/home");
      }, 500);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "로그인 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-standalone">
      <article className="login-form-card login-form-card--solo">
        <div className="login-form-card__header">
          <p className="eyebrow">계정 접속</p>
          <h2>이메일로 로그인</h2>
          <p>저장한 일정과 장소, 포크한 루트를 계정에서 이어서 관리할 수 있습니다.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="input-field">
            <span>이메일</span>
            <div className="input-field__box">
              <Mail size={18} />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </div>
          </label>

          <label className="input-field">
            <span>비밀번호</span>
            <div className="input-field__box">
              <LockKeyhole size={18} />
              <input
                type="password"
                placeholder="비밀번호를 입력해주세요"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>
          </label>

          <div className="login-form__meta">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>로그인 상태 유지</span>
            </label>
            <button type="button" className="text-link-button">
              비밀번호 찾기
            </button>
          </div>

          {errorMessage ? (
            <p className="form-feedback form-feedback--error">{errorMessage}</p>
          ) : null}
          {successMessage ? (
            <p className="form-feedback form-feedback--success">{successMessage}</p>
          ) : null}

          <button
            type="submit"
            className="button button--primary login-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "로그인 중..." : "로그인"}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="login-divider">
          <span>또는</span>
        </div>

        <div className="login-alt-actions">
          <button className="button button--secondary" type="button">
            카카오로 시작하기
          </button>
          <button className="button button--secondary" type="button">
            구글로 시작하기
          </button>
        </div>

        <p className="login-helper-text">
          아직 계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </p>
      </article>
    </div>
  );
}
