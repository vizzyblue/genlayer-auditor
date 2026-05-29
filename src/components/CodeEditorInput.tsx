import React, { useRef, useState } from "react";
import { Code, FileCode, Upload, HelpCircle, FileText, Check, RefreshCw } from "lucide-react";

interface CodeTemplate {
  name: string;
  fileName: string;
  language: string;
  code: string;
}

const PRESET_TEMPLATES: CodeTemplate[] = [
  {
    name: "Solidity: Reentrancy Smart Contract",
    fileName: "InsecureVault.sol",
    language: "solidity",
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract InsecureVault {
    mapping(address => uint256) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    // VULNERABLE FUNCTION: Allows reentrancy attack
    function withdrawAll() public {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "Insufficient balance");

        // External transfer before updating internal storage
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");

        balances[msg.sender] = 0; // State is updated too late!
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}`
  },
  {
    name: "Python: Insecure Arbitrary SQL Concatenation",
    fileName: "auth_service.py",
    language: "python",
    code: `import sqlite3
import hashlib

def login_user(username, password):
    # SECURITY RISK: Direct SQL String formatting causes Vulnerability
    # An attacker can enter admin' -- to bypass password check completely
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    
    hashed_pwd = hashlib.sha256(password.encode()).hexdigest()
    
    query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{hashed_pwd}'"
    print(f"Executing Query: {query}")
    
    cursor.execute(query)
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return {"status": "success", "user": user[1]}
    else:
        return {"status": "failure"}
`
  },
  {
    name: "Node.js: Insecure Crypto & Command Exec",
    fileName: "utils.js",
    language: "javascript",
    code: `const crypto = require('crypto');
const { exec } = require('child_process');

// VULNERABILITY 1: Insecure Cryptography algorithm (MD5 is broken)
function hashAPIKey(apiKey) {
    return crypto.createHash('md5').update(apiKey).digest('hex');
}

// VULNERABILITY 2: Command Injection via shell parameter concatenation
function backupFolder(folderName, destPath) {
    console.log(\`Logging backup from: \${folderName}\`);
    
    // Command allows execution of subcommands like: "src; rm -rf /"
    const command = \`tar -czf \${destPath}/backup.tar.gz \${folderName}\`;
    
    exec(command, (err, stdout, stderr) => {
        if (err) {
            console.error(\`Backup failure: \${err}\`);
            return;
        }
        console.log(\`Backup done: \${stdout}\`);
    });
}
`
  }
];

interface CodeEditorInputProps {
  onAuditSubmit: (code: string, fileName: string) => void;
  isLoading: boolean;
}

export default function CodeEditorInput({ onAuditSubmit, isLoading }: CodeEditorInputProps) {
  const [code, setCode] = useState(PRESET_TEMPLATES[0].code);
  const [fileName, setFileName] = useState(PRESET_TEMPLATES[0].fileName);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectTemplate = (template: CodeTemplate) => {
    setCode(template.code);
    setFileName(template.fileName);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === "string") {
        setCode(content);
        setFileName(file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleSearchTrigger = () => {
    if (!code.trim()) return;
    onAuditSubmit(code, fileName || "source_code");
  };

  return (
    <div className="bg-[#0D1014] border border-[#1E2229] rounded-lg p-4 shadow-xl flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#1E2229] pb-3 bg-[#161A1F] p-3 -mx-4 -mt-4 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Code className="h-4.5 w-4.5 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-300">Source Target Code</h3>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mr-1">Load Template:</span>
          {PRESET_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.name}
              onClick={() => selectTemplate(tmpl)}
              className={`text-[10px] px-2.5 py-1 rounded font-bold uppercase border transition-all cursor-pointer font-mono ${
                fileName === tmpl.fileName
                  ? "bg-indigo-600 text-white border-indigo-400/30 shadow-sm"
                  : "bg-[#0A0B0D] text-gray-400 border-[#1E2229] hover:text-white hover:border-indigo-500/30"
              }`}
            >
              {tmpl.fileName.split(".").pop()?.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Code Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
        <div className="md:col-span-2 flex items-center gap-2 bg-[#0A0B0D] px-3 py-1.5 rounded border border-[#1E2229]">
          <FileCode className="h-4 w-4 text-gray-450" />
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">File Path:</span>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="bg-transparent text-xs font-mono text-indigo-300 focus:outline-none w-full"
            placeholder="Filename (e.g., InsecureAuth.py)"
          />
        </div>
        
        {/* Upload Button */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".sol,.js,.py,.rs,.ts,.go,.cpp,.c,.h"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#0A0B0D] hover:bg-[#161A1F] text-gray-300 hover:text-white border border-[#1E2229] text-[10px] font-bold uppercase px-3 py-2 rounded transition-all cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload File
          </button>
        </div>
      </div>

      {/* Drag & Drop Editor */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded border h-[340px] overflow-hidden transition-all ${
          isDragOver
            ? "border-indigo-400 bg-indigo-500/5 ring-1 ring-indigo-400"
            : "border-[#1E2229] bg-[#0A0B0D]"
        }`}
      >
        {isDragOver && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-2 pointer-events-none">
            <Upload className="h-10 w-10 text-indigo-400 animate-bounce" />
            <p className="font-semibold text-slate-200">Drop Code File Here</p>
            <p className="text-xs text-slate-400">Works with Sol, JS, TS, Python, Rust, etc.</p>
          </div>
        )}

        {/* Text Area Code Editor */}
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-full p-4 font-mono text-sm text-indigo-100 bg-transparent focus:outline-none resize-none leading-relaxed overflow-y-auto"
          placeholder="Paste smart contract or backend application code lines here..."
          spellCheck="false"
        />

        {/* Line Numbers Fake Left Panel background styling decoration */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-[9px] font-mono text-gray-500 bg-[#161A1F] border border-[#1E2229] px-2 py-0.5 rounded select-none">
          <span>{code.split("\n").length} Lines</span>
          <span>•</span>
          <span>{new Blob([code]).size} Bytes</span>
        </div>
      </div>

      {/* Call to action button */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleSearchTrigger}
          disabled={isLoading || !code.trim()}
          className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-[#161A1F] disabled:text-gray-500 disabled:border-[#1E2229] font-bold uppercase tracking-widest text-xs px-6 py-3 rounded transition-all cursor-pointer border border-indigo-400/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
        >
          <Code className="h-4 w-4" />
          {isLoading ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-white" />
              <span>Analyzing Vectors & Generating Audit...</span>
            </div>
          ) : (
            "Analyze & Commit to GenLayer"
          )}
        </button>
        <p className="text-[10px] text-gray-500 font-mono text-center">
          DECENTRALIZED VULNERABILITY ADJUDICATION NODE RUNNING ON ASIMOV PROTOCOL STACK
        </p>
      </div>
    </div>
  );
}
