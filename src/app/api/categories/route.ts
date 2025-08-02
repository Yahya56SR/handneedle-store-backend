// src/app/api/categories/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Category from "@/models/Category";

// GET : Récupérer toutes les catégories (pas de changement ici)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(req: NextRequest) {
  // ... (code existant pour la méthode GET)
  await dbConnect();
  try {
    const categories = await Category.find({});
    return NextResponse.json(categories, { status: 200 });
  } catch (error: any) {
    console.error("Erreur API GET /api/categories:", error);
    return NextResponse.json(
      { message: "Erreur serveur", error: error.message },
      { status: 500 }
    );
  }
}

// POST : Créer une nouvelle catégorie
export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const body = await req.json();
    const { name } = body; // NOUVEAU: Récupérer image_url

    if (!name) {
      return NextResponse.json(
        { message: "Le nom de la catégorie est requis." },
        { status: 400 }
      );
    }

    const newCategory = new Category(body);

    const savedCategory = await newCategory.save();

    return NextResponse.json(savedCategory, { status: 201 });
  } catch (error: any) {
    console.error("Erreur API POST /api/categories:", error);
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
