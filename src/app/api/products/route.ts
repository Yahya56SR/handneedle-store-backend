// src/app/api/products/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import Product from "../../../models/Product";
import Category from "../../../models/Category";
import mongoose from "mongoose";

// TypeScript interface for query parameters
interface ProductQueryParams {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  featured?: boolean;
  new?: boolean;
}

// --- Helper for transforming product options for variant generation ---
function transformProductOptionsForVariantGeneration(
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
function generateVariants(
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

/**
 * GET /api/products : Récupérer tous les produits avec filtres et pagination
 * 
 * Query Parameters:
 * - category?: string - Filter by category ID or slug
 * - search?: string - Search in product name, description, and content
 * - page?: number - Page number for pagination (default: 1, min: 1)
 * - limit?: number - Number of items per page (default: 10, min: 1, max: 100)
 * - featured?: boolean - Filter products in the "Featured Products" category
 * - new?: boolean - Filter products in the "New Arrival" category
 * 
 * Response:
 * {
 *   products: Product[],
 *   pagination: {
 *     currentPage: number,
 *     totalPages: number,
 *     totalProducts: number,
 *     limit: number,
 *     hasNextPage: boolean,
 *     hasPrevPage: boolean
 *   }
 * }
 */
export async function GET(request: Request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract and validate query parameters
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured') === 'true';
    const newParam = searchParams.get('new') === 'true';
    let page = parseInt(searchParams.get('page') || '1', 10);
    let limit = parseInt(searchParams.get('limit') || '10', 10);
    
    // Validate and sanitize parameters
    page = Math.max(1, page); // Ensure page is at least 1
    limit = Math.min(Math.max(1, limit), 100); // Limit between 1 and 100
    
    // Build filter object
    const filter: any = { published: true }; // Only show published products by default
    
    // Category filter - handle both ObjectId and slug
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        filter.categories = category;
      } else {
        // If not a valid ObjectId, treat as category slug and find the category first
        const categoryDoc = await Category.findOne({ slug: category });
        if (categoryDoc) {
          filter.categories = categoryDoc._id;
        } else {
          // If category not found, return empty results
          filter.categories = new mongoose.Types.ObjectId(); // Non-existent ID
        }
      }
    }
    
    // Search filter (searches in name, shortDescription, and description)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
        { 'description.title': { $regex: search, $options: 'i' } },
        { 'description.body': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Featured products filter - find products in "Featured Products" category
    if (featured) {
      const featuredCategory = await Category.findOne({ name: "Featured Products" });
      if (featuredCategory) {
        filter.categories = featuredCategory._id;
      } else {
        // If Featured Products category doesn't exist, return empty results
        filter.categories = new mongoose.Types.ObjectId();
      }
    }
    
    // New products filter - find products in "New Arrival" category
    if (newParam) {
      const newArrivalCategory = await Category.findOne({ name: "New Arrival" });
      if (newArrivalCategory) {
        filter.categories = newArrivalCategory._id;
      } else {
        // If New Arrival category doesn't exist, return empty results
        filter.categories = new mongoose.Types.ObjectId();
      }
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get total count for pagination metadata
    const totalProducts = await Product.countDocuments(filter);
    
    // Find products with filters and pagination
    const products = await Product.find(filter)
      .populate('categories', 'name slug')
      .populate('tags', 'name slug')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Sort by newest first
    
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
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalProducts / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    const response = {
      products: productsFormatted,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        limit,
        hasNextPage,
        hasPrevPage
      }
    };
    
    return NextResponse.json(response, { status: 200 });
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
