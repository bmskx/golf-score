const APPS_SCRIPT_URL = import.meta.env.VITE_GS_API_URL;

// helper: GET
export async function apiGet(params) {
  if (!APPS_SCRIPT_URL) throw new Error("Missing VITE_GS_API_URL");
  const url = new URL(APPS_SCRIPT_URL);
  Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  const res = await fetch(url.toString(), { method: "GET" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `GET failed: ${res.status}`);
  return data;
}

// helper: POST
export async function apiPost(body) {
  if (!APPS_SCRIPT_URL) throw new Error("Missing VITE_GS_API_URL");
  const res = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" }, 
    // Apps Script บางทีรับ text/plain ง่ายกว่า
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `POST failed: ${res.status}`);
  return data;
}
