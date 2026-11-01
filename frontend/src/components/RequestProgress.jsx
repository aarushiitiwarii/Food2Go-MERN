import React from "react";

export const REQUEST_STATUS_STYLES = {
  Open: "bg-blue-100 text-blue-800",
  "Partially Fulfilled": "bg-yellow-100 text-yellow-800",
  Fulfilled: "bg-green-100 text-green-800",
};

// Bar showing received (green) and pledged-but-not-yet-received (amber) out of the quantity needed
export default function RequestProgress({ request }) {
  const { quantityNeeded, quantityReceived = 0, quantityPledged = 0, unit } = request;
  const remaining = request.quantityRemaining ?? Math.max(0, quantityNeeded - quantityReceived - quantityPledged);
  const pct = (n) => `${Math.min(100, (n / quantityNeeded) * 100)}%`;

  return (
    <div>
      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
        <div className="h-full bg-green-500" style={{ width: pct(quantityReceived) }} />
        <div className="h-full bg-amber-300" style={{ width: pct(quantityPledged) }} />
      </div>
      <div className="flex flex-wrap gap-x-3 text-xs text-gray-600 mt-1.5">
        <span>
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />
          {quantityReceived} / {quantityNeeded} {unit} received
        </span>
        {quantityPledged > 0 && (
          <span>
            <span className="inline-block w-2 h-2 rounded-full bg-amber-300 mr-1" />
            {quantityPledged} on the way
          </span>
        )}
        <span className="font-medium text-gray-700">{remaining} left</span>
      </div>
    </div>
  );
}
