import { useMemo } from "react";

export default function useRevenue(missions, users, fiscalYears, selectedFYId) {
  const wonMissions = useMemo(() => missions.filter(m => m.status === "Gagné"), [missions]);

  const activeFY = useMemo(
    () => selectedFYId !== "all" ? fiscalYears.find(fy => String(fy.id) === selectedFYId) : null,
    [fiscalYears, selectedFYId]
  );

  const globalCA = useMemo(() => {
    const filtered = activeFY
      ? wonMissions.filter(m => String(m.fiscalYearId) === String(activeFY.id))
      : wonMissions;
    return filtered.reduce((s, m) => s + (m.commission || 0), 0);
  }, [wonMissions, activeFY]);

  const caByUser = useMemo(() => {
    return users.map(u => {
      let userMissions = wonMissions.filter(m => m.assignedTo === u.id);
      if (activeFY) userMissions = userMissions.filter(m => String(m.fiscalYearId) === String(activeFY.id));
      return { ...u, ca: userMissions.reduce((s, m) => s + (m.commission || 0), 0), count: userMissions.length };
    });
  }, [wonMissions, users, activeFY]);

  const fyWithCA = useMemo(() => {
    return fiscalYears.map(fy => {
      const fyMissions = wonMissions.filter(m => String(m.fiscalYearId) === String(fy.id));
      const ca = fyMissions.reduce((s, m) => s + (m.commission || 0), 0);
      return { ...fy, ca, count: fyMissions.length };
    });
  }, [wonMissions, fiscalYears]);

  const filteredWonMissions = useMemo(() => {
    return activeFY
      ? wonMissions.filter(m => String(m.fiscalYearId) === String(activeFY.id))
      : wonMissions;
  }, [wonMissions, activeFY]);

  return { wonMissions, activeFY, globalCA, caByUser, fyWithCA, filteredWonMissions };
}
