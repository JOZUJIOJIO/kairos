"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isTelegramMiniAppRuntime } from "@/lib/telegram/environment";

type TelegramSession = {
  telegramUserId: number;
  firstName: string;
  username?: string;
  startParam?: string;
  referralCode?: string;
  isPremium?: boolean;
};

export default function TelegramMiniAppBridge() {
  const [isTelegram, setIsTelegram] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp || !isTelegramMiniAppRuntime()) return;
    const isVersionAtLeast = (version: string) => webApp.isVersionAtLeast?.(version) ?? true;

    setIsTelegram(true);
    document.documentElement.classList.add("telegram-miniapp");
    document.documentElement.dataset.telegramTheme = webApp.colorScheme || "dark";

    const applyTelegramViewport = () => {
      document.documentElement.style.setProperty("--tg-viewport-height", `${webApp.viewportHeight || window.innerHeight}px`);
      document.documentElement.style.setProperty("--tg-viewport-stable-height", `${webApp.viewportStableHeight || window.innerHeight}px`);
    };

    applyTelegramViewport();
    webApp.onEvent?.("viewportChanged", applyTelegramViewport);
    webApp.ready();
    webApp.expand();
    if (isVersionAtLeast("6.2")) {
      webApp.enableClosingConfirmation?.();
    }
    if (isVersionAtLeast("6.1")) {
      webApp.setHeaderColor?.("#090712");
      webApp.setBackgroundColor?.("#060410");
    }

    const currentParams = new URLSearchParams(window.location.search);
    const startParam = webApp.initDataUnsafe?.start_param || currentParams.get("tgWebAppStartParam") || currentParams.get("startapp") || "";
    if (startParam) {
      localStorage.setItem("kairos_tg_start_param", startParam);
      if (startParam.startsWith("ref_")) {
        localStorage.setItem("kairos_ref", startParam.replace(/^ref_/, ""));
      }
    }

    if (webApp.initData) {
      fetch("/api/telegram/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: webApp.initData, startParam }),
      })
        .then((res) => res.json())
        .then((session: TelegramSession) => {
          if (session?.telegramUserId) {
            localStorage.setItem("kairos_telegram_session", JSON.stringify(session));
            window.dispatchEvent(new CustomEvent("kairos:telegram-session", { detail: session }));
          }
        })
        .catch(() => {});
    }

    fetch("/api/telegram/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventName: "miniapp_open", path: pathname, startParam }),
    }).catch(() => {});

    return () => {
      webApp.offEvent?.("viewportChanged", applyTelegramViewport);
    };
  }, [pathname]);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp || !isTelegram) return;
    const isVersionAtLeast = (version: string) => webApp.isVersionAtLeast?.(version) ?? true;
    if (!isVersionAtLeast("6.1")) return;

    const showBack = pathname !== "/" && pathname !== "/tg";
    if (showBack) {
      const goBack = () => router.back();
      webApp.BackButton?.show();
      webApp.BackButton?.onClick(goBack);
      return () => webApp.BackButton?.offClick(goBack);
    }
    webApp.BackButton?.hide();
  }, [isTelegram, pathname, router]);

  return null;
}
