// Postes / titres affichés pour certains utilisateurs internes.
// La table `users` ne comporte pas (encore) de champ dédié : on gère ici les
// libellés au cas par cas, par adresse email. Pour ajouter/modifier un titre,
// il suffit de compléter cette table.
const USER_TITLES = {
  "oceane@valo-inno.com": "Partenaire de VALO Recrutement",
};

export function userTitle(user) {
  const login = user?.login;
  if (!login) return "";
  return USER_TITLES[login.toLowerCase()] || "";
}
