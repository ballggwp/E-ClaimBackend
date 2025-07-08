// components/ClaimTimelineWithDates.tsx
"use client";

import React from "react";
import { format } from "date-fns";
import {th} from "date-fns/locale/th";

interface Props {
  /** map of statusCode → ISO timestamp when that status was entered */
  statusDates: Record<string, string>;
  /** the current status code, must match one of the STEPS.code */
  currentStatus: string;
}

// Use your exact workflow steps here:
const STEPS = [
  { code: "SUBMITTED",               label: "Submitted" },
  { code: "PENDING_APPROVER_REVIEW", label: "Approver"  },
  { code: "PENDING_INSURER_REVIEW",  label: "Insurer"   },
  { code: "PENDING_MANAGER_REVIEW",  label: "Manager"   },
  { code: "PENDING_USER_CONFIRM",    label: "Confirm"   },
  { code: "COMPLETED",               label: "Done"      },
];

export function ClaimTimelineWithDates({
  statusDates,
  currentStatus,
}: Props) {
  // Which index in STEPS is the current status?
  const currIdx = STEPS.findIndex((s) => s.code === currentStatus);

  return (
    <div className="relative flex items-center my-6">
      {/* full-width grey baseline */}
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full h-1 bg-gray-200 rounded-full" />
      </div>

      {STEPS.map((step, i) => {
        // determine colors for dot and segment
        const done   = i < currIdx;
        const active = i === currIdx;
        const dotColor =
          active
            ? "bg-yellow-400"
            : done
            ? "bg-green-500"
            : "bg-gray-300";
        const segColor =
          i < currIdx - 1
            ? "bg-green-500"
            : i === currIdx - 1
            ? "bg-yellow-400"
            : "bg-gray-200";

        // for each dot i, show the timestamp of the *next* step (i+1),
        // except the last dot shows its own timestamp
        let iso: string | undefined;
        if (i < STEPS.length - 1) {
          iso = statusDates[STEPS[i + 1].code];
        } else {
          iso = statusDates[step.code];
        }
        const tsLabel = iso
          ? format(new Date(iso), "dd/MM/yy HH:mm", { locale: th })
          : "–";

        return (
          <React.Fragment key={step.code}>
            {/* dot + timestamp + label */}
            <div className="relative flex flex-col items-center z-10">
              {/* timestamp above the dot */}
              <span className="mb-1 text-xs text-gray-600">{tsLabel}</span>

              {/* the colored dot */}
              <div
                className={`
                  w-10 h-10 rounded-full ${dotColor}
                  ring-4 ring-white shadow-lg
                  flex items-center justify-center transition
                `}
              >
                <span
                  className={`text-sm font-bold ${
                    active || done ? "text-white" : "text-gray-500"
                  }`}
                >
                  {step.label.slice(0, 3).toUpperCase()}
                </span>
              </div>

              {/* step label below */}
              <span className="mt-2 text-xs text-gray-700 font-medium">
                {step.label}
              </span>
            </div>

            {/* connecting segment to the next dot */}
            {i < STEPS.length - 1 && (
              <div
                className={`
                  flex-1 h-1 mx-2 rounded-full ${segColor} transition
                `}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
