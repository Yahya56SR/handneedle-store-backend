// src/models/Product.ts
import mongoose from "mongoose";
import slug from "mongoose-slug-generator";

mongoose.plugin(slug);

// Schéma pour une seule variante de produit
const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true }, // SKU unique pour chaque variante
    // MODIFIÉ: Le champ 'options' est maintenant un Map (objet clé-valeur) de chaînes de caractères.
    // Cela permettra de stocker des options comme {"color": "Red", "size": "M"}.
    options: { type: Map, of: String },
    priceAdjustment: { type: Number, default: 0 }, // Ajustement du prix par rapport au prix de base du produit
    stock: { type: Number, required: true, default: 0 }, // Stock pour cette variante spécifique
    // Tu peux ajouter d'autres champs spécifiques à la variante ici, comme imageUrl, etc.
  },
  { _id: false }
);

const priceDataSchema = new mongoose.Schema(
  {
    currency: { type: String, required: true, default: "MAD" }, // Devise (ex: "MAD", "USD", "EUR")
    price: { type: mongoose.Schema.Types.Decimal128, required: true }, // Prix de base
    discountedPrice: { type: mongoose.Schema.Types.Decimal128, default: null }, // Prix réduit (optionnel)
    pricePerUnit: { type: mongoose.Schema.Types.Decimal128, default: null }, // Prix par unité (optionnel)
    // Le champ "formatted" ne sera PAS stocké dans la BDD.
    // Il sera généré dynamiquement dans l'API ou le frontend à partir des valeurs Decimal128.
  },
  { _id: false }
); // _id: false pour ne pas créer un _id pour ce sous-document

const descriptionBlockSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true }, // Le contenu HTML sera stocké comme une chaîne de caractères
  },
  { _id: false }
); // _id: false pour ne pas créer un _id pour chaque bloc dans le tableau

// --- NOUVEAU SCHÉMA POUR LES GROUPES D'OPTIONS DE PRODUIT ---
const productOptionGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Ex: "Color", "Size", "Design"
    optionType: {
      type: String,
      required: true,
      enum: ["none", "drop_down", "color", "json"], // 'json' pour les options arbitraires
      default: "none",
    },
    // Le champ 'choices' sera de type Mixed pour pouvoir stocker:
    // - Un Map pour les options de couleur (ex: {"Red": "#FF0000"})
    // - Un tableau de chaînes pour les listes déroulantes (ex: ["Small", "Medium"])
    // - Un objet arbitraire pour le type 'json'
    choices: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);
// -------------------------------------------------------------------

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, slug: "name" },
  shortDescription: { type: String },
  description: [{ type: descriptionBlockSchema, required: true }],
  sku: { type: String, required: true },
  stock: { type: Number, required: true },
  mediaUrls: [{ type: String, default: "" }],
  published: { type: Boolean, required: true, default: true },
  categories: [{ type: mongoose.SchemaTypes.ObjectId, ref: "category" }],
  tags: [{ type: mongoose.SchemaTypes.ObjectId, ref: "tag" }],
  type: { type: String, required: true, enum: ["Digital", "Physical"] },
  instantDelivery: { type: Boolean, default: false },
  priceData: { type: priceDataSchema, required: true },
  productOptions: [{ type: productOptionGroupSchema, default: {} }],
  variants: [variantSchema],
  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: Date.now() },
  active: Boolean,
  isFeatured: Boolean,
});

// Assurez-vous que les schémas imbriqués sont définis avant d'être utilisés
if (!mongoose.models.Variant) {
  // mongoose.model("VariantOption", variantOptionSchema); // SUPPRIMÉ: variantOptionSchema n'est plus utilisé directement
  mongoose.model("Variant", variantSchema);
}

const Product =
  mongoose.models.product || mongoose.model("product", productSchema);

export default Product;
