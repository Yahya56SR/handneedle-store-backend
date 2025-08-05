// src/models/Cart.ts
import mongoose, { Schema, Document } from "mongoose";

// Définir l'interface pour un article dans le panier,
// en utilisant la même structure que votre fichier CartItem.ts.
export interface CartItem {
  productId: mongoose.Schema.Types.ObjectId; // Utiliser ObjectId pour référencer le produit
  name: string;
  imageUrl: string;
  price: number;
  quantity: number;
  variants?: Record<string, string>;
}

// Définir l'interface pour le document Cart
export interface CartDocument extends Document {
  userIdentifier: string; // Utilisé pour stocker l'ID de Clerk (userId ou sessionId)
  items: Map<string, CartItem>; // Une map pour gérer les articles par SKU
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Définir le schéma pour un article de panier en utilisant les types de Mongoose
const CartItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "product", required: true },
    name: { type: String, required: true },
    imageUrl: { type: String, required: false, default: "" },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    variants: { type: Map, of: String },
  },
  { _id: false }
);

// Définir le schéma principal du panier
const CartSchema = new Schema(
  {
    // La clé unique pour identifier le panier, qu'il soit pour un utilisateur
    // authentifié (userId) ou un invité (sessionId)
    userIdentifier: { type: String, required: true, unique: true },
    items: {
      type: Map,
      of: CartItemSchema,
      default: new Map(),
    },
    totalAmount: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

// S'assurer que le modèle n'est pas redéfini
const CartModel =
  mongoose.models.Cart || mongoose.model<CartDocument>("Cart", CartSchema);

export default CartModel;
