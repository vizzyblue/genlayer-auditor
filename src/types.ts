export interface Vulnerability {
  title: string;
  severity: "High" | "Medium" | "Low";
  category: string;
  line: number;
  description: string;
  fix: string;
}

export interface AuditSummary {
  high: number;
  medium: number;
  low: number;
}

export interface AuditReport {
  id: string;
  fileName: string;
  code: string;
  score: number;
  remarks: string;
  summary: AuditSummary;
  vulnerabilities: Vulnerability[];
  timestamp: string;
  onChainTxHash: string | null;
  onChainNetwork: string | null;
  onChainContract: string | null;
}
