const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

function withApi(route) {
  const base = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  return `${base}${route}`;
}

export async function apiGet(route) {
  const res = await fetch(withApi(route));
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost(route, body) {
  const res = await fetch(withApi(route), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPatch(route, body) {
  const res = await fetch(withApi(route), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
