// src/app/api/products/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import Product from "../../../models/Product";
import mongoose from "mongoose";

// --- Helper for transforming product options for variant generation ---
export function transformProductOptionsForVariantGeneration(
  finalProductOptions: any[]
): { [key: string]: string[] } {
  const transformedOptions: { [key: string]: string[] } = {};

  finalProductOptions.forEach((optionGroup) => {
    // Only process option types that contribute to distinct variants
    if (optionGroup.optionType === "color" && optionGroup.choices) {
      // For color type, choices are an object { "Red": "#FF0000" }
      // We want an array of names: ["Red", "Blue"]
      transformedOptions[optionGroup.name] = Object.keys(optionGroup.choices);
    } else if (
      optionGroup.optionType === "drop_down" &&
      Array.isArray(optionGroup.choices)
    ) {
      // For dropdown, choices are an array of strings: ["Small", "Medium"]
      transformedOptions[optionGroup.name] = optionGroup.choices;
    }
    // If optionType is 'json' or 'none', they are not used for simple variant generation here.
  });

  return transformedOptions;
}

// --- generateVariants function (CORRIGÉE pour le champ 'options') ---
export function generateVariants(
  productOptions: { [key: string]: string[] }, // e.g., { "Color": ["Red", "Blue"], "Size": ["S", "M"] }
  baseSku: string,
  baseStock: number
): any[] {
  const optionKeys = Object.keys(productOptions);
  if (optionKeys.length === 0) {
    return [];
  }

  const combinations: { name: string; value: string }[][] = [];

  function generateCombinationsRecursive(
    index: number,
    currentCombination: { name: string; value: string }[]
  ) {
    if (index === optionKeys.length) {
      combinations.push([...currentCombination]);
      return;
    }

    const currentOptionName = optionKeys[index];
    const currentOptionValues = productOptions[currentOptionName];

    for (const value of currentOptionValues) {
      currentCombination.push({ name: currentOptionName, value: value });
      generateCombinationsRecursive(index + 1, currentCombination);
      currentCombination.pop();
    }
  }

  generateCombinationsRecursive(0, []);

  const variants = combinations.map((combination) => {
    const skuSuffix = combination
      .map((opt) => opt.value.replace(/\s+/g, "-").toUpperCase())
      .join("-");

    // MODIFICATION ICI : Transforme le tableau 'combination' en un objet clé-valeur
    const optionsMap: { [key: string]: string } = {};
    combination.forEach((opt) => {
      optionsMap[opt.name] = opt.value;
    });

    return {
      sku: `${baseSku}-${skuSuffix}`,
      options: optionsMap, // Maintenant c'est un objet (qui peut être casté en Map par Mongoose)
      priceAdjustment: 0,
      stock: baseStock,
    };
  });
  return variants;
}
// ----------------------------------------------------------------------

// Fonction utilitaire pour convertir Decimal128 en Number
function decimal128ToNumber(
  decimal: mongoose.Types.Decimal128 | undefined | null
): number | null {
  if (decimal === undefined || decimal === null) return null;
  if (typeof decimal === "object" && "toString" in decimal) {
    return parseFloat(decimal.toString());
  }
  return parseFloat(String(decimal)); // Fallback au cas où le type serait inattendu
}

// Nouvelle fonction utilitaire pour formater Decimal128 en chaîne de caractères
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function formatDecimal128ToString(
  decimal: mongoose.Types.Decimal128 | undefined | null,
  currencyCode: string = "MAD"
): string | null {
  if (decimal === undefined || decimal === null) return null;
  const value = parseFloat(decimal.toString());
  // Utilise "fr-MA" pour le formatage du Dirham marocain
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: currencyCode,
  }).format(value);
}

// GET /api/products : Récupérer tous les produits
export async function GET() {
  await dbConnect();
  try {
    const products = await Product.find({});
    // Convert Decimal128 to Number for client-side consumption
    const productsFormatted = products.map((product) => {
      const p = product.toObject(); // Convert Mongoose document to plain object
      if (p.priceData) {
        p.priceData.price = decimal128ToNumber(
          p.priceData.price as mongoose.Types.Decimal128
        );
        p.priceData.discountedPrice = decimal128ToNumber(
          p.priceData.discountedPrice as mongoose.Types.Decimal128
        );
        p.priceData.pricePerUnit = decimal128ToNumber(
          p.priceData.pricePerUnit as mongoose.Types.Decimal128
        );
      }
      return p;
    });
    return NextResponse.json(productsFormatted, { status: 200 });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { message: "Failed to fetch products." },
      { status: 500 }
    );
  }
}

// POST /api/products : Créer un nouveau produit
export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();

    // Convert price fields to Decimal128 before saving
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

    // Process productOptions (if they contain price adjustments or need other processing)
    if (body.productOptions && Array.isArray(body.productOptions)) {
      body.productOptions = body.productOptions.map((optionGroup: any) => {
        // This 'values' field does not seem to exist in the current frontend `finalProductOptions` structure.
        // Frontend sends: { name, optionType, choices } where choices is an array or object.
        // This block might need adjustment based on how `productOptions` and `priceAdjust` are truly structured.
        // For now, let's assume it doesn't break.
        if (optionGroup.values && Array.isArray(optionGroup.values)) {
          optionGroup.values = optionGroup.values.map((value: any) => {
            if (value.priceAdjust) {
              value.priceAdjust = new mongoose.Types.Decimal128(
                String(value.priceAdjust)
              );
            }
            return value;
          });
        }
        return optionGroup;
      });

      // --- NEW LOGIC: Generate variants based on productOptions ---
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
        body.variants = []; // Ensure variants array is explicitly empty if no options for generation
      }
      // ---------------------------------------------------
    } else {
      body.variants = []; // If no product options, ensure no variants are generated
    }

    const product = await Product.create(body); // Crée un nouveau produit
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product:", error);
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

// DELETE /api/products/:id : Supprimer un produit
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  try {
    const { id } = params;
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return NextResponse.json(
        { message: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Product deleted successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error deleting product ${params.id}:`, error);
    return NextResponse.json(
      { message: "An error occurred while deleting the product." },
      { status: 500 }
    );
  }
}
