"use client";

import type { User } from "@supabase/supabase-js";
import { formatStarsPrice, formatUsdPrice } from "@/lib/pricing";

export interface PaywallSectionProps {
  user: User | null;
  showLoginGate: boolean;
  showPaywall: boolean;
  setShowPaywall: (v: boolean) => void;
  setShowLoginGate: (v: boolean) => void;
  setUnlocked: (v: boolean) => void;
  setFreeReadings: React.Dispatch<React.SetStateAction<number>>;
  freeReadings: number;
  isTelegramMiniApp?: boolean;
  isChinese: boolean;
  t: (key: string) => string;
  handleAiReading: () => void;
  handleStripeCheckout: (tier: "pro" | "master") => void;
  handleSubscribe: (plan: "monthly" | "yearly") => void;
  checkoutLoading: boolean;
  subLoading: boolean;
  checkoutError: string;
}

export function PaywallSection({
  user,
  showLoginGate,
  showPaywall,
  setShowPaywall,
  setShowLoginGate,
  setUnlocked,
  setFreeReadings,
  freeReadings,
  isTelegramMiniApp = false,
  isChinese,
  t,
  handleAiReading,
  handleStripeCheckout,
  handleSubscribe,
  checkoutLoading,
  subLoading,
  checkoutError,
}: PaywallSectionProps) {
  return (
    <div className="relative -mt-20 pt-12">
      {/* Login Gate Modal */}
      {showLoginGate && !user && !isTelegramMiniApp && (
        <div className="bg-white/[0.03] border border-amber-400/15 rounded-2xl p-6 space-y-4 animate-slideUp mb-4" style={{ animationDuration: "0.4s" }}>
          <div className="text-center">
            <div className="text-3xl mb-2">👤</div>
            <h3 className="text-lg font-bold text-amber-100">
              {isChinese ? "请先登录" : "Sign in to continue"}
            </h3>
            <p className="text-amber-200/40 text-sm mt-1">
              {isChinese ? "登录后解锁购买，并永久保存您的解读报告" : "Sign in to purchase and permanently save your reading"}
            </p>
          </div>
          <a
            href={`/login?redirect=${encodeURIComponent("/fortune?paid=pending")}`}
            className="block w-full py-3 rounded-xl font-semibold text-sm text-center bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-white hover:shadow-[0_0_30px_rgba(217,119,6,0.2)] transition-all"
          >
            {isChinese ? "登录 / 注册" : "Log In / Sign Up"}
          </a>
          <button
            onClick={() => setShowLoginGate(false)}
            className="w-full text-center text-amber-200/20 text-xs hover:text-amber-200/40 cursor-pointer transition-colors"
          >
            {isChinese ? "暂不登录" : "Skip for now"}
          </button>
        </div>
      )}

      {!showPaywall ? (
        <button
          onClick={() => setShowPaywall(true)}
          className="w-full py-4 rounded-2xl font-semibold cursor-pointer bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-white hover:shadow-[0_0_40px_rgba(217,119,6,0.25)] transition-all animate-glowPulse"
        >
          {t("bazi.unlock")}
        </button>
      ) : (
        /* Paywall Modal */
        <div className="bg-white/[0.03] border border-amber-400/15 rounded-2xl p-5 space-y-4 animate-slideUp max-h-[calc(100vh-160px)] overflow-y-auto" style={{ animationDuration: "0.4s" }}>
          <div className="text-center">
            <div className="text-2xl mb-2">✨</div>
            <h3 className="text-xl font-bold text-amber-100">{t("bazi.unlockTitle")}</h3>
            <p className="text-amber-200/40 text-sm mt-2">
              {isTelegramMiniApp
                ? (isChinese ? "使用 Telegram Stars 原生支付，解锁您的 AI 深度解读" : "Use Telegram Stars native checkout to unlock your AI reading")
                : (isChinese ? "基于您的真实八字，AI 大师将为您深度解读 6 大维度" : "AI will deeply analyze 6 dimensions based on your real birth chart")
              }
            </p>
          </div>

          <div className="space-y-2">
            {[
              { icon: "🧠", text: isChinese ? "性格特质深度分析" : "Deep personality analysis" },
              { icon: "💼", text: isChinese ? "事业运势与发展方向" : "Career & development" },
              { icon: "💰", text: isChinese ? "财运分析与投资建议" : "Wealth & investment" },
              { icon: "❤️", text: isChinese ? "感情运势与桃花分析" : "Love & relationships" },
              { icon: "🏥", text: isChinese ? "健康提醒与养生建议" : "Health guidance" },
              { icon: "🍀", text: isChinese ? "开运指南（颜色/方位/行业）" : "Lucky guidance" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2.5 text-sm text-amber-200/60">
                <span>{item.icon}</span>
                <span>{item.text}</span>
                <span className="ml-auto text-amber-500/40">✓</span>
              </div>
            ))}
          </div>

          {/* Free reading from referral rewards */}
          {user && freeReadings > 0 && (
            <button
              onClick={() => {
                setUnlocked(true);
                setShowPaywall(false);
                setFreeReadings((prev) => prev - 1);
                // Deduct on server
                fetch("/api/referral?userId=" + user.id).catch(() => {});
                handleAiReading();
              }}
              className="w-full py-3.5 rounded-xl font-semibold text-sm cursor-pointer bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white hover:shadow-[0_0_30px_rgba(217,119,6,0.3)] transition-all"
            >
              🎁 {isChinese ? `使用免费解读（剩余 ${freeReadings} 次）` : `Use free reading (${freeReadings} left)`}
            </button>
          )}

          {/* Subscription Option — Best Value */}
          {!isTelegramMiniApp && (
          <div className="bg-emerald-900/15 border border-emerald-400/25 rounded-xl p-4 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-500/80 text-white text-[8px] px-2 py-0.5 rounded-bl-lg font-bold">
              {isChinese ? "最划算" : "BEST VALUE"}
            </div>
            <div className="text-[10px] text-emerald-300/60 mb-1">♾️ {isChinese ? "Pro 会员" : "Pro Membership"}</div>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-2xl font-bold text-emerald-200">$4.99</span>
              <span className="text-emerald-200/40 text-xs">/{isChinese ? "月" : "mo"}</span>
            </div>
            <p className="text-emerald-200/25 text-[10px] mt-1 mb-3">
              {isChinese ? "无限 AI 解读 · 每日深度运势 · 优先支持" : "Unlimited readings · Daily insights · Priority support"}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSubscribe("monthly")}
                disabled={subLoading}
                className="py-3 rounded-lg font-semibold cursor-pointer bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-700 text-white text-xs disabled:opacity-50 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all"
              >
                {subLoading ? "..." : (isChinese ? "$4.99/月" : "$4.99/mo")}
              </button>
              <button
                onClick={() => handleSubscribe("yearly")}
                disabled={subLoading}
                className="py-3 rounded-lg font-semibold cursor-pointer bg-emerald-800/50 text-emerald-200 text-xs border border-emerald-500/20 disabled:opacity-50 hover:bg-emerald-700/50 transition-all"
              >
                {subLoading ? "..." : (isChinese ? "$39.90/年 省33%" : "$39.90/yr save 33%")}
              </button>
            </div>
          </div>
          )}

          {!isTelegramMiniApp && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-amber-200/20 text-[10px]">{isChinese ? "或单次购买" : "or one-time purchase"}</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>
          )}

          {/* Two-tier one-time pricing */}
          <div className="grid grid-cols-2 gap-3">
            {/* Pro */}
            <div className="bg-amber-900/15 border border-amber-500/20 rounded-xl p-3.5 text-center">
              <div className="text-[10px] text-amber-400/50 mb-1">⭐ {isChinese ? "专业版" : "Pro"}</div>
              <div className="text-2xl font-bold text-amber-300">{isTelegramMiniApp ? formatStarsPrice("fortune_pro") : formatUsdPrice("fortune_pro")}</div>
              <p className="text-amber-200/25 text-[10px] mt-1 mb-3">{isChinese ? "6维AI深度解读" : "6-dimension AI reading"}</p>
              <button
                onClick={() => handleStripeCheckout("pro")}
                disabled={checkoutLoading}
                className="w-full py-3 rounded-lg font-semibold cursor-pointer bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-white text-xs disabled:opacity-50 hover:shadow-[0_0_20px_rgba(217,119,6,0.2)] transition-all"
              >
                {checkoutLoading ? "..." : (isTelegramMiniApp ? (isChinese ? "Stars 解锁" : "Pay Stars") : (isChinese ? "选择专业版" : "Choose Pro"))}
              </button>
            </div>
            {/* Master */}
            <div className="bg-purple-900/15 border border-purple-400/25 rounded-xl p-3.5 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-purple-500/80 text-white text-[8px] px-2 py-0.5 rounded-bl-lg font-bold">{isChinese ? "推荐" : "BEST"}</div>
              <div className="text-[10px] text-purple-300/60 mb-1">👑 {isChinese ? "大师版" : "Master"}</div>
              <div className="text-2xl font-bold text-purple-200">{isTelegramMiniApp ? formatStarsPrice("fortune_master") : formatUsdPrice("fortune_master")}</div>
              <p className="text-purple-200/25 text-[10px] mt-1 mb-3">{isChinese ? "宗师级全盘深度解析" : "Master-level deep reading"}</p>
              <button
                onClick={() => handleStripeCheckout("master")}
                disabled={checkoutLoading}
                className="w-full py-3 rounded-lg font-semibold cursor-pointer bg-gradient-to-r from-purple-700 via-purple-600 to-purple-700 text-white text-xs disabled:opacity-50 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] transition-all"
              >
                {checkoutLoading ? "..." : (isTelegramMiniApp ? (isChinese ? "Stars 解锁" : "Pay Stars") : (isChinese ? "选择大师版" : "Choose Master"))}
              </button>
            </div>
          </div>

          {checkoutError && (
            <p className="text-center text-red-400/80 text-xs">{checkoutError}</p>
          )}
          <p className="text-center text-amber-200/15 text-[10px] leading-relaxed">
            {isTelegramMiniApp ? "Native payment via Telegram Stars" : "Secure payment via Stripe · Card / Alipay / WeChat Pay"}
          </p>

          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <p className="text-amber-200/20 text-[10px] leading-relaxed text-center">
              Digital product · Delivered instantly · Non-refundable after delivery
            </p>
            <p className="text-amber-200/20 text-[10px] leading-relaxed text-center">
              By purchasing you agree to our <a href="/terms" className="underline hover:text-amber-200/40">Terms of Service</a> and <a href="/privacy" className="underline hover:text-amber-200/40">Privacy Policy</a>
            </p>
            <p className="text-amber-200/15 text-[10px] text-center">
              This is an AI-powered personality analysis for entertainment purposes only.
            </p>
          </div>

          <button
            onClick={() => setShowPaywall(false)}
            className="w-full text-center text-amber-200/20 text-xs hover:text-amber-200/40 cursor-pointer transition-colors"
          >
            {isChinese ? "暂不需要" : "Not now"}
          </button>
        </div>
      )}
    </div>
  );
}
