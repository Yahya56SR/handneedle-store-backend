// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Définis les chemins qui doivent être publiquement accessibles SANS authentification.
// Le webhook de Clerk DOIT être listé ici.
const isPublicRoute = createRouteMatcher([
  "/api/webhooks/clerk", // La route du webhook doit être publique
  "/sign-in(.*)", // Les pages de connexion de Clerk sont publiques par défaut
  "/sign-up(.*)", // Les pages d'inscription de Clerk sont publiques par défaut
  "/sso-callback(.*)", // Callback SSO de Clerk
  "/(.*)", // Si ta page d'accueil est publique
  // Ajoute ici d'autres chemins que tu souhaites rendre explicitement publics.
  // Par exemple, si tu as une API pour lister des produits qui n'a pas besoin d'authentification :
  // '/api/products(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Si la route actuelle N'EST PAS une route publique,
  // alors nous appelons auth.protect() pour exiger l'authentification.
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
  // Si c'est une route publique, nous ne faisons rien, et elle reste accessible.
});

// La configuration du matcher reste la même : elle assure que le middleware
// s'exécute pour toutes les routes de l'application (pages et API),
// à l'exception des fichiers statiques et des chemins internes de Next.js (_next).
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
