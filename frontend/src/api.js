const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '') + '/api';

export const getToken = () => localStorage.getItem('ak_token');
export const setToken = (t) => (t ? localStorage.setItem('ak_token', t) : localStorage.removeItem('ak_token'));

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw Object.assign(new Error('Cannot reach the server. Please check your connection and try again.'), { network: true });
  }
  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) throw Object.assign(new Error(data.message || 'Something went wrong'), { status: res.status, code: data.code });
  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: 'POST', body }),
  put: (p, body) => request(p, { method: 'PUT', body }),
  del: (p) => request(p, { method: 'DELETE' }),
};

/** Resize an image file in the browser and return a compact data URL (keeps PNG transparency). */
export function fileToDataUrl(file, maxSize = 800, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const isPng = file.type === 'image/png' || file.type === 'image/webp';
        resolve(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
