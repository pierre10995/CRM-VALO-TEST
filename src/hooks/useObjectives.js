import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { useConfirm } from "../components/common/ConfirmDialog";

export default function useObjectives() {
  const confirm = useConfirm();
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
    const res = await api.post("/api/objectives", data);
    if (res.ok) await load();
    return res.ok;
  };

  const update = async (id, data) => {
    const res = await api.put(`/api/objectives/${id}`, data);
    if (res.ok) await load();
    return res.ok;
  };

  const remove = async (id) => {
    if (!(await confirm("Supprimer cet objectif ?", { confirmLabel: "Supprimer" }))) return false;
    const res = await api.del(`/api/objectives/${id}`);
    if (res.ok) await load();
    return res.ok;
  };

  return { objectives, loading, load, add, update, remove };
}
