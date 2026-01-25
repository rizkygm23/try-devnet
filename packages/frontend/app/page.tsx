"use client";

import { useState } from "react";
import axios from "axios";
import Image from "next/image";
import {
  Rocket,
  Wallet,
  CheckCircle2,
  Copy,
  ExternalLink,
  Terminal,
  Loader2,
  ChevronRight,
  AlertCircle
} from "lucide-react";

// API Configuration
const API_BASE_URL = "http://75.119.155.222:3000";

/* --- Types --- */
type SessionData = {
  sessionId: string;
  walletAddress: string;
  privateKey: string;
  faucet: string;
};

type DeployData = {
  walletAddress: string;
  contractAddress: string;
  contractLink: string;
};

/* --- Components --- */

const Button = ({
  children,
  onClick,
  disabled,
  variant = "primary",
  className = ""
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
}) => {
  const baseStyle = "px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-[var(--primary)] hover:opacity-90 text-[var(--primary-foreground)] shadow-lg shadow-[var(--primary)]/20",
    secondary: "bg-[var(--secondary)] hover:opacity-90 text-[var(--secondary-foreground)] border border-[var(--border)]",
    outline: "border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-2xl p-6 shadow-2xl ${className}`}>
    {children}
  </div>
);

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 hover:bg-[var(--primary)]/20 rounded-lg transition-colors text-[var(--muted-foreground)] hover:text-white"
      title="Copy to clipboard"
    >
      {copied ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
    </button>
  );
};

/* --- Main Page --- */

export default function Home() {
  const [step, setStep] = useState<"IDLE" | "SESSION" | "FUNDING" | "DEPLOYING" | "SUCCESS">("IDLE");
  const [session, setSession] = useState<SessionData | null>(null);
  const [deployResult, setDeployResult] = useState<DeployData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/start`);

      const data = res.data;
      if (data.success && data.data) {
        setSession(data.data);
        setStep("SESSION");
      } else if (data.sessionId) {
        setSession(data as SessionData);
        setStep("SESSION");
      } else {
        setError(data.error?.message || "Failed to start session");
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    setStep("DEPLOYING");

    try {
      const res = await axios.post(`${API_BASE_URL}/api/deploy`, {
        sessionId: session.sessionId
      });

      const data = res.data;
      if (data.success && data.data) {
        setDeployResult(data.data);
        setStep("SUCCESS");
      } else if (data.contractAddress || data.walletAddress) {
        setDeployResult(data as DeployData);
        setStep("SUCCESS");
      } else {
        setError(data.error?.message || "Deployment failed");
        setStep("SESSION");
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.response?.data?.error || err.message || "Deployment failed";

      if (errorMessage.includes("insufficient funds")) {
        setError("Insufficient funds! Please make sure you have claimed ETH from the faucet.");
      } else {
        setError(errorMessage);
      }
      setStep("SESSION");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("IDLE");
    setSession(null);
    setDeployResult(null);
    setError(null);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-96 h-96 bg-[var(--primary)]/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[var(--color-brand-deep)]/30 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-3xl z-10 space-y-8">

        {/* Header */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative w-24 h-24 md:w-32 md:h-32 drop-shadow-2xl">
              <Image
                src="/logo.png"
                alt="Seismic Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--accent)] text-sm font-medium">
            <Rocket size={14} />
            <span>Seismic Devnet Playground</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--foreground)] via-[var(--color-brand-beige)] to-[var(--color-brand-mauve)] tracking-tight">
            Build on Seismic
          </h1>
          <p className="text-[var(--muted-foreground)] text-lg max-w-xl mx-auto">
            Experience the future of on-chain privacy. Build shielded applications with protocol-level encryption using Seismic's modified EVM and secure hardware integration.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="text-red-500 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Dynamic Content Card */}
        <div className="transition-all duration-500 ease-in-out">
          {step === "IDLE" && (
            <Card className="text-center py-12">
              <div className="space-y-6">
                <div className="w-16 h-16 bg-zinc-800 rounded-2xl mx-auto flex items-center justify-center">
                  <Terminal size={32} className="text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Ready to Start?</h3>
                  <p className="text-[var(--muted-foreground)]">Creates a temporary wallet session for you.</p>
                </div>
                <Button onClick={handleStartSession} disabled={loading} className="w-full md:w-auto mx-auto min-w-[200px]">
                  {loading ? <Loader2 className="animate-spin" /> : "Start Simulation"}
                </Button>
              </div>
            </Card>
          )}

          {(step === "SESSION" || step === "DEPLOYING") && session && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              {/* Wallet Info */}
              <Card>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-[var(--primary)]/20 rounded-lg text-[var(--primary)]">
                    <Wallet size={20} />
                  </div>
                  <h2 className="text-xl font-semibold">Step 1: Fund Your Wallet</h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-[var(--muted-foreground)] uppercase tracking-wider font-semibold">Wallet Address</label>
                    <div className="flex items-center gap-2 bg-[var(--background)]/50 border border-[var(--border)] rounded-lg p-3">
                      <code className="flex-1 text-[var(--foreground)] font-mono text-sm break-all">{session.walletAddress}</code>
                      <CopyButton text={session.walletAddress} />
                      <a
                        href={`https://explorer-2.seismicdev.net/address/${session.walletAddress}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 hover:bg-[var(--primary)]/20 rounded-lg transition-colors text-[var(--muted-foreground)] hover:text-white"
                        title="View on Explorer"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>

                  <div className="bg-[var(--secondary)]/50 border border-[var(--secondary)] p-4 rounded-lg text-white text-sm">
                    ⚠️ <strong>Development Only:</strong> Private Key: <span className="font-mono blur-[2px] hover:blur-none transition-all cursor-pointer select-all">{session.privateKey}</span>
                  </div>

                  <div className="pt-4 border-t border-[var(--border)]">
                    <p className="text-[var(--muted-foreground)] mb-4">You need to fund this wallet to deploy contracts.</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <a
                        href={session.faucet}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1"
                      >
                        <Button variant="secondary" className="w-full">
                          Open Faucet <ExternalLink size={16} />
                        </Button>
                      </a>
                      <Button onClick={handleDeploy} disabled={loading || step === "DEPLOYING"} className="flex-1">
                        {step === "DEPLOYING" ? (
                          <>
                            <Loader2 className="animate-spin" /> Deploying...
                          </>
                        ) : (
                          <>
                            I Have Funded It <ChevronRight size={16} />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {step === "SUCCESS" && deployResult && (
            <div className="animate-in zoom-in-95 duration-500">
              <Card className="border-[var(--primary)]/50 bg-[var(--primary)]/10">
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-[var(--primary)]/20 rounded-full mx-auto flex items-center justify-center mb-4">
                    <CheckCircle2 size={40} className="text-green-500" />
                  </div>

                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Deployment Successful!</h2>
                    <p className="text-[var(--muted-foreground)]">Your smart contract is live on the Devnet.</p>
                  </div>

                  <div className="bg-[var(--background)]/50 border border-[var(--border)] rounded-xl p-4 text-left space-y-4">
                    <div>
                      <label className="text-xs text-[var(--muted-foreground)] uppercase font-semibold">Contract Address</label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[var(--accent)] text-lg">{deployResult.contractAddress}</span>
                        <CopyButton text={deployResult.contractAddress} />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <a href={deployResult.contractLink} target="_blank" rel="noreferrer" className="flex-1">
                      <Button className="w-full">
                        View on Explorer <ExternalLink size={16} />
                      </Button>
                    </a>
                    <Button variant="secondary" onClick={reset} className="flex-1">
                      Start New Session
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
