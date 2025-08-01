/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/dashboard/products/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react"; // Ajout de useMemo
import { DataTable } from "@/components/data-table"; // Assurez-vous que ce chemin est correct
import { columns, Product } from "@/components/columns"; // Importez vos colonnes et le type Product
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Importer Input pour la barre de recherche
import Link from "next/link";
import { toast } from "sonner";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); // Nouvel état pour le terme de recherche

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("/api/products");
        if (!response.ok) {
          throw new Error("Échec de la récupération des produits.");
        }
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Erreur lors du chargement des produits:", error);
        toast.error("Erreur lors du chargement des produits.");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // --- Fonction pour gérer la suppression (à passer à DataTable) ---
  const handleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      return;
    }
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Échec de la suppression du produit.");
      }

      setProducts(prevProducts => prevProducts.filter(product => product._id !== id));
      toast.success("Produit supprimé avec succès !");
    } catch (error: any) {
      console.error("Erreur lors de la suppression du produit:", error);
      toast.error(error.message || "Une erreur est survenue lors de la suppression.");
    }
  };

  // --- Filtrer les produits basés sur le terme de recherche ---
  const filteredProducts = useMemo(() => {
    if (!searchTerm) {
      return products;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return products.filter(product =>
      product.name.toLowerCase().includes(lowercasedSearchTerm) ||
      product.sku.toLowerCase().includes(lowercasedSearchTerm) ||
      product.shortDescription?.toLowerCase().includes(lowercasedSearchTerm) ||
      product.categories.some((cat: any) => cat.toLowerCase().includes(lowercasedSearchTerm)) ||
      product.tags.some((tag: any) => tag.toLowerCase().includes(lowercasedSearchTerm))
    );
  }, [products, searchTerm]);


  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Chargement des produits...
      </div>
    );
  }

  return (
    <Card className="p-4">
      <CardHeader className="flex flex-row justify-between items-center mb-4">
        <CardTitle className="text-3xl font-bold">Produits</CardTitle>
        <Link href="/dashboard/products/new">
          <Button>Ajouter un nouveau produit</Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Rechercher des produits par nom, SKU, catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        {/* Passer la fonction handleDelete au composant DataTable */}
        <DataTable columns={columns} data={filteredProducts} onDelete={handleDelete} />
      </CardContent>
    </Card>
  );
}