import { useState } from "react";
import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "@/lib/authApi";

export function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (password !== passwordConfirm) {
      setErrorMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      await register({ email, nickname, password });
      window.dispatchEvent(new Event("auth-changed"));
      setSuccessMessage("회원가입이 완료되었습니다. 홈으로 이동합니다.");

      window.setTimeout(() => {
        navigate("/home");
      }, 500);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "회원가입 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-standalone">
      <article className="login-form-card login-form-card--solo">
        <div className="login-form-card__header">
          <p className="eyebrow">회원가입</p>
          <h2>계정을 만들고 여행 기록을 이어가세요</h2>
          <p>이메일과 닉네임만 입력하면 Travel Master를 바로 시작할 수 있습니다.</p>
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
            <span>닉네임</span>
            <div className="input-field__box">
              <UserRound size={18} />
              <input
                type="text"
                placeholder="서비스에서 사용할 이름"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                autoComplete="nickname"
              />
            </div>
          </label>

          <label className="input-field">
            <span>비밀번호</span>
            <div className="input-field__box">
              <LockKeyhole size={18} />
              <input
                type="password"
                placeholder="8자 이상 비밀번호"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
              />
            </div>
          </label>

          <label className="input-field">
            <span>비밀번호 확인</span>
            <div className="input-field__box">
              <LockKeyhole size={18} />
              <input
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                autoComplete="new-password"
              />
            </div>
          </label>

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
            {isSubmitting ? "가입 중..." : "회원가입"}
            <ArrowRight size={16} />
          </button>
        </form>

        <p className="login-helper-text">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </article>
    </div>
  );
}
