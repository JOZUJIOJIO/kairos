"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale } from "@/lib/LocaleContext";

function IconHome({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function IconCompass({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" opacity="0.15" stroke="none" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function IconDaily({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
      <path d="M9 15h.01M12 15h.01M15 15h.01" />
    </svg>
  );
}

function IconLeaf({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89-.76c.25-.1.53-.08.76.05A8.98 8.98 0 0 0 12 22c4.97 0 9-4.03 9-9 0-4.97-4.03-9-9-9" />
      <path d="M6 15l5-5" />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  );
}

const navItems = [
  { href: "/", Icon: IconHome, labelKey: "nav.home" },
  { href: "/fortune", Icon: IconCompass, labelKey: "nav.fortune" },
  { href: "/health", Icon: IconLeaf, labelKey: "nav.health" },
  { href: "/profile", Icon: IconUser, labelKey: "nav.profile" },
];

const telegramNavItems = [
  { href: "/tg", Icon: IconHome, labelKey: "nav.home" },
  { href: "/fortune", Icon: IconCompass, labelKey: "nav.fortune" },
  { href: "/daily", Icon: IconDaily, labelKey: "nav.daily" },
  { href: "/profile", Icon: IconUser, labelKey: "nav.profile" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const [isTelegramMiniApp, setIsTelegramMiniApp] = useState(false);

  useEffect(() => {
    setIsTelegramMiniApp(Boolean(window.Telegram?.WebApp?.initData));
  }, []);

  const activeNavItems = isTelegramMiniApp || pathname === "/tg" ? telegramNavItems : navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#070511]/95 backdrop-blur-md border-t border-amber-300/18 safe-bottom shadow-[0_-18px_48px_rgba(0,0,0,0.38)]">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {activeNavItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 min-w-[60px] min-h-[48px] transition-colors btn-haptic ${
                active ? "text-amber-100" : "text-[#F2F0EB]/52"
              }`}
            >
              <item.Icon />
              <span className="text-[10px]">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
