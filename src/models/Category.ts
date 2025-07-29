import mongoose from "mongoose";
import slug from "mongoose-slug-generator";

mongoose.plugin(slug);

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, slug: "name" },
  promotion_coupons: [
    { type: mongoose.SchemaTypes.ObjectId, ref: "promotion_coupon" },
  ],
  products: [{ type: mongoose.SchemaTypes.ObjectId, ref: "product" }],
  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: Date.now() },
});

const Category =
  mongoose.models.category || mongoose.model("category", categorySchema);

export default Category;
