import React, { useState } from "react";
import { User } from "@/entities/User";

const setores = [
  "RH",
  "Controladoria",
  "M.I.S",
  "Tecnologia",
  "Contencioso",
  "Focais",
  "Filiais",
];

export default function CompletarPerfil({ onProfileComplete }) {
  const [fullName, setFullName] = useState("");
  const [setor, setSetor] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    if (!fullName.trim() || !setor) {
      window.alert("Preencha nome completo e setor.");
      return;
    }
    setLoading(true);
    try {
      await User.updateMyUserData({
        full_name: fullName.trim(),
        setor,
      });
      if (onProfileComplete) await onProfileComplete();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Completar Perfil</h1>
        <p className="mt-1 text-sm text-slate-600">
          Estes dados sao obrigatorios para liberar o uso do sistema.
        </p>
        <label className="mt-4 block text-sm text-slate-700">
          Nome completo
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="Digite seu nome"
          />
        </label>
        <label className="mt-3 block text-sm text-slate-700">
          Setor
          <select
            value={setor}
            onChange={(event) => setSetor(event.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
          >
            <option value="">Selecione</option>
            {setores.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Salvar"}
        </button>
      </form>
    </div>
  );
}
