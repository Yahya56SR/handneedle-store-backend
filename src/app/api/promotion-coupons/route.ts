/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/promotion-coupons/route.ts
import { NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import PromotionCoupon from "../../../models/PromotionCoupon"; // Assure-toi que le chemin est correct
import mongoose from "mongoose"; // Pour validation ObjectId

export async function GET() {
  await dbConnect();
  try {
    const coupons = await PromotionCoupon.find({})
      .populate("categories", "name slug") // Peupler les catégories liées
      .populate("products", "name slug"); // Peupler les produits liés
    return NextResponse.json(coupons, { status: 200 });
  } catch (error) {
    console.error("Error fetching promotion coupons:", error);
    return NextResponse.json(
      { message: "Error fetching promotion coupons" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    console.log("Creating promotion coupon with body:", body);

    // Valider les IDs de catégories et produits si présents
    if (body.categories && !Array.isArray(body.categories)) {
      return NextResponse.json(
        { message: "Categories must be an array of IDs." },
        { status: 400 }
      );
    }
    if (body.products && !Array.isArray(body.products)) {
      return NextResponse.json(
        { message: "Products must be an array of IDs." },
        { status: 400 }
      );
    }

    // Optionnel: Vérifier que les IDs de catégories/produits sont valides ObjectId
    if (body.categories) {
      for (const catId of body.categories) {
        if (!mongoose.Types.ObjectId.isValid(catId)) {
          return NextResponse.json(
            { message: `Invalid category ID: ${catId}` },
            { status: 400 }
          );
        }
      }
    }
    if (body.products) {
      for (const prodId of body.products) {
        if (!mongoose.Types.ObjectId.isValid(prodId)) {
          return NextResponse.json(
            { message: `Invalid product ID: ${prodId}` },
            { status: 400 }
          );
        }
      }
    }

    const coupon = await PromotionCoupon.create(body);
    return NextResponse.json(coupon, { status: 201 });
  } catch (error: any) {
    console.error("Error creating promotion coupon:", error);
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { message: error.message, errors: error.errors },
        { status: 400 }
      );
    }
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "Duplicate key error: Coupon name or code must be unique." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Error creating promotion coupon" },
      { status: 500 }
    );
  }
}
