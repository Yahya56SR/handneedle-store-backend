// src/models/Tag.ts
import mongoose from "mongoose";
import slug from "mongoose-slug-generator";

mongoose.plugin(slug);

const tagSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // MODIFIÉ : Ajout de unique: true
  slug: { type: String, slug: "name" },
  products: [{ type: mongoose.SchemaTypes.ObjectId, ref: "product" }], // Assure-toi que le ref est "product"
  // AJOUTÉ : Timestamps pour created/updated at
  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: Date.now() },
});

const Tag = mongoose.models.tag || mongoose.model("tag", tagSchema);

export default Tag;
