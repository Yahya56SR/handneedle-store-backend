/* eslint-disable @typescript-eslint/no-explicit-any */
import dbConnect from "@/lib/dbConnect";
import Category from "@/models/Category";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
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
    const body = await req.json();
    const { product } = body;
    if (!product) {
      return NextResponse.json(
        { message: "Product Is Required" },
        { status: 400 }
      );
    }
    if (!mongoose.Types.ObjectId.isValid(product)) {
      return NextResponse.json(
        { message: "Invalid Product ID" },
        { status: 400 }
      );
    }
    const category = await Category.findByIdAndUpdate(id, {
      $push: { products: product },
    });

    if (!category)
      return NextResponse.json(
        { message: "Category Not Found" },
        { status: 404 }
      );

    return NextResponse.json({ category }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: `Unexpected Error Encountered ${error.message}`,
      },
      { status: 500 }
    );
  }
}
