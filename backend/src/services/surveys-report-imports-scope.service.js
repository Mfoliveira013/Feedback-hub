import { listUsers } from "../repositories/users.repo.js";
import { resolveFeedbackVisibilityScope } from "./feedback-scope.service.js";
import { resolveUserVisibilityScope } from "./user-scope.service.js";

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function uniqueEmails(values = []) {
  return Array.from(
    new Set((Array.isArray(values) ? values : []).map((value) => normalizeEmail(value)).filter(Boolean))
  );
}

function hasEmailScope(scope = {}) {
  return Array.isArray(scope.scopeEmails);
}

export async function resolveSurveyVisibilityScope(authUser = {}) {
  const baseScope = await resolveFeedbackVisibilityScope(authUser);

  if (baseScope.mode === "all") {
    return { mode: "all", scopeEmails: [] };
  }

  return {
    mode: "emails",
    scopeEmails: uniqueEmails(baseScope.scopeEmails || []),
  };
}

export function canAccessSurveyRecordByScope(scope = {}, record = {}) {
  if (!scope || !record) return false;
  if (scope.mode === "all") return true;

  const allowedEmails = uniqueEmails(scope.scopeEmails || []);
  const relatedEmails = uniqueEmails([
    record.colaborador_email,
    record.destinatario_email,
    record.remetente_email,
  ]);

  return relatedEmails.some((email) => allowedEmails.includes(email));
}

export async function resolveReportImportVisibilityScope(authUser = {}) {
  const userScope = await resolveUserVisibilityScope(authUser);

  if (userScope.mode === "all") {
    return { mode: "all", scopeEmails: [] };
  }

  let scopeEmails = [];

  if (hasEmailScope(userScope)) {
    scopeEmails = uniqueEmails(userScope.scopeEmails || []);
  }

  if (userScope.mode === "setores") {
    const usersInSetores = await listUsers({ scopeSetores: userScope.scopeSetores || [] });
    scopeEmails = uniqueEmails(usersInSetores.map((user) => user.email));
  }

  if (userScope.mode === "self") {
    scopeEmails = uniqueEmails([authUser.email]);
  }

  return {
    mode: "emails",
    scopeEmails,
  };
}

export function canAccessReportImportByScope(scope = {}, reportImport = {}) {
  if (!scope || !reportImport) return false;
  if (scope.mode === "all") return true;

  const allowedEmails = uniqueEmails(scope.scopeEmails || []);
  const importedByEmail = normalizeEmail(reportImport.imported_by || reportImport.imported_by_email);
  return allowedEmails.includes(importedByEmail);
}
