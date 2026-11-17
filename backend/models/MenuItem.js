const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  { label: { type: String, required: true }, price: { type: Number, required: true, min: 0 } },
  { _id: false }
);

const menuItemSchema = new mongoose.Schema(
  {
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },     // base price (used when no variants)
    variants: { type: [variantSchema], default: [] },    // e.g. Full / Half
    isVeg: { type: Boolean, default: true },
    tags: { type: [String], default: [] },               // spicy | sweet | chef | popular
    image: { type: String, default: '' },
    available: { type: Boolean, default: true },
    popular: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MenuItem', menuItemSchema);
