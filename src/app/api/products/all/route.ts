/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/products/all/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Product from "@/models/Product";

// GET: Récupérer tous les produits
export async function GET() {
  await dbConnect();
  try {
    // Récupère tous les produits mais ne sélectionne que les champs nécessaires
    const products = await Product.find({}).select("name slug sku");
    return NextResponse.json(products, { status: 200 });
  } catch (error: any) {
    console.error("Erreur API GET /api/products/all:", error);
    return NextResponse.json(
      { message: "Erreur serveur", error: error.message },
      { status: 500 }
    );
  }
}
