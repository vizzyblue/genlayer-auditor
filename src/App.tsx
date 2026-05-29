import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, ShieldCheck, Clipboard, ExternalLink, RefreshCw, 
  Terminal, Award, Layers, PlusCircle, HelpCircle, Bug, BookOpen 
} from "lucide-react";
import WalletConnect from "./components/WalletConnect";
import CodeEditorInput from "./components/CodeEditorInput";
import AuditResultView from "./components/AuditResultView";
import AuditHistory from "./components/AuditHistory";
import { AuditReport, Vulnerability } from "./types";

export default function App() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load audit logs from Local Storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("CODE_AUDITOR_REPORTS");
      if (saved) {
        setReports(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Failed to load local audit history logs:", err);
    }
  }, []);

  // Save audit logs to Local Storage when changes happen
  const saveReports = (newReports: AuditReport[]) => {
    setReports(newReports);
    try {
      localStorage.setItem("CODE_AUDITOR_REPORTS", JSON.stringify(newReports));
    } catch (err) {
      console.error("Failed to persist audit history logs:", err);
    }
  };

  const handleAuditSubmit = async (code: string, fileName: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, fileName }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.details || "API server auditing failed");
      }

      const data = await res.json();
      
      const newReport: AuditReport = {
        id: "rep_" + Date.now().toString(),
        fileName,
        code,
        score: data.score,
        remarks: data.remarks,
        summary: data.summary,
        vulnerabilities: data.vulnerabilities,
        timestamp: new Date().toISOString(),
        onChainTxHash: null,
        onChainNetwork: null,
        onChainContract: null,
      };

      const updated = [newReport, ...reports];
      saveReports(updated);
      setActiveReportId(newReport.id);
    } catch (err: any) {
      console.error("Code Auditor failure:", err);
      setErrorMessage(err.message || "An unexpected network or model error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStoreOnChain = (txHash: string, network: string, contractAddress: string) => {
    if (!activeReportId) return;
    
    const updated = reports.map((rep) => {
      if (rep.id === activeReportId) {
        return {
          ...rep,
          onChainTxHash: txHash,
          onChainNetwork: network,
          onChainContract: contractAddress,
        };
      }
      return rep;
    });

    saveReports(updated);
  };

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear your local static audit logs? This cannot be undone.")) {
      saveReports([]);
      setActiveReportId(null);
    }
  };

  const activeReport = reports.find((r) => r.id === activeReportId) || null;

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-[#E0E0E0] flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-200">
      
      {/* Top Header Panel Section Decoration */}
      <header className="border-b border-[#1E2229] bg-[#111418] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="p-2 bg-indigo-600 rounded text-white shadow-md shadow-indigo-500/10 flex items-center justify-center">
                <ShieldCheck className="h-5.5 w-5.5" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-slate-950" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5 font-sans">
                GenGuard <span className="text-indigo-400 font-mono text-xs">v1.0.4</span>
              </span>
              <span className="text-[9px] text-slate-500 font-mono tracking-wider font-semibold block uppercase">
                INTELLIGENT VERIFICATION CONTRACTS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Display Stats Counter */}
            <div className="hidden md:flex items-center gap-4 bg-[#161A1F] px-3.5 py-1.5 rounded border border-[#1E2229] text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <Bug className="h-3.5 w-3.5 text-rose-400" />
                <span>Audited: <strong className="text-slate-200">{reports.length}</strong></span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Award className="h-3.5 w-3.5 text-emerald-400" />
                <span>On-Chain Certs: <strong className="text-slate-200">{reports.filter(r => r.onChainTxHash).length}</strong></span>
              </span>
            </div>
            
            <span className="text-[10px] text-slate-500 font-mono">
              SDK v2.4 (Asimov Protocol)
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Workspace Layout with Responsive Density grid */}
      <main className="flex-1 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 w-full flex flex-col gap-5">
        
        {/* Wallet Gateway Section */}
        <section id="wallet-gateway">
          <WalletConnect
            walletAddress={walletAddress}
            chainId={chainId}
            onAddressChange={setWalletAddress}
            onChainIdChange={setChainId}
          />
        </section>

        {/* Workspace body and split controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* LEFT GRID SIDE PANEL: History lists with dynamic size bindings */}
          <section className="lg:col-span-4 flex flex-col gap-4 h-full" id="audit-sidebar">
            <AuditHistory
              reports={reports}
              activeReportId={activeReportId}
              onSelectReport={(rep) => setActiveReportId(rep.id)}
              onClearHistory={clearHistory}
            />

            {/* Quick Informational card on GenLayerintelligent consensus */}
            <div className="bg-[#0D1014] p-4 rounded-lg border border-[#1E2229] space-y-2">
              <h5 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 uppercase font-mono">
                <BookOpen className="h-3.5 w-3.5" />
                DeCentralized Security Audits
              </h5>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                GenLayer introduces Intelligent Contracts that run customized LLM queries directly inside the decentralized network. GenShield leverages high-fidelity AI models to compute security assurance certs and stores them on-chain inside the Studio ledger.
              </p>
            </div>
          </section>

          {/* RIGHT GRID MODULE: Code input or Live Reports View */}
          <section className="lg:col-span-8 flex flex-col gap-5" id="audit-editor">
            
            {/* Error Message banner */}
            {errorMessage && (
              <div className="bg-[#1C1212] border border-red-900/30 text-rose-400 p-4 rounded-lg text-xs flex items-start gap-2 animate-pulse">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Audit Compilation Interruption</span>
                  <p className="text-slate-350 mt-1 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* If there is an active report, show the results. Otherwise, show input editor */}
            {activeReport ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-[#161A1F] px-4 py-2 bg-[#161A1F] border-b border-[#1E2229] rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-indigo-400 font-semibold uppercase tracking-wider">Reviewing Audit Cert:</span>
                    <h4 className="text-xs font-mono font-bold text-slate-100">{activeReport.fileName}</h4>
                  </div>
                  <button
                    onClick={() => setActiveReportId(null)}
                    className="inline-flex items-center gap-1.5 text-gray-300 hover:text-white bg-[#0A0B0D] font-semibold px-3 py-1.5 rounded border border-[#1E2229] text-xs cursor-pointer transition-all"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    New Scan
                  </button>
                </div>

                <AuditResultView
                  report={activeReport}
                  walletAddress={walletAddress}
                  chainId={chainId}
                  onStoreOnChain={handleStoreOnChain}
                />
              </div>
            ) : (
              <CodeEditorInput
                onAuditSubmit={handleAuditSubmit}
                isLoading={isLoading}
              />
            )}
          </section>

        </div>
      </main>

      {/* Humble literal footer credits conforming strictly to system instructions */}
      <footer className="h-12 bg-[#0A0B0D] border-t border-[#1E2229] flex items-center justify-between px-6 text-[10px] text-gray-500 uppercase tracking-widest mt-12">
        <div className="flex items-center space-x-4">
          <span>Auditor Node: <strong className="text-gray-300">0x12...F9E</strong></span>
        </div>
        <div className="flex items-center space-x-4">
          <span>System Load: <strong className="text-green-500">Minimal</strong></span>
          <span className="text-gray-300 font-mono">GEN_CONTRACT_COMMIT_V2</span>
        </div>
      </footer>
    </div>
  );
}
