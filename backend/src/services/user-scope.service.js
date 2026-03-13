import { resolveManagerTeamForUser } from "./gestor-equipe.service.js";
import { resolveAllowedSetoresForUser } from "./user-setores.service.js";
import { getCargoScope } from "../utils/cargo.js";

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function normalizeSetor(value = "") {
  return String(value || "").trim();
}

function uniqueValues(values = [], normalizer = (value) => value) {
  return Array.from(new Set(values.map((value) => normalizer(value)).filter(Boolean)));
}

function normalizeScopeUserId(authUser = {}) {
  const userId = Number(authUser?.id ?? authUser?.sub);
  return Number.isFinite(userId) && userId > 0 ? userId : null;
}

export async function resolveUserVisibilityScope(authUser = {}) {
  const scopeUserId = normalizeScopeUserId(authUser);
  const cargoScope = getCargoScope(authUser);

  if (cargoScope === "admin_global") {
    return { mode: "all", scopeUserId: null, scopeSetores: [], scopeEmails: [] };
  }

  if (cargoScope === "admin_setor") {
    const scopeSetores = uniqueValues(await resolveAllowedSetoresForUser(authUser), normalizeSetor);
    return { mode: "setores", scopeUserId: null, scopeSetores, scopeEmails: [] };
  }

  if (cargoScope === "gestor") {
    const teamUsers = await resolveManagerTeamForUser(authUser);
    const scopeEmails = uniqueValues(teamUsers.map((user) => user.email), normalizeEmail);
    return { mode: "emails", scopeUserId: null, scopeSetores: [], scopeEmails };
  }

  return {
    mode: "self",
    scopeUserId,
    scopeSetores: [],
    scopeEmails: [],
  };
}

export function canAccessUserByScope(scope = {}, targetUser = {}) {
  if (!scope || !targetUser) return false;

  if (scope.mode === "all") return true;

  if (scope.mode === "self") {
    return Number(targetUser.id) === Number(scope.scopeUserId);
  }

  if (scope.mode === "setores") {
    const allowedSetores = uniqueValues(scope.scopeSetores || [], normalizeSetor);
    return allowedSetores.includes(normalizeSetor(targetUser.setor));
  }

  if (scope.mode === "emails") {
    const allowedEmails = uniqueValues(scope.scopeEmails || [], normalizeEmail);
    return allowedEmails.includes(normalizeEmail(targetUser.email));
  }

  return false;
}
