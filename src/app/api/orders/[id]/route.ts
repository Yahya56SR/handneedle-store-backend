// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import Order from "@/models/Order"; // Your Order model
import dbConnect from "@/lib/dbConnect"; // Your DB connection utility
import { Types } from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const { id } = params;

  // Validate the order ID
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, error: "Invalid order ID." },
      { status: 400 }
    );
  }

  try {
    const order = await Order.findById(id).populate("products");

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order }, { status: 200 });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}

// PUT method to update an order's status
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const { id } = params;

  // Validate the order ID
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, error: "Invalid order ID." },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const { orderStatus } = body;

    // Optional: Add validation for the new status if needed
    // e.g., if (!["Pending", "Processing", "Shipped", "Delivered", ...].includes(orderStatus)) { ... }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { orderStatus },
      { new: true, runValidators: true } // `new: true` returns the updated document
    );

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: updatedOrder },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const { id } = params;

  // Validate the order ID
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, error: "Invalid order ID." },
      { status: 400 }
    );
  }

  try {
    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: null }, { status: 200 });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
