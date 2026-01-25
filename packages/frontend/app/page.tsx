"use client";

import { useState } from "react";
import axios from "axios";
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
// In a real app, use process.env.NEXT_PUBLIC_API_URL
// For this demo, we use the specific VPS IP or localhost if configured.
// Ideally, the Next.js app should proxy these requests or point to the right place.
const API_BASE_URL = "http://75.119.155.222:3000"; // Based on docs

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
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700",
    outline: "border border-zinc-700 text-zinc-300 hover:bg-zinc-800/50"
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
  <div className={`bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-2xl ${className}`}>
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
      className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
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

      // Support both new standard format and legacy flat format
      const data = res.data;
      if (data.success && data.data) {
        setSession(data.data);
        setStep("SESSION");
      } else if (data.sessionId) {
        // Handle legacy/flat response from VPS if server code isn't updated yet
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

  const handleFunded = () => {
    setStep("FUNDING");
    // Small artificial delay to improve UX
    setTimeout(() => setStep("DEPLOYING"), 500);
    // Actually, "DEPLOYING" is a state where we show the deploy button. 
    // Let's rename step for clarity: "READY_TO_DEPLOY"
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

      // Support both new standard format and legacy flat format
      const data = res.data;
      if (data.success && data.data) {
        setDeployResult(data.data);
        setStep("SUCCESS");
      } else if (data.contractAddress || data.walletAddress) {
        // Handle legacy/flat response
        setDeployResult(data as DeployData);
        setStep("SUCCESS");
      } else {
        setError(data.error?.message || "Deployment failed");
        setStep("SESSION");
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || "Deployment failed");
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
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-3xl z-10 space-y-8">

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
            <Rocket size={14} />
            <span>Seismic Devnet Playground</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500 tracking-tight">
            Build on Seismic
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Experience the future of decentralized computing. Generate a wallet, fund it, and deploy a contract in seconds.
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
                  <p className="text-zinc-400">Creates a temporary wallet session for you.</p>
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
                  <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                    <Wallet size={20} />
                  </div>
                  <h2 className="text-xl font-semibold">Step 1: Fund Your Wallet</h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-500 uppercase tracking-wider font-semibold">Wallet Address</label>
                    <div className="flex items-center gap-2 bg-zinc-950/50 border border-zinc-800 rounded-lg p-3">
                      <code className="flex-1 text-zinc-300 font-mono text-sm break-all">{session.walletAddress}</code>
                      <CopyButton text={session.walletAddress} />
                    </div>
                  </div>

                  <div className="bg-amber-900/20 border border-amber-900/50 p-4 rounded-lg text-amber-200/80 text-sm">
                    ⚠️ <strong>Development Only:</strong> Private Key: <span className="font-mono blur-[2px] hover:blur-none transition-all cursor-pointer select-all">{session.privateKey}</span>
                  </div>

                  <div className="pt-4 border-t border-zinc-800">
                    <p className="text-zinc-400 mb-4">You need to fund this wallet to deploy contracts.</p>
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
              <Card className="border-green-500/20 bg-green-900/5">
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full mx-auto flex items-center justify-center mb-4">
                    <CheckCircle2 size={40} className="text-green-500" />
                  </div>

                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Deployment Successful!</h2>
                    <p className="text-zinc-400">Your smart contract is live on the Devnet.</p>
                  </div>

                  <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-left space-y-4">
                    <div>
                      <label className="text-xs text-zinc-500 uppercase font-semibold">Contract Address</label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-green-400 text-lg">{deployResult.contractAddress}</span>
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
