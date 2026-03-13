import { listUsers } from "../repositories/users.repo.js";
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

export async function resolveFeedbackVisibilityScope(authUser = {}) {
  const cargoScope = getCargoScope(authUser);

  if (cargoScope === "admin_global") {
    return { mode: "all", scopeEmails: [], scopeSetores: [] };
  }

  if (cargoScope === "admin_setor") {
    const scopeSetores = uniqueValues(await resolveAllowedSetoresForUser(authUser), normalizeSetor);
    if (!scopeSetores.length) {
      return { mode: "setor", scopeEmails: [], scopeSetores: [] };
    }

    const usersInScope = await listUsers({ scopeSetores });
    const scopeEmails = uniqueValues(usersInScope.map((user) => user.email), normalizeEmail);

    return { mode: "setor", scopeEmails, scopeSetores };
  }

  if (cargoScope === "gestor") {
    const teamUsers = await resolveManagerTeamForUser(authUser);
    const scopeEmails = uniqueValues(
      [...teamUsers.map((user) => user.email), authUser.email],
      normalizeEmail
    );

    return { mode: "emails", scopeEmails, scopeSetores: [] };
  }

  const ownEmail = normalizeEmail(authUser.email);
  return {
    mode: "emails",
    scopeEmails: ownEmail ? [ownEmail] : [],
    scopeSetores: [],
  };
}

export function canAccessFeedbackByScope(scope = {}, feedback = {}) {
  if (!scope || !feedback) return false;

  if (scope.mode === "all") return true;

  const destinatarioEmail = normalizeEmail(feedback.destinatario_email);
  const remetenteEmail = normalizeEmail(feedback.remetente_email);

  if (scope.mode === "emails") {
    const allowedEmails = uniqueValues(scope.scopeEmails || [], normalizeEmail);
    return allowedEmails.includes(destinatarioEmail) || allowedEmails.includes(remetenteEmail);
  }

  if (scope.mode === "setor") {
    const allowedSetores = uniqueValues(scope.scopeSetores || [], normalizeSetor);
    const allowedEmails = uniqueValues(scope.scopeEmails || [], normalizeEmail);
    const destinatarioSetor = normalizeSetor(feedback.destinatario_setor);

    return (
      allowedSetores.includes(destinatarioSetor) ||
      allowedEmails.includes(destinatarioEmail) ||
      allowedEmails.includes(remetenteEmail)
    );
  }

  return false;
}
