import React, { useEffect, useState } from "react";
import { Bell, Palette, Settings, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { User } from "@/entities/User";
import { Preference } from "@/entities/Preference";

export default function Configuracoes() {
  const [tema, setTema] = useState("claro");
  const [accountType, setAccountType] = useState("-");
  const [accountSetor, setAccountSetor] = useState("-");
  const [loading, setLoading] = useState(true);
  const [savingTheme, setSavingTheme] = useState(false);
  const [prefs, setPrefs] = useState({
    language: "pt-BR",
    emailNotifications: true,
    pushNotifications: false,
  });

  useEffect(() => {
    async function load() {
      try {
        const [me, prefsData] = await Promise.all([User.me(), Preference.me()]);
        setTema(me.tema || "claro");
        setAccountType(me.cargo || "-");
        setAccountSetor(me.setor || "-");
        setPrefs(prefsData);
      } finally {
        setLoading(false);
      }
    }
    load().catch((error) => {
      window.alert(error instanceof Error ? error.message : "Falha ao carregar configuracoes");
    });
  }, []);

  async function saveTheme(nextTheme) {
    setTema(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "escuro");
    setSavingTheme(true);
    try {
      await User.updateMyUserData({ tema: nextTheme });
    } finally {
      setSavingTheme(false);
    }
  }

  async function updatePrefs(patch) {
    const previous = prefs;
    const next = { ...previous, ...patch };
    setPrefs(next);
    try {
      await Preference.updateMyPreferences(next);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Falha ao salvar preferencias");
      setPrefs(previous);
    }
  }

  if (loading) return <p className="text-sm text-slate-600">Carregando configuracoes...</p>;

  return (
    <div className="fh-page">
      <PageHeader
        icon={Settings}
        title="Configuracoes"
        subtitle="Personalize sua experiencia no Feedback Hub."
      />

      <section className="fh-card">
        <div className="fh-card-header inline-flex items-center gap-2">
          <Palette className="h-4 w-4 text-violet-600" /> Aparencia
        </div>
        <div className="fh-card-body grid gap-3">
          <label className="flex flex-wrap items-center justify-between gap-3">
            <span>
              <span className="block text-sm font-semibold text-slate-800">Tema da Interface</span>
              <span className="text-xs text-slate-500">Escolha entre tema claro ou escuro.</span>
            </span>
            <select
              value={tema}
              onChange={(event) => saveTheme(event.target.value)}
              disabled={savingTheme}
              className="fh-select w-[170px]"
            >
              <option value="claro">Claro</option>
              <option value="escuro">Escuro</option>
            </select>
          </label>

          <label className="flex flex-wrap items-center justify-between gap-3">
            <span>
              <span className="block text-sm font-semibold text-slate-800">Idioma</span>
              <span className="text-xs text-slate-500">Selecione o idioma da interface.</span>
            </span>
            <select
              value={prefs.language}
              onChange={(event) => updatePrefs({ language: event.target.value })}
              className="fh-select w-[170px]"
            >
              <option value="pt-BR">Portuguese (BR)</option>
              <option value="en-US">English (US)</option>
              <option value="es-ES">Espanol</option>
            </select>
          </label>
        </div>
      </section>

      <section className="fh-card">
        <div className="fh-card-header inline-flex items-center gap-2">
          <Bell className="h-4 w-4 text-blue-600" /> Notificacoes
        </div>
        <div className="fh-card-body space-y-3">
          <label className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-3">
            <span>
              <span className="block text-sm font-semibold text-slate-800">Notificacoes por E-mail</span>
              <span className="text-xs text-slate-500">Receba notificacoes de novos feedbacks por e-mail.</span>
            </span>
            <input
              type="checkbox"
              checked={prefs.emailNotifications}
              onChange={(event) => updatePrefs({ emailNotifications: event.target.checked })}
              className="h-4 w-4"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-3">
            <span>
              <span className="block text-sm font-semibold text-slate-800">Notificacoes Push</span>
              <span className="text-xs text-slate-500">Receba notificacoes push no navegador.</span>
            </span>
            <input
              type="checkbox"
              checked={prefs.pushNotifications}
              onChange={(event) => updatePrefs({ pushNotifications: event.target.checked })}
              className="h-4 w-4"
            />
          </label>
        </div>
      </section>

      <section className="fh-card">
        <div className="fh-card-header inline-flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" /> Privacidade e Seguranca
        </div>
        <div className="fh-card-body space-y-3">
          <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-3">
            <p className="text-sm font-semibold text-blue-800">Protecao de Dados</p>
            <p className="text-xs text-blue-700">
              Seus feedbacks sao armazenados localmente de forma protegida para uso analitico interno.
            </p>
          </div>
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3">
            <p className="text-sm font-semibold text-emerald-800">Acesso Seguro</p>
            <p className="text-xs text-emerald-700">
              Recomendamos manter autenticacao de dois fatores ativa e revisar acessos periodicamente.
            </p>
          </div>
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3">
            <p className="text-sm font-semibold text-amber-800">Retencao de Dados</p>
            <p className="text-xs text-amber-700">
              Os registros sao mantidos para historico e analises. Solicite remocao via suporte interno quando necessario.
            </p>
          </div>
        </div>
      </section>

      <section className="fh-card">
        <div className="fh-card-header">Informacoes da Conta</div>
        <div className="fh-card-body grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-slate-500">Versao do Sistema:</span> <strong>v1.0.0</strong>
          </p>
          <p>
            <span className="text-slate-500">Ultimo Login:</span> <strong>Agora</strong>
          </p>
          <p>
            <span className="text-slate-500">Tipo de Conta:</span> <strong>{accountType}</strong>
          </p>
          <p>
            <span className="text-slate-500">Setor:</span> <strong>{accountSetor}</strong>
          </p>
        </div>
      </section>
    </div>
  );
}
