"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import Image from "next/image";

export type Category = {
  _id: string;
  name: string;
  slug: string;
  image_url?: string;
};

// MODIFICATION : `columns` est maintenant une fonction qui prend `onDelete`
export const columns = (
  onDelete: (id: string) => void
): ColumnDef<Category>[] => [
  {
    accessorKey: " ",
    cell: ({ row }) => {
      const imageUrl = row.original.image_url;
      return (
        imageUrl && (
          <div className="font-medium">
            <Image src={imageUrl} alt="" width={25} height={25} />
          </div>
        )
      );
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Nom
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "slug",
    header: "Slug",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const category = row.original;
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
              <Link href={`/dashboard/categories/${category._id}/edit`}>
                Modifier
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => onDelete(category._id)}
            >
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
