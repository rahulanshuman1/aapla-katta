const router = require('express').Router();
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Public menu (admins get ?all=1 to also see hidden categories)
router.get('/', optionalAuth, async (req, res) => {
  const showAll = req.query.all && req.user?.role === 'admin';
  const cats = await Category.find(showAll ? {} : { active: true }).sort({ order: 1 }).lean();
  const items = await MenuItem.find({ category: { $in: cats.map((c) => c._id) } }).sort({ order: 1, name: 1 }).lean();
  const byCat = {};
  items.forEach((i) => (byCat[i.category] ||= []).push(i));
  res.json({ categories: cats.map((c) => ({ ...c, items: byCat[c._id] || [] })) });
});

// ---- Admin: categories ----
router.post('/categories', protect, adminOnly, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Name required' });
  let slug = slugify(name);
  if (await Category.exists({ slug })) slug += '-' + Date.now().toString(36);
  const last = await Category.findOne().sort({ order: -1 });
  const cat = await Category.create({ ...req.body, slug, order: (last?.order || 0) + 1 });
  res.status(201).json(cat);
});
router.put('/categories/:id', protect, adminOnly, async (req, res) => {
  const { slug, _id, ...rest } = req.body;
  res.json(await Category.findByIdAndUpdate(req.params.id, rest, { new: true }));
});
router.delete('/categories/:id', protect, adminOnly, async (req, res) => {
  await MenuItem.deleteMany({ category: req.params.id });
  await Category.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// ---- Admin: items ----
const clean = (b) => {
  const out = { ...b };
  delete out._id;
  if (out.price !== undefined) out.price = Number(out.price) || 0;
  if (Array.isArray(out.variants)) {
    out.variants = out.variants.filter((v) => v.label && v.price !== '' && v.price != null).map((v) => ({ label: v.label, price: Number(v.price) || 0 }));
  }
  return out;
};
router.post('/items', protect, adminOnly, async (req, res) => {
  const b = clean(req.body);
  if (!b.name || !b.category) return res.status(400).json({ message: 'Name and category required' });
  if (b.variants?.length && !b.price) b.price = Math.min(...b.variants.map((v) => v.price));
  const last = await MenuItem.findOne({ category: b.category }).sort({ order: -1 });
  res.status(201).json(await MenuItem.create({ ...b, order: (last?.order || 0) + 1 }));
});
router.put('/items/:id', protect, adminOnly, async (req, res) => {
  const b = clean(req.body);
  if (b.variants?.length) b.price = Math.min(...b.variants.map((v) => v.price));
  res.json(await MenuItem.findByIdAndUpdate(req.params.id, b, { new: true }));
});
router.delete('/items/:id', protect, adminOnly, async (req, res) => {
  await MenuItem.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
