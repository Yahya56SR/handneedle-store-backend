/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import Order from "@/models/Order"; // Use your provided model
import dbConnect from "@/lib/dbConnect"; // Assuming you have a DB connection utility
import Product from "@/models/Product";

// POST method to create a new order
export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const {
      shippingAddress,
      billingAdress,
      paymentMethod,
      items: clientItems,
    } = await req.json();

    if (
      !shippingAddress ||
      !billingAdress ||
      !paymentMethod ||
      !clientItems ||
      clientItems.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required order data." },
        { status: 400 }
      );
    }

    const orderItemsMap: any = {};
    const productIds = []; // NOUVEAU: Initialiser l'array pour les IDs de produits
    let totalAmount = 0;

    for (const clientItem of clientItems) {
      const { sku, quantity } = clientItem;

      if (!sku || !quantity || quantity <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid SKU or quantity in items." },
          { status: 400 }
        );
      }

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
          {
            success: false,
            error: `Variant with SKU "${sku}" not found in product.`,
          },
          { status: 404 }
        );
      }

      // NOUVEAU: Ajouter l'ID du produit à l'array
      productIds.push(product._id);

      orderItemsMap[sku] = {
        productId: product._id,
        productName: product.name,
        pricePerUnit:
          product.priceData.discountedPrice || product.priceData.price,
        quantity: quantity,
        variantDetails: variant.options || {},
      };

      totalAmount +=
        (product.priceData.discountedPrice || product.priceData.price) *
        quantity;
    }

    const newOrder = await Order.create({
      totalAmount: totalAmount,
      shippingAddress,
      billingAdress,
      paymentMethod,
      items: orderItemsMap,
      products: productIds, // NOUVEAU: Ajouter l'array des IDs de produits
      orderStatus: "Pending",
      customer: {
        name: "Test Customer",
        email: "test@example.com",
      },
    });

    return NextResponse.json(
      { success: true, data: newOrder },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}

// GET method to fetch all orders
export async function GET() {
  await dbConnect();
  try {
    const orders = await Order.find({});
    return NextResponse.json({ success: true, data: orders }, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
