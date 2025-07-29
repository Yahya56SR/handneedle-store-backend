/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/promotion-coupons/[id]/route.ts
import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import PromotionCoupon from "../../../../models/PromotionCoupon";
import mongoose from "mongoose";

interface CouponRouteParams {
  params: {
    id: string; // L'ID du coupon
  };
}

export async function GET(request: Request, { params }: CouponRouteParams) {
  await dbConnect();
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid Coupon ID" }, { status: 400 });
  }

  try {
    const coupon = await PromotionCoupon.findById(id)
      .populate("categories", "name slug")
      .populate("products", "name slug");

    if (!coupon) {
      return NextResponse.json(
        { message: "Promotion coupon not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(coupon, { status: 200 });
  } catch (error) {
    console.error(`Error fetching promotion coupon with ID ${id}:`, error);
    return NextResponse.json(
      { message: "Error fetching promotion coupon" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: CouponRouteParams) {
  await dbConnect();
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid Coupon ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    console.log(
      `Updating promotion coupon with ID ${id}. Received body:`,
      body
    );

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

    // Optionnel: Vérifier que les IDs de catégories/produits sont valides ObjectId pour PUT aussi
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

    const updatedCoupon = await PromotionCoupon.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedCoupon) {
      return NextResponse.json(
        { message: "Promotion coupon not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedCoupon, { status: 200 });
  } catch (error: any) {
    console.error(`Error updating promotion coupon with ID ${id}:`, error);
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
      { message: "Error updating promotion coupon" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: CouponRouteParams) {
  await dbConnect();
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid Coupon ID" }, { status: 400 });
  }

  try {
    const deletedCoupon = await PromotionCoupon.findByIdAndDelete(id);

    if (!deletedCoupon) {
      return NextResponse.json(
        { message: "Promotion coupon not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Promotion coupon deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting promotion coupon with ID ${id}:`, error);
    return NextResponse.json(
      { message: "Error deleting promotion coupon" },
      { status: 500 }
    );
  }
}
