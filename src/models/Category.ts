import mongoose, { model, models, Schema } from "mongoose";
import slug from "mongoose-slug-generator";

mongoose.plugin(slug);

const categorySchema = new Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, slug: "name", unique: true },
  image_url: { type: String }, // NOUVEAU: Définition du type pour le schéma
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "category",
  },
  promotion_coupons: [
    { type: mongoose.Schema.Types.ObjectId, ref: "promotion_coupon" },
  ],
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "product" }],
  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: Date.now() },
});

const Category = models.category || model("category", categorySchema);

export default Category;
