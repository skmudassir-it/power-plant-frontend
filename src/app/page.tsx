"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Thermometer,
  Gauge,
  Droplets,
  Wind,
  Factory,
  AlertCircle,
} from "lucide-react";
import { predictEnergy } from "@/lib/predict";

// ─── INPUT CONFIG ─────────────────────────────────────────────────────────────

type InputField = {
  id: string;
  label: string;
  unit: string;
  icon: React.ReactNode;
  min: number;
  max: number;
  step: number;
  placeholder: string;
};

const inputFields: InputField[] = [
  {
    id: "temperature",
    label: "Temperature",
    unit: "°C",
    icon: <Thermometer className="w-5 h-5" />,
    min: 0,
    max: 40,
    step: 0.1,
    placeholder: "e.g. 25",
  },
  {
    id: "vacuum",
    label: "Exhaust Vacuum",
    unit: "cm Hg",
    icon: <Wind className="w-5 h-5" />,
    min: 20,
    max: 85,
    step: 0.1,
    placeholder: "e.g. 60",
  },
  {
    id: "pressure",
    label: "Ambient Pressure",
    unit: "milibar",
    icon: <Gauge className="w-5 h-5" />,
    min: 900,
    max: 1100,
    step: 0.1,
    placeholder: "e.g. 1013",
  },
  {
    id: "humidity",
    label: "Relative Humidity",
    unit: "%",
    icon: <Droplets className="w-5 h-5" />,
    min: 0,
    max: 100,
    step: 0.1,
    placeholder: "e.g. 70",
  },
];

// ─── ENERGY GAUGE ─────────────────────────────────────────────────────────────

function EnergyGauge({ value }: { value: number }) {
  const minVal = 420;
  const maxVal = 500;
  const clamped = Math.max(minVal, Math.min(maxVal, value));
  const percent = ((clamped - minVal) / (maxVal - minVal)) * 100;

  return (
    <div className="relative">
      <div className="h-4 rounded-full bg-white/[0.05] border border-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.2 }}
        />
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-zinc-600 font-medium">
        <span>{minVal} MW</span>
        <span>{Math.round((minVal + maxVal) / 2)} MW</span>
        <span>{maxVal} MW</span>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function Home() {
  const [values, setValues] = useState<Record<string, string>>({
    temperature: "",
    vacuum: "",
    pressure: "",
    humidity: "",
  });
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (id: string, val: string) => {
    setValues((prev) => ({ ...prev, [id]: val }));
    setResult(null);
    setError(null);
  };

  const allFilled = Object.values(values).every((v) => v !== "");

  const handlePredict = () => {
    if (!allFilled) return;
    setError(null);

    try {
      const features = [
        parseFloat(values.temperature),
        parseFloat(values.vacuum),
        parseFloat(values.pressure),
        parseFloat(values.humidity),
      ];

      // Validate ranges
      const mins = [0, 20, 900, 0];
      const maxs = [40, 85, 1100, 100];
      for (let i = 0; i < 4; i++) {
        if (features[i] < mins[i] || features[i] > maxs[i]) {
          setError(`${inputFields[i].label} out of range (${mins[i]}-${maxs[i]} ${inputFields[i].unit})`);
          return;
        }
      }

      const prediction = predictEnergy(features);
      setResult(Math.round(prediction * 100) / 100);
    } catch (e: any) {
      setError(e.message || "Prediction failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#050510] font-sans overflow-hidden relative">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-amber-900/10 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-blue-900/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-xl mx-auto px-4 py-8 sm:py-16">
        {/* ── Header ── */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 mb-5 shadow-lg shadow-amber-500/20"
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <Factory className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-bold">
            <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Power Plant Energy Predictor
            </span>
          </h1>
          <p className="mt-2 text-zinc-500 text-sm max-w-md mx-auto">
            Predict net hourly electrical energy output (MW) of a Combined Cycle
            Power Plant using ambient sensor readings
          </p>
        </motion.div>

        {/* ── Input Grid ── */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {inputFields.map((field, i) => (
            <motion.div
              key={field.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="relative"
            >
              <label className="flex items-center gap-2 text-xs text-zinc-400 mb-1.5 font-medium">
                {field.icon}
                {field.label}
                <span className="text-zinc-600 ml-auto">{field.unit}</span>
              </label>
              <input
                type="number"
                value={values[field.id]}
                onChange={(e) => handleChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                min={field.min}
                max={field.max}
                step={field.step}
                className="w-full h-12 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-zinc-700 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all text-base"
                onKeyDown={(e) => e.key === "Enter" && handlePredict()}
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-zinc-700">{field.min}</span>
                <span className="text-[10px] text-zinc-700">{field.max}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Predict Button ── */}
        <motion.button
          onClick={handlePredict}
          disabled={!allFilled}
          className="w-full h-14 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-lg shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          whileHover={allFilled ? { scale: 1.02 } : {}}
          whileTap={allFilled ? { scale: 0.98 } : {}}
        >
          <Zap className="w-5 h-5" />
          Predict Energy Output
        </motion.button>

        {/* ── Result ── */}
        <AnimatePresence mode="wait">
          {(result !== null || error) && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="mt-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 backdrop-blur-sm"
            >
              {error ? (
                <div className="flex items-center gap-3 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-sm">{error}</p>
                </div>
              ) : result !== null ? (
                <>
                  <div className="text-center mb-4">
                    <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">
                      Predicted Energy Output
                    </p>
                    <motion.p
                      className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 bg-clip-text text-transparent tabular-nums"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    >
                      {result.toFixed(2)}
                      <span className="text-xl text-zinc-500 ml-1">MW</span>
                    </motion.p>
                  </div>
                  <EnergyGauge value={result} />
                  <p className="text-center text-zinc-600 text-[10px] mt-4">
                    Decision Tree model · 127 nodes · Trained on 9,568 data points
                  </p>
                </>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Info Cards ── */}
        <motion.div
          className="mt-10 grid grid-cols-2 gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {[
            { label: "Data Points", value: "9,568" },
            { label: "Model", value: "Decision Tree" },
            { label: "Features", value: "4 sensors" },
            { label: "Runs In", value: "Browser" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.07 }}
            >
              <p className="text-zinc-500 text-[10px] uppercase tracking-wider">{item.label}</p>
              <p className="text-white font-semibold text-sm mt-0.5">{item.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Footer ── */}
        <motion.footer
          className="text-center pt-10 mt-8 border-t border-white/[0.04]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <p className="text-zinc-600 text-xs">
            Developed by Mudassir Shaik · ML model trained on CCPP dataset (2006–2011)
          </p>
        </motion.footer>
      </div>
    </div>
  );
}
