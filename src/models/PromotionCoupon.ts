// src/models/PromotionCoupon.ts
import mongoose from "mongoose";

const promotionCouponsSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true }, // MODIFIÉ : Ajout de required: true
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ["Percentage Discount", "Fixed Amount Discount", "Free Shipping"],
    required: true, // AJOUTÉ : Le type de coupon est généralement requis
  },
  value: { type: mongoose.SchemaTypes.Decimal128, required: true },
  appliesTo: {
    type: String,
    enum: [
      "All Products",
      "Specific Products",
      "Specific Categories",
      "New Users",
      "Specific Users",
    ],
    required: true, // AJOUTÉ : Il est important de savoir à quoi le coupon s'applique
  },
  categories: [{ type: mongoose.SchemaTypes.ObjectId, ref: "category" }], // Référence au modèle Category
  products: [{ type: mongoose.SchemaTypes.ObjectId, ref: "product" }], // Référence au modèle Product
  // Tu pourrais ajouter un champ pour les utilisateurs spécifiques si appliesTo: "Specific Users"
  specificUsers: [{ type: mongoose.SchemaTypes.ObjectId, ref: "user" }],

  usageLimit: { type: Number, required: true },
  usageLimitPerUser: { type: Number, required: true, default: 1 },
  minimumOrderAmount: { type: mongoose.SchemaTypes.Decimal128, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: false },
  // AJOUTÉ : Timestamps pour created/updated at
  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: Date.now() },
});

const PromotionCoupon =
  mongoose.models.promotion_coupon ||
  mongoose.model("promotion_coupon", promotionCouponsSchema); // Changé en "promotion_coupon" pour la cohérence avec les autres noms de modèles singuliers

export default PromotionCoupon;
