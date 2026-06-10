import { useMemo } from "react";
import { wonMissionsForFY, sumCommission, sumRecruiterCommission } from "../utils/revenue";

export default function useRevenue(missions, users, fiscalYears, selectedFYId) {
  const wonMissions = useMemo(() => wonMissionsForFY(missions, "all"), [missions]);

  const activeFY = useMemo(
    () => selectedFYId !== "all" ? fiscalYears.find(fy => String(fy.id) === selectedFYId) : null,
    [fiscalYears, selectedFYId]
  );

  const filteredWonMissions = useMemo(
    () => wonMissionsForFY(missions, activeFY ? activeFY.id : "all"),
    [missions, activeFY]
  );

  const globalCA = useMemo(() => sumCommission(filteredWonMissions), [filteredWonMissions]);

  const globalRecruiterCommission = useMemo(
    () => sumRecruiterCommission(filteredWonMissions),
    [filteredWonMissions]
  );

  const caByUser = useMemo(() => {
    return users.map(u => {
      const userMissions = filteredWonMissions.filter(m => m.assignedTo === u.id);
      return { ...u, ca: sumCommission(userMissions), count: userMissions.length };
    });
  }, [filteredWonMissions, users]);

  const fyWithCA = useMemo(() => {
    return fiscalYears.map(fy => {
      const fyMissions = wonMissionsForFY(missions, fy.id);
      return { ...fy, ca: sumCommission(fyMissions), count: fyMissions.length };
    });
  }, [missions, fiscalYears]);

  return { wonMissions, activeFY, globalCA, globalRecruiterCommission, caByUser, fyWithCA, filteredWonMissions };
}
