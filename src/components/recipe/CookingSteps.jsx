import React, { useState, useEffect } from "react";
import { Clock, ChefHat, Play, Pause, RotateCcw, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function StepTimer({ seconds }) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [running, setRunning] = useState(false);
  const done = timeLeft === 0;

  useEffect(() => {
    if (!running || done) return;
    const t = setInterval(() => setTimeLeft(n => n - 1), 1000);
    return () => clearInterval(t);
  }, [running, done]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className="flex items-center gap-2 mt-2">
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${done ? "bg-chart-3/10 border-chart-3/20" : "bg-primary/10 border-primary/20"}`}>
        {done ? <CheckCircle className="w-3 h-3 text-chart-3" /> : <Clock className="w-3 h-3 text-primary" />}
        <span className={`text-xs font-black font-mono ${done ? "text-chart-3" : "text-primary"}`}>
          {done ? "Done!" : `${mins}:${secs.toString().padStart(2, "0")}`}
        </span>
      </div>
      {!done && (
        <button onClick={() => setRunning(!running)}
          className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
          {running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 text-primary" />}
        </button>
      )}
      <button onClick={() => { setTimeLeft(seconds); setRunning(false); }}
        className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
        <RotateCcw className="w-3 h-3 text-muted-foreground" />
      </button>
    </div>
  );
}

export default function CookingSteps({ steps, isGuidedMode }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!steps || steps.length === 0) return null;

  if (isGuidedMode) {
    const step = steps[currentStep];
    const isLast = currentStep === steps.length - 1;

    return (
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {/* Progress header */}
        <div className="bg-primary/5 border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-primary" />
            <span className="text-xs font-black text-foreground">Guided Cooking</span>
          </div>
          <span className="text-xs font-black text-primary">{currentStep + 1} / {steps.length}</span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center text-xl font-black text-primary">
                {step.step_number || currentStep + 1}
              </div>
              <p className="text-base font-medium text-foreground leading-relaxed">{step.instruction}</p>
              {step.ingredient_note && (
                <div className="bg-chart-2/8 border border-chart-2/15 rounded-xl px-3 py-2">
                  <p className="text-xs text-chart-2 font-medium">🧂 {step.ingredient_note}</p>
                </div>
              )}
              {step.timer_seconds && <StepTimer seconds={step.timer_seconds} />}
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3 mt-6">
            <button
              disabled={currentStep === 0}
              onClick={() => setCurrentStep(s => s - 1)}
              className="flex-1 h-11 rounded-xl border border-border text-sm font-bold text-foreground disabled:opacity-30 transition-all active:scale-95"
            >
              ← Previous
            </button>
            <button
              onClick={() => !isLast && setCurrentStep(s => s + 1)}
              className={`flex-1 h-11 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                isLast
                  ? "bg-chart-3/15 text-chart-3 border border-chart-3/25"
                  : "bg-primary text-white"
              }`}
            >
              {isLast ? "🎉 All Done!" : "Next Step →"}
            </button>
          </div>

          {/* Step dots */}
          <div className="flex gap-1.5 mt-4 justify-center">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`rounded-full transition-all ${
                  i === currentStep ? "w-6 h-1.5 bg-primary" :
                  i < currentStep ? "w-1.5 h-1.5 bg-chart-3" : "w-1.5 h-1.5 bg-border"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-border flex items-center gap-2">
        <ChefHat className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-black text-foreground">Cooking Instructions</h3>
        <span className="ml-auto text-[9px] font-black text-muted-foreground uppercase tracking-wider">{steps.length} steps</span>
      </div>
      <div className="p-4 space-y-4">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="flex gap-3"
          >
            <div className="w-7 h-7 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">
              {step.step_number || i + 1}
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground leading-relaxed">{step.instruction}</p>
              {step.ingredient_note && (
                <p className="text-xs text-muted-foreground mt-1">🧂 {step.ingredient_note}</p>
              )}
              {step.timer_seconds && <StepTimer seconds={step.timer_seconds} />}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}