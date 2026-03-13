import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  ChartColumn,
  ClipboardCheck,
  Crown,
  FileCheck2,
  FileClock,
  FilePenLine,
  Flame,
  Gamepad2,
  Medal,
  MessageCircle,
  PenSquare,
  RefreshCcw,
  Rocket,
  Send,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Feedback } from "@/entities/Feedback";
import { User } from "@/entities/User";
import { createPageUrl } from "@/utils";
import StatCard from "@/components/Dashboard/StatCard";
import DashboardFilters from "@/components/Dashboard/DashboardFilters";
import NotesDistribuitionChart from "@/components/Dashboard/NotesDistribuitionChart";
import ClassificationDistribuitionChart from "@/components/Dashboard/ClassificationDistribuitionChart";
import { isAdminCargo } from "@/components/utils/cargo";
import { canViewPage } from "@/components/utils/ui-permissions";
import PageHeader from "@/components/layout/PageHeader";

const TIPO_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "feedback", label: "Feedback" },
  { value: "avaliacao_pontual", label: "Avaliacao Pontual" },
  { value: "avaliacao_periodica", label: "Avaliacao Periodica" },
  { value: "avaliacao_aic", label: "A.I.C" },
];

const EMPTY_FILTERS = {
  fromDate: "",
  toDate: "",
  tipo: "",
  titulo: "",
  setor: "",
  usuario: "",
};

const QUICK_ACTIONS = [
  {
    label: "Nova Avaliacao",
    helper: "Registrar feedback agora",
    page: "EnviarFeedback",
    icon: Send,
  },
  {
    label: "Todas Avaliacoes",
    helper: "Filtrar e revisar registros",
    page: "TodosFeedbacks",
    icon: ChartColumn,
  },
  {
    label: "Retroativas",
    helper: "Registrar eventos passados",
    page: "FeedbacksRetroativos",
    icon: FilePenLine,
  },
  {
    label: "Importar Dados",
    helper: "Upload de relatorios e avaliacoes",
    page: "ImportacaoRelatorios",
    icon: Rocket,
  },
];

function normalizeTitle(value) {
  if (Array.isArray(value)) return value.join(", ");
  return value || "Sem titulo";
}

function isDraft(feedback) {
  return String(feedback.status_avaliacao || "").toLowerCase() === "rascunho";
}

function inDateRange(itemDate, fromDate, toDate) {
  if (!fromDate && !toDate) return true;
  const date = new Date(itemDate);
  if (Number.isNaN(date.getTime())) return false;

  if (fromDate) {
    const start = new Date(`${fromDate}T00:00:00`);
    if (date < start) return false;
  }

  if (toDate) {
    const end = new Date(`${toDate}T23:59:59`);
    if (date > end) return false;
  }

  return true;
}

function toAchievementSet(metrics) {
  return [
    {
      id: "constancia",
      title: "Pulso Ativo",
      description: "Enviar 20+ avaliacoes no periodo filtrado",
      unlocked: metrics.totalSent >= 20,
      icon: Flame,
    },
    {
      id: "qualidade",
      title: "Qualidade de Ouro",
      description: "Media geral de notas acima de 4.0",
      unlocked: metrics.average >= 4,
      icon: Award,
    },
    {
      id: "mestre",
      title: "Mestre A.I.C",
      description: "Ter pelo menos 8 avaliacoes A.I.C enviadas",
      unlocked: metrics.aicSent >= 8,
      icon: Crown,
    },
  ];
}

function formatDayLabel() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  async function loadData() {
    setLoading(true);
    try {
      const [user, allFeedbacks, allUsers] = await Promise.all([
        User.me(),
        Feedback.list("-created_date", 5000),
        User.list(),
      ]);
      setCurrentUser(user);
      setFeedbacks(allFeedbacks);
      setUsers(allUsers);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const usersByEmail = useMemo(
    () => new Map(users.map((user) => [user.email, user])),
    [users]
  );

  const filtered = useMemo(() => {
    return feedbacks.filter((item) => {
      if (!inDateRange(item.data_ocorrido || item.created_date, filters.fromDate, filters.toDate)) {
        return false;
      }

      if (filters.tipo && (item.tipo_avaliacao || "feedback") !== filters.tipo) {
        return false;
      }

      if (filters.titulo && normalizeTitle(item.titulo) !== filters.titulo) {
        return false;
      }

      if (filters.usuario && item.destinatario_email !== filters.usuario) {
        return false;
      }

      if (filters.setor) {
        const setorDestinatario = usersByEmail.get(item.destinatario_email)?.setor || "";
        if (setorDestinatario !== filters.setor) return false;
      }

      return true;
    });
  }, [feedbacks, filters, usersByEmail]);

  const totals = useMemo(() => {
    const totalSent = filtered.filter((item) => !isDraft(item)).length;
    const totalDraft = filtered.filter((item) => isDraft(item)).length;

    const byType = (type, draft) =>
      filtered.filter(
        (item) => (item.tipo_avaliacao || "feedback") === type && isDraft(item) === draft
      ).length;

    const average =
      filtered.length > 0
        ? Number(
            (
              filtered.reduce((acc, item) => acc + Number(item.nota || 0), 0) /
              filtered.length
            ).toFixed(1)
          )
        : 0;

    return {
      totalSent,
      totalDraft,
      feedbackSent: byType("feedback", false),
      feedbackDraft: byType("feedback", true),
      periodicSent: byType("avaliacao_periodica", false),
      periodicDraft: byType("avaliacao_periodica", true),
      aicSent: byType("avaliacao_aic", false),
      aicDraft: byType("avaliacao_aic", true),
      average,
    };
  }, [filtered]);

  const notesData = useMemo(() => {
    const base = [0, 1, 2, 3, 4, 5].map((value) => ({ label: `Nota ${value}`, total: 0 }));
    filtered.forEach((item) => {
      const score = Number(item.nota || 0);
      const safeIndex = Math.max(0, Math.min(5, Math.round(score)));
      base[safeIndex].total += 1;
    });
    return base;
  }, [filtered]);

  const classificationData = useMemo(() => {
    const map = new Map();
    filtered.forEach((item) => {
      const label = item.classificacao || "Sem classificacao";
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map.entries()).map(([label, total]) => ({ label, total }));
  }, [filtered]);

  const titleOptions = useMemo(() => {
    const unique = Array.from(
      new Set(feedbacks.map((item) => normalizeTitle(item.titulo)).filter(Boolean))
    );
    return [
      { value: "", label: "Todos" },
      ...unique.map((title) => ({ value: title, label: title })),
    ];
  }, [feedbacks]);

  const setorOptions = useMemo(() => {
    const unique = Array.from(new Set(users.map((user) => user.setor).filter(Boolean)));
    return [
      { value: "", label: "Todos" },
      ...unique.map((setor) => ({ value: setor, label: setor })),
    ];
  }, [users]);

  const userOptions = useMemo(() => {
    const options = users.map((user) => ({
      value: user.email,
      label: user.full_name || user.email,
    }));
    return [{ value: "", label: "Todos os usuarios" }, ...options];
  }, [users]);

  const gamification = useMemo(() => {
    const currentEmail = currentUser?.email;
    const mySent = filtered.filter(
      (item) => item.remetente_email === currentEmail && !isDraft(item)
    ).length;
    const myReceived = filtered.filter(
      (item) => item.destinatario_email === currentEmail && !isDraft(item)
    ).length;

    const missionTarget = isAdminCargo(currentUser) ? 24 : 12;
    const missionProgress = Math.min(100, Math.round((mySent / Math.max(1, missionTarget)) * 100));

    const xp = totals.totalSent * 8 + mySent * 14 + Math.round(totals.average * 10);
    const xpPerLevel = 120;
    const level = Math.max(1, Math.floor(xp / xpPerLevel) + 1);
    const xpInLevel = xp % xpPerLevel;
    const levelProgress = Math.min(100, Math.round((xpInLevel / xpPerLevel) * 100));

    const senderMap = new Map();
    filtered.forEach((item) => {
      if (isDraft(item)) return;
      const key = item.remetente_email || "sem-email";
      const current = senderMap.get(key) || {
        email: key,
        name: item.remetente_nome || item.remetente_email || "Sem nome",
        sent: 0,
      };
      current.sent += 1;
      senderMap.set(key, current);
    });

    const ranking = Array.from(senderMap.values())
      .sort((a, b) => b.sent - a.sent)
      .slice(0, 5);

    return {
      mySent,
      myReceived,
      missionTarget,
      missionProgress,
      xp,
      level,
      xpInLevel,
      xpPerLevel,
      levelProgress,
      ranking,
      achievements: toAchievementSet(totals),
    };
  }, [currentUser, filtered, totals]);

  function onFilterChange(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  if (loading) {
    return <p className="text-sm text-slate-600 dark:text-slate-300">Carregando dashboard...</p>;
  }

  return (
    <div className="fh-page">
      <PageHeader
        icon={ChartColumn}
        title="Dashboard de Analise"
        subtitle={`Ola, ${currentUser?.full_name || "usuario"}. ${formatDayLabel()} | Painel consolidado de desempenho.`}
        actions={
          <button type="button" onClick={loadData} className="fh-button-secondary">
            <RefreshCcw className="h-4 w-4" />
            Atualizar
          </button>
        }
      />

      <DashboardFilters
        filters={filters}
        onChange={onFilterChange}
        onClear={() => setFilters(EMPTY_FILTERS)}
        tipoOptions={TIPO_OPTIONS}
        titleOptions={titleOptions}
        setorOptions={setorOptions}
        userOptions={userOptions}
      />

      <div className="grid gap-3 lg:grid-cols-3">
        <section className="fh-gamified-card p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
            <Target className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            Missao da Semana
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Enviar <strong>{gamification.missionTarget}</strong> avaliacoes. Voce esta em <strong>{gamification.mySent}</strong>.
          </p>
          <div className="fh-progress-track mt-3">
            <div className="fh-progress-fill" style={{ width: `${gamification.missionProgress}%` }} />
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Progresso: {gamification.missionProgress}%
          </p>
        </section>

        <section className="fh-gamified-card p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
            <Gamepad2 className="h-4 w-4 text-violet-600 dark:text-violet-300" />
            Nivel de Engajamento
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">Nivel {gamification.level}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">XP total: {gamification.xp}</p>
          <div className="fh-progress-track mt-3">
            <div className="fh-progress-fill" style={{ width: `${gamification.levelProgress}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {gamification.xpInLevel}/{gamification.xpPerLevel} XP para o proximo nivel
          </p>
        </section>

        <section className="fh-gamified-card p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
            <Sparkles className="h-4 w-4 text-amber-500 dark:text-amber-300" />
            Conquistas
          </div>
          <ul className="space-y-2">
            {gamification.achievements.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <li
                  key={achievement.id}
                  className={`rounded-md border px-3 py-2 text-xs ${
                    achievement.unlocked
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-700/60 dark:bg-emerald-900/25 dark:text-emerald-300"
                      : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <Icon className="h-3.5 w-3.5" />
                    {achievement.title}
                  </div>
                  <p className="mt-1">{achievement.description}</p>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total de Avaliacoes Enviadas"
          value={totals.totalSent}
          icon={Send}
          tone="blue"
        />
        <StatCard
          label="Total em Rascunho"
          value={totals.totalDraft}
          icon={FileClock}
          tone="amber"
        />
        <StatCard
          label="Feedbacks Enviados"
          value={totals.feedbackSent}
          icon={MessageCircle}
          tone="violet"
        />
        <StatCard
          label="Feedbacks em Rascunho"
          value={totals.feedbackDraft}
          icon={PenSquare}
          tone="rose"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Aval. Periodicas Enviadas"
          value={totals.periodicSent}
          icon={FileCheck2}
          tone="emerald"
        />
        <StatCard
          label="Periodicas em Rascunho"
          value={totals.periodicDraft}
          icon={FilePenLine}
          tone="sky"
        />
        <StatCard
          label="A.I.C Enviadas"
          value={totals.aicSent}
          icon={ClipboardCheck}
          tone="blue"
        />
        <StatCard
          label="A.I.C em Rascunho"
          value={totals.aicDraft}
          icon={FileClock}
          tone="violet"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="fh-card">
          <div className="fh-card-header">Pontuacao Geral</div>
          <div className="fh-card-body flex flex-wrap items-center justify-between gap-4">
            <div className="text-center">
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-[7px] border-emerald-500 border-l-emerald-200 dark:border-emerald-400 dark:border-l-emerald-900">
                <span className="text-4xl font-extrabold text-slate-800 dark:text-slate-100">
                  {totals.average.toFixed(1)}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Media Geral de Notas</p>
            </div>

            <div className="grid gap-2 text-sm">
              <div className="rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">Avaliacoes recebidas por voce</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{gamification.myReceived}</p>
              </div>
              <div className="rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">Avaliacoes enviadas por voce</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{gamification.mySent}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="fh-card">
          <div className="fh-card-header">Ranking de Engajamento</div>
          <div className="fh-card-body space-y-2">
            {gamification.ranking.map((item, index) => (
              <div key={item.email} className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{item.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.email}</p>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-300">
                  {index === 0 ? <Medal className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                  {item.sent}
                </div>
              </div>
            ))}
            {gamification.ranking.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Sem dados de ranking no filtro atual.</p>
            ) : null}
          </div>
        </section>
      </div>

      <section className="fh-card">
        <div className="fh-card-header">Acoes Rapidas</div>
        <div className="fh-card-body grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACTIONS.filter((action) => canViewPage(currentUser, action.page)).map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.page}
                to={createPageUrl(action.page)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-500 dark:hover:bg-slate-700"
              >
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">{action.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{action.helper}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-3 xl:grid-cols-2">
        <ClassificationDistribuitionChart data={classificationData} />
        <NotesDistribuitionChart data={notesData} />
      </div>
    </div>
  );
}
