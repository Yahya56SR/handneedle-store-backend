// src/middleware.ts
import {
  clerkClient,
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server"; // Importe explicitement NextRequest pour le typage

// Définis les chemins qui doivent être publiquement accessibles SANS authentification.
const isPublicRoute = createRouteMatcher([
  "/api/webhooks/clerk",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/", // La page d'accueil ('/') DOIT être publique pour notre logique de redirection
]);

export default clerkMiddleware(async (authResolver, req: NextRequest) => {
  // 'authResolver' est la fonction qui retourne l'objet d'authentification
  const url = req.nextUrl;

  // IMPORTANT : Appelle authResolver() pour obtenir l'objet d'authentification et utilise 'await'.
  // Cet objet contient userId, user, et d'autres propriétés.
  const { userId } = await authResolver();

  // --- Logique de redirection pour les administrateurs ---
  if (userId) {
    // Vérifie si un utilisateur est authentifié et si l'objet user est disponible
    const user = await (await clerkClient()).users.getUser(userId);
    // console.log(user);
    // Tente d'accéder au rôle via publicMetadata de l'objet user.
    // Utilisation d'une assertion de type pour contourner d'éventuels problèmes de typage de TypeScript.
    const userRole = user.publicMetadata?.role;

    // Si l'utilisateur a le rôle "admin" ET qu'il tente d'accéder à la page d'accueil ('/')
    // On le redirige vers le tableau de bord.
    if (userRole === "admin" && url.pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard/products", req.url));
    }
  }

  // --- Logique de protection des routes (existante) ---
  // Si la route actuelle N'EST PAS une route publique,
  // alors nous appelons protect() pour exiger l'authentification.
  if (!isPublicRoute(req)) {
    // Appelle authResolver() pour obtenir l'objet d'authentification, puis sa méthode protect().
    await authResolver.protect();
  }

  // Si c'est une route publique, ou si aucune redirection admin n'a eu lieu, continuer normalement.
  return NextResponse.next();
});

// La configuration du matcher reste la même.
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
