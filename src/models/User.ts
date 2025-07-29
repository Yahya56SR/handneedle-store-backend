// src/models/User.ts
import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true }, // L'ID du produit
    name: { type: String, required: true },
    imageUrl: { type: String, required: false, default: "" },
    price: { type: Number, required: true }, // Le prix au moment de l'ajout (peut être un Decimal128 si tu veux plus de précision)
    quantity: { type: Number, required: true, min: 1 },
    options: { type: mongoose.Schema.Types.Mixed, default: {} }, // Pour les options comme taille, couleur, etc.
  },
  { _id: false } // Important: ne génère pas d'ID pour ces sous-documents car ils sont des valeurs dans une Map
);

const userSchema = new mongoose.Schema(
  {
    // AJOUTÉ : Définit explicitement _id comme String pour accepter l'ID de Clerk
    _id: { type: String, required: true },
    username: { type: String, required: true },
    fullName: { type: String, required: false },
    lastName: { type: String, required: false },
    phoneNumber: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    imageUrl: { type: String, required: false },
    addresses: [{ type: Object, default: {} }],
    orders: [{ type: Object, default: {} }],
    cartItems: {
      type: Map,
      of: cartItemSchema, // Spécifie que les valeurs de la Map doivent suivre le cartItemSchema
      default: new Map(), // Valeur par défaut pour une Map vide
    },
    usedCoupons: [{ type: Object, default: {} }],
  },
  {
    minimize: false,
    timestamps: true,
    // IMPORTANT : Désactive la génération automatique d'ObjectId pour _id,
    // car nous le fournirons manuellement avec l'ID de Clerk.
    _id: false,
  }
);

const User = mongoose.models.user || mongoose.model("user", userSchema);

export default User;
