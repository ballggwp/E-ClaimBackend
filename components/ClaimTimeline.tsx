"use client";

import React from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale/th";

interface Props {
  statusDates: Record<string, string>;
  currentStatus: string;
}

const STEPS = [
  { code: "SUBMITTED", label: "Submitted" },
  { code: "PENDING_APPROVER_REVIEW", label: "Approver" },
  { code: "PENDING_INSURER_REVIEW", label: "Insurer" },
  { code: "PENDING_INSURER_FORM", label: "InsurerForm" },
  { code: "PENDING_MANAGER_REVIEW", label: "Manager" },
  { code: "PENDING_USER_CONFIRM", label: "Confirm" },
  { code: "COMPLETED", label: "Done" },
];

export function ClaimTimelineWithDates({ statusDates, currentStatus }: Props) {
  const total = STEPS.length;
  const currentIndex = STEPS.findIndex((s) => s.code === currentStatus);
  const isAllDone = currentStatus === "COMPLETED";
  const completedCount = isAllDone ? total : currentIndex + 1;
  const fillPercent = ((completedCount - 1) / (total - 1)) * 100;

  return (
    <div
      className="relative grid items-center"
      style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
    >
      {/* background track */}
      <div
        className="absolute inset-y-0 flex items-center z-0"
        style={{ left: `${50 / total}%`, right: `${50 / total}%` }}
      >
        <div className="w-full h-1 bg-gray-200 rounded-full" />
      </div>

      {/* filled track */}
      <div
        className="absolute inset-y-0 flex items-center z-10 pointer-events-none"
        style={{ left: `${50 / total}%`, right: `${50 / total}%` }}
      >
        <div
          className="h-1 bg-green-500 rounded-full transition-all duration-500"
          style={{ width: `${fillPercent}%` }}
        />
      </div>

      {STEPS.map((step, i) => {
        const isDone = i < completedCount - 1 || (isAllDone && i === total - 1);
        const isActive = !isAllDone && i === currentIndex;
        const dotColor = isDone
          ? "bg-green-500"
          : isActive
          ? "bg-yellow-400"
          : "bg-gray-300";
        const textColor = isDone || isActive ? "text-white" : "text-gray-500";

        const iso =
          i < total - 1
            ? statusDates[STEPS[i + 1].code]
            : statusDates[step.code];
        const tsLabel = iso
          ? format(new Date(iso), "dd/MM/yy HH:mm", { locale: th })
          : "–";

        return (
          <div
            key={step.code}
            className="relative flex flex-col items-center z-20"
          >
            <span className="mb-2 text-xs text-gray-600">{tsLabel}</span>
            <div
              className={`w-10 h-10 rounded-full ${dotColor} ring-4 ring-white shadow-md flex items-center justify-center ${
                isActive ? "animate-pulse" : ""
              }`}
            >
              <span className={`text-sm font-bold ${textColor}`}>
                {step.label.slice(0, 3).toUpperCase()}
              </span>
            </div>
            <span className="mt-2 text-sm font-medium text-gray-700">
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
