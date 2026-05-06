"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";
import { useLocale } from "@/lib/LocaleContext";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/lib/ThemeContext";
import { themeTokens } from "@/lib/theme-tokens";
import { PageArtworkBackdrop } from "@/components/PageArtwork";
import BrandMark from "@/components/BrandMark";
import { isTelegramMiniAppPreviewRuntime } from "@/lib/telegram/environment";
import { resolveTelegramRedirectPath } from "@/lib/telegram/navigation";

type AuthSurface = "checking" | "telegram" | "web";

function safeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0814]" />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [authSurface, setAuthSurface] = useState<AuthSurface>("checking");
  const [telegramMessage, setTelegramMessage] = useState("");
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, isChinese } = useLocale();
  const { theme } = useTheme();
  const tk = themeTokens[theme];

  const redirectTo = safeRedirectPath(searchParams.get("redirect"));

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const connectTelegram = async () => {
      const webApp = window.Telegram?.WebApp;
      if (!webApp) {
        if (attempts >= 8) setAuthSurface("web");
        else {
          attempts += 1;
          window.setTimeout(connectTelegram, 120);
        }
        return;
      }

      if (!webApp.initData && !isTelegramMiniAppPreviewRuntime()) {
        if (attempts >= 8) setAuthSurface("web");
        else {
          attempts += 1;
          window.setTimeout(connectTelegram, 120);
        }
        return;
      }

      setAuthSurface("telegram");
      webApp.ready?.();
      webApp.expand?.();

      if (!webApp.initData) {
        setTelegramMessage(isChinese ? "请从 Telegram 机器人重新打开 Mini App" : "Please reopen the Mini App from Telegram.");
        return;
      }

      setTelegramMessage(isChinese ? "正在通过 Telegram 安全进入..." : "Signing in with Telegram...");
      const startParam = webApp.initDataUnsafe?.start_param || "";
      try {
        const res = await fetch("/api/telegram/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData: webApp.initData, startParam }),
        });
        const session = await res.json();
        if (!res.ok || !session?.telegramUserId) {
          throw new Error(session?.error || "Telegram auth failed");
        }
        localStorage.setItem("kairos_telegram_session", JSON.stringify(session));
        window.dispatchEvent(new CustomEvent("kairos:telegram-session", { detail: session }));
        webApp.HapticFeedback?.notificationOccurred?.("success");
        if (!cancelled) router.replace(resolveTelegramRedirectPath(redirectTo));
      } catch (err) {
        webApp.HapticFeedback?.notificationOccurred?.("error");
        const message = err instanceof Error ? err.message : "Telegram auth failed";
        if (!cancelled) setTelegramMessage(message);
      }
    };

    connectTelegram();
    return () => {
      cancelled = true;
    };
  }, [isChinese, redirectTo, router]);

  const handleResetPassword = async () => {
    if (!resetEmail) return;
    setResetLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      setError(message || (isChinese ? "发送失败，请重试" : "Failed to send, please try again"));
    }
    setResetLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = isSignUp
      ? await signUp(email, password, displayName)
      : await signIn(email, password);

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.push(redirectTo);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden px-4"
      style={{
        background: theme === "cosmic"
          ? "#0a0814"
          : "linear-gradient(180deg, #E8E6F0 0%, #F2F0EB 40%, #F8F5EE 100%)",
      }}
    >
      <PageArtworkBackdrop art="login" className={theme === "cosmic" ? "" : "opacity-30"} />
      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center">
            <BrandMark size="lg" />
            <h1 className={`text-2xl font-bold ${tk.accent} mt-2`}>{t("app.name")}</h1>
          </Link>
          <p className={`text-sm ${tk.label} mt-1`}>{t("app.tagline")}</p>
        </div>

        <div className={`${tk.card} rounded-2xl border p-6`}>
          {authSurface === "telegram" && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/20 bg-amber-500/10">
                <span className="text-2xl">✦</span>
              </div>
              <h2 className={`text-lg font-semibold ${tk.text1}`}>
                {isChinese ? "Telegram 免注册进入" : "Telegram one-tap access"}
              </h2>
              <p className={`mt-2 text-sm ${tk.text2}`}>
                {telegramMessage || (isChinese ? "正在连接您的 Telegram 身份..." : "Connecting your Telegram identity...")}
              </p>
              <button
                type="button"
                onClick={() => router.replace("/tg")}
                className={`mt-6 w-full py-3 ${tk.ctaPrimary} rounded-xl font-semibold text-sm transition-colors`}
              >
                {isChinese ? "返回 Mini App 首页" : "Back to Mini App"}
              </button>
            </div>
          )}

          {authSurface === "checking" && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-amber-400/20 border-t-amber-400/70 animate-spin" />
              <p className={`text-sm ${tk.text2}`}>
                {isChinese ? "正在确认登录环境..." : "Checking sign-in environment..."}
              </p>
            </div>
          )}

          {authSurface === "web" && (
          <>
          <div className={`flex mb-6 ${tk.selectBg} rounded-xl p-1`}>
            <button
              onClick={() => { setIsSignUp(false); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                !isSignUp
                  ? `${theme === "cosmic" ? "bg-white/[0.08]" : "bg-white/80"} ${tk.text1}`
                  : tk.label
              }`}
            >
              {t("auth.login")}
            </button>
            <button
              onClick={() => { setIsSignUp(true); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                isSignUp
                  ? `${theme === "cosmic" ? "bg-white/[0.08]" : "bg-white/80"} ${tk.text1}`
                  : tk.label
              }`}
            >
              {t("auth.signup")}
            </button>
          </div>

          {/* Google OAuth */}
          <button
            onClick={() => signInWithGoogle(redirectTo)}
            className={`w-full py-2.5 ${tk.selectBg} hover:opacity-80 border ${tk.accentBorder} rounded-xl text-sm font-medium ${tk.accent} transition-colors flex items-center justify-center gap-2 cursor-pointer mb-4`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            {isSignUp ? (isChinese ? "使用 Google 注册" : "Sign up with Google") : (isChinese ? "使用 Google 登录" : "Sign in with Google")}
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className={`flex-1 h-px ${theme === "cosmic" ? "bg-white/5" : "bg-[#1a1520]/5"}`} />
            <span className={`${tk.text3} text-[10px]`}>or</span>
            <div className={`flex-1 h-px ${theme === "cosmic" ? "bg-white/5" : "bg-[#1a1520]/5"}`} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className={`block text-xs font-medium ${tk.label} mb-1`}>
                  {t("auth.displayName")}
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border ${tk.accentBorder} ${tk.input} text-sm focus:outline-none focus:ring-2 ${theme === "cosmic" ? "focus:ring-amber-500/20" : "focus:ring-amber-600/20"} ${tk.inputFocus}`}
                  style={{ colorScheme: tk.colorScheme }}
                  required
                />
              </div>
            )}
            <div>
              <label className={`block text-xs font-medium ${tk.label} mb-1`}>
                {t("auth.email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border ${tk.accentBorder} ${tk.input} text-sm focus:outline-none focus:ring-2 ${theme === "cosmic" ? "focus:ring-amber-500/20" : "focus:ring-amber-600/20"} ${tk.inputFocus}`}
                style={{ colorScheme: tk.colorScheme }}
                required
              />
            </div>
            <div>
              <label className={`block text-xs font-medium ${tk.label} mb-1`}>
                {t("auth.password")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border ${tk.accentBorder} ${tk.input} text-sm focus:outline-none focus:ring-2 ${theme === "cosmic" ? "focus:ring-amber-500/20" : "focus:ring-amber-600/20"} ${tk.inputFocus}`}
                style={{ colorScheme: tk.colorScheme }}
                required
                minLength={6}
              />
            </div>

            {!forgotMode && !isSignUp && (
              <button
                type="button"
                onClick={() => { setForgotMode(true); setResetEmail(email); }}
                className={`${tk.accentMuted} text-xs hover:opacity-80 transition-colors cursor-pointer text-right w-full`}
              >
                {isChinese ? "忘记密码？" : "Forgot password?"}
              </button>
            )}

            {error && (
              <p className="text-xs text-red-400 bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 ${tk.ctaPrimary} disabled:opacity-40 rounded-xl font-semibold text-sm transition-colors`}
            >
              {loading
                ? t("auth.loading")
                : isSignUp
                  ? t("auth.signup")
                  : t("auth.login")}
            </button>
          </form>

          {forgotMode && (
            <div className="space-y-4 mt-2">
              {resetSent ? (
                <div className="text-center space-y-3 py-4">
                  <div className="text-3xl">📧</div>
                  <p className={`${tk.text1} text-sm font-semibold`}>
                    {isChinese ? "重置链接已发送" : "Reset link sent"}
                  </p>
                  <p className={`${tk.text2} text-xs`}>
                    {isChinese ? `请检查 ${resetEmail} 的收件箱` : `Please check inbox for ${resetEmail}`}
                  </p>
                  <button
                    onClick={() => { setForgotMode(false); setResetSent(false); }}
                    className={`${tk.accentMuted} text-xs hover:opacity-80 cursor-pointer`}
                  >
                    {isChinese ? "← 返回登录" : "← Back to login"}
                  </button>
                </div>
              ) : (
                <>
                  <p className={`${tk.text2} text-xs text-center`}>
                    {isChinese ? "输入您的邮箱，我们将发送重置密码链接" : "Enter your email and we'll send a reset link"}
                  </p>
                  <div>
                    <label className={`text-xs ${tk.label} mb-1 block`}>{isChinese ? "邮箱" : "Email"}</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl ${tk.input} border ${tk.accentBorder} focus:outline-none ${tk.inputFocus} transition-all`}
                      style={{ colorScheme: tk.colorScheme }}
                      placeholder="your@email.com"
                    />
                  </div>
                  <button
                    onClick={handleResetPassword}
                    disabled={resetLoading || !resetEmail}
                    className={`w-full py-3 rounded-xl font-semibold text-sm cursor-pointer ${tk.ctaPrimary} disabled:opacity-50 transition-all`}
                  >
                    {resetLoading ? "..." : (isChinese ? "发送重置链接" : "Send Reset Link")}
                  </button>
                  <button
                    onClick={() => setForgotMode(false)}
                    className={`${tk.accentMuted} text-xs hover:opacity-80 cursor-pointer w-full text-center`}
                  >
                    {isChinese ? "← 返回登录" : "← Back to login"}
                  </button>
                </>
              )}
            </div>
          )}
          </>
          )}
        </div>

        <p className={`text-center text-xs ${tk.text3} mt-6`}>
          {t("auth.disclaimer")}
        </p>
      </div>
    </div>
  );
}
