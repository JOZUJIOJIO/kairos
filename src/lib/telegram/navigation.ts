const TELEGRAM_UNSUPPORTED_REDIRECT_PATHS = [
  "/admin",
  "/health/quiz",
  "/health/report",
  "/login",
  "/profile",
];

export function resolveTelegramRedirectPath(redirectTo: string) {
  const pathname = redirectTo.split(/[?#]/, 1)[0] || "/";
  const isUnsupported = TELEGRAM_UNSUPPORTED_REDIRECT_PATHS.some((path) => (
    pathname === path || pathname.startsWith(`${path}/`)
  ));

  return isUnsupported ? "/tg" : redirectTo;
}
