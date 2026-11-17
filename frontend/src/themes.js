// Festival theme presets. Admin can pick one (or customise every colour) from the Appearance tab.
const base = { primaryDark: '#8f0b21', surface: '#FFFFFF', text: '#2B1B14', muted: '#7a6a60' };

export const THEMES = {
  classic: {
    label: 'Classic Katta', emoji: '🍛', effect: 'none', banner: '',
    colors: { ...base, primary: '#C8102E', secondary: '#D4A017', accent: '#1f6f50', bg: '#FFF8EC' },
  },
  diwali: {
    label: 'Diwali', emoji: '🪔', effect: 'diyas', banner: '🪔 Happy Diwali! Enjoy festive specials at Aapla Katta ✨',
    colors: { ...base, primary: '#D9480F', primaryDark: '#9c3409', secondary: '#F5B301', accent: '#7B2CBF', bg: '#FFF3DC', text: '#3a1c0b' },
  },
  holi: {
    label: 'Holi', emoji: '🎨', effect: 'colors', banner: '🎨 Happy Holi! Bura na mano, Holi hai! 🌈',
    colors: { ...base, primary: '#D6246E', primaryDark: '#9d1450', secondary: '#FFB703', accent: '#00A6A6', bg: '#FFF5FA' },
  },
  ganesh: {
    label: 'Ganesh Chaturthi', emoji: '🐘', effect: 'petals', banner: '🌺 Ganpati Bappa Morya! 🙏',
    colors: { ...base, primary: '#E85D04', primaryDark: '#a84300', secondary: '#C9A227', accent: '#9D0208', bg: '#FFF6E5' },
  },
  navratri: {
    label: 'Navratri', emoji: '💃', effect: 'stars', banner: '💃 Shubh Navratri – Garba nights & festive thalis!',
    colors: { ...base, primary: '#B5179E', primaryDark: '#7b0f6c', secondary: '#F7B801', accent: '#F3722C', bg: '#FFF5FC' },
  },
  christmas: {
    label: 'Christmas', emoji: '🎄', effect: 'snow', banner: '🎄 Merry Christmas from Aapla Katta! 🎅',
    colors: { ...base, primary: '#B3001B', primaryDark: '#7a0012', secondary: '#D4AF37', accent: '#146B3A', bg: '#F6FBF7' },
  },
  eid: {
    label: 'Eid', emoji: '🌙', effect: 'stars', banner: '🌙 Eid Mubarak! Wishing you joy & great food ✨',
    colors: { ...base, primary: '#0B6E4F', primaryDark: '#07503a', secondary: '#D4AF37', accent: '#1d3557', bg: '#F3FBF7' },
  },
  republic: {
    label: 'Republic / Independence Day', emoji: '🇮🇳', effect: 'balloons', banner: '🇮🇳 Jai Hind! Celebrate with a tri-colour treat.',
    colors: { ...base, primary: '#E8710A', primaryDark: '#a85207', secondary: '#1a237e', accent: '#138808', bg: '#FFFDF7' },
  },
  sankranti: {
    label: 'Makar Sankranti', emoji: '🪁', effect: 'confetti', banner: '🪁 Tilgul ghya, god god bola! Happy Makar Sankranti',
    colors: { ...base, primary: '#E76F51', primaryDark: '#a94a31', secondary: '#E9C46A', accent: '#2A9D8F', bg: '#FFF7EE' },
  },
  newyear: {
    label: 'New Year', emoji: '🎆', effect: 'confetti', banner: '🎆 Happy New Year! Cheers to good mood & good food 🥂',
    colors: { ...base, primary: '#1D3557', primaryDark: '#12233a', secondary: '#E9B44C', accent: '#E63946', bg: '#F8FAFF' },
  },
};

export const EFFECTS = {
  none: [],
  diyas: ['🪔', '✨', '🎇'],
  petals: ['🌸', '🌼', '🌺'],
  confetti: ['🎊', '🎉', '✨', '🪁'],
  snow: ['❄️', '❅', '❆'],
  stars: ['🌙', '⭐', '✨'],
  colors: ['🟣', '🟠', '🟡', '🔴', '🟢', '🔵'],
  balloons: ['🎈', '🎈', '🇮🇳'],
};
