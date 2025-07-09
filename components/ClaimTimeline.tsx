// components/ClaimTimelineWithDates.tsx
"use client";

import React from "react";
import { format } from "date-fns";
import {th} from "date-fns/locale/th";

interface Props {
  statusDates: Record<string, string>;
  currentStatus: string;
}

const STEPS = [
  { code: "SUBMITTED",               label: "Submitted" },
  { code: "PENDING_APPROVER_REVIEW", label: "Approver"  },
  { code: "PENDING_INSURER_REVIEW",  label: "Insurer"   },
  { code: "PENDING_INSURER_FORM",  label: "InsurerForm"   },
  { code: "PENDING_MANAGER_REVIEW",  label: "Manager"   },
  { code: "PENDING_USER_CONFIRM",    label: "Confirm"   },
  { code: "COMPLETED",               label: "Done"      },
];

export function ClaimTimelineWithDates({
  statusDates,
  currentStatus,
}: Props) {
  const baseIdx = STEPS.findIndex((s) => s.code === currentStatus);
  const doneCount =
    currentStatus === "COMPLETED"
      ? STEPS.length
      : baseIdx;

  // 1) Build an array of dot colors
  const dotColors = STEPS.map((_, i) => {
    if (i < doneCount) return "bg-green-500";
    if (i === baseIdx) return "bg-yellow-400";
    return "bg-gray-300";
  });

  // 2) Build an array of segment colors
  const segColors = dotColors.slice(0, -1).map((leftColor, i) => {
    const rightColor = dotColors[i + 1];
    if (leftColor === "bg-green-500" && rightColor === "bg-green-500") {
      return "bg-green-500";
    }
    if (leftColor === "bg-green-500" && rightColor === "bg-yellow-400") {
      return "bg-yellow-400";
    }
    return "bg-gray-200";
  });

  return (
    <div className="relative flex items-center my-6">
      {/* baseline */}
      <div className="absolute inset-0 flex items-center z-0" aria-hidden="true">
        <div className="w-full h-1 bg-gray-200 rounded-full" />
      </div>

      {STEPS.map((step, i) => {
        const dotColor = dotColors[i];
        const isYellow = dotColor === "bg-yellow-400";

        // timestamp above dot: next‐status time or own for last
        const iso =
          i < STEPS.length - 1
            ? statusDates[STEPS[i + 1].code]
            : statusDates[step.code];
        const tsLabel = iso
          ? format(new Date(iso), "dd/MM/yy HH:mm", { locale: th })
          : "–";

        return (
          <React.Fragment key={step.code}>
            {/* dot + label */}
            <div className="relative z-10 flex flex-col items-center">
              <span className="mb-1 text-xs text-gray-600">{tsLabel}</span>
              <div
                className={`
                  w-10 h-10 rounded-full ${dotColor}
                  ring-4 ring-white shadow-md
                  flex items-center justify-center
                  ${isYellow ? "animate-pulse" : ""}
                  transition
                `}
              >
                <span
                  className={`text-sm font-bold ${
                    dotColor === "bg-gray-300" ? "text-gray-500" : "text-white"
                  }`}
                >
                  {step.label.slice(0, 3).toUpperCase()}
                </span>
              </div>
              <span className="mt-2 text-xs text-gray-700 font-medium">
                {step.label}
              </span>
            </div>

            {/* segment */}
            {i < segColors.length && (
              <div
                className={`
                  relative z-5 flex-1 h-1 rounded-full ${segColors[i]}
                  transition
                `}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}