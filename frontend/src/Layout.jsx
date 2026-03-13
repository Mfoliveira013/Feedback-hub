import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  ClipboardCheck,
  FileSpreadsheet,
  FileText,
  Files,
  FileUp,
  Grid2x2,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageCircle,
  MoonStar,
  RotateCcw,
  ScrollText,
  Send,
  Settings,
  Sun,
  UserRound,
  Users,
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { toLegacyCargo } from "@/components/utils/cargo";
import { canViewPage, getFriendlyDeniedMessage } from "@/components/utils/ui-permissions";
import CompletarPerfil from "./pages/CompletarPerfil";

const NAV_ITEMS = [
  { name: "Dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    name: "EnviarFeedback",
    label: "Enviar Avaliacao",
    icon: Send,
    roles: ["administrador", "gestor"],
  },
  {
    name: "FeedbacksRetroativos",
    label: "Avaliacoes Retroativas",
    icon: RotateCcw,
    roles: ["administrador", "gestor"],
  },
  {
    name: "MinhaEquipe",
    label: "Todos os Usuarios",
    icon: Users,
    roles: ["administrador", "gestor"],
  },
  {
    name: "TodosFeedbacks",
    label: "Todas as Avaliacoes",
    icon: FileText,
    roles: ["administrador", "gestor"],
  },
  {
    name: "AvaliacaoAIC",
    label: "Avaliacao A.I.C",
    icon: ClipboardCheck,
    roles: ["administrador", "gestor"],
  },
  {
    name: "TodasAvaliacoesAIC",
    label: "Todas as Avaliacoes A.I.C",
    icon: Files,
    roles: ["administrador", "gestor"],
  },
  {
    name: "PesquisaPeriodica",
    label: "Pesquisa Periodica",
    icon: ScrollText,
    roles: ["administrador", "gestor"],
  },
  {
    name: "ResultadosPesquisaPeriodica",
    label: "Resultados das Pesquisas",
    icon: BarChart3,
    roles: ["administrador", "gestor"],
  },
  {
    name: "DiagnosticoEmails",
    label: "Diagnostico de E-mails",
    icon: Mail,
    roles: ["administrador", "gestor"],
  },
  {
    name: "Relatorios",
    label: "Relatorios",
    icon: FileSpreadsheet,
    roles: ["administrador", "gestor"],
  },
  {
    name: "ImportacaoRelatorios",
    label: "Importacao de Relatorios",
    icon: FileUp,
    roles: ["administrador", "gestor"],
  },
  { name: "AppsNef", label: "Todos os App's NEF", icon: Grid2x2 },
  { name: "Perfil", label: "Perfil", icon: UserRound },
  { name: "Configuracoes", label: "Configuracoes", icon: Settings },
];

function canSeeItem(item, user) {
  if (!item.roles) return true;
  if (!user) return false;
  return item.roles.includes(toLegacyCargo(user.cargo || user.cargo_scope));
}

function isItemActive(pathname, href) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function Layout({ children, currentPageName = "" }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingTheme, setSavingTheme] = useState(false);

  const loadCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      const user = await User.me();
      setCurrentUser(user);
      document.documentElement.classList.toggle("dark", user.tema === "escuro");
    } catch {
      setCurrentUser(null);
      document.documentElement.classList.remove("dark");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  const visibleItems = useMemo(
    () => NAV_ITEMS.filter((item) => canSeeItem(item, currentUser)),
    [currentUser]
  );
  const activeItem = useMemo(
    () =>
      visibleItems.find((item) => {
        const href = createPageUrl(item.name);
        return isItemActive(location.pathname, href);
      }) || null,
    [location.pathname, visibleItems]
  );
  const canViewCurrentPage = useMemo(
    () => canViewPage(currentUser, currentPageName),
    [currentPageName, currentUser]
  );

  const handleLogin = async () => {
    await User.login();
    await loadCurrentUser();
  };

  const handleLogout = async () => {
    await User.logout();
    await loadCurrentUser();
  };

  const toggleTheme = async () => {
    if (!currentUser || savingTheme) return;
    const next = currentUser.tema === "escuro" ? "claro" : "escuro";
    setSavingTheme(true);
    document.documentElement.classList.toggle("dark", next === "escuro");
    try {
      await User.updateMyUserData({ tema: next });
      setCurrentUser((prev) => (prev ? { ...prev, tema: next } : prev));
    } finally {
      setSavingTheme(false);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-100 px-4 dark:bg-slate-950">
        <div className="fh-card w-full max-w-sm px-6 py-5 text-sm text-slate-600 dark:text-slate-300">
          Carregando sistema...
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-100 px-4 dark:bg-slate-950">
        <div className="fh-card w-full max-w-xl p-8">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
            <MessageCircle className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-3xl font-extrabold text-slate-900 dark:text-slate-100">Feedback Hub</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Sistema corporativo de avaliacoes e acompanhamento de equipes.
          </p>
          <button
            type="button"
            onClick={handleLogin}
            className="fh-button-primary mt-6"
          >
            Entrar no sistema
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser.full_name || !currentUser.setor) {
    return <CompletarPerfil onProfileComplete={loadCurrentUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-100/90 dark:bg-slate-950">
      <div className="fh-shell">
        <aside className="fh-sidebar flex flex-col">
          <div className="border-b border-slate-200/90 px-4 py-4 dark:border-slate-800/90 sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Feedback Hub</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Sistema Corporativo</p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-3 px-3 py-4 sm:px-4">
            <p className="px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
              Navegacao
            </p>
            <nav className="grid gap-1.5 lg:max-h-[calc(100vh-258px)] lg:overflow-y-auto lg:pr-1">
              {visibleItems.map((item) => {
                const href = createPageUrl(item.name);
                const active = isItemActive(location.pathname, href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={href}
                    className={`fh-sidebar-item ${active ? "fh-sidebar-item-active" : ""}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="hidden border-t border-slate-200/90 px-3 py-3 dark:border-slate-800/90 lg:block">
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/90 p-3.5 shadow-sm dark:border-slate-700/90 dark:bg-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                  {getInitials(currentUser.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{currentUser.full_name}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {currentUser.cargo} - {currentUser.setor}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={toggleTheme}
                  disabled={savingTheme}
                  className="fh-button-secondary h-8 px-2.5 text-xs"
                >
                  {currentUser.tema === "escuro" ? (
                    <Sun className="h-3.5 w-3.5" />
                  ) : (
                    <MoonStar className="h-3.5 w-3.5" />
                  )}
                  {currentUser.tema === "escuro" ? "Claro" : "Escuro"}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="fh-button-secondary h-8 px-2.5 text-xs"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sair
                </button>
              </div>
            </div>
          </div>
        </aside>

        <main className="fh-main">
          <div className="fh-main-inner fh-main-stack">
            <header className="fh-topbar">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Area atual
                </p>
                <p className="truncate text-base font-bold text-slate-900 dark:text-slate-100 sm:text-lg">
                  {activeItem?.label || "Feedback Hub"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-slate-200 sm:flex">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                    {getInitials(currentUser.full_name)}
                  </div>
                  <span className="max-w-[180px] truncate font-semibold">{currentUser.full_name}</span>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  disabled={savingTheme}
                  className="fh-button-secondary h-9 px-3 text-xs lg:hidden"
                >
                  {currentUser.tema === "escuro" ? (
                    <Sun className="h-3.5 w-3.5" />
                  ) : (
                    <MoonStar className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="fh-button-secondary h-9 px-3 text-xs lg:hidden"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </header>
            <div className="fh-page-container">
              <div className="fh-page-content">
                {canViewCurrentPage ? (
                  children
                ) : (
                  <section className="fh-card p-6 text-center">
                    <h2 className="text-lg font-bold text-slate-900">Acesso negado</h2>
                    <p className="mt-2 text-sm text-slate-600">{getFriendlyDeniedMessage("page")}</p>
                    <Link to={createPageUrl("Dashboard")} className="fh-button-secondary mt-4 inline-flex">
                      Voltar ao Dashboard
                    </Link>
                  </section>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
