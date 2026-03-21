/**
 * Client API centralisé.
 * Utilise les cookies httpOnly pour l'authentification (posés par le serveur).
 * Conserve le header Authorization en fallback pour la compatibilité.
 */

function getAuthHeaders() {
  const headers = { "Content-Type": "application/json" };
  // Fallback: si le token est encore en localStorage (migration progressive)
  const token = localStorage.getItem("crm_token");
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function handleAuthResponse(r) {
  if (r.status === 401) {
    localStorage.removeItem("crm_token");
    localStorage.removeItem("crm_user");
    window.location.reload();
  }
  return r;
}

const api = {
  get: async (url) => {
    const r = await handleAuthResponse(await fetch(url, { headers: getAuthHeaders(), credentials: "include" }));
    return r.json();
  },
  post: async (url, data) => {
    return handleAuthResponse(await fetch(url, { method: "POST", headers: getAuthHeaders(), credentials: "include", body: JSON.stringify(data) }));
  },
  put: async (url, data) => {
    return handleAuthResponse(await fetch(url, { method: "PUT", headers: getAuthHeaders(), credentials: "include", body: JSON.stringify(data) }));
  },
  del: async (url) => {
    return handleAuthResponse(await fetch(url, { method: "DELETE", headers: getAuthHeaders(), credentials: "include" }));
  },
  getBlob: async (url) => {
    const headers = getAuthHeaders();
    delete headers["Content-Type"];
    const r = await handleAuthResponse(await fetch(url, { headers, credentials: "include" }));
    if (!r.ok) throw new Error("Erreur téléchargement");
    return r.blob();
  },
};

export default api;
