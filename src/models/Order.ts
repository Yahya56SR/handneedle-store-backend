import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true },
    productId: { type: mongoose.SchemaTypes.ObjectId, ref: "product" },
    quantity: { type: Number, required: true },
    pricePerUnit: { type: Number, required: true },
    variantDetails: { type: Object },
  },
  { id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderDate: { type: Date, default: Date.now() },
    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Refunded",
      ],
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    shippingAddress: {
      type: Object,
    },
    billingAdress: {
      type: Object,
    },
    items: {
      type: Map,
      of: orderItemSchema,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["Credit Card", "PayPal", "Bank Transfer", "Cash"],
    },
    products: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "product",
      },
    ],
  },
  {
    timestamps: true, // Ajoute createdAt et updatedAt automatiquement
  }
);

const Order = mongoose.models.order || mongoose.model("order", orderSchema);

export default Order;
