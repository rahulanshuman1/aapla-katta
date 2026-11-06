// Defaults used until the admin edits something. Stored in MongoDB (Settings collection).
module.exports = {
  brand: {
    name: 'Aapla Katta',
    marathiName: 'आपला कट्टा',
    prefix: 'वेंगुर्लेकरांचा',
    tagline: 'Good Mood Food',
    subtitle: 'Family Restaurant',
    logoUrl: '',      // admin-uploaded logo (data URL). Empty = built-in animated logo
    heroImage: '',    // optional admin-uploaded hero photo
    footerImage: '',  // optional admin-uploaded footer background photo
  },
  theme: {
    preset: 'classic',
    colors: {
      primary: '#C8102E',
      primaryDark: '#8f0b21',
      secondary: '#D4A017',
      accent: '#1f6f50',
      bg: '#FFF8EC',
      surface: '#FFFFFF',
      text: '#2B1B14',
      muted: '#7a6a60',
    },
    banner: { enabled: false, text: '' },
    effect: 'none', // none | diyas | petals | confetti | snow | stars | colors | balloons
  },
  contact: {
    phone: '+91 9763691996',
    whatsapp: '919763691996',
    email: '',
    address: 'Gawade Colony, Bhoir Colony, Chinchwad, Pimpri-Chinchwad, Pune, Maharashtra 411033',
    mapUrl: 'https://maps.google.com/?q=Aapla+Katta+Chinchwad+Pune',
    hours: 'Open daily · Closes 11 pm',
    instagram: 'aapla.katta_gmf',
  },
  charges: {
    gstPercent: 0,
    deliveryFee: 0,
    minOrder: 0,
    acceptingOrders: true,
    enableCOD: true,
  },
  // Free-form text blocks. Keys are referenced from the frontend <Editable k="..."/>.
  content: {},
};
