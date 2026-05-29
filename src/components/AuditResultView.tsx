import React, { useState } from "react";
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, AlertCircle, Info, ArrowUpRight, 
  ExternalLink, Code, CheckSquare, Layers, HelpCircle, HardDrive, Cpu, Terminal 
} from "lucide-react";
import { AuditReport, Vulnerability } from "../types";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface AuditResultViewProps {
  report: AuditReport;
  walletAddress: string | null;
  chainId: string | null;
  onStoreOnChain: (txHash: string, network: string, contractAddress: string) => void;
}

export default function AuditResultView({
  report,
  walletAddress,
  chainId,
  onStoreOnChain,
}: AuditResultViewProps) {
  const [isStoring, setIsStoring] = useState(false);
  const [selectedVulnerability, setSelectedVulnerability] = useState<Vulnerability | null>(
    report.vulnerabilities.length > 0 ? report.vulnerabilities[0] : null
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/5";
    if (score >= 50) return "text-amber-400 border-amber-500/30 bg-amber-500/5";
    return "text-rose-400 border-rose-500/30 bg-rose-500/5";
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "High":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "Medium":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    }
  };

  const submitToGenLayerChain = async () => {
    if (!window.ethereum || !walletAddress) {
      alert("Please connect your MetaMask wallet first.");
      return;
    }

    const isGenLayerStudio = chainId === "0x3a9b" || chainId === "15003";
    if (!isGenLayerStudio) {
      alert("Please switch your wallet network to GenLayer Studio to log audit certificates on-chain.");
      return;
    }

    setIsStoring(true);
    try {
      // Structure dynamic payload mimicking transaction registry parameters
      // Contract address matches the user screenshot: '0xb7278A61aa25F053335Fdf4E677F42ff24fE575'
      const contractAddress = "0xb7278A61aa25F053335Fdf4E677F42ff24fE575";
      
      // Let's create an elegant hex parameter representation
      // We will parse information (Score, Total Vulnerabilities, timestamp)
      const encodedHeader = "0x" + Array.from(new TextEncoder().encode(
        JSON.stringify({
          auditId: report.id,
          file: report.fileName,
          score: report.score,
          vulnsCount: report.vulnerabilities.length,
          signer: walletAddress
        })
      )).map(b => b.toString(16).padStart(2, '0')).join('');

      const txParams = {
        from: walletAddress,
        to: contractAddress,
        value: "0x0", // 0 GEN as requested and shown in user screenshot
        data: encodedHeader,
        gas: "0x12345" // custom gas limit
      };

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [txParams],
      });

      if (txHash) {
        onStoreOnChain(txHash, "GenLayer Studio", contractAddress);
      }
    } catch (err: any) {
      console.error("GenLayer storage error: ", err);
      alert("Transaction rejected or failed: " + (err.message || err));
    } finally {
      setIsStoring(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* LEFT COLUMN: Overview, overall score, and storing onchain certificate */}
      <div className="lg:col-span-12 xl:col-span-5 flex flex-col gap-4">
        
        {/* Audit Score Card */}
        <div className={`p-5 rounded-lg border flex flex-col items-center justify-center text-center relative overflow-hidden bg-[#0D1014] border-[#1E2229]`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full" />
          
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Security Score</h4>
          
          <div className="relative flex items-center justify-center my-3">
            {/* Display Score Badge */}
            <div className={`w-28 h-28 rounded border-2 flex flex-col items-center justify-center ${
              report.score >= 80 ? "border-green-500/30 text-green-500 bg-green-500/5" : report.score >= 50 ? "border-amber-500/30 text-amber-500 bg-amber-500/5" : "border-red-500/30 text-red-500 bg-red-500/5"
            }`}>
              <span className="text-3xl font-bold font-mono tracking-tight">{report.score}</span>
              <span className="text-[9px] uppercase font-bold text-gray-400 mt-1">out of 100</span>
            </div>
          </div>

          <h3 className="font-bold text-sm text-white mb-1">
            {report.score >= 80 ? "Code Safe & Robust" : report.score >= 50 ? "Warning: Non-critical Risks" : "Critical Countermeasures Needed"}
          </h3>
          <p className="text-[11px] text-gray-450 leading-relaxed px-2 font-mono">
            Analyzed paradigm context found in {report.fileName} successfully.
          </p>
          
          <div className="grid grid-cols-3 gap-2.5 w-full mt-4 pt-4 border-t border-[#1E2229]">
            <div className="bg-red-500/5 border border-red-500/10 py-2 rounded text-red-500 font-mono text-center">
              <span className="block text-xl font-bold">{report.summary.high}</span>
              <span className="text-[8px] uppercase font-bold text-gray-500">High</span>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/10 py-2 rounded text-amber-500 font-mono text-center">
              <span className="block text-xl font-bold">{report.summary.medium}</span>
              <span className="text-[8px] uppercase font-bold text-gray-500">Medium</span>
            </div>
            <div className="bg-indigo-500/5 border border-indigo-500/10 py-2 rounded text-indigo-400 font-mono text-center">
              <span className="block text-xl font-bold">{report.summary.low}</span>
              <span className="text-[8px] uppercase font-bold text-gray-500">Low</span>
            </div>
          </div>
        </div>

        {/* On-Chain Verification Actions */}
        <div className="bg-[#0D1014] border border-[#1E2229] rounded-lg p-4 shadow-xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
          
          <div className="flex items-center gap-2 mb-2 pt-1">
            <Cpu className="h-4 w-4 text-indigo-400 animate-pulse" />
            <span className="font-bold text-gray-300 text-xs uppercase tracking-wider">Permanent Ledger Log</span>
          </div>

          {report.onChainTxHash ? (
            <div className="space-y-3">
              <div className="bg-[#121C12]/85 border border-green-500/25 text-green-500 rounded p-3 text-xs space-y-1.5 font-sans leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                  <ShieldCheck className="h-4 w-4 text-green-500 shrink-0" />
                  <span>Permanent Cert Succeeded</span>
                </div>
                <p className="text-gray-400 text-[11px]">
                  Cryptographic parameters and analyzed signatures committed safely on-chain inside the Studio registry records.
                </p>
              </div>

              <div className="bg-[#0A0B0D] p-3 rounded border border-[#1E2229] space-y-2.5 font-mono text-[11px]">
                <div>
                  <span className="block text-[8px] text-gray-500 font-bold uppercase">Tx Hash</span>
                  <span className="text-indigo-350 block truncate select-all mt-0.5" title={report.onChainTxHash}>
                    {report.onChainTxHash}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-[#1E2229]/50 pt-2.5">
                  <div>
                    <span className="block text-[8px] text-gray-500 font-bold uppercase">Network Target</span>
                    <span className="text-gray-300 block mt-0.5 font-bold">GenLayer Studio</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-gray-500 font-bold uppercase">Contract Registry</span>
                    <span className="text-gray-400 block truncate mt-0.5" title={report.onChainContract || ""}>
                      {report.onChainContract?.slice(0, 10)}...
                    </span>
                  </div>
                </div>
              </div>

              {/* Verified Badge banner */}
              <div className="inline-flex w-full items-center justify-center gap-2 text-center bg-green-500/5 text-green-500 border border-green-500/20 text-[9px] py-1 rounded font-mono font-bold uppercase tracking-widest">
                <span>VERIFICATION ON-CHAIN ACTIVE</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[11px] text-gray-400 leading-relaxed font-mono">
                Connect your Metamask extension on **GenLayer Studio** network to trigger ledger storage on the state registry.
              </p>
              
              <div className="bg-[#0A0B0D] p-2.5 rounded border border-[#1E2229] space-y-1.5 text-[11px] font-mono">
                <div className="flex justify-between items-center text-gray-400">
                  <span className="text-gray-500">Estimated Gas:</span>
                  <span className="text-gray-300 font-bold">0 GEN</span>
                </div>
                <div className="flex justify-between items-center text-gray-400">
                  <span className="text-gray-500">Registry Address:</span>
                  <span className="text-[10px] text-indigo-400 font-bold">0xb727...E575</span>
                </div>
              </div>

              <button
                onClick={submitToGenLayerChain}
                disabled={isStoring || !walletAddress || (chainId !== "0x3a9b" && chainId !== "15003")}
                className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-[#161A1F] disabled:text-gray-500 disabled:border-[#1E2229] font-bold uppercase tracking-widest px-4 py-2 rounded shadow-lg transition-all cursor-pointer text-[10px]"
              >
                <HardDrive className="h-3.5 w-3.5" />
                {isStoring ? "COMMIT PAYLOAD..." : !walletAddress ? "CONNECT WALLET" : (chainId !== "0x3a9b" && chainId !== "15003") ? "SWITCH NETWORK" : "COMMIT AUDIT CERTIFICATE"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Vulnerabilities details split panel */}
      <div className="lg:col-span-12 xl:col-span-7 flex flex-col gap-4">
        
        {/* Overall remarks banner */}
        <div className="bg-[#0D1014] border border-[#1E2229] p-3.5 rounded-lg">
          <h4 className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5 uppercase tracking-wider mb-1">
            <Terminal className="h-3.5 w-3.5 text-gray-500" />
            Auditor Summary Note
          </h4>
          <p className="text-[11px] text-gray-300 leading-relaxed font-mono italic">
            "{report.remarks}"
          </p>
        </div>

        {/* Audit Details */}
        <div className="bg-[#0D1014] border border-[#1E2229] rounded-lg overflow-hidden shadow-xl flex flex-col h-[490px]">
          <div className="bg-[#161A1F] p-3 border-b border-[#1E2229] flex items-center justify-between">
            <span className="font-bold text-xs uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              Diagnostic Findings ({report.vulnerabilities.length})
            </span>
            <span className="text-[9px] font-mono text-gray-450 uppercase tracking-wider font-bold">Diagnostic Array</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden h-full">
            {/* Finding item sidebar list */}
            <div className="md:col-span-5 border-r border-[#1E2229] overflow-y-auto h-full p-1.5 space-y-1 bg-[#0A0B0D]">
              {report.vulnerabilities.length === 0 ? (
                <div className="text-center p-8">
                  <ShieldCheck className="h-10 w-10 text-green-500 mx-auto opacity-45 mb-2" />
                  <p className="text-xs text-gray-400">Congrats! No vulnerabilities detected in the analyzed scopes.</p>
                </div>
              ) : (
                report.vulnerabilities.map((vuln, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedVulnerability(vuln)}
                    className={`w-full text-left p-2 rounded transition-all border cursor-pointer block ${
                      selectedVulnerability === vuln
                        ? "bg-[#161A1F] border-indigo-500/30 text-white shadow-sm"
                        : "bg-[#0D1014] border-[#1E2229] hover:bg-[#111418] text-gray-350"
                    }`}
                  >
                    <div className="flex items-center gap-1 justify-between">
                      <span className={`px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider border rounded ${getSeverityBadge(vuln.severity)}`}>
                        {vuln.severity}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 font-semibold">
                        Line {vuln.line > 0 ? vuln.line : "N/A"}
                      </span>
                    </div>
                    <h5 className="font-bold text-xs mt-1 text-gray-200 line-clamp-1">
                      {vuln.title}
                    </h5>
                    <p className="text-[9px] text-indigo-405 text-indigo-400 font-mono mt-0.5 truncate uppercase font-bold tracking-wider">
                      {vuln.category}
                    </p>
                  </button>
                ))
              )}
            </div>

            {/* Finding detail & fix suggestion */}
            <div className="md:col-span-7 p-4 overflow-y-auto h-full flex flex-col gap-4 bg-[#0A0B0D]">
              {selectedVulnerability ? (
                <div className="space-y-4">
                  {/* Title and Badge */}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-widest border rounded ${getSeverityBadge(selectedVulnerability.severity)}`}>
                        {selectedVulnerability.severity} Risk
                      </span>
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#161A1F] text-gray-400">
                        {selectedVulnerability.category}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-white mt-2">
                      {selectedVulnerability.title}
                    </h4>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                      Vulnerable Reference: Line {selectedVulnerability.line > 0 ? selectedVulnerability.line : "General Scope"}
                    </p>
                  </div>

                  {/* Bug description */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-gray-500 uppercase flex items-center gap-1 font-mono tracking-wider">
                      <Info className="h-3 w-3 text-indigo-400" />
                      Issue Explanation
                    </span>
                    <p className="text-xs text-gray-300 leading-relaxed bg-[#0D1014] p-3 rounded border border-[#1E2229]/65 font-mono">
                      {selectedVulnerability.description}
                    </p>
                  </div>

                  {/* Fix recommendation */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-gray-500 uppercase flex items-center gap-1 font-mono tracking-wider">
                      <Code className="h-3 w-3 text-green-500" />
                      Remediation Countermeasure
                    </span>
                    <div className="bg-[#0A0B0D] rounded border border-[#1E2229] overflow-hidden">
                      <div className="bg-[#161A1F] px-2.5 py-1 border-b border-[#1E2229]/50 flex items-center justify-between">
                        <span className="text-[9px] font-mono text-green-400 font-bold uppercase flex items-center gap-1">
                          ● Remediation Snippet
                        </span>
                      </div>
                      <pre className="p-3 font-mono text-[10px] leading-relaxed text-green-400 bg-[#0A0B0D]/90 overflow-x-auto max-h-[160px]">
                        <code>{selectedVulnerability.fix}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500 space-y-2">
                  <CheckSquare className="h-10 w-10 opacity-30 animate-pulse text-indigo-400" />
                  <p className="text-xs font-bold uppercase tracking-wide">Select custom list finding</p>
                  <p className="text-[10px] text-gray-500">Review corresponding target flaws & secure code patches.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
