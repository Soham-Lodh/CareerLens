// CareerLens — Career & Burnout Predictor
// Requires: VITE_API_BASE_URL in .env
// Stack: React (hooks only), vanilla CSS-in-JS

import React, { useState, useEffect, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const STEPS = [
  { id: 1, label: "Personal" },
  { id: 2, label: "Academic" },
  { id: 3, label: "AI & Career" },
  { id: 4, label: "Lifestyle" },
];

const initialFormData = {
  age: "",
  gender: "",
  urban_or_rural: "",
  degree_type: "",
  stream: "",
  year_of_study: "",
  college_tier: "",
  internship_experience: "",
  skill_development_courses_taken: "",
  weekly_job_application_count: "",
  primary_ai_tools_used: "",
  daily_ai_tool_usage_hrs: "",
  ai_replaces_own_thinking_score: 5,
  ai_dependency_score: 5,
  fear_of_job_loss_to_ai: 5,
  career_clarity_score: 5,
  resume_confidence_score: 5,
  interview_anxiety_score: 5,
  daily_study_hours: "",
  self_learning_hours_per_week: "",
  social_media_hrs_per_day: "",
  sleep_hours: "",
  stress_level: 5,
  motivation_score: 5,
};

const STYLES = `
  :root {
    --bg: #252422;
    --surface: #403d39;
    --border: #5a554f;
    --text: #fffcf2;
    --muted: #ccc5b9;
    --accent: #eb5e28;
    --accent-hover: #d45524;
    --skeleton-highlight: #6c665f;
    --good: #8bd17c;
    --warn: #f2b134;
    --bad: #ff6b5b;
    color-scheme: dark;
  }

  * { box-sizing: border-box; }

  .cl-app {
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.5;
  }

  /* Navbar */
  .cl-navbar {
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 24px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
  }

  .cl-logo {
    font-weight: 800;
    font-size: 1.25rem;
    color: var(--accent);
    letter-spacing: -0.02em;
  }

  .cl-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.78rem;
    padding: 5px 10px;
    border-radius: 999px;
    border: 1px solid var(--border);
    color: var(--muted);
    background: var(--bg);
    white-space: nowrap;
  }

  .cl-pill .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }

  .cl-pill.warming .dot { animation: cl-pulse 1.4s ease-in-out infinite; }
  .cl-pill.ready { color: var(--good); border-color: rgba(139, 209, 124, 0.4); }
  .cl-pill.slow { color: var(--warn); border-color: rgba(242, 177, 52, 0.4); }

  @keyframes cl-pulse {
    0%, 100% { opacity: 0.3; transform: scale(0.85); }
    50% { opacity: 1; transform: scale(1.2); }
  }

  /* Hero */
  .cl-hero {
    background: var(--bg);
    padding: 48px 24px 32px;
    text-align: center;
    border-bottom: 1px solid var(--border);
  }

  .cl-hero h1 {
    margin: 0 0 12px;
    font-size: clamp(1.5rem, 4.2vw, 2.4rem);
    font-weight: 800;
    letter-spacing: -0.01em;
    color: var(--text);
  }

  .cl-hero p {
    margin: 0 auto;
    max-width: 580px;
    color: var(--muted);
    font-size: 0.98rem;
  }

  /* Layout */
  .cl-container {
    max-width: 860px;
    margin: 0 auto;
    padding: 32px 20px 64px;
  }

  /* Step progress */
  .cl-steps {
    display: flex;
    align-items: center;
    margin-bottom: 28px;
  }

  .cl-step {
    display: flex;
    align-items: center;
  }

  .cl-step-circle {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.9rem;
    border: 2px solid var(--border);
    color: var(--muted);
    background: var(--surface);
    flex-shrink: 0;
    transition: background 200ms ease, border-color 200ms ease, color 200ms ease;
  }

  .cl-step.active .cl-step-circle,
  .cl-step.complete .cl-step-circle {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--text);
  }

  .cl-step-label {
    margin-left: 10px;
    font-size: 0.85rem;
    color: var(--muted);
    white-space: nowrap;
  }

  .cl-step.active .cl-step-label,
  .cl-step.complete .cl-step-label {
    color: var(--text);
  }

  .cl-step-line {
    flex: 1;
    height: 2px;
    background: var(--border);
    margin: 0 12px;
    position: relative;
    overflow: hidden;
  }

  .cl-step-line::after {
    content: "";
    position: absolute;
    inset: 0;
    background: var(--accent);
    transform: scaleX(var(--fill, 0));
    transform-origin: left;
    transition: transform 300ms ease;
  }

  .cl-steps-mobile {
    display: none;
    font-size: 0.9rem;
    color: var(--muted);
    margin-bottom: 20px;
  }

  .cl-steps-mobile strong { color: var(--text); }

  @media (max-width: 640px) {
    .cl-steps { display: none; }
    .cl-steps-mobile { display: block; }
  }

  /* Card */
  .cl-card {
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(37, 36, 34, 0.10);
    padding: 28px;
  }

  @media (max-width: 640px) {
    .cl-card { padding: 20px; }
    .cl-hero { padding: 36px 16px 24px; }
  }

  .cl-card h2 {
    margin: 0 0 4px;
    font-size: 1.25rem;
    color: var(--text);
  }

  .cl-step-desc {
    margin: 0 0 24px;
    color: var(--muted);
    font-size: 0.9rem;
  }

  .cl-fade {
    animation: cl-fade-step 250ms ease;
  }

  @keyframes cl-fade-step {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Form grid & fields */
  .cl-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 20px;
  }

  @media (max-width: 640px) {
    .cl-grid { grid-template-columns: 1fr; }
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 18px;
  }

  .field label {
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text);
  }

  .field-helper {
    font-size: 0.8rem;
    color: var(--muted);
  }

  .input {
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text);
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 0.95rem;
    width: 100%;
    transition: border-color 150ms ease, box-shadow 150ms ease;
  }

  .input::placeholder { color: var(--muted); }

  .input:focus-visible {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(235, 94, 40, 0.35);
  }

  .input.error { border-color: var(--bad); }

  .field-error {
    color: #c0392b;
    font-size: 0.85rem;
    animation: cl-slide-down 200ms ease;
  }

  @keyframes cl-slide-down {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Radio pills */
  .radio-group {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .radio-pill {
    position: relative;
    display: inline-flex;
    align-items: center;
    padding: 9px 16px;
    border: 1px solid var(--border);
    border-radius: 999px;
    cursor: pointer;
    font-size: 0.9rem;
    color: var(--muted);
    background: var(--bg);
    transition: border-color 150ms ease, background 150ms ease, color 150ms ease;
  }

  .radio-pill input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .radio-pill:hover { border-color: var(--accent); }

  .radio-pill.active {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--text);
  }

  .radio-pill:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(235, 94, 40, 0.35);
  }

  /* Sliders */
  .slider-field { margin-bottom: 22px; }

  .slider-label-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 8px;
  }

  .slider-label-row label { font-size: 0.88rem; font-weight: 600; color: var(--text); }

  .slider-value {
    font-weight: 700;
    color: var(--accent);
    font-size: 1rem;
    min-width: 24px;
    text-align: right;
  }

  .slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 999px;
    outline: none;
    cursor: pointer;
    background: var(--border);
  }

  .slider:focus-visible {
    box-shadow: 0 0 0 3px rgba(235, 94, 40, 0.35);
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--bg);
    border: 3px solid var(--accent);
    cursor: pointer;
    transition: transform 150ms ease;
    margin-top: 0;
  }

  .slider::-webkit-slider-thumb:hover { transform: scale(1.12); }

  .slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--bg);
    border: 3px solid var(--accent);
    cursor: pointer;
  }

  .slider::-moz-range-track {
    height: 6px;
    border-radius: 999px;
    background: transparent;
  }

  .slider-range-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
    font-size: 0.78rem;
    color: var(--muted);
  }

  @media (max-width: 640px) {
    .slider-range-labels { flex-direction: column; gap: 2px; }
  }

  /* Buttons */
  .cl-nav-buttons {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 28px;
    gap: 12px;
  }

  .btn {
    font-size: 0.95rem;
    font-weight: 700;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    border: none;
    transition: background 150ms ease, color 150ms ease, transform 100ms ease, opacity 150ms ease;
  }

  .btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(235, 94, 40, 0.35);
  }

  .btn:active { transform: scale(0.98); }

  .btn-primary {
    background: var(--accent);
    color: var(--text);
  }

  .btn-primary:hover:not(:disabled) { background: var(--accent-hover); }

  .btn-primary:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .btn-outline {
    background: transparent;
    border: 2px solid var(--border);
    color: var(--text);
  }

  .btn-outline:hover { border-color: var(--accent); color: var(--accent); }

  .btn-outline.accent {
    border-color: var(--accent);
    color: var(--accent);
  }

  .btn-outline.accent:hover {
    background: var(--accent);
    color: var(--text);
  }

  .spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 252, 242, 0.35);
    border-top-color: var(--text);
    border-radius: 50%;
    margin-right: 8px;
    animation: cl-spin 700ms linear infinite;
    vertical-align: middle;
  }

  @keyframes cl-spin { to { transform: rotate(360deg); } }

  .cl-submit-error {
    color: var(--bad);
    font-size: 0.88rem;
    margin-top: 14px;
    text-align: center;
  }

  /* Skeleton */
  .cl-skeleton-msg {
    color: var(--muted);
    margin: 0 0 24px;
    font-size: 0.95rem;
    text-align: center;
  }

  .cl-skeleton-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  @media (max-width: 640px) {
    .cl-skeleton-grid { grid-template-columns: 1fr; }
  }

  .skeleton-card {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .skeleton-circle,
  .skeleton-line {
    background: linear-gradient(90deg, var(--border) 25%, var(--skeleton-highlight) 50%, var(--border) 75%);
    background-size: 200% 100%;
    animation: cl-shimmer 1.4s ease-in-out infinite;
    border-radius: 999px;
  }

  .skeleton-circle { width: 60px; height: 60px; }
  .skeleton-line { width: 80%; height: 12px; }
  .skeleton-line.short { width: 50%; }

  @keyframes cl-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Results */
  .cl-results-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  @media (max-width: 640px) {
    .cl-results-grid { grid-template-columns: 1fr; }
  }

  .result-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(37, 36, 34, 0.10);
    padding: 24px 20px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .result-card h3 {
    margin: 0;
    font-size: 1.05rem;
    color: var(--text);
  }

  .score-ring { display: block; margin: 4px auto; }

  .score-ring-fill { transition: stroke-dashoffset 800ms ease-out; }

  .score-ring-text {
    fill: var(--text);
    font-size: 24px;
    font-weight: 800;
    font-family: inherit;
  }

  .result-badge {
    font-weight: 700;
    font-size: 0.9rem;
    padding: 4px 14px;
    border-radius: 999px;
  }

  .result-badge.good { color: var(--good); background: rgba(139, 209, 124, 0.12); }
  .result-badge.warn { color: var(--warn); background: rgba(242, 177, 52, 0.12); }
  .result-badge.bad { color: var(--bad); background: rgba(255, 107, 91, 0.12); }

  .result-accuracy {
    color: var(--muted);
    font-size: 0.78rem;
    margin: auto 0 0;
    padding-top: 8px;
  }

  .counsel-icon {
    font-size: 48px;
    font-weight: 800;
    line-height: 1;
  }

  .counsel-icon.yes { color: var(--accent); }
  .counsel-icon.no { color: var(--good); }

  .counsel-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text);
  }

  .counsel-sub {
    color: var(--muted);
    font-size: 0.85rem;
    margin: 0;
  }

  .cl-disclaimer {
    border: 1px solid var(--border);
    background: var(--surface);
    border-radius: 10px;
    padding: 16px 18px;
    margin-top: 24px;
    color: var(--muted);
    font-size: 0.85rem;
    line-height: 1.6;
  }

  .cl-start-over {
    display: flex;
    justify-content: center;
    margin-top: 24px;
  }
`;

// ---------------------------------------------------------------------------
// Small reusable pieces
// ---------------------------------------------------------------------------

function StatusPill({ status }) {
  const config = {
    warming: { text: "Model warming up…", cls: "warming" },
    ready: { text: "Model ready ✓", cls: "ready" },
    slow: { text: "Model may be slow", cls: "slow" },
  };
  const current = config[status] || config.warming;
  return (
    <div className={`cl-pill ${current.cls}`}>
      <span className="dot" />
      <span>{current.text}</span>
    </div>
  );
}

function StepProgress({ step }) {
  return (
    <>
      <div className="cl-steps">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div
              className={`cl-step ${step === s.id ? "active" : step > s.id ? "complete" : ""}`}
            >
              <div className="cl-step-circle">{step > s.id ? "✓" : s.id}</div>
              <div className="cl-step-label">{s.label}</div>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="cl-step-line"
                style={{ "--fill": step > s.id ? 1 : 0 }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="cl-steps-mobile">
        Step {step} of {STEPS.length} · <strong>{STEPS[step - 1].label}</strong>
      </div>
    </>
  );
}

function NumberField({
  label,
  name,
  value,
  onChange,
  min,
  max,
  step,
  error,
  helper,
}) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type="number"
        inputMode="decimal"
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        aria-invalid={!!error}
        className={`input ${error ? "error" : ""}`}
      />
      {helper && <div className="field-helper">{helper}</div>}
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

function SelectField({ label, name, value, onChange, options, error, helper }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        aria-invalid={!!error}
        className={`input ${error ? "error" : ""}`}
      >
        <option value="">Select…</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {helper && <div className="field-helper">{helper}</div>}
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

function RadioField({ label, name, value, onChange, options, error }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="radio-group">
        {options.map((opt) => (
          <label
            key={opt}
            className={`radio-pill ${value === opt ? "active" : ""}`}
          >
            <input
              type="radio"
              name={name}
              value={opt}
              checked={value === opt}
              onChange={onChange}
            />
            {opt}
          </label>
        ))}
      </div>
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

function SliderField({ label, name, value, onChange, lowLabel, highLabel }) {
  const pct = ((value - 1) / 9) * 100;
  return (
    <div className="field slider-field">
      <div className="slider-label-row">
        <label htmlFor={name}>{label}</label>
        <span className="slider-value">{value}</span>
      </div>
      <input
        id={name}
        name={name}
        type="range"
        min="1"
        max="10"
        step="1"
        value={value}
        onChange={onChange}
        className="slider"
        style={{
          background: `linear-gradient(to right, var(--accent) ${pct}%, var(--border) ${pct}%)`,
        }}
      />
      <div className="slider-range-labels">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-circle" />
      <div className="skeleton-line" />
      <div className="skeleton-line short" />
    </div>
  );
}

function ScoreRing({ value, max = 10, size = 132, strokeWidth = 10 }) {
  const [filled, setFilled] = useState(false);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, value / max));
  const offset = circumference * (1 - pct);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <svg
      className="score-ring"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth={strokeWidth}
      />
      <circle
        className="score-ring-fill"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={filled ? offset : circumference}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        className="score-ring-text"
      >
        {value.toFixed(1)}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function isFilledNumber(v) {
  return v !== "" && v !== null && v !== undefined && !Number.isNaN(Number(v));
}

function validateStep(step, data) {
  const errors = {};

  if (step === 1) {
    if (!isFilledNumber(data.age) || data.age < 16 || data.age > 40) {
      errors.age = "Enter an age between 16 and 40.";
    }
    if (!data.gender) {
      errors.gender = "Select the option that best describes you.";
    }
    if (!data.urban_or_rural) {
      errors.urban_or_rural = "Let us know where you're based.";
    }
  }

  if (step === 2) {
    if (!data.degree_type) errors.degree_type = "Select your degree type.";
    if (!data.stream) errors.stream = "Select your stream.";
    if (
      !isFilledNumber(data.year_of_study) ||
      data.year_of_study < 1 ||
      data.year_of_study > 6
    ) {
      errors.year_of_study = "Enter a year of study between 1 and 6.";
    }
    if (!data.college_tier) errors.college_tier = "Select your college tier.";
    if (
      !isFilledNumber(data.internship_experience) ||
      data.internship_experience < 0
    ) {
      errors.internship_experience = "Enter 0 or more internships.";
    }
    if (
      !isFilledNumber(data.skill_development_courses_taken) ||
      data.skill_development_courses_taken < 0
    ) {
      errors.skill_development_courses_taken = "Enter 0 or more courses.";
    }
    if (
      !isFilledNumber(data.weekly_job_application_count) ||
      data.weekly_job_application_count < 0
    ) {
      errors.weekly_job_application_count = "Enter 0 or more applications.";
    }
  }

  if (step === 3) {
    if (!data.primary_ai_tools_used)
      errors.primary_ai_tools_used = "Select the AI tool you use most.";
    if (
      !isFilledNumber(data.daily_ai_tool_usage_hrs) ||
      data.daily_ai_tool_usage_hrs < 0 ||
      data.daily_ai_tool_usage_hrs > 24
    ) {
      errors.daily_ai_tool_usage_hrs = "Enter a value between 0 and 24 hours.";
    }
  }

  if (step === 4) {
    if (
      !isFilledNumber(data.daily_study_hours) ||
      data.daily_study_hours < 0 ||
      data.daily_study_hours > 24
    ) {
      errors.daily_study_hours = "Enter a value between 0 and 24 hours.";
    }
    if (
      !isFilledNumber(data.self_learning_hours_per_week) ||
      data.self_learning_hours_per_week < 0
    ) {
      errors.self_learning_hours_per_week = "Enter 0 or more hours.";
    }
    if (
      !isFilledNumber(data.social_media_hrs_per_day) ||
      data.social_media_hrs_per_day < 0 ||
      data.social_media_hrs_per_day > 24
    ) {
      errors.social_media_hrs_per_day = "Enter a value between 0 and 24 hours.";
    }
    if (
      !isFilledNumber(data.sleep_hours) ||
      data.sleep_hours < 0 ||
      data.sleep_hours > 24
    ) {
      errors.sleep_hours = "Enter a value between 0 and 24 hours.";
    }
  }

  return errors;
}

function burnoutBand(score) {
  if (score < 4) return { text: "Low Risk", cls: "good" };
  if (score < 7) return { text: "Moderate", cls: "warn" };
  return { text: "High Risk", cls: "bad" };
}

function readinessBand(score) {
  if (score < 4) return { text: "Needs Work", cls: "bad" };
  if (score < 7) return { text: "Developing", cls: "warn" };
  return { text: "Strong", cls: "good" };
}

// ---------------------------------------------------------------------------
// Results panel
// ---------------------------------------------------------------------------

function ResultsPanel({ results, onReset }) {
  const burnout = Number(results.burnout_score);
  const readiness = Number(results.career_readiness_score);
  const counseling = Math.round(Number(results.career_counseling_score));

  const bBand = burnoutBand(burnout);
  const rBand = readinessBand(readiness);

  return (
    <div className="cl-card cl-fade">
      <div className="cl-results-grid">
        <div className="result-card">
          <h3>Burnout Risk</h3>
          <ScoreRing value={burnout} />
          <span className={`result-badge ${bBand.cls}`}>{bBand.text}</span>
          <p className="result-accuracy">R² 0.56 · RMSE ±1.37</p>
        </div>

        <div className="result-card">
          <h3>Career Readiness</h3>
          <ScoreRing value={readiness} />
          <span className={`result-badge ${rBand.cls}`}>{rBand.text}</span>
          <p className="result-accuracy">R² 0.50 · RMSE ±1.13</p>
        </div>

        <div className="result-card">
          <h3>Counselling Recommendation</h3>
          {counseling === 1 ? (
            <>
              <div className="counsel-icon yes">✓</div>
              <div className="counsel-title">Recommended</div>
              <p className="counsel-sub">
                Based on your profile, career counselling could be highly
                beneficial.
              </p>
            </>
          ) : (
            <>
              <div className="counsel-icon no">✗</div>
              <div className="counsel-title">Not Recommended</div>
              <p className="counsel-sub">
                Your indicators don't suggest a pressing need right now.
              </p>
            </>
          )}
          <p className="result-accuracy">AUC 0.78 · F1 0.72 (weighted)</p>
        </div>
      </div>

      <div className="cl-disclaimer">
        These predictions are generated by machine learning models trained on
        student survey data. They are indicative, not diagnostic. Scores carry
        inherent uncertainty — treat them as a starting point for reflection,
        not a verdict.
      </div>

      <div className="cl-start-over">
        <button
          type="button"
          className="btn btn-outline accent"
          onClick={onReset}
        >
          Start Over
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main app
// ---------------------------------------------------------------------------

export default function App() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [modelStatus, setModelStatus] = useState("warming");
  const modelReady = useRef(false);

  // Wake-up ping — fired once on mount, never blocks the UI.
  useEffect(() => {
    let cancelled = false;

    fetch(`${API_BASE}/model_status`)
      .then((res) => {
        if (!res.ok) throw new Error("Model status check failed");
        return res.json();
      })
      .then(() => {
        if (cancelled) return;
        modelReady.current = true;
        setModelStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setModelStatus("slow");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "range" ? Number(value) : value,
    }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleNext = () => {
    const stepErrors = validateStep(step, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(STEPS.length, s + 1));
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = async () => {
    const stepErrors = validateStep(4, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setErrors({});
    setSubmitError("");
    setSubmitted(true);
    setLoading(true);

    const payload = {
      age: Number(formData.age),
      gender: formData.gender,
      degree_type: formData.degree_type,
      stream: formData.stream,
      year_of_study: Number(formData.year_of_study),
      college_tier: formData.college_tier,
      urban_or_rural: formData.urban_or_rural,
      daily_ai_tool_usage_hrs: Number(formData.daily_ai_tool_usage_hrs),
      primary_ai_tools_used: formData.primary_ai_tools_used,
      ai_replaces_own_thinking_score: Number(
        formData.ai_replaces_own_thinking_score,
      ),
      ai_dependency_score: Number(formData.ai_dependency_score),
      fear_of_job_loss_to_ai: Number(formData.fear_of_job_loss_to_ai),
      career_clarity_score: Number(formData.career_clarity_score),
      internship_experience: Number(formData.internship_experience),
      weekly_job_application_count: Number(
        formData.weekly_job_application_count,
      ),
      resume_confidence_score: Number(formData.resume_confidence_score),
      interview_anxiety_score: Number(formData.interview_anxiety_score),
      daily_study_hours: Number(formData.daily_study_hours),
      self_learning_hours_per_week: Number(
        formData.self_learning_hours_per_week,
      ),
      skill_development_courses_taken: Number(
        formData.skill_development_courses_taken,
      ),
      social_media_hrs_per_day: Number(formData.social_media_hrs_per_day),
      sleep_hours: Number(formData.sleep_hours),
      stress_level: Number(formData.stress_level),
      motivation_score: Number(formData.motivation_score),
    };

    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);

      const data = await res.json();
      setResults(data);
    } catch (err) {
      setSubmitError(
        "We couldn't reach the prediction service. Please try again in a moment.",
      );
      setSubmitted(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setErrors({});
    setStep(1);
    setResults(null);
    setSubmitted(false);
    setSubmitError("");
  };

  const showForm = !submitted && !results;
  const showSkeleton = submitted && loading && !results;

  return (
    <div className="cl-app">
      <style>{STYLES}</style>

      <nav className="cl-navbar">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <img
            src="/favicon.png"
            alt="CareerLens logo"
            width="32"
            height="32"
          />

          <div className="cl-logo">CareerLens</div>
        </div>
      </nav>

      <header className="cl-hero">
        <h1>Understand Your Career Trajectory with AI</h1>
        <p>
          Answer 24 questions. Get your burnout risk, career readiness, and
          counselling need — predicted by ML models trained on real student
          data.
        </p>
      </header>

      <main className="cl-container">
        {showForm && (
          <>
            <StepProgress step={step} />

            <div className="cl-card">
              <div key={step} className="cl-fade">
                {step === 1 && (
                  <>
                    <h2>Personal Details</h2>
                    <p className="cl-step-desc">
                      Let's start with a bit about you — this helps us calibrate
                      the model to your stage of life.
                    </p>
                    <div className="cl-grid">
                      <NumberField
                        label="Age"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        min={16}
                        max={40}
                        step={1}
                        error={errors.age}
                        helper="Used to compare you with peers at a similar life stage."
                      />
                      <RadioField
                        label="Gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        options={["Male", "Female", "Non-binary"]}
                        error={errors.gender}
                      />
                    </div>
                    <RadioField
                      label="Where do you currently live?"
                      name="urban_or_rural"
                      value={formData.urban_or_rural}
                      onChange={handleChange}
                      options={["Urban", "Rural"]}
                      error={errors.urban_or_rural}
                    />
                  </>
                )}

                {step === 2 && (
                  <>
                    <h2>Academic Background</h2>
                    <p className="cl-step-desc">
                      Tell us about your course of study and how you've been
                      building your profile so far.
                    </p>
                    <div className="cl-grid">
                      <SelectField
                        label="Degree Type"
                        name="degree_type"
                        value={formData.degree_type}
                        onChange={handleChange}
                        options={["B.Tech/B.E.", "M.Tech/M.Sc", "MBA", "Other"]}
                        error={errors.degree_type}
                      />
                      <SelectField
                        label="Stream"
                        name="stream"
                        value={formData.stream}
                        onChange={handleChange}
                        options={[
                          "CS/IT",
                          "Commerce/Management",
                          "Engineering (Non-CS)",
                          "Other",
                        ]}
                        error={errors.stream}
                      />
                      <NumberField
                        label="Year of Study"
                        name="year_of_study"
                        value={formData.year_of_study}
                        onChange={handleChange}
                        min={1}
                        max={6}
                        step={1}
                        error={errors.year_of_study}
                        helper="Which year of your current program you're in."
                      />
                      <SelectField
                        label="College Tier"
                        name="college_tier"
                        value={formData.college_tier}
                        onChange={handleChange}
                        options={["Tier 1", "Tier 2", "Tier 3"]}
                        error={errors.college_tier}
                        helper="Tier 1: top national institutes. Tier 2: established universities. Tier 3: others."
                      />
                      <NumberField
                        label="Internships Completed"
                        name="internship_experience"
                        value={formData.internship_experience}
                        onChange={handleChange}
                        min={0}
                        step={1}
                        error={errors.internship_experience}
                        helper="Include internships you're currently doing."
                      />
                      <NumberField
                        label="Online Courses Taken"
                        name="skill_development_courses_taken"
                        value={formData.skill_development_courses_taken}
                        onChange={handleChange}
                        min={0}
                        step={1}
                        error={errors.skill_development_courses_taken}
                        helper="Certifications or MOOCs completed outside your regular coursework."
                      />
                      <NumberField
                        label="Job Applications / Week"
                        name="weekly_job_application_count"
                        value={formData.weekly_job_application_count}
                        onChange={handleChange}
                        min={0}
                        step={1}
                        error={errors.weekly_job_application_count}
                        helper="Average applications you send out in a typical week."
                      />
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <h2>AI & Career Outlook</h2>
                    <p className="cl-step-desc">
                      Tell us how AI tools fit into your routine, and how you
                      feel about your career path right now.
                    </p>
                    <div className="cl-grid">
                      <SelectField
                        label="Primary AI Tool Used"
                        name="primary_ai_tools_used"
                        value={formData.primary_ai_tools_used}
                        onChange={handleChange}
                        options={[
                          "ChatGPT",
                          "Claude",
                          "Gemini",
                          "GitHub Copilot",
                          "Perplexity",
                          "None",
                          "Unknown",
                        ]}
                        error={errors.primary_ai_tools_used}
                      />
                      <NumberField
                        label="Daily AI Tool Usage (hrs)"
                        name="daily_ai_tool_usage_hrs"
                        value={formData.daily_ai_tool_usage_hrs}
                        onChange={handleChange}
                        min={0}
                        max={24}
                        step={0.5}
                        error={errors.daily_ai_tool_usage_hrs}
                        helper="Roughly how many hours a day you use AI tools for study or work."
                      />
                    </div>

                    <SliderField
                      label="AI replaces my own thinking"
                      name="ai_replaces_own_thinking_score"
                      value={formData.ai_replaces_own_thinking_score}
                      onChange={handleChange}
                      lowLabel="Rarely"
                      highLabel="Constantly"
                    />
                    <SliderField
                      label="Dependency on AI tools"
                      name="ai_dependency_score"
                      value={formData.ai_dependency_score}
                      onChange={handleChange}
                      lowLabel="Not dependent"
                      highLabel="Highly dependent"
                    />
                    <SliderField
                      label="Fear of losing your job to AI"
                      name="fear_of_job_loss_to_ai"
                      value={formData.fear_of_job_loss_to_ai}
                      onChange={handleChange}
                      lowLabel="Not worried"
                      highLabel="Very worried"
                    />
                    <SliderField
                      label="Clarity about your career path"
                      name="career_clarity_score"
                      value={formData.career_clarity_score}
                      onChange={handleChange}
                      lowLabel="Unclear"
                      highLabel="Very clear"
                    />
                    <SliderField
                      label="Confidence in your resume"
                      name="resume_confidence_score"
                      value={formData.resume_confidence_score}
                      onChange={handleChange}
                      lowLabel="Not confident"
                      highLabel="Very confident"
                    />
                    <SliderField
                      label="Interview anxiety"
                      name="interview_anxiety_score"
                      value={formData.interview_anxiety_score}
                      onChange={handleChange}
                      lowLabel="Calm"
                      highLabel="Very anxious"
                    />
                  </>
                )}

                {step === 4 && (
                  <>
                    <h2>Lifestyle & Wellbeing</h2>
                    <p className="cl-step-desc">
                      Almost done — a few questions about how you spend your
                      time day to day.
                    </p>
                    <div className="cl-grid">
                      <NumberField
                        label="Daily Study Hours"
                        name="daily_study_hours"
                        value={formData.daily_study_hours}
                        onChange={handleChange}
                        min={0}
                        max={24}
                        step={0.5}
                        error={errors.daily_study_hours}
                        helper="Average hours per day on coursework, assignments, or revision."
                      />
                      <NumberField
                        label="Self-Learning Hours / Week"
                        name="self_learning_hours_per_week"
                        value={formData.self_learning_hours_per_week}
                        onChange={handleChange}
                        min={0}
                        step={0.5}
                        error={errors.self_learning_hours_per_week}
                        helper="Time spent learning outside your formal curriculum."
                      />
                      <NumberField
                        label="Social Media Hours / Day"
                        name="social_media_hrs_per_day"
                        value={formData.social_media_hrs_per_day}
                        onChange={handleChange}
                        min={0}
                        max={24}
                        step={0.5}
                        error={errors.social_media_hrs_per_day}
                        helper="Average hours per day spent on social media."
                      />
                      <NumberField
                        label="Sleep Hours / Night"
                        name="sleep_hours"
                        value={formData.sleep_hours}
                        onChange={handleChange}
                        min={0}
                        max={24}
                        step={0.5}
                        error={errors.sleep_hours}
                        helper="Average hours of sleep per night."
                      />
                    </div>

                    <SliderField
                      label="Current stress level"
                      name="stress_level"
                      value={formData.stress_level}
                      onChange={handleChange}
                      lowLabel="Relaxed"
                      highLabel="Overwhelmed"
                    />
                    <SliderField
                      label="Motivation level"
                      name="motivation_score"
                      value={formData.motivation_score}
                      onChange={handleChange}
                      lowLabel="Low"
                      highLabel="High"
                    />
                  </>
                )}
              </div>

              <div className="cl-nav-buttons">
                {step > 1 ? (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleBack}
                  >
                    Back
                  </button>
                ) : (
                  <div />
                )}

                {step < STEPS.length ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleNext}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner" />
                        Analysing…
                      </>
                    ) : (
                      "Submit"
                    )}
                  </button>
                )}
              </div>

              {submitError && (
                <div className="cl-submit-error">{submitError}</div>
              )}
            </div>
          </>
        )}

        {showSkeleton && (
          <div className="cl-card cl-fade">
            <p className="cl-skeleton-msg">
              Your results are being computed by our ML models…
            </p>
            <div className="cl-skeleton-grid">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        )}

        {results && <ResultsPanel results={results} onReset={handleReset} />}
      </main>
    </div>
  );
}
