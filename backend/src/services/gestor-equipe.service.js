import { listTeamUsersByManagerEmail } from "../repositories/gestor-equipe.repo.js";
import { getCargoScope } from "../utils/cargo.js";

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

export async function resolveManagerTeamForUser(authUser = {}) {
  const cargoScope = getCargoScope(authUser);
  if (cargoScope !== "gestor") {
    return [];
  }

  const managerEmail = normalizeEmail(authUser.email);
  if (!managerEmail) {
    return [];
  }

  return listTeamUsersByManagerEmail(managerEmail);
}
