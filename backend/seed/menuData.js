// Menu transcribed from the restaurant's printed menu (latest price list).
// Line format:  Name | price            -> single price
//               Name | full/half        -> two sizes (Full / Half)
// Flags after a 3rd "|":  s = spicy, w = sweet, c = chef recommendation, p = popular
module.exports = [
  { group: 'Starters & Sides', name: 'Soups', icon: '🍲', items: `
Manchow Soup|100
Tomato Soup|100
Noodle Soup|100
Clear Soup|100
Sweet Corn Soup|110
Paneer Manchow Soup|120
Paneer Clear Soup|120
Mushroom Soup|120` },
  { group: 'Starters & Sides', name: 'Mocktails', icon: '🍹', items: `
Sweet Lime|60
Sweet Lime Soda|80
Virgin Mojito|100
Blue Lagoon|100` },
  { group: 'Starters & Sides', name: 'Khane Ke Sath Sath', icon: '🥣', items: `
Boondi Raita|90
Mix Veg Raita|95` },
  { group: 'Starters & Sides', name: 'Starters', icon: '🥟', items: `
Masala Papad|50
Potato Chilli|180
Veg Manchurian|180|p
Veg 65|180
Crispy Corn|200
Veg Crispy|200
Mushroom Chilli|220
Mushroom Manchurian|220
Mushroom 65|220
Paneer Manchurian|220
Paneer 65|220|p
Paneer Popcorn|220
Paneer Chilli|220
Paneer Crispy|220
Chinese Platter|800` },
  { group: 'Starters & Sides', name: 'Tandoori Starters', icon: '🍢', items: `
Veg Seekh Kebab|240
Paneer Tikka|250|p
Hariyali Paneer Tikka|250
Paneer Malai Tikka|260
Paneer Achari Tikka|260
Mushroom Tikka|250
Tandoor Platter|900` },

  { group: 'Main Course', name: 'Veg Main Course', icon: '🥘', items: `
Mix Veg|170
Green Peas Masala|180
Veg Khurma|180|w
Veg Kolhapuri|180|s
Veg Handi|190
Veg Kadai|190
Veg Chatpata|190
Veg Hydrebadi|190
Methi Mutter|190
Veg Adraki|190
Behndi Masala|190
Behndi Fry|190
Methi Mutter Malai|200|w
Veg Jaipuri|200
Veg Maratha|200|s
Veg Tawa|200
Veg Angara|200|s
Veg Kofta|200|c
Veg Bhoona|200
Cheese Peas Masala|200
Veg Diwani Handi|200
Behndi Kurmure|210
Veg Toofani|210` },
  { group: 'Main Course', name: 'Mushroom Main Course', icon: '🍄', items: `
Mushroom Kadai|200
Mushroom Masala|210
Mutter Mushroom Masala|220
Paneer Mushroom Masala|250` },
  { group: 'Main Course', name: 'Paneer Main Course', icon: '🧀', items: `
Mutter Paneer|200
Paneer Masala|200
Paneer Lasuni|220
Paneer Makhnwala|220|w
Paneer Kadai|220
Paneer Butter Masala|220|w,p
Paneer Tikka Masala|220|s,p
Palak Paneer|220
Paneer Kolhapuri|220|s
Paneer Cheese Masala|230
Paneer Kurma|230|w
Paneer Handi|230
Paneer Chili Milli|230|s
Paneer Bhurji|230
Paneer Hairyali|230
Paneer Basket|230
Paneer Rimzim|230
Palak Paneer Lasuni|230
Paneer Cheese Kurma|240|w
Paneer Cheese Butter Masala|240|w
Paneer Cheese Tikka Masala|240|s
Shahi Paneer|240
Paneer Tawa|240
Paneer Cheese Tawa|260
Paneer Rajwadi|260|c
Paneer Avgani|260
Kaju Masala|260
Kaju Paneer Masala|260
Kaju Paneer Cheese Masala|290` },
  { group: 'Main Course', name: 'Aapla Katta Special', icon: '⭐', description: 'Signature house specials', items: `
Veg Ratnagiri|240
Veg Ratnagiri Kurma|250|w
Navratna Kurma|250|w
Paneer Hydrebadi|250|s
Paneer Chingari|250|s
Paneer Lajawab|250
Paneer Navabi|250|w
Paneer 65 Masala|250|s
Paneer Lahori|250|w
Paneer Patiyala|250
Paneer Angara|250|s
Paneer Do Pyaza|250
Veg Mumtaj|260
Aapla Katta Special|260|p
Paneer Hungama|260|c
Paneer Ghungroo|260
Paneer Pasanda|260|c
Kashmiri Tikka Masala|260|w
Malai Panner Korma|270|w
Veg Tiranga|270
Paneer Methi Chaman|270` },
  { group: 'Main Course', name: 'Dal', icon: '🍛', items: `
Dal Fry|140
Dal Hyderbadi|150
Dal Tadka|160|p
Dal Kolhapuri|160|s
Dal Makhni|180` },

  { group: 'Breads & Rice', name: 'Indian Breads', icon: '🫓', items: `
Roti (Maida)|25
Butter Roti (Maida)|30
Roti (Wheat)|30
Butter Roti (Wheat)|35
Naan|50
Butter Naan|60
Cheese Butter Naan|120
Garlic Naan|90
Garlic Butter Naan|100
Garlic Cheese Butter Naan|120
Laccha Paratha (Maida)|35
Laccha Paratha Butter (Maida)|40
Laccha Paratha (Wheat)|45
Laccha Paratha Butter (Wheat)|50
Tawa Laccha Paratha (Maida)|30
Tawa Laccha Paratha (Wheat)|35` },
  { group: 'Breads & Rice', name: 'Paratha', icon: '🥞', items: `
Aloo Paratha|80
Aloo Cheese Paratha|100
Onion Paratha|80
Onion Cheese Paratha|100
Gobi Paratha|80
Gobi Cheese Paratha|100
Mix Veg Paratha|90
Mix Veg Cheese Paratha|110
Paneer Paratha|110
Paneer Cheese Paratha|130` },
  { group: 'Breads & Rice', name: 'Rice Darbar', icon: '🍚', items: `
Steam Rice|130
Jeera Rice|150/110
Curd Rice|170
Green Peas Pulav|170
Vegetable Pulav|180
Paneer Vegetable Pulav|185
Cheese Pulav|200
Dal Kichdi|180
Palak Kichdi|190
Kadi Kichdi|200
Kashmiri Pulav|220|w
Veg Biryani|200|p
Paneer Biryani|220
Cheese Biryani|230
Mushroom Biryani|220
Veg Hyderbadi Biryani|210
Paneer Hyderbadi Biryani|230` },

  { group: 'Chinese', name: 'Chinese Rice', icon: '🍚', items: `
Veg Fried Rice|160/100|p
Paneer Fried Rice|190
Veg Schezwan Rice|170/110
Paneer Schezwan Rice|200
Veg Singaporean Rice|170/110
Paneer Singaporean Rice|200
Veg Hong Kong Rice|170/110
Paneer Hong Kong Rice|200
Veg Combo Rice|180/120
Paneer Combo Rice|210
Veg Burnt Garlic Rice|180/120
Paneer Burnt Garlic Rice|210
Veg Crispy Rice|180/120
Paneer Crispy Rice|210
Veg Manchurian Rice|180/120
Paneer Manchurian Rice|210
Veg Triple Rice|200
Paneer Triple Rice|230
Veg Chopper Rice|200
Paneer Chopper Rice|230
Veg Thousand Rice|220
Paneer Thousand Rice|250` },
  { group: 'Chinese', name: 'Chinese Noodles', icon: '🍜', items: `
Veg Hakka Noodles|160/100
Paneer Fried Noodles|190
Veg Schezwan Noodles|170/110|p
Paneer Schezwan Noodles|200
Veg Singaporean Noodles|170/110
Paneer Singaporean Noodles|200
Veg Hong Kong Noodles|170/110
Paneer Hong Kong Noodles|200
Veg Combo Noodles|180/120
Paneer Combo Noodles|210
Veg Burnt Garlic Noodles|180/120
Paneer Burnt Garlic Noodles|210
Veg Crispy Noodles|180/120
Paneer Crispy Noodles|210
Veg Manchurian Noodles|180/120
Paneer Manchurian Noodles|210
Veg Triple Noodles|200
Paneer Triple Noodles|230
Veg Chopper Noodles|200
Paneer Chopper Noodles|230
Veg Thousand Noodles|220
Paneer Thousand Noodles|250` },

  { group: 'Snacks & Drinks', name: 'Hot Beverages', icon: '☕', items: `
Tea|20
Special Tea|40
Coffee|40` },
  { group: 'Snacks & Drinks', name: 'Cold Beverages', icon: '🥤', items: `
Masala Taak|25|p
Lassi|40
Cold Coffee|60
Cold Coffee With Softy|90` },
  { group: 'Snacks & Drinks', name: 'Snacks', icon: '🥖', description: 'Puneri & Mumbai specials', items: `
Misal Pav|70|p
Cheese Misal Pav|100
Pav Bhaji|90
Cheese Pav Bhaji|120
Pav Jodi|10
Butter Pav Jodi|15
Masala Pav Jodi|30
Farsan Vati|15
Dahi Vati|15
Matki Vati|15` },
  { group: 'Snacks & Drinks', name: 'South Indian', icon: '🥞', items: `
Plain Dosa|60
Plain Cheese Dosa|80
Masala Dosa|70|p
Cheese Masala Dosa|90
Onion Uttapa|70
Cheese Onion Uttapa|90
Tomato Onion Uttapa|80
Cheese Tomato Onion Uttapa|100
Cut Dosa|70
Cheese Cut Dosa|90
Schezwan Dosa|80
Cheese Schezwan Dosa|100
Paper Masala Dosa|150
Cheese Paper Masala Dosa|170
Idli Sambar|50
Meduvada Sambar|50
Idli Vada Mix|60` },
  { group: 'Snacks & Drinks', name: 'Sandwich & Fries', icon: '🥪', items: `
Bread Butter Toast|35
Veg Sandwich|60
Veg Cheese Sandwich|80
Veg Grilled Sandwich|70
Veg Cheese Grilled Sandwich|90
Veg Club Sandwich|120
French Fries|100
Peri Peri French Fries|120` },
];
