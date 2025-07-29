/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/categories/route.ts
import { NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import Category from "../../../models/Category"; // Assure-toi que le chemin est correct

export async function GET() {
  await dbConnect();
  try {
    const categories = await Category.find({});
    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { message: "Error fetching categories" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    console.log("Creating category with body:", body);
    const category = await Category.create(body);
    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error("Error creating category:", error);
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { message: error.message, errors: error.errors },
        { status: 400 }
      );
    }
    if (error.code === 11000) {
      // Code pour erreur de duplication (ex: unique: true)
      return NextResponse.json(
        { message: "Duplicate key error: Category name must be unique." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Error creating category" },
      { status: 500 }
    );
  }
}
