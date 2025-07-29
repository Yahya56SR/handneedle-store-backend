/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/tags/route.ts
import { NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import Tag from "../../../models/Tag"; // Assure-toi que le chemin est correct

export async function GET() {
  await dbConnect();
  try {
    const tags = await Tag.find({});
    return NextResponse.json(tags, { status: 200 });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { message: "Error fetching tags" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    console.log("Creating tag with body:", body);
    const tag = await Tag.create(body);
    return NextResponse.json(tag, { status: 201 });
  } catch (error: any) {
    console.error("Error creating tag:", error);
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { message: error.message, errors: error.errors },
        { status: 400 }
      );
    }
    if (error.code === 11000) {
      // Code pour erreur de duplication (ex: unique: true)
      return NextResponse.json(
        { message: "Duplicate key error: Tag name must be unique." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Error creating tag" },
      { status: 500 }
    );
  }
}
