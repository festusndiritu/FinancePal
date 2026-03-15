import { handlers } from "@/auth";

// Export the GET and POST handlers that NextAuth needs to handle
// /api/auth/[...nextauth] — session, signin, signout, csrf, etc.
export const { GET, POST } = handlers;