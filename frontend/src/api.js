const BASE = (import.meta.env.VITE_API_URL || 'https://aapla-katta.onrender.com').replace(/\/$/, '') + '/api';

export const getToken = () => localStorage.getItem('ak_token');
export const setToken = (t) => (t ? localStorage.setItem('ak_token', t) : localStorage.removeItem('ak_token'));

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60000); // free Render servers can take ~50s to wake up
  try {
    res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: ctrl.signal });
  } catch (e) {
    throw Object.assign(new Error(e.name === 'AbortError' ? 'The server is taking too long to respond. Please try again.' : 'Cannot reach the server. Please check your connection and try again.'), { network: true });
  } finally { clearTimeout(timer); }
  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) throw Object.assign(new Error(data.message || 'Something went wrong'), { status: res.status, code: data.code });
  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: 'POST', body }),
  put: (p, body) => request(p, { method: 'PUT', body }),
  del: (p, body) => request(p, { method: 'DELETE', body }),
};

/** Resize an image file in the browser and return a compact data URL (keeps PNG transparency). */
export function fileToDataUrl(file, maxSize = 800, quality = 0.82, { jpeg = false } = {}) {
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
        const ctx = canvas.getContext('2d');
        if (jpeg) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); } // photos: small JPEG, no transparency
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const isPng = !jpeg && (file.type === 'image/png' || file.type === 'image/webp');
        resolve(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
