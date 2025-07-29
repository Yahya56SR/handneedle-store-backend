// src/app/dashboard/layout.tsx
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await currentUser();

  // Redirige si l'utilisateur n'est pas authentifié
  if (!user) {
    redirect("/sign-in"); // Redirige vers la page de connexion de Clerk si non authentifié
  }

  // Optionnel : Tu pourrais ajouter une logique ici pour vérifier si l'utilisateur
  // a les permissions d'accéder au tableau de bord (ex: rôle "admin").
  // Pour l'instant, tout utilisateur connecté peut accéder.

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar (à développer plus tard) */}
      <aside className="w-64 bg-gray-800 text-white p-4 hidden md:block">
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
        <nav>
          <ul>
            <li className="mb-2">
              <a
                href="/dashboard/products"
                className="block p-2 rounded hover:bg-gray-700"
              >
                Produits
              </a>
            </li>
            {/* Ajoute d'autres liens ici au fur et à mesure */}
            <li className="mb-2">
              <a
                href="/dashboard/orders"
                className="block p-2 rounded hover:bg-gray-700"
              >
                Commandes
              </a>
            </li>
            <li className="mb-2">
              <a
                href="/dashboard/categories"
                className="block p-2 rounded hover:bg-gray-700"
              >
                Catégories
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main content area */}
      <main className="flex-1 p-6">
        {/* Header (à développer plus tard) */}
        <header className="bg-white shadow p-4 mb-6 rounded-lg">
          <h1 className="text-3xl font-semibold">Tableau de Bord</h1>
          {/* Afficher le nom de l'utilisateur connecté */}
          {user && (
            <p className="text-gray-600">
              Bienvenue, {user.firstName || user.emailAddresses[0].emailAddress}
              !
            </p>
          )}
        </header>

        {/* Contenu spécifique de la page enfant (products, new, edit, etc.) */}
        {children}
      </main>
    </div>
  );
}
