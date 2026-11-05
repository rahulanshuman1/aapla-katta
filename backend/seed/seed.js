require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const data = require('./menuData');

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function parse(text) {
  return text.trim().split('\n').map((line, idx) => {
    const [name, price, flags = ''] = line.split('|').map((x) => x.trim());
    const f = flags.split(',').filter(Boolean);
    const tags = [];
    if (f.includes('s')) tags.push('spicy');
    if (f.includes('w')) tags.push('sweet');
    if (f.includes('c')) tags.push('chef');
    const item = { name, tags, popular: f.includes('p'), order: idx, isVeg: true };
    if (price.includes('/')) {
      const [full, half] = price.split('/').map(Number);
      item.variants = [{ label: 'Half', price: Math.min(full, half) }, { label: 'Full', price: Math.max(full, half) }];
      item.price = Math.min(full, half);
    } else item.price = Number(price);
    return item;
  });
}

async function run() {
  await MenuItem.deleteMany({});
  await Category.deleteMany({});
  for (let i = 0; i < data.length; i++) {
    const c = data[i];
    const cat = await Category.create({ name: c.name, slug: slugify(c.name), group: c.group, icon: c.icon, description: c.description || '', order: i });
    await MenuItem.insertMany(parse(c.items).map((it) => ({ ...it, category: cat._id })));
  }
  console.log(`Seeded ${data.length} categories and ${await MenuItem.countDocuments()} items`);
}

module.exports = { run };

if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI).then(run).then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
