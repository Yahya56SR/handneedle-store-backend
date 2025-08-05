/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/dbConnect";
import CartModel from "@/models/Cart"; // Le modèle Cart que nous avons créé
import Product from "@/models/Product"; // Le modèle Product
import { CartItem } from "@/models/Cart"; // L'interface CartItem

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const { userId, sessionId } = getAuth(req);

    const userIdentifier = userId || sessionId;

    if (!userIdentifier) {
      return NextResponse.json(
        { success: false, error: "No active session found" },
        { status: 401 }
      );
    }

    const { sku, quantity } = await req.json();

    if (!sku || quantity === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing SKU or quantity" },
        { status: 400 }
      );
    }

    // 1. Trouver le produit et le variant correspondant au SKU
    const product = await Product.findOne({ "variants.sku": sku });

    if (!product) {
      return NextResponse.json(
        { success: false, error: `Product with SKU "${sku}" not found.` },
        { status: 404 }
      );
    }

    const variant = product.variants.find((v: any) => v.sku === sku);

    if (!variant) {
      return NextResponse.json(
        { success: false, error: `Variant with SKU "${sku}" not found.` },
        { status: 404 }
      );
    }

    // 2. Trouver ou créer le panier pour l'utilisateur
    let cart = await CartModel.findOne({ userIdentifier });

    if (!cart) {
      cart = await CartModel.create({
        userIdentifier: userIdentifier,
        items: new Map<string, CartItem>(),
        products: [],
      });
    }

    const itemsMap = cart.items;

    // 3. Ajouter, mettre à jour ou supprimer l'article
    if (quantity > 0) {
      // Ajouter ou mettre à jour l'article
      itemsMap.set(sku, {
        productId: product._id,
        name: product.name,
        imageUrl: product.mediaUrls[0] || "",
        price: product.priceData.discountedPrice || product.priceData.price,
        quantity: quantity,
        options: variant.options,
      });
    } else {
      // Supprimer l'article si la quantité est 0
      itemsMap.delete(sku);
    }

    // 4. Mettre à jour le montant total et la liste des IDs de produits
    let newTotalAmount = 0;
    const newProductIds = new Set<string>();

    itemsMap.forEach((item: any) => {
      newTotalAmount += item.price * item.quantity;
      newProductIds.add(item.productId.toString());
    });

    cart.totalAmount = newTotalAmount;
    cart.items = itemsMap;
    cart.products = Array.from(newProductIds); // Mise à jour du tableau de références

    await cart.save();

    return NextResponse.json({ success: true, data: cart }, { status: 200 });
  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
