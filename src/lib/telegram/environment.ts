export function isTelegramMiniAppPreviewRuntime() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("tg_preview") === "1";
}

export function hasTelegramMiniAppInitData() {
  if (typeof window === "undefined") return false;
  return Boolean(window.Telegram?.WebApp?.initData);
}

export function isTelegramMiniAppRuntime() {
  return hasTelegramMiniAppInitData() || isTelegramMiniAppPreviewRuntime();
}
