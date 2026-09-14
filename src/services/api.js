/**
 * Client API centralisé.
 * Utilise les cookies httpOnly pour l'authentification (posés par le serveur).
 * Aucun token n'est stocké en JS — seul le cookie httpOnly est utilisé.
 *
 * Contrat : `get`/`getBlob` lèvent une erreur si la réponse n'est pas OK ;
 * `post`/`put`/`del` renvoient la Response (les appelants testent `res.ok`).
 * Pour qu'aucun échec ne reste silencieux, toute réponse non-OK émet aussi un
 * événement global `api:error` (affiché en toast par ToastProvider).
 */

const REQUEST_TIMEOUT_MS = 20000;
let reloading = false;

function getAuthHeaders() {
  return { "Content-Type": "application/json" };
}

function emitError(message, status, url) {
  try {
    window.dispatchEvent(new CustomEvent("api:error", { detail: { message, status, url } }));
  } catch { /* environnement sans window */ }
}

async function handleAuthResponse(r, url) {
  if (r.status === 401 && !reloading) {
    reloading = true; // un seul rechargement même si 10 requêtes échouent en parallèle
    localStorage.removeItem("crm_user");
    localStorage.removeItem("crm_token"); // cleanup legacy
    window.location.reload();
    return r;
  }
  if (!r.ok && r.status !== 401) {
    // On lit le message sans consommer le body pour l'appelant (clone)
    const err = await r.clone().json().catch(() => ({}));
    emitError(err.error || `Erreur ${r.status}`, r.status, url);
  }
  return r;
}

function request(url, options = {}) {
  return fetch(url, { credentials: "include", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), ...options });
}

const api = {
  get: async (url) => {
    const r = await handleAuthResponse(await request(url, { headers: getAuthHeaders() }), url);
    if (!r.ok) {
      const err = await r.json().catch(() => ({ error: "Erreur serveur" }));
      throw new Error(err.error || `Erreur ${r.status}`);
    }
    return r.json();
  },
  post: async (url, data) => {
    return handleAuthResponse(await request(url, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify(data) }), url);
  },
  put: async (url, data) => {
    return handleAuthResponse(await request(url, { method: "PUT", headers: getAuthHeaders(), body: JSON.stringify(data) }), url);
  },
  del: async (url) => {
    return handleAuthResponse(await request(url, { method: "DELETE", headers: getAuthHeaders() }), url);
  },
  getBlob: async (url) => {
    const r = await handleAuthResponse(await request(url, { signal: AbortSignal.timeout(60000) }), url);
    if (!r.ok) throw new Error("Erreur téléchargement");
    return r.blob();
  },
};

export default api;
