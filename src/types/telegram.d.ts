export {};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }

  interface TelegramWebApp {
    initData: string;
    initDataUnsafe?: {
      query_id?: string;
      start_param?: string;
      user?: TelegramWebAppUser;
    };
    version?: string;
    colorScheme?: "light" | "dark";
    themeParams?: Record<string, string>;
    viewportHeight?: number;
    viewportStableHeight?: number;
    isExpanded?: boolean;
    ready: () => void;
    expand: () => void;
    close: () => void;
    enableClosingConfirmation?: () => void;
    disableClosingConfirmation?: () => void;
    setHeaderColor?: (color: string) => void;
    setBackgroundColor?: (color: string) => void;
    isVersionAtLeast?: (version: string) => boolean;
    openInvoice?: (
      url: string,
      callback?: (status: "paid" | "cancelled" | "failed" | "pending") => void
    ) => void;
    MainButton?: {
      text: string;
      isVisible: boolean;
      show: () => void;
      hide: () => void;
      setText: (text: string) => void;
      onClick: (callback: () => void) => void;
      offClick: (callback: () => void) => void;
    };
    BackButton?: {
      isVisible: boolean;
      show: () => void;
      hide: () => void;
      onClick: (callback: () => void) => void;
      offClick: (callback: () => void) => void;
    };
    onEvent?: (eventType: string, callback: (...args: unknown[]) => void) => void;
    offEvent?: (eventType: string, callback: (...args: unknown[]) => void) => void;
    HapticFeedback?: {
      impactOccurred?: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
      notificationOccurred?: (type: "error" | "success" | "warning") => void;
      selectionChanged?: () => void;
    };
  }

  interface TelegramWebAppUser {
    id: number;
    is_bot?: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
    photo_url?: string;
  }
}
