/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"; // Ce composant est interactif (formulaire)

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";

// --- Définition explicite de l'interface pour les valeurs du formulaire ---
// Basé sur votre modèle Product.ts
interface ProductFormValues {
  name: string;
  slug?: string; // Optionnel selon votre schéma Product.ts
  shortDescription?: string; // Optionnel
  description: string;
  sku: string;
  stock: number;
  mediaUrls: string[];
  published: boolean;
  type: "Digital" | "Physical";
  instantDelivery: boolean;
  price: number; // Représente priceData.price
}

// --- Schéma de validation Zod pour le formulaire de produit ---
// Mappé sur l'interface ProductFormValues et votre modèle Product.ts
const productFormSchema: any = z.object({
  name: z
    .string()
    .min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  slug: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z
    .string()
    .min(10, { message: "La description est trop courte." }),
  sku: z.string().min(1, { message: "SKU est requis." }),
  stock: z.coerce
    .number()
    .min(0, { message: "Le stock ne peut pas être négatif." })
    .default(0),
  mediaUrls: z.array(z.url("URL d'image invalide.")).default([]),
  published: z.boolean().default(true), // Default true as per Product.ts model
  type: z.enum(["Digital", "Physical"]),
  instantDelivery: z.boolean().default(false),
  price: z.coerce
    .number()
    .min(0.01, { message: "Le prix doit être supérieur à 0." })
    .default(0.01),
});

// Le composant de la page d'édition
export default function EditProductPage({
  params,
}: {
  params: { productId: string };
}) {
  const router = useRouter();
  const { productId } = params; // Récupère l'ID du produit depuis les paramètres de l'URL
  const [loading, setLoading] = useState(true); // État de chargement des données

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      shortDescription: "",
      description: "",
      sku: "",
      stock: 0,
      mediaUrls: [],
      published: true, // Valeur par défaut correspondant au modèle
      type: "Physical",
      instantDelivery: false,
      price: 0.01,
    } as ProductFormValues, // Cast explicite pour les valeurs par défaut
  });

  const [mediaUrlInput, setMediaUrlInput] = useState<string>("");

  // Hook useEffect pour charger les données du produit lors du chargement de la page
  useEffect(() => {
    async function fetchProduct() {
      if (!productId) return; // Ne pas exécuter si productId n'est pas disponible

      setLoading(true);
      try {
        const response = await fetch(`/api/products/${productId}`); // Appel à votre API pour récupérer le produit
        if (!response.ok) {
          throw new Error("Produit non trouvé.");
        }
        const productData = await response.json();

        // Remplir le formulaire avec les données récupérées
        form.reset({
          name: productData.name,
          slug: productData.slug || "", // Gérer le slug optionnel
          shortDescription: productData.shortDescription || "",
          description: productData.description || "",
          sku: productData.sku,
          stock: productData.stock,
          mediaUrls: productData.mediaUrls || [],
          published: productData.published,
          type: productData.type,
          instantDelivery: productData.instantDelivery,
          price: productData.priceData?.price || 0.01, // Extraire le prix de priceData
        } as ProductFormValues);
      } catch (error) {
        console.error("Erreur lors du chargement du produit:", error);
        toast.error("Erreur lors du chargement des données du produit.");
        router.push("/dashboard/products"); // Rediriger en cas d'erreur ou produit non trouvé
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [productId, form, router]); // Dépendances pour re-exécuter le hook

  const handleAddMediaUrl = () => {
    if (mediaUrlInput && z.string().url().safeParse(mediaUrlInput).success) {
      form.setValue("mediaUrls", [
        ...(form.getValues("mediaUrls") || []),
        mediaUrlInput,
      ]);
      setMediaUrlInput("");
    } else {
      toast.error("Veuillez entrer une URL d'image valide.");
    }
  };

  const handleRemoveMediaUrl = (urlToRemove: string) => {
    form.setValue(
      "mediaUrls",
      form.getValues("mediaUrls")?.filter((url) => url !== urlToRemove) || []
    );
  };

  // --- Soumission du formulaire pour la mise à jour ---
  async function onSubmit(values: ProductFormValues) {
    try {
      const productDataToSend = {
        ...values,
        priceData: { price: values.price },
        // Les champs 'categories', 'tags', 'productOptions', 'variants' ne sont pas gérés par ce formulaire et sont omis.
      };

      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT", // Méthode HTTP pour la mise à jour
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productDataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Échec de la mise à jour du produit."
        );
      }

      toast.success("Produit mis à jour avec succès !");
      router.push("/dashboard/products"); // Rediriger vers la liste des produits
      router.refresh(); // Rafraîchir la liste des produits après la mise à jour
    } catch (error: unknown) {
      console.error("Erreur lors de la mise à jour du produit:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(
          "Une erreur inconnue est survenue lors de la mise à jour du produit."
        );
      }
    }
  }

  // Affiche un message de chargement pendant la récupération des données
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-lg">
        Chargement du produit...
      </div>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-3xl font-bold">Modifier Produit</CardTitle>
        <CardDescription>
          Mettez à jour les détails du produit existant.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informations de base */}
            <h3 className="text-xl font-semibold mt-8 mb-4">
              Informations Générales
            </h3>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du produit</FormLabel>
                  <FormControl>
                    <Input placeholder="T-shirt graphique cool" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="t-shirt-graphique-cool" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shortDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description Courte (optionnel)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Un aperçu rapide du produit"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description Complète</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décris en détail les caractéristiques du produit..."
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Stock et Prix */}
            <h3 className="text-xl font-semibold mt-8 mb-4">
              Inventaire et Prix
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU (Stock Keeping Unit)</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC-123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock</FormLabel>
                    <FormControl>
                      {/* Convertir la valeur en nombre entier pour le stock */}
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prix (DH)</FormLabel>
                  <FormControl>
                    {/* Convertir la valeur en nombre flottant pour le prix */}
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="99.99"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Médias */}
            <h3 className="text-xl font-semibold mt-8 mb-4">
              Images du Produit
            </h3>
            <FormItem>
              <FormLabel>URLs des images</FormLabel>
              <div className="flex space-x-2">
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={mediaUrlInput}
                  onChange={(e) => setMediaUrlInput(e.target.value)}
                />
                <Button type="button" onClick={handleAddMediaUrl}>
                  Ajouter
                </Button>
              </div>
              <FormDescription>
                Ajoute une URL d&#39;image à la fois.
              </FormDescription>
              <FormMessage />
              <div className="mt-4 space-y-2">
                {form.watch("mediaUrls")?.map((url, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 p-2 border rounded-md"
                  >
                    <Image
                      src={url}
                      width={100}
                      height={100}
                      alt={`Image ${index + 1}`}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <span className="truncate flex-1">{url}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMediaUrl(url)}
                    >
                      Supprimer
                    </Button>
                  </div>
                ))}
                {form.formState.errors.mediaUrls && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.mediaUrls.message}
                  </p>
                )}
              </div>
            </FormItem>

            {/* Options et Publication */}
            <h3 className="text-xl font-semibold mt-8 mb-4">Type et État</h3>
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de Produit</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Physical">Physique</SelectItem>
                      <SelectItem value="Digital">Numérique</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instantDelivery"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Livraison Instantanée
                    </FormLabel>
                    <FormDescription>
                      Est-ce un produit numérique avec livraison automatique ?
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="published"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Publier le produit
                    </FormLabel>
                    <FormDescription>
                      Rendre ce produit visible sur le site.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Boutons d'action */}
            <div className="flex justify-end gap-2 mt-8">
              <Link href="/dashboard/products" passHref>
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </Link>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Mise à jour..."
                  : "Mettre à jour le Produit"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
