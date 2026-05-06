"use client";

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import { createClient, isSupabaseConfigured } from "./client";
import type { User } from "@supabase/supabase-js";
import {
  clearTelegramClientSession,
  readTelegramClientSession,
  writeTelegramClientSession,
  type TelegramClientSession,
} from "@/lib/telegram/client-session";
import { isTelegramMiniAppPreviewRuntime } from "@/lib/telegram/environment";

interface AuthContextType {
  user: User | null;
  telegramUser: TelegramClientSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signInWithGoogle: (redirectPath?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  telegramUser: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [telegramUser, setTelegramUser] = useState<TelegramClientSession | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    let cancelled = false;
    const refreshTelegramUser = () => {
      const isTelegramRuntime = Boolean(window.Telegram?.WebApp?.initData) || isTelegramMiniAppPreviewRuntime();
      if (!cancelled) setTelegramUser(isTelegramRuntime ? readTelegramClientSession() : null);
    };
    const waitForTelegramWebApp = async () => {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const webApp = window.Telegram?.WebApp;
        if (webApp) return webApp;
        await new Promise((resolve) => window.setTimeout(resolve, 120));
      }
      return window.Telegram?.WebApp;
    };
    const authenticateTelegramFromWebApp = async () => {
      const webApp = await waitForTelegramWebApp();
      const isTelegramRuntime = Boolean(webApp?.initData) || isTelegramMiniAppPreviewRuntime();
      if (!isTelegramRuntime) return null;

      const storedSession = readTelegramClientSession();
      if (storedSession) {
        if (!cancelled) setTelegramUser(storedSession);
        return storedSession;
      }

      if (!webApp?.initData) return null;

      const startParam = webApp.initDataUnsafe?.start_param || "";
      const res = await fetch("/api/telegram/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: webApp.initData, startParam }),
      });
      const session = await res.json();
      if (!res.ok || !session?.telegramUserId) return null;

      writeTelegramClientSession(session);
      if (!cancelled) setTelegramUser(session);
      window.dispatchEvent(new CustomEvent("kairos:telegram-session", { detail: session }));
      return session as TelegramClientSession;
    };

    refreshTelegramUser();
    window.addEventListener("kairos:telegram-session", refreshTelegramUser);
    window.addEventListener("storage", refreshTelegramUser);

    if (!isSupabaseConfigured()) {
      authenticateTelegramFromWebApp().finally(() => {
        if (!cancelled) setLoading(false);
      });
      return () => {
        cancelled = true;
        window.removeEventListener("kairos:telegram-session", refreshTelegramUser);
        window.removeEventListener("storage", refreshTelegramUser);
      };
    }

    const supabase = supabaseRef.current;

    Promise.all([
      authenticateTelegramFromWebApp().catch(() => null),
      supabase.auth.getSession()
        .then(({ data }) => setUser(data?.session?.user ?? null))
        .catch(() => {}),
    ]).finally(() => {
      if (!cancelled) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener("kairos:telegram-session", refreshTelegramUser);
      window.removeEventListener("storage", refreshTelegramUser);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabaseRef.current.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error } = await supabaseRef.current.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    return { error: error?.message ?? null };
  };

  const signInWithGoogle = async (redirectPath?: string) => {
    const target = redirectPath
      || (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("redirect") : null)
      || "/";
    const { error } = await supabaseRef.current.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: typeof window !== "undefined"
          ? `${window.location.origin}${target}`
          : undefined,
      },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    clearTelegramClientSession();
    setTelegramUser(null);
    await supabaseRef.current.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, telegramUser, loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
