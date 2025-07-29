/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/dashboard/products/page.tsx
"use client"; // Cette page a besoin d'interactivité pour fetch les données et gérer les états

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button"; // Assurez-vous que le chemin est correct
import { Skeleton } from "@/components/ui/skeleton"; // Nous allons l'ajouter via shadcn
import { toast } from "sonner"; // Pour les notifications
import { DataTable } from "@/components/data-table"; // Importe le nouveau composant DataTable
import { columns, Product } from "@/components/columns"; // Importe les colonnes et le type Product

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour récupérer les produits
  const fetchProducts = async () => {
    setLoading(true); // Active l'état de chargement
    setError(null); // Réinitialise les erreurs précédentes
    try {
      const response = await fetch("/api/products");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Product[] = await response.json();
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Impossible de charger les produits.");
      toast.error("Erreur lors du chargement des produits."); // Affiche une notification d'erreur
    } finally {
      setLoading(false); // Désactive l'état de chargement
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Fonction pour gérer la suppression d'un produit
  const handleDelete = async (productId: string) => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible."
      )
    ) {
      return; // Annule la suppression si l'utilisateur annule
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Échec de la suppression du produit."
        );
      }

      toast.success("Produit supprimé avec succès !");
      // Rafraîchit la liste des produits après la suppression réussie
      fetchProducts();
    } catch (error: any) {
      console.error("Erreur lors de la suppression du produit:", error);
      toast.error(
        error.message ||
          "Une erreur est survenue lors de la suppression du produit."
      );
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-6">Liste des Produits</h2>
        <Skeleton className="w-full h-10 mb-4" />
        <Skeleton className="w-full h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Liste des Produits</h2>
        <Link href="/dashboard/products/new" passHref>
          <Button>Ajouter un nouveau produit</Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center p-10 text-gray-500 border border-dashed rounded-lg">
          <p>Aucun produit trouvé. Commence par en ajouter un !</p>
        </div>
      ) : (
        <DataTable columns={columns(handleDelete)} data={products} />
      )}
    </div>
  );
}
