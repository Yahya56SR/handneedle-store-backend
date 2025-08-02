/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/categories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import Category from "../../../../models/Category";
import mongoose from "mongoose"; // Pour vérifier si l'ID est valide
import Product from "@/models/Product";

// Définir l'interface pour les paramètres de la route
interface CategoryRouteParams {
  params: {
    id: string; // L'ID de la catégorie
  };
}

export async function GET(req: NextRequest, { params }: CategoryRouteParams) {
  await dbConnect();
  const { id } = params;

  try {
    const category = await Category.findById(id).populate({
      path: "products",
      model: Product,
      select: "name slug sku mediaUrls", // Sélectionne les champs que vous voulez afficher
    });

    if (!category) {
      return NextResponse.json(
        { message: "Catégorie non trouvée." },
        { status: 404 }
      );
    }
    return NextResponse.json(category, { status: 200 });
  } catch (error: any) {
    console.error("Erreur API GET /api/categories/[id]:", error);
    return NextResponse.json(
      { message: "Erreur serveur", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  await dbConnect();
  const { categoryId } = params;

  try {
    const body = await req.json();
    const { name, image_url } = body; // NOUVEAU: Récupérer image_url

    if (!name) {
      return NextResponse.json(
        { message: "Le nom de la catégorie est requis." },
        { status: 400 }
      );
    }

    // Mettre à jour la catégorie avec le nouveau champ
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      { name, slug: name, image_url }, // NOUVEAU: Inclure image_url
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return NextResponse.json(
        { message: "Catégorie non trouvée." },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedCategory, { status: 200 });
  } catch (error: any) {
    console.error("Erreur API PUT /api/categories/[id]:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "Une catégorie avec ce nom existe déjà." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Erreur serveur", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: CategoryRouteParams
) {
  await dbConnect();
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Invalid Category ID" },
      { status: 400 }
    );
  }

  try {
    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    await Product.updateMany({ categories: id }, { $pull: { categories: id } });

    return NextResponse.json(
      { message: "Category deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting category with ID ${id}:`, error);
    return NextResponse.json(
      { message: "Error deleting category" },
      { status: 500 }
    );
  }
}
