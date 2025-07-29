/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/categories/[id]/route.ts
import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import Category from "../../../../models/Category";
import mongoose from "mongoose"; // Pour vérifier si l'ID est valide

// Définir l'interface pour les paramètres de la route
interface CategoryRouteParams {
  params: {
    id: string; // L'ID de la catégorie
  };
}

export async function GET(request: Request, { params }: CategoryRouteParams) {
  await dbConnect();
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Invalid Category ID" },
      { status: 400 }
    );
  }

  try {
    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(category, { status: 200 });
  } catch (error) {
    console.error(`Error fetching category with ID ${id}:`, error);
    return NextResponse.json(
      { message: "Error fetching category" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: CategoryRouteParams) {
  await dbConnect();
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Invalid Category ID" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    console.log(`Updating category with ID ${id}. Received body:`, body);

    const updatedCategory = await Category.findByIdAndUpdate(id, body, {
      new: true, // Retourne le document modifié
      runValidators: true, // Exécute les validateurs de schéma
    });

    if (!updatedCategory) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedCategory, { status: 200 });
  } catch (error: any) {
    console.error(`Error updating category with ID ${id}:`, error);
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { message: error.message, errors: error.errors },
        { status: 400 }
      );
    }
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "Duplicate key error: Category name must be unique." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Error updating category" },
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
