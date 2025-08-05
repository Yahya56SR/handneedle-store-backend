// src/middleware.ts
import {
  clerkClient,
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Définir les chemins qui doivent être publiquement accessibles SANS authentification,
// mais pour lesquels nous voulons quand même les infos de session.
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/api/cart(.*)", // Ajout de votre route d'API du panier
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const url = req.nextUrl;

  // Utilisez 'await' pour appeler la fonction auth() et obtenir le userId et le sessionId.
  const { userId, sessionId } = await auth();

  console.log("sessionId", sessionId);

  // Logique de redirection pour les administrateurs
  if (userId) {
    const user = await (await clerkClient()).users.getUser(userId);
    const userRole = user.publicMetadata?.role;

    if (userRole === "admin" && url.pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard/products", req.url));
    }
  }

  // Si la route est publique ou si un utilisateur est authentifié, on ne fait rien.
  // Sinon, on redirige vers la page de connexion.
  if (!isPublicRoute(req) && !userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Si c'est une route publique, on autorise l'accès.
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Pour toutes les autres routes non publiques, on continue si l'utilisateur est authentifié.
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
