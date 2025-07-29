// src/models/Review.ts
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  rating: { type: Number, required: true, min: 1, max: 5 }, // Ajout de min/max pour la note
  title: { type: String, required: false },
  comment: { type: String, required: false },
  date: { type: Date, default: Date.now() },
  reviewStatus: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  }, // 'Approuved' corrigé en 'Approved', et ajout de default
  isVerifiedBuyer: { type: Boolean, default: false },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "product",
    required: true,
  }, // NOUVEAU : Référence au produit
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true }, // NOUVEAU : Référence à l'utilisateur
  createdAt: { type: Date, default: Date.now() }, // Ajout de timestamps
  updatedAt: { type: Date, default: Date.now() }, // Ajout de timestamps
});

const Review = mongoose.models.review || mongoose.model("review", reviewSchema);

export default Review;
