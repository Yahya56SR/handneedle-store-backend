/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/reviews/route.ts
import { NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import Review from "../../../models/Review";
import mongoose from "mongoose"; // Pour valider les ObjectId si besoin dans le POST
import Product from "../../../models/Product"; // Pour vérifier l'existence du produit
import User from "../../../models/User"; // Pour vérifier l'existence de l'utilisateur

export async function GET() {
  await dbConnect();
  try {
    // On peut utiliser .populate() pour récupérer les détails du produit et de l'utilisateur
    const reviews = await Review.find({})
      .populate("product", "name slug") // Récupère seulement le nom et le slug du produit
      .populate("user", "username email"); // Récupère seulement le username et l'email de l'utilisateur
    return NextResponse.json(reviews, { status: 200 });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { message: "Error fetching reviews" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    console.log("Creating review with body:", body);

    // Valider les IDs de produit et d'utilisateur
    if (!body.product || !mongoose.Types.ObjectId.isValid(body.product)) {
      return NextResponse.json(
        { message: "Invalid or missing product ID." },
        { status: 400 }
      );
    }
    if (!body.user || !mongoose.Types.ObjectId.isValid(body.user)) {
      return NextResponse.json(
        { message: "Invalid or missing user ID." },
        { status: 400 }
      );
    }

    // Optionnel: Vérifier si le produit et l'utilisateur existent réellement
    const productExists = await Product.findById(body.product);
    if (!productExists) {
      return NextResponse.json(
        { message: "Product not found." },
        { status: 404 }
      );
    }
    const userExists = await User.findById(body.user);
    if (!userExists) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const review = await Review.create(body);
    return NextResponse.json(review, { status: 201 });
  } catch (error: any) {
    console.error("Error creating review:", error);
    if (error.name === "ValidationError") {
      // Pour les erreurs de validation de Mongoose (champs manquants/incorrects)
      return NextResponse.json(
        { message: error.message, errors: error.errors },
        { status: 400 }
      );
    }
    // Gérer d'autres types d'erreurs génériques
    return NextResponse.json(
      { message: "Error creating review" },
      { status: 500 }
    );
  }
}
