import React, { useState, useEffect } from "react";
import { Wallet, ShieldAlert, Award, Compass, Copy, Check, RefreshCw } from "lucide-react";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletConnectProps {
  walletAddress: string | null;
  chainId: string | null;
  onAddressChange: (address: string | null) => void;
  onChainIdChange: (chainId: string | null) => void;
}

export default function WalletConnect({
  walletAddress,
  chainId,
  onAddressChange,
  onChainIdChange,
}: WalletConnectProps) {
  const [copied, setCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAddingNetwork, setIsAddingNetwork] = useState(false);

  // Parse chain ID helper
  const isGenLayerStudio = chainId === "0x3a9b" || chainId === "15003"; // 15003 in hex is 0x3a9b

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed. Please install MetaMask to use on-chain features.");
      return;
    }
    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts && accounts.length > 0) {
        onAddressChange(accounts[0]);
        const currentChain = await window.ethereum.request({ method: "eth_chainId" });
        onChainIdChange(currentChain);
      }
    } catch (err) {
      console.error("Connection error:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    onAddressChange(null);
    onChainIdChange(null);
  };

  const addGenLayerStudio = async () => {
    if (!window.ethereum) return;
    setIsAddingNetwork(true);
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x3a9b", // 15003 in decimal
            chainName: "GenLayer Studio",
            nativeCurrency: {
              name: "GEN",
              symbol: "GEN",
              decimals: 18,
            },
            rpcUrls: ["https://studio.genlayer.com/api"],
            blockExplorerUrls: [],
          },
        ],
      });
      const newChain = await window.ethereum.request({ method: "eth_chainId" });
      onChainIdChange(newChain);
    } catch (err) {
      console.error("Adding network failed:", err);
    } finally {
      setIsAddingNetwork(false);
    }
  };

  // Listen for wallet and network events
  useEffect(() => {
    if (window.ethereum) {
      const handleAccounts = (accounts: string[]) => {
        if (accounts.length > 0) {
          onAddressChange(accounts[0]);
        } else {
          onAddressChange(null);
        }
      };

      const handleChain = (hexId: string) => {
        onChainIdChange(hexId);
      };

      window.ethereum.on("accountsChanged", handleAccounts);
      window.ethereum.on("chainChanged", handleChain);

      // Fetch initial values
      window.ethereum.request({ method: "eth_accounts" })
        .then(handleAccounts)
        .catch(console.error);

      window.ethereum.request({ method: "eth_chainId" })
        .then(handleChain)
        .catch(console.error);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccounts);
        window.ethereum.removeListener("chainChanged", handleChain);
      };
    }
  }, []);

  return (
    <div className="bg-[#0D1014] border border-[#1E2229] rounded-lg p-4 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-505 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/10 rounded border border-indigo-500/20 text-indigo-400">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white flex items-center gap-2">
              GenLayer Wallet Gateway
              {walletAddress && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                  isGenLayerStudio ? "bg-green-500/15 text-green-500 border border-green-500/20" : "bg-amber-500/15 text-amber-500 border border-amber-500/20"
                }`}>
                  ● {isGenLayerStudio ? "Studio Network Connected" : "Incorrect Network"}
                </span>
              )}
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {walletAddress 
                ? "Your metamask wallet is connected. You can now commit calculated diagnostic certificates directly on-chain."
                : "A Web3 gateway connection is active to register completed security audit codes permanently."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {walletAddress ? (
            <>
              {/* Connected Address Details */}
              <div className="flex items-center gap-2 bg-[#161A1F] px-2.5 py-1.5 rounded border border-[#1E2229]">
                <span className="text-xs font-mono text-gray-300">
                  {walletAddress.slice(0, 7)}...{walletAddress.slice(-4)}
                </span>
                <button
                  onClick={copyAddress}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Copy address"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Network warning & add/switch network button */}
              {!isGenLayerStudio ? (
                <button
                  onClick={addGenLayerStudio}
                  disabled={isAddingNetwork}
                  className="inline-flex items-center gap-1.5 bg-[#181A12] hover:bg-[#1C1212] border border-yellow-905 border-yellow-500/30 text-xs text-yellow-500 px-3 py-1.5 rounded transition-colors cursor-pointer font-bold uppercase tracking-wider text-[10px]"
                >
                  <RefreshCw className={`h-3 w-3 ${isAddingNetwork ? "animate-spin" : ""}`} />
                  Switch Network
                </button>
              ) : (
                <div className="bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] font-bold uppercase px-3 py-1.5 rounded flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5" />
                  GEN Connected
                </div>
              )}

              <button
                onClick={disconnectWallet}
                className="bg-[#161A1F] hover:bg-[#0A0B0D] font-bold text-[10px] uppercase text-gray-400 px-3 py-1.5 rounded transition-colors border border-[#1E2229] cursor-pointer"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-wider text-[11px] px-4 py-2 relative overflow-hidden text-center rounded transition-all cursor-pointer border border-indigo-400/30"
            >
              <Wallet className="h-3.5 w-3.5" />
              {isConnecting ? "Connecting..." : "Connect MetaMask"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
