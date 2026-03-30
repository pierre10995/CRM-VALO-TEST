/**
 * Client API centralisé.
 * Utilise les cookies httpOnly pour l'authentification (posés par le serveur).
 * Aucun token n'est stocké en JS — seul le cookie httpOnly est utilisé.
 */

function getAuthHeaders() {
  return { "Content-Type": "application/json" };
}

async function handleAuthResponse(r) {
  if (r.status === 401) {
    localStorage.removeItem("crm_user");
    localStorage.removeItem("crm_token"); // cleanup legacy
    window.location.reload();
  }
  return r;
}

const api = {
  get: async (url) => {
    const r = await handleAuthResponse(await fetch(url, { headers: getAuthHeaders(), credentials: "include" }));
    if (!r.ok) {
      const err = await r.json().catch(() => ({ error: "Erreur serveur" }));
      throw new Error(err.error || `Erreur ${r.status}`);
    }
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
