/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/tags/[id]/route.ts
import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import Tag from "../../../../models/Tag";
import mongoose from "mongoose";

// Définir l'interface pour les paramètres de la route
interface TagRouteParams {
  params: {
    id: string; // L'ID du tag
  };
}

export async function GET(request: Request, { params }: TagRouteParams) {
  await dbConnect();
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid Tag ID" }, { status: 400 });
  }

  try {
    const tag = await Tag.findById(id);

    if (!tag) {
      return NextResponse.json({ message: "Tag not found" }, { status: 404 });
    }

    return NextResponse.json(tag, { status: 200 });
  } catch (error) {
    console.error(`Error fetching tag with ID ${id}:`, error);
    return NextResponse.json(
      { message: "Error fetching tag" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: TagRouteParams) {
  await dbConnect();
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid Tag ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    console.log(`Updating tag with ID ${id}. Received body:`, body);

    const updatedTag = await Tag.findByIdAndUpdate(id, body, {
      new: true, // Retourne le document modifié
      runValidators: true, // Exécute les validateurs de schéma
    });

    if (!updatedTag) {
      return NextResponse.json({ message: "Tag not found" }, { status: 404 });
    }

    return NextResponse.json(updatedTag, { status: 200 });
  } catch (error: any) {
    console.error(`Error updating tag with ID ${id}:`, error);
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { message: error.message, errors: error.errors },
        { status: 400 }
      );
    }
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "Duplicate key error: Tag name must be unique." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Error updating tag" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: TagRouteParams) {
  await dbConnect();
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid Tag ID" }, { status: 400 });
  }

  try {
    const deletedTag = await Tag.findByIdAndDelete(id);

    if (!deletedTag) {
      return NextResponse.json({ message: "Tag not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Tag deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting tag with ID ${id}:`, error);
    return NextResponse.json(
      { message: "Error deleting tag" },
      { status: 500 }
    );
  }
}
