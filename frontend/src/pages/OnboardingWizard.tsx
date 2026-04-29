/**
 * Guided 60-second onboarding wizard (issue #16).
 *
 * Goal: every new user reaches a deployed workflow in under 90 seconds.
 *
 * State: persisted to localStorage under `zigsaw.onboarding.v1` so a refresh
 * never loses progress. Skip is always available; the user lands on /workflow
 * with a starter workflow loaded if they skip.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Check, ChevronLeft, Sparkles, Workflow, Rocket } from "lucide-react";

const STORAGE_KEY = "zigsaw.onboarding.v1";

type StepId = "welcome" | "task" | "preview" | "run" | "deploy" | "done";

const STEPS: ReadonlyArray<{ id: StepId; label: string }> = [
  { id: "welcome", label: "Welcome" },
  { id: "task", label: "Your task" },
  { id: "preview", label: "Workflow" },
  { id: "run", label: "Run" },
  { id: "deploy", label: "Deploy" },
  { id: "done", label: "Done" },
];

interface PersistedState {
  step: StepId;
  taskAnswer: string;
  startedAt: number;
}

const TASK_PRESETS: ReadonlyArray<{ label: string; description: string }> = [
  { label: "Summarize PRs", description: "When a GitHub PR opens, summarize it with Claude and email me the highlights." },
  { label: "Triage support email", description: "Watch my Gmail inbox, classify each new message, and write a draft reply." },
  { label: "Daily team digest", description: "Every Monday 9am, summarize last week's commits and post to Slack." },
  { label: "Lead enrichment", description: "When a new Stripe customer signs up, enrich them with web data and add to my CRM." },
  { label: "Invoice extraction", description: "When an invoice PDF lands in my inbox, parse it and append a row to my spreadsheet." },
];

function loadState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedState) : null;
  } catch {
    return null;
  }
}

function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage might be unavailable (private mode); fail silently.
  }
}

function trackEvent(event: string, payload?: Record<string, unknown>): void {
  // Lightweight analytics shim. Wired to a real provider later.
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("zigsaw:onboarding", { detail: { event, ...payload } }));
  }
}

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const initial = loadState();
  const [step, setStep] = useState<StepId>(initial?.step ?? "welcome");
  const [taskAnswer, setTaskAnswer] = useState<string>(initial?.taskAnswer ?? "");
  const [runProgress, setRunProgress] = useState(0);
  const startedAt = useMemo(() => initial?.startedAt ?? Date.now(), [initial?.startedAt]);

  useEffect(() => {
    saveState({ step, taskAnswer, startedAt });
  }, [step, taskAnswer, startedAt]);

  useEffect(() => {
    trackEvent("started", { step });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentIndex = STEPS.findIndex((s) => s.id === step);
  const progressPct = ((currentIndex + 1) / STEPS.length) * 100;

  const goNext = (next: StepId) => {
    trackEvent("step_completed", { from: step, to: next });
    setStep(next);
  };

  const skip = () => {
    trackEvent("skipped", { atStep: step, secondsElapsed: Math.round((Date.now() - startedAt) / 1000) });
    localStorage.setItem("zigsaw.onboarding.completed", "skipped");
    navigate("/workflow");
  };

  // Simulate execution streaming on the Run step.
  useEffect(() => {
    if (step !== "run") return;
    setRunProgress(0);
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setRunProgress((p) => {
        const next = Math.min(100, p + 4 + Math.random() * 8);
        if (next >= 100) {
          setTimeout(() => goNext("deploy"), 400);
          return 100;
        }
        setTimeout(tick, 120);
        return next;
      });
    };
    tick();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const finish = () => {
    trackEvent("completed", { secondsElapsed: Math.round((Date.now() - startedAt) / 1000) });
    localStorage.setItem("zigsaw.onboarding.completed", "true");
    navigate("/workflow");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 text-white flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10" role="banner">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-wider uppercase opacity-80">
          <Sparkles className="h-4 w-4" aria-hidden /> Zigsaw onboarding
        </div>
        <button
          type="button"
          onClick={skip}
          className="text-sm text-white/70 hover:text-white underline underline-offset-4"
          aria-label="Skip the onboarding tour"
        >
          Skip tour
        </button>
      </header>

      {/* Progress */}
      <div className="px-6 pt-4" aria-live="polite">
        <Progress value={progressPct} className="h-1 bg-white/10" />
        <ol className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-70" aria-label="Onboarding steps">
          {STEPS.map((s, i) => (
            <li key={s.id} className={i <= currentIndex ? "text-white" : ""}>
              <span aria-current={s.id === step ? "step" : undefined}>{i + 1}. {s.label}</span>
            </li>
          ))}
        </ol>
      </div>

      <main className="flex-1 px-6 py-12 flex items-center justify-center" role="main">
        <Card className="w-full max-w-2xl bg-white/5 border-white/10 backdrop-blur p-8">
          {step === "welcome" && (
            <section aria-labelledby="welcome-heading">
              <h1 id="welcome-heading" className="text-3xl font-bold tracking-tight">
                Build your first automation in 60 seconds.
              </h1>
              <p className="mt-3 text-white/80 leading-relaxed">
                Tell Zigsaw what you want automated. We'll generate the workflow, run it
                live, and deploy it as a real API endpoint — all before this page reloads.
              </p>
              <div className="mt-8 flex items-center gap-3">
                <Button onClick={() => goNext("task")} className="bg-violet-500 hover:bg-violet-400 text-white">
                  Let's go <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Button>
                <span className="text-xs text-white/60">No credit card required</span>
              </div>
            </section>
          )}

          {step === "task" && (
            <section aria-labelledby="task-heading">
              <h2 id="task-heading" className="text-2xl font-semibold">What's your most repetitive task?</h2>
              <p className="mt-2 text-white/70">Pick one — or describe your own.</p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TASK_PRESETS.map((preset) => {
                  const selected = taskAnswer === preset.description;
                  return (
                    <button
                      type="button"
                      key={preset.label}
                      onClick={() => setTaskAnswer(preset.description)}
                      className={`text-left rounded-md border px-4 py-3 transition ${
                        selected
                          ? "border-violet-400 bg-violet-500/20"
                          : "border-white/15 bg-white/5 hover:border-white/30"
                      }`}
                      aria-pressed={selected}
                    >
                      <div className="font-medium">{preset.label}</div>
                      <div className="text-xs text-white/60 mt-1 line-clamp-2">{preset.description}</div>
                    </button>
                  );
                })}
              </div>
              <Textarea
                value={taskAnswer}
                onChange={(e) => setTaskAnswer(e.target.value)}
                placeholder="…or write your own (plain English)"
                className="mt-4 bg-black/30 border-white/15 text-white placeholder:text-white/40"
                rows={3}
                aria-label="Describe your automation task"
              />
              <div className="mt-6 flex items-center justify-between">
                <Button variant="ghost" onClick={() => goNext("welcome")} className="text-white/70">
                  <ChevronLeft className="mr-2 h-4 w-4" aria-hidden /> Back
                </Button>
                <Button
                  onClick={() => goNext("preview")}
                  disabled={taskAnswer.trim().length < 10}
                  className="bg-violet-500 hover:bg-violet-400"
                >
                  Generate workflow <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Button>
              </div>
            </section>
          )}

          {step === "preview" && (
            <section aria-labelledby="preview-heading">
              <h2 id="preview-heading" className="text-2xl font-semibold flex items-center gap-2">
                <Workflow className="h-6 w-6" aria-hidden /> Here's your workflow
              </h2>
              <p className="mt-2 text-white/70 text-sm">Generated from: "{taskAnswer.slice(0, 80)}{taskAnswer.length > 80 ? "…" : ""}"</p>
              <ol className="mt-6 space-y-3">
                {[
                  { name: "Trigger", subtitle: "Webhook / cron / event", color: "bg-amber-500/20 text-amber-200 border-amber-400/40" },
                  { name: "Claude", subtitle: "Reason about the input", color: "bg-violet-500/20 text-violet-200 border-violet-400/40" },
                  { name: "Integration", subtitle: "Email / Slack / Sheet", color: "bg-teal-500/20 text-teal-200 border-teal-400/40" },
                  { name: "Result", subtitle: "Deployed live API", color: "bg-pink-500/20 text-pink-200 border-pink-400/40" },
                ].map((node, i) => (
                  <li key={node.name} className={`rounded-md border px-4 py-3 flex items-center gap-3 ${node.color}`}>
                    <span className="font-mono text-xs opacity-70">{i + 1}</span>
                    <div>
                      <div className="font-medium">{node.name}</div>
                      <div className="text-xs opacity-80">{node.subtitle}</div>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-6 flex items-center justify-between">
                <Button variant="ghost" onClick={() => goNext("task")} className="text-white/70">
                  <ChevronLeft className="mr-2 h-4 w-4" aria-hidden /> Back
                </Button>
                <Button onClick={() => goNext("run")} className="bg-violet-500 hover:bg-violet-400">
                  Run it <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Button>
              </div>
            </section>
          )}

          {step === "run" && (
            <section aria-labelledby="run-heading" aria-live="polite">
              <h2 id="run-heading" className="text-2xl font-semibold">Running…</h2>
              <p className="mt-2 text-white/70 text-sm">Streaming live execution</p>
              <div className="mt-8">
                <Progress value={runProgress} className="h-2" aria-label="Workflow execution progress" />
                <div className="mt-3 text-xs text-white/60 font-mono">
                  {runProgress < 30 && "→ Trigger fired"}
                  {runProgress >= 30 && runProgress < 60 && "→ Claude reasoning…"}
                  {runProgress >= 60 && runProgress < 90 && "→ Integration call"}
                  {runProgress >= 90 && "→ Done. Output captured."}
                </div>
              </div>
            </section>
          )}

          {step === "deploy" && (
            <section aria-labelledby="deploy-heading">
              <h2 id="deploy-heading" className="text-2xl font-semibold flex items-center gap-2">
                <Rocket className="h-6 w-6" aria-hidden /> Deploy as a live API
              </h2>
              <p className="mt-2 text-white/70 text-sm">One click. Stable URL. Auto-published OpenAPI spec.</p>
              <div className="mt-6 rounded-md bg-black/40 border border-white/10 p-4 font-mono text-xs">
                <div className="text-white/60">$ curl -X POST \</div>
                <div className="ml-4 text-emerald-300">https://api.figsaw.dev/w/your-first-workflow</div>
                <div className="ml-4 text-white/60">-H "Authorization: Bearer $ZIGSAW_KEY"</div>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <Button variant="ghost" onClick={() => goNext("preview")} className="text-white/70">
                  <ChevronLeft className="mr-2 h-4 w-4" aria-hidden /> Back
                </Button>
                <Button onClick={() => goNext("done")} className="bg-violet-500 hover:bg-violet-400">
                  Deploy <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Button>
              </div>
            </section>
          )}

          {step === "done" && (
            <section aria-labelledby="done-heading" className="text-center">
              <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                <Check className="h-7 w-7 text-emerald-300" aria-hidden />
              </div>
              <h2 id="done-heading" className="mt-4 text-2xl font-semibold">
                You're live.
              </h2>
              <p className="mt-2 text-white/70">
                Took {Math.round((Date.now() - startedAt) / 1000)} seconds. Now build something
                impossible.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <Button onClick={finish} className="bg-violet-500 hover:bg-violet-400">
                  Open the editor <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Button>
              </div>
            </section>
          )}
        </Card>
      </main>
    </div>
  );
}
