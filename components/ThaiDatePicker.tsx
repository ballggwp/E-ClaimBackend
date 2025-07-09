// components/ThaiDatePicker.tsx
"use client";

import React, { useRef } from "react";

interface Props {
  name: string;
  label: string;
  value: string;                // ISO: "YYYY-MM-DD"
  onChange: (iso: string) => void;
  disabled: boolean;
  inputClass: string;
}

function formatBE(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyyBE = d.getFullYear() + 543;
  return `${dd}/${mm}/${yyyyBE}`;
}

export default function ThaiDatePicker({
  name,
  label,
  value,
  onChange,
  disabled,
  inputClass,
}: Props) {
  const dateRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    if (!disabled) {
      // showPicker() works in modern browsers; falls back to focus
      dateRef.current?.showPicker?.() ?? dateRef.current?.focus();
    }
  };

  return (
    <div onClick={openPicker} className="relative">
      <label htmlFor={name} className="block mb-1 font-medium">
        {label}
      </label>

      {/* read-only text input, formatted as dd/MM/YYYY BE */}
      <input
        id={name}
        name={name}
        type="text"
        readOnly
        value={formatBE(value)}
        disabled={disabled}
        className={inputClass}
      />

      {/* invisible real date input, just for the browser picker */}
      <input
        ref={dateRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </div>
  );
}
