import React from "react";

const TONE_CLASSES = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300",
  sky: "bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300",
};

export default function StatCard({
  label,
  value,
  helper = "",
  icon: Icon,
  tone = "blue",
}) {
  const toneClass = TONE_CLASSES[tone] || TONE_CLASSES.blue;

  return (
    <article className="fh-card">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-300">{label}</p>
          <p className="mt-1 text-4xl font-extrabold text-slate-900 dark:text-slate-100">{value}</p>
          {helper ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helper}</p> : null}
        </div>
        {Icon ? (
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </article>
  );
}
