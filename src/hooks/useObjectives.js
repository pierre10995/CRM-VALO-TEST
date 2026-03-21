import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

export default function useObjectives() {
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/api/objectives");
      setObjectives(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async (data) => {
    await api.post("/api/objectives", data);
    await load();
  };

  const update = async (id, data) => {
    await api.put(`/api/objectives/${id}`, data);
    await load();
  };

  const remove = async (id) => {
    if (!window.confirm("Supprimer cet objectif ?")) return;
    await api.del(`/api/objectives/${id}`);
    await load();
  };

  return { objectives, loading, load, add, update, remove };
}
