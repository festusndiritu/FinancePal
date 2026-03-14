import { redirect } from "next/navigation";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAMES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
];

export default async function Home() {
  const cookieStore = await cookies();
  const hasSession = SESSION_COOKIE_NAMES.some((cookieName) =>
    cookieStore.has(cookieName),
  );

  redirect(hasSession ? "/dashboard" : "/login");
}
