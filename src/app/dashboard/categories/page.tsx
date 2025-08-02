/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table";
import { columns, Category as CategoryType } from "./_components/columns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "axios";
// import { useRouter } from "next/navigation";

export default function CategoriesPage() {
  // const router = useRouter();
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);

  // État pour le nom et l'image de la nouvelle catégorie
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryImageUrl, setNewCategoryImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/categories");
      if (!response.ok)
        throw new Error("Échec de la récupération des catégories.");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Impossible de charger les catégories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.post("/api/categories", {
        name: newCategoryName,
        image_url: newCategoryImageUrl,
      });

      const result = response.data;

      if (response.status !== 201) {
        throw new Error(
          result.message || "Échec de la création de la catégorie."
        );
      }

      toast.success(`Catégorie "${result.name}" créée avec succès !`);
      setNewCategoryName(""); // Réinitialiser le formulaire
      setNewCategoryImageUrl("");
      fetchCategories(); // Rafraîchir la liste
    } catch (error: any) {
      console.error("Erreur de soumission:", error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (
      window.confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")
    ) {
      try {
        const response = await fetch(`/api/categories/${categoryId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Échec de la suppression de la catégorie."
          );
        }

        toast.success("Catégorie supprimée avec succès !");
        fetchCategories(); // Rafraîchir la liste après la suppression
      } catch (error: any) {
        console.error("Erreur lors de la suppression:", error);
        toast.error(error.message);
      }
    }
  };

  if (loading && categories.length === 0) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Colonne du formulaire */}
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Ajouter une Catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="category-name">Nom de la Catégorie</Label>
                <Input
                  id="category-name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ex: T-shirts"
                  required
                />
              </div>
              {/* NOUVEAU: Champ pour l'URL de l'image */}
              <div>
                <Label htmlFor="category-image">URL de {"l'image"}</Label>
                <Input
                  id="category-image"
                  type="url"
                  value={newCategoryImageUrl}
                  onChange={(e) => setNewCategoryImageUrl(e.target.value)}
                  placeholder="Ex: https://example.com/image.jpg"
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Ajout en cours..." : "Ajouter la catégorie"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Colonne du tableau */}
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Liste des Catégories</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns(handleDelete)} data={categories} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
