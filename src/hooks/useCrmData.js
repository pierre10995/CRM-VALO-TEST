import { useState, useRef, useMemo, useCallback } from "react";
import api from "../services/api";

/**
 * Couche de données du CRM : états par entité, chargement initial et
 * rechargement ciblé par clé (une mutation ne recharge que ce qu'elle impacte).
 *
 *   const data = useCrmData();
 *   data.reload("contacts", "candidatures");   // ciblé
 *   data.loadAll();                             // tout
 */
export default function useCrmData() {
  const [contacts, setContacts] = useState([]);
  const [missions, setMissions] = useState([]);
  const [candidatures, setCandidatures] = useState([]);
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [fiscalYears, setFiscalYears] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [workModes, setWorkModes] = useState([]);
  const [validationStatuses, setValidationStatuses] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Chaque clé correspond à un endpoint et à son setter.
  const endpoints = useRef({
    contacts: ["/api/contacts", setContacts],
    missions: ["/api/missions", setMissions],
    candidatures: ["/api/candidatures", setCandidatures],
    activities: ["/api/activities", setActivities],
    users: ["/api/users", setUsers],
    fiscalYears: ["/api/fiscal-years", setFiscalYears],
    sectors: ["/api/sectors", setSectors],
    workModes: ["/api/work-modes", setWorkModes],
    validationStatuses: ["/api/validation-statuses", setValidationStatuses],
  }).current;

  // Numéro de séquence par clé : si deux rechargements se croisent, seul le
  // plus récent est appliqué (une réponse ancienne n'écrase pas la nouvelle).
  const loadSeq = useRef({});

  const reload = useCallback(async (...keys) => {
    const targets = keys.length ? keys : Object.keys(endpoints);
    const seqs = {};
    targets.forEach(k => { seqs[k] = (loadSeq.current[k] || 0) + 1; loadSeq.current[k] = seqs[k]; });
    // allSettled : un endpoint en échec (ex. réservé admin pour un non-admin)
    // ne doit pas empêcher le chargement du reste.
    const results = await Promise.allSettled(targets.map(k => api.get(endpoints[k][0])));
    results.forEach((r, i) => {
      const k = targets[i];
      if (r.status === "fulfilled" && loadSeq.current[k] === seqs[k]) endpoints[k][1](r.value);
    });
    setLoaded(true);
  }, [endpoints]);

  const loadAll = useCallback(() => reload(), [reload]);

  const candidates = useMemo(() => contacts.filter(c => c.status === "Candidat"), [contacts]);
  const clients = useMemo(() => contacts.filter(c => c.status === "Client" || c.status === "Prospect"), [contacts]);

  return {
    contacts, missions, candidatures, activities, users, fiscalYears, sectors, workModes, validationStatuses,
    candidates, clients, loaded,
    reload, loadAll,
    // Exposé pour les mises à jour optimistes (ex. cocher une activité)
    setActivities,
  };
}
