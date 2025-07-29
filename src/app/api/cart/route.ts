// src/app/api/cart/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server"; // Ou directement '@clerk/nextjs' si tu utilises le middleware fonctionnel
import dbConnect from "../../../lib/dbConnect";
import User from "../../../models/User";
import Product from "../../../models/Product";
import mongoose from "mongoose";

// Interface pour la structure d'un article dans le panier (pour la requête)
interface CartItemData {
  productId: string;
  quantity: number;
  options?: { [key: string]: string };
}

// Fonction utilitaire pour convertir Decimal128 en Number
function decimal128ToNumber(
  decimal: mongoose.Types.Decimal128 | undefined | null
): number {
  if (decimal === undefined || decimal === null) return 0;
  // Vérifie si c'est un objet Decimal128 avant d'appeler .toString()
  if (typeof decimal === "object" && "toString" in decimal) {
    return parseFloat(decimal.toString());
  }
  // Si c'est déjà un nombre ou autre type compatible
  return parseFloat(String(decimal));
}

// --- GET /api/cart : Récupérer le panier de l'utilisateur ---
export async function GET() {
  await dbConnect();
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { message: "Unauthorized: User not authenticated" },
      { status: 401 }
    );
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { message: "User not found in database" },
        { status: 404 }
      );
    }

    let cartItemsObject = {};

    // Vérifie si user.cartItems est une instance de Map (nouveaux documents)
    if (user.cartItems instanceof Map) {
      cartItemsObject = Object.fromEntries(user.cartItems);
    }
    // Si c'est un objet simple (anciens documents) et non null
    else if (typeof user.cartItems === "object" && user.cartItems !== null) {
      // Convertit l'objet simple en tableau d'entrées, puis en objet
      cartItemsObject = Object.fromEntries(Object.entries(user.cartItems));
    }
    // Si user.cartItems est null ou undefined, il restera {} (initialisé au-dessus)
    // Cela gère les cas où le champ n'existe pas ou est nul dans d'anciens documents.

    return NextResponse.json(cartItemsObject, { status: 200 });
  } catch (error) {
    console.error("Error fetching user cart:", error);
    return NextResponse.json(
      { message: "Error fetching cart" },
      { status: 500 }
    );
  }
}

// --- POST /api/cart : Ajouter/Mettre à jour un article dans le panier ---
export async function POST(req: Request) {
  await dbConnect();
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { message: "Unauthorized: User not authenticated" },
      { status: 401 }
    );
  }

  try {
    const { productId, quantity, options }: CartItemData = await req.json();

    if (!productId || typeof quantity !== "number" || quantity <= 0) {
      return NextResponse.json(
        { message: "Invalid product ID or quantity" },
        { status: 400 }
      );
    }

    // Valider si le productId est un ObjectId valide (si tes Product IDs sont des ObjectIds Mongoose)
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { message: "Invalid Product ID format" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: "User not found in database" },
        { status: 404 }
      );
    }

    const product = await Product.findById(productId);
    if (!product || product.published === false) {
      return NextResponse.json(
        { message: "Product not found or not available" },
        { status: 404 }
      );
    }

    // Récupère le prix du produit et le convertit en nombre
    const itemPrice = decimal128ToNumber(product.priceData?.price);

    // Initialise cartItems comme une Map si ce n'est pas déjà le cas (pour les anciens documents)
    if (!(user.cartItems instanceof Map)) {
      user.cartItems = new Map(Object.entries(user.cartItems || {}));
    }

    // Crée ou met à jour l'article dans la Map du panier
    user.cartItems.set(productId, {
      productId: productId,
      name: product.name,
      imageUrl: product.mediaUrls?.[0] || "",
      price: itemPrice,
      quantity: quantity,
      options: options || {},
    });

    await user.save(); // Sauvegarde le document utilisateur avec le panier mis à jour

    const updatedCartItemsObject = Object.fromEntries(user.cartItems);
    return NextResponse.json(updatedCartItemsObject, { status: 200 });
  } catch (error) {
    console.error("Error adding/updating item in cart:", error);
    // Gérer spécifiquement les erreurs de validation du schéma de CartItem
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        { message: `Validation Error: ${error.message}` },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Error processing cart item" },
      { status: 500 }
    );
  }
}

// --- DELETE /api/cart : Supprimer un article ou vider le panier ---
export async function DELETE(req: Request) {
  await dbConnect();
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { message: "Unauthorized: User not authenticated" },
      { status: 401 }
    );
  }

  try {
    const { productId }: { productId?: string } = await req.json();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: "User not found in database" },
        { status: 404 }
      );
    }

    // Initialise cartItems comme une Map si ce n'est pas déjà le cas (pour les anciens documents)
    if (!(user.cartItems instanceof Map)) {
      user.cartItems = new Map(Object.entries(user.cartItems || {}));
    }

    if (productId) {
      // Supprimer un article spécifique
      if (user.cartItems.has(productId)) {
        // Utilise .has() pour vérifier l'existence
        user.cartItems.delete(productId); // Utilise .delete() pour supprimer
        console.log(`Product ${productId} removed from user ${userId}'s cart.`);
      } else {
        return NextResponse.json(
          { message: "Product not found in cart" },
          { status: 404 }
        );
      }
    } else {
      // Vider tout le panier
      user.cartItems.clear(); // Utilise .clear() pour vider la Map
      console.log(`Cart cleared for user ${userId}.`);
    }

    await user.save();
    const updatedCartItemsObject = Object.fromEntries(user.cartItems);
    return NextResponse.json(updatedCartItemsObject, { status: 200 });
  } catch (error) {
    console.error("Error deleting item/clearing cart:", error);
    return NextResponse.json(
      { message: "Error processing cart deletion" },
      { status: 500 }
    );
  }
}
