/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/products/[id]/route.ts
import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import Product from "../../../../models/Product";
import mongoose from "mongoose";
import {
  transformProductOptionsForVariantGeneration,
  generateVariants,
} from "../route";

// Fonction utilitaire pour convertir Decimal128 en Number
function decimal128ToNumber(
  decimal: mongoose.Types.Decimal128 | undefined | null
): number | null {
  if (decimal === undefined || decimal === null) return null;
  if (typeof decimal === "object" && "toString" in decimal) {
    return parseFloat(decimal.toString());
  }
  return parseFloat(String(decimal));
}

// Nouvelle fonction utilitaire pour formater Decimal128 en chaîne de caractères
function formatDecimal128ToString(
  decimal: mongoose.Types.Decimal128 | undefined | null,
  currencyCode: string = "MAD"
): string | null {
  if (decimal === undefined || decimal === null) return null;
  const value = parseFloat(decimal.toString());
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: currencyCode,
  }).format(value);
}

// GET /api/products/[id] : Récupérer un seul produit par ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const { id } = await params;

  try {
    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    // Transforme le produit pour convertir les champs Decimal128 et ajouter les formats souhaités
    const productObject = product.toObject();
    if (
      productObject.priceData &&
      typeof productObject.priceData === "object"
    ) {
      const currency = productObject.priceData.currency || "MAD";

      // Convertit les valeurs Decimal128 en Number
      if (productObject.priceData.price instanceof mongoose.Types.Decimal128) {
        productObject.priceData.price = decimal128ToNumber(
          productObject.priceData.price
        );
      }
      if (
        productObject.priceData.discountedPrice instanceof
        mongoose.Types.Decimal128
      ) {
        productObject.priceData.discountedPrice = decimal128ToNumber(
          productObject.priceData.discountedPrice
        );
      }
      if (
        productObject.priceData.pricePerUnit instanceof
        mongoose.Types.Decimal128
      ) {
        productObject.priceData.pricePerUnit = decimal128ToNumber(
          productObject.priceData.pricePerUnit
        );
      }

      // Ajoute le champ 'formatted' avec les prix en chaînes de caractères
      productObject.priceData.formatted = {
        price:
          productObject.priceData.price !== null &&
          productObject.priceData.price !== undefined
            ? formatDecimal128ToString(
                new mongoose.Types.Decimal128(
                  String(productObject.priceData.price)
                ),
                currency
              )
            : null,
        discountedPrice:
          productObject.priceData.discountedPrice !== null &&
          productObject.priceData.discountedPrice !== undefined
            ? formatDecimal128ToString(
                new mongoose.Types.Decimal128(
                  String(productObject.priceData.discountedPrice)
                ),
                currency
              )
            : null,
        pricePerUnit:
          productObject.priceData.pricePerUnit !== null &&
          productObject.priceData.pricePerUnit !== undefined
            ? formatDecimal128ToString(
                new mongoose.Types.Decimal128(
                  String(productObject.priceData.pricePerUnit)
                ),
                currency
              )
            : null,
      };
    }

    // Transformation de productOptions
    if (
      productObject.productOptions &&
      Array.isArray(productObject.productOptions)
    ) {
      productObject.productOptions = productObject.productOptions.map(
        (optionGroup: any) => {
          if (optionGroup.values && Array.isArray(optionGroup.values)) {
            optionGroup.values = optionGroup.values.map((value: any) => {
              if (
                value.priceAdjust &&
                value.priceAdjust instanceof mongoose.Types.Decimal128
              ) {
                value.priceAdjust = decimal128ToNumber(value.priceAdjust);
              }
              return value;
            });
          }
          return optionGroup;
        }
      );
    }

    return NextResponse.json(productObject, { status: 200 });
  } catch (error) {
    console.error("Error fetching product:", error);
    if (error instanceof mongoose.Error.CastError) {
      return NextResponse.json(
        { message: "Invalid product ID format" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Error fetching product" },
      { status: 500 }
    );
  }
}

// PUT /api/products/:id : Mettre à jour un produit
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  try {
    const { id } = params;
    const body = await req.json();

    // Convert price fields to Decimal128 before saving (similar to POST)
    if (body.priceData) {
      if (body.priceData.price) {
        body.priceData.price = new mongoose.Types.Decimal128(
          String(body.priceData.price)
        );
      }
      if (
        body.priceData.discountedPrice !== undefined &&
        body.priceData.discountedPrice !== null
      ) {
        body.priceData.discountedPrice = new mongoose.Types.Decimal128(
          String(body.priceData.discountedPrice)
        );
      }
      if (
        body.priceData.pricePerUnit !== undefined &&
        body.priceData.pricePerUnit !== null
      ) {
        body.priceData.pricePerUnit = new mongoose.Types.Decimal128(
          String(body.priceData.pricePerUnit)
        );
      }
    }

    // Recalculate variants on update as well
    if (body.productOptions && Array.isArray(body.productOptions)) {
      const transformedOptions = transformProductOptionsForVariantGeneration(
        body.productOptions
      );
      if (Object.keys(transformedOptions).length > 0) {
        body.variants = generateVariants(
          transformedOptions,
          body.sku,
          body.stock
        );
      } else {
        body.variants = [];
      }
    } else {
      body.variants = [];
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      return NextResponse.json(
        { message: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error: any) {
    console.error(`Error updating product ${params.id}:`, error);
    if (error.name === "ValidationError") {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (error.code === 11000) {
      return NextResponse.json(
        {
          message:
            "Duplicate key error, product name or SKU might already exist.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] : Supprimer un produit par ID (inchangé par rapport à la dernière fois)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const { id } = params;

  try {
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Produit supprimé avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting product:", error);
    if (error instanceof mongoose.Error.CastError) {
      return NextResponse.json(
        { message: "Invalid product ID format" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Erreur lors de la suppression du produit" },
      { status: 500 }
    );
  }
}
