function getAuthHeaders() {
  const token = localStorage.getItem("crm_token");
  const headers = { "Content-Type": "application/json" };
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
  get: async (url) => { const r = await handleAuthResponse(await fetch(url, { headers: getAuthHeaders() })); return r.json(); },
  post: async (url, data) => { return handleAuthResponse(await fetch(url, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify(data) })); },
  put: async (url, data) => { return handleAuthResponse(await fetch(url, { method: "PUT", headers: getAuthHeaders(), body: JSON.stringify(data) })); },
  del: async (url) => { return handleAuthResponse(await fetch(url, { method: "DELETE", headers: getAuthHeaders() })); },
  getBlob: async (url) => {
    const headers = getAuthHeaders();
    delete headers["Content-Type"];
    const r = await handleAuthResponse(await fetch(url, { headers }));
    if (!r.ok) throw new Error("Erreur téléchargement");
    return r.blob();
  },
};

export default api;
