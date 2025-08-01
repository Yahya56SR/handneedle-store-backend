/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/dashboard/products/components/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge"; // Importer le composant Badge
import Link from "next/link";
import Image from "next/image";

// --- Type de Produit MIS À JOUR ---
export interface DescriptionBlock {
  id: string; // Ajout d'un ID pour faciliter la gestion des clés React
  title: string;
  body: string; // Le corps contiendra du HTML généré par Quill
}

export type Product = {
  _id: string;
  name: string;
  slug: string;
  description?: DescriptionBlock[]; // CHANGEMENT ICI : Maintenant un tableau de DescriptionBlock
  shortDescription?: string;
  sku: string;
  stock: number;
  priceData: {
    price: number;
    currency: string;
    discountedPrice?: number;
    pricePerUnit?: number;
  };
  mediaUrls: string[];
  categories: string[];
  tags: string[];
  published: boolean;
  active: boolean;
  isFeatured: boolean;
  productOptions: any[];
  variants: any[];
  createdAt: string; // Gardez string si votre API retourne des strings pour les dates
  updatedAt: string; // Gardez string si votre API retourne des strings pour les dates
  type: "Digital" | "Physical";
  instantDelivery: boolean;
};

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: " ",
    cell: ({ row }) => {
      const mainMedia = row.original.mediaUrls[0];
      return (
        <Link
          href={`/dashboard/products/${row.original._id}/edit`}
          className="hover:underline font-medium"
        >
          <Image src={mainMedia} alt="" width={25} height={25} sizes="20vw" />
        </Link>
      );
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nom du Produit
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <Link
        href={`/dashboard/products/${row.original._id}/edit`}
        className="hover:underline font-medium"
      >
        {row.getValue("name")}
      </Link>
    ),
  },
  {
    accessorKey: "sku",
    header: "SKU",
  },
  {
    accessorKey: "stock",
    header: "Stock",
    cell: ({ row }) => {
      const stock = row.getValue("stock") as number;
      if (stock < 999)
        return (
          <span
            className={
              stock <= 10 && stock > 0
                ? "text-orange-500 font-medium"
                : stock === 0
                ? "text-red-500 font-bold"
                : ""
            }
          >
            {stock}
          </span>
        );
      else return <span>This Product Is For Command Only</span>;
    },
  },
  {
    accessorKey: "priceData.price",
    header: "Prix",
    cell: ({ row }) => {
      const priceData = row.original.priceData; // Accéder directement à l'objet priceData
      const price = priceData.price;
      const discountedPrice = priceData.discountedPrice;
      const currency = priceData.currency || "MAD";

      const formattedPrice = new Intl.NumberFormat("fr-MA", {
        style: "currency",
        currency: currency,
      }).format(price);

      let formattedDiscount;

      if (discountedPrice) {
        formattedDiscount = new Intl.NumberFormat("fr-MA", {
          style: "currency",
          currency: currency,
        }).format(discountedPrice);
      }

      return (
        <div className="font-medium">
          {formattedDiscount ? (
            <div className="block">
              <div className="mr-2 text-xs text-red-500 line-through decoration-2 decoration-red-500 ">
                {formattedPrice}
              </div>
              <div className="">{formattedDiscount}</div>
            </div>
          ) : (
            <div className="">{formattedPrice}</div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "published",
    header: "Publié",
    cell: ({ row }) => {
      const published = row.getValue("published");
      return (
        <Badge variant={published ? "default" : "secondary"}>
          {published ? "Oui" : "Non"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original;
      // Supposons que handleDelete est passé via le composant DataTable ou via un contexte
      // Pour l'exemple, nous allons juste logger l'action de suppression.
      // La vraie implémentation nécessiterait de passer handleDelete de page.tsx
      // Ou utiliser un hook useMutation si tu utilises React Query/SWR

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Ouvrir le menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/products/${product._id}/edit`}>
                Modifier
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                // Ceci est un placeholder. La fonction handleDelete réelle doit être passée.
                // Par exemple, via `DataTable` props ou un contexte.
                // Pour l'instant, on simule une suppression.
                console.log("Supprimer le produit avec l'ID:", product._id);
                // toast.success(`Produit "${product.name}" supprimé (simulation).`);
              }}
              className="text-red-600 focus:text-red-600" // Style pour le texte de suppression
            >
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
