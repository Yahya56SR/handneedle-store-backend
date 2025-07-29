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
import Link from "next/link";
import Image from "next/image";

// --- NOUVEAU : Type pour un bloc de description ---
export type DescriptionBlock = {
  title: string;
  body: string; // Le contenu HTML sera une chaîne de caractères
};

// Définissez le type de vos données de produit pour correspondre à la nouvelle API
export type Product = {
  _id: string;
  name: string;
  sku: string;
  stock: number;
  // --- MODIFICATION ICI : description est maintenant un tableau de DescriptionBlock ---
  description?: DescriptionBlock[]; // Peut être optionnel si non pertinent pour le tableau
  // ----------------------------------------------------------------------------------
  priceData: {
    currency: string;
    price: number;
    discountedPrice?: number;
    pricePerUnit?: number;
  };
  published: boolean;
  type: "Digital" | "Physical";
  mediaUrls?: string[];
};

export const columns = (
  onDelete: (productId: string) => void
): ColumnDef<Product>[] => [
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
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex items-center gap-2">
          {product.mediaUrls &&
            product.mediaUrls.length > 0 &&
            product.mediaUrls[0] && (
              <Image
                src={product.mediaUrls[0]}
                width={250}
                height={250}
                alt={product.name}
                className="w-10 h-10 object-cover rounded mr-2"
              />
            )}
          {product.name}
        </div>
      );
    },
  },
  {
    accessorKey: "sku",
    header: "SKU",
  },
  {
    accessorKey: "stock",
    header: "Stock",
  },
  {
    accessorKey: "priceData.formatted.price",
    header: "Prix",
    cell: ({ row }) => {
      const formattedPrice =
        row.original.priceData.price + " " + row.original.priceData.currency;
      const formattedDiscountedPrice =
        row.original.priceData.discountedPrice +
        " " +
        row.original.priceData.currency;

      if (
        formattedDiscountedPrice &&
        formattedDiscountedPrice !== formattedPrice
      ) {
        return (
          <div className="font-medium">
            <span className="text-red-500 line-through">{formattedPrice}</span>
            <br />
            <span className="text-green-600">{formattedDiscountedPrice}</span>
          </div>
        );
      }
      return <div className="font-medium">{formattedPrice}</div>;
    },
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "published",
    header: "Publié",
    cell: ({ row }) => <div>{row.getValue("published") ? "Oui" : "Non"}</div>,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original;

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
              onClick={() => onDelete(product._id)}
              className="text-red-600 focus:text-red-600 cursor-pointer"
            >
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
