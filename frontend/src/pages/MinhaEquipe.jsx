import React, { useEffect, useMemo, useState } from "react";
import { Search, UsersRound } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { User } from "@/entities/User";
import { Feedback } from "@/entities/Feedback";
import { isAdminCargo } from "@/components/utils/cargo";
import { canExecuteAction, getFriendlyDeniedMessage } from "@/components/utils/ui-permissions";
import { filterUsersByPermission } from "@/components/utils/permissoes";

function getInitial(name = "") {
  return String(name).trim().slice(0, 1).toLowerCase() || "u";
}

export default function MinhaEquipe() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [rows, setRows] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [search, setSearch] = useState("");
  const [setorFilter, setSetorFilter] = useState("");
  const [permissionMessage, setPermissionMessage] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [user, users, allFeedbacks] = await Promise.all([
          User.me(),
          User.list(),
          Feedback.list("-created_date", 5000),
        ]);
        setCurrentUser(user);
        setRows(filterUsersByPermission(users, user));
        setFeedbacks(allFeedbacks);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const setores = useMemo(() => {
    const counts = new Map();
    rows.forEach((user) => {
      const setor = user.setor || "Sem setor";
      counts.set(setor, (counts.get(setor) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([setor, total]) => ({ setor, total }))
      .sort((a, b) => a.setor.localeCompare(b.setor));
  }, [rows]);

  const metricsByUser = useMemo(() => {
    const map = new Map();
    feedbacks.forEach((item) => {
      const key = item.destinatario_email;
      const previous = map.get(key) || { total: 0, sum: 0 };
      previous.total += 1;
      previous.sum += Number(item.nota || 0);
      map.set(key, previous);
    });
    return map;
  }, [feedbacks]);

  const filteredRows = useMemo(() => {
    const text = search.toLowerCase().trim();
    return rows.filter((user) => {
      if (setorFilter && (user.setor || "Sem setor") !== setorFilter) return false;
      if (!text) return true;
      return (
        String(user.full_name || "").toLowerCase().includes(text) ||
        String(user.email || "").toLowerCase().includes(text)
      );
    });
  }, [rows, search, setorFilter]);

  if (loading) return <p className="text-sm text-slate-600">Carregando equipe...</p>;

  return (
    <div className="fh-page">
      <PageHeader
        icon={UsersRound}
        title={isAdminCargo(currentUser) ? "Todos os Usuarios" : "Minha Equipe"}
        subtitle="Visualize e gerencie membros por setor, com indicadores de desempenho."
      />
      {permissionMessage ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {permissionMessage}
        </div>
      ) : null}

      <section className="max-w-md">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar por nome ou e-mail..."
            className="fh-input pl-9"
          />
        </label>
      </section>

      <div className="grid gap-3 xl:grid-cols-[260px_1fr]">
        <section className="fh-card h-fit">
          <div className="fh-card-header">Setores</div>
          <div className="fh-card-body space-y-1">
            <button
              type="button"
              onClick={() => setSetorFilter("")}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-semibold ${
                setorFilter === "" ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"
              }`}
            >
              <span>Todos</span>
              <span className="fh-chip">{rows.length}</span>
            </button>
            {setores.map((item) => (
              <button
                type="button"
                key={item.setor}
                onClick={() => setSetorFilter(item.setor)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-semibold ${
                  setorFilter === item.setor ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"
                }`}
              >
                <span className="truncate">{item.setor}</span>
                <span className="fh-chip">{item.total}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRows.map((user) => {
            const metrics = metricsByUser.get(user.email) || { total: 0, sum: 0 };
            const average = metrics.total ? (metrics.sum / metrics.total).toFixed(1) : "0.0";

            return (
              <article key={user.id} className="fh-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-700">
                    {getInitial(user.full_name)}
                  </div>
                </div>

                <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-center text-xs font-semibold text-slate-700">
                  {user.full_name || user.email}
                </div>

                <p className="mt-2 truncate text-center text-xs text-slate-500">{user.email}</p>

                <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                  <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-center">
                    {user.cargo || "usuario"}
                  </span>
                  <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-center">
                    {user.setor || "Sem setor"}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                  <div>
                    <p className="text-2xl font-extrabold text-blue-600">{metrics.total}</p>
                    <p className="text-xs text-slate-500">Recebidas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-emerald-600">{average}/5</p>
                    <p className="text-xs text-slate-500">Media</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPermissionMessage(getFriendlyDeniedMessage("acao"))}
                  disabled={!canExecuteAction(currentUser, "manage_team")}
                  className="fh-button-secondary mt-3 w-full text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Atribuir Gestor
                </button>
              </article>
            );
          })}

          {filteredRows.length === 0 ? (
            <div className="fh-card p-8 text-center text-sm text-slate-500 sm:col-span-2 lg:col-span-3">
              Nenhum usuario encontrado para os filtros selecionados.
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
