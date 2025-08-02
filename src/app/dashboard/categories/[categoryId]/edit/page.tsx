/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/dashboard/categories/[categoryId]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Interfaces pour les données
interface Product {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  mediaUrls: string[];
}

interface AllProduct {
  _id: string;
  name: string;
  sku: string;
}

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.categoryId as string;

  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState(""); // NOUVEAU: État pour l'URL de l'image
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<AllProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!categoryId) return;

    const fetchData = async () => {
      try {
        const [categoryResponse, allProductsResponse] = await Promise.all([
          fetch(`/api/categories/${categoryId}`),
          fetch("/api/products/all"),
        ]);

        if (!categoryResponse.ok)
          throw new Error(
            "Échec de la récupération des données de la catégorie."
          );
        const categoryData = await categoryResponse.json();
        setName(categoryData.name);
        setImageUrl(categoryData.image_url || ""); // NOUVEAU: Mettre à jour l'état avec l'URL de l'image
        setProducts(categoryData.products);

        if (!allProductsResponse.ok)
          throw new Error("Échec de la récupération des produits.");
        const allProductsData = await allProductsResponse.json();
        setAllProducts(allProductsData);
      } catch (error: any) {
        console.error("Erreur:", error);
        toast.error("Impossible de charger la catégorie ou les produits.");
        router.push("/dashboard/categories");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryId, isSubmitting, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // NOUVEAU: Inclure image_url dans le corps de la requête PUT
        body: JSON.stringify({ name, image_url: imageUrl }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Échec de la mise à jour de la catégorie."
        );
      }

      toast.success(`Catégorie "${result.name}" mise à jour avec succès !`);
      router.push("/dashboard/categories");
    } catch (error: any) {
      console.error("Erreur de soumission:", error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddProduct = async () => {
    if (!selectedProduct) {
      toast.error("Veuillez sélectionner un produit à ajouter.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/categories/${categoryId}/add-product`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product: selectedProduct }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Échec de l'ajout du produit.");
      }

      toast.success("Produit ajouté à la catégorie avec succès !");
      setSelectedProduct("");
      router.refresh();
    } catch (error: any) {
      console.error("Erreur lors de l'ajout du produit:", error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 p-6">
      {/* Colonne du formulaire */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Modifier la catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="category-name">Nom de la Catégorie</Label>
                <Input
                  id="category-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: T-shirts"
                  required
                  disabled={isSubmitting}
                />
              </div>
              {/* NOUVEAU: Champ pour l'URL de l'image */}
              <div>
                <Label htmlFor="category-image">URL de {"l'image"}</Label>
                <Input
                  id="category-image"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Ex: https://example.com/image.jpg"
                />
              </div>
              {/* NOUVEAU: Affichage de l'image actuelle si elle existe */}
              {imageUrl && (
                <div className="relative w-full h-48 rounded-md overflow-hidden">
                  <Image
                    src={imageUrl}
                    alt="Image de la catégorie"
                    fill
                    style={{ objectFit: "contain" }}
                  />
                </div>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Mise à jour en cours..."
                  : "Mettre à jour la catégorie"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Colonne des produits liés */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Produits liés ({products.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2 mb-4">
              <Select
                onValueChange={(value) => setSelectedProduct(value)}
                value={selectedProduct}
                disabled={isSubmitting}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Sélectionner un produit..." />
                </SelectTrigger>
                <SelectContent>
                  {allProducts
                    .filter((p) => !products.some((catP) => catP._id === p._id))
                    .map((product) => (
                      <SelectItem key={product._id} value={product._id}>
                        {product.name} ({product.sku})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddProduct}
                disabled={!selectedProduct || isSubmitting}
              >
                Ajouter
              </Button>
            </div>
            {products.length === 0 ? (
              <p className="text-gray-500">
                Aucun produit {"n'est"} associé à cette catégorie.
              </p>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center space-x-4 border-b pb-2 last:border-b-0"
                  >
                    <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0">
                      <Image
                        src={product.mediaUrls[0] || "/placeholder-image.jpg"}
                        alt={product.name}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{product.name}</h4>
                      <p className="text-sm text-gray-500">
                        SKU: {product.sku}
                      </p>
                    </div>
                    <div>
                      <Link href={`/dashboard/products/${product._id}/edit`}>
                        <Badge variant="secondary" className="cursor-pointer">
                          Modifier
                        </Badge>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
