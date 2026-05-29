import React, { useState } from "react";
import { Search, FileCode, CheckSquare, Trash2, Shield, Calendar, ShieldAlert } from "lucide-react";
import { AuditReport } from "../types";

interface AuditHistoryProps {
  reports: AuditReport[];
  activeReportId: string | null;
  onSelectReport: (report: AuditReport) => void;
  onClearHistory: () => void;
}

export default function AuditHistory({
  reports,
  activeReportId,
  onSelectReport,
  onClearHistory,
}: AuditHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredReports = reports.filter((rep) =>
    rep.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rep.remarks.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#0D1014] border border-[#1E2229] rounded-lg p-4 shadow-xl flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between border-b border-[#1E2229] pb-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4.5 w-4.5 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-300">Audit Registry</h3>
        </div>
        {reports.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-[10px] text-rose-450 hover:text-rose-400 font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
            title="Clear all stored logs"
          >
            <Trash2 className="h-3 w-3" />
            Wipe
          </button>
        )}
      </div>

      {/* Search Input */}
      {reports.length > 0 && (
        <div className="flex items-center gap-2 bg-[#0A0B0D] px-2.5 py-1.5 rounded border border-[#1E2229]">
          <Search className="h-3.5 w-3.5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-gray-200 focus:outline-none w-full font-mono"
            placeholder="Search registry indices..."
          />
        </div>
      )}

      {/* Reports List */}
      <div className="flex-1 overflow-y-auto space-y-2 max-h-[290px] pr-1">
        {filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 space-y-2">
            <Calendar className="h-10 w-10 opacity-20" />
            {searchQuery ? (
              <p className="text-xs">No records correspond to parameters</p>
            ) : (
              <>
                <p className="text-xs font-bold uppercase tracking-wider">Empty Registry</p>
                <p className="text-[10px] text-gray-500">Submit a smart contract audit payload to write index certs.</p>
              </>
            )}
          </div>
        ) : (
          filteredReports.map((rep) => {
            const hasOnChain = rep.onChainTxHash !== null;
            return (
              <button
                key={rep.id}
                onClick={() => onSelectReport(rep)}
                className={`w-full text-left p-2.5 rounded transition-all border block cursor-pointer ${
                  activeReportId === rep.id
                    ? "bg-[#161A1F] border-indigo-500/35 text-white"
                    : "bg-[#0A0B0D] border-[#1E2229] hover:bg-[#111418] text-gray-350"
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-start gap-1.5 min-w-0">
                    <FileCode className="h-4 w-4 text-gray-405 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold truncate font-mono text-gray-205">
                        {rep.fileName}
                      </h4>
                      <span className="text-[9px] text-slate-505 text-gray-500 font-mono">
                        {new Date(rep.timestamp).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`inline-block text-[11px] font-mono font-bold ${
                      rep.score >= 80 ? "text-green-500" : rep.score >= 50 ? "text-yellow-500" : "text-red-500"
                    }`}>
                      {rep.score}%
                    </span>
                    {hasOnChain && (
                      <span className="block text-[8px] font-mono text-green-500 font-bold uppercase mt-0.5 tracking-wider">
                        ON-CHAIN
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#1E2229]/50 justify-between text-[9px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-red-500 font-bold">{rep.summary.high}H</span>
                    <span className="text-yellow-500 font-bold">{rep.summary.medium}M</span>
                    <span className="text-indigo-400 font-bold">{rep.summary.low}L</span>
                  </div>
                  {rep.onChainTxHash && (
                    <span className="text-[8px] bg-green-500/10 text-green-500 border border-green-500/25 px-1 rounded font-bold uppercase">
                      verified
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
