import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "./shared/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request);

  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname.startsWith("/auth");
  const isOnboardingPage = pathname.startsWith("/onboarding");
  const isProtectedRoute = pathname.startsWith("/dashboard") || isOnboardingPage;

  // не авторизован — пускаем везде, кроме защищённых роутов
  if (!user) {
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL("/auth", request.url));
    }
    return response; // лендинг, /auth и всё остальное — свободно
  }

  // дальше — авторизован, проверяем профиль
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, company_name, role")
    .eq("id", user.id)
    .single();

  const isOnboarded = !!(
    profile?.first_name &&
    profile?.last_name &&
    profile?.company_name &&
    profile?.role
  );

  // авторизован, но зашёл на /auth — некуда ему туда, отправляем дальше
  if (isAuthPage) {
    return NextResponse.redirect(
      new URL(isOnboarded ? "/dashboard" : "/onboarding", request.url)
    );
  }

  if (!isOnboarded && !isOnboardingPage) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (isOnboarded && isOnboardingPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
