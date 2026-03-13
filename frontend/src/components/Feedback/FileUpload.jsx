import React, { useRef } from "react";

export default function FileUpload({ onFileSelected }) {
  const inputRef = useRef(null);

  function onChange(event) {
    const file = event.target.files?.[0];
    if (file && onFileSelected) onFileSelected(file);
  }

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" className="hidden" onChange={onChange} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="fh-button-secondary"
      >
        Selecionar arquivo
      </button>
    </div>
  );
}
