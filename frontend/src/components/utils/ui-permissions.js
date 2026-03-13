import { isAdminCargo, isGestorCargo } from "./cargo";
import { canDelete } from "./permissoes";

const ADMIN_GESTOR_PAGES = new Set([
  "EnviarFeedback",
  "FeedbacksRetroativos",
  "MinhaEquipe",
  "TodosFeedbacks",
  "AvaliacaoAIC",
  "TodasAvaliacoesAIC",
  "PesquisaPeriodica",
  "ResultadosPesquisaPeriodica",
  "DiagnosticoEmails",
  "Relatorios",
  "ImportacaoRelatorios",
]);

function isAdminOrGestor(user) {
  return isAdminCargo(user) || isGestorCargo(user);
}

export function canViewPage(user, pageName = "") {
  if (!user) return false;
  if (!pageName) return true;
  if (ADMIN_GESTOR_PAGES.has(pageName)) {
    return isAdminOrGestor(user);
  }
  return true;
}

export function canViewAction(user, action = "") {
  if (!user) return false;

  if (action === "feedback_delete") return canDelete(user);
  if (action === "feedback_resend_email") return isAdminOrGestor(user);
  if (action === "report_import") return isAdminOrGestor(user);
  if (action === "manage_team") return isAdminCargo(user);

  return true;
}

export function canExecuteAction(user, action = "") {
  return canViewAction(user, action);
}

export function getFriendlyDeniedMessage(context = "acao") {
  if (context === "page") {
    return "Voce nao tem permissao para acessar esta pagina.";
  }
  return "Voce nao tem permissao para executar esta acao.";
}
