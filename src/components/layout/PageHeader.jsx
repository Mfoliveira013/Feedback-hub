import React from "react";

export default function PageHeader({
  icon: Icon,
  title,
  subtitle = "",
  actions = null,
}) {
  return (
    <header className="fh-page-header">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            {Icon ? <Icon className="h-5 w-5 text-blue-600 dark:text-blue-300 sm:h-6 sm:w-6" /> : null}
            <h1 className="fh-title text-2xl sm:text-3xl">{title}</h1>
          </div>
          {subtitle ? <p className="fh-subtitle max-w-3xl">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">{actions}</div> : null}
      </div>
    </header>
  );
}
