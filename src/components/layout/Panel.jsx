import React from "react";

export default function Panel({ title = "", children, className = "", bodyClassName = "" }) {
  return (
    <section className={`fh-card ${className}`.trim()}>
      {title ? <div className="fh-card-header">{title}</div> : null}
      <div className={`fh-card-body ${bodyClassName}`.trim()}>{children}</div>
    </section>
  );
}
