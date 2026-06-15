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

/* ─────────────────────────────────────────────
   SHADER BACKGROUND — burnt-orange palette,
   fixed in the viewport, z-index -1
───────────────────────────────────────────── */
function ShaderBackground() {
  const canvasRef = useRef(null);

  const vsSource = `
    attribute vec4 aVertexPosition;
    void main() {
      gl_Position = aVertexPosition;
    }
  `;

  const fsSource = `
    precision highp float;
    uniform vec2 iResolution;
    uniform float iTime;

    const float overallSpeed      = 0.12;
    const float gridSmoothWidth   = 0.015;
    const float axisWidth         = 0.05;
    const float majorLineWidth    = 0.025;
    const float minorLineWidth    = 0.0125;
    const float majorLineFrequency = 5.0;
    const float minorLineFrequency = 1.0;
    const float scale             = 5.0;
    /* ── burnt-orange line colour ── */
    const vec4  lineColor         = vec4(0.922, 0.369, 0.157, 1.0);
    const float minLineWidth      = 0.01;
    const float maxLineWidth      = 0.18;
    const float lineSpeed         = 1.0 * overallSpeed;
    const float lineAmplitude     = 1.0;
    const float lineFrequency     = 0.2;
    const float warpSpeed         = 0.2 * overallSpeed;
    const float warpFrequency     = 0.5;
    const float warpAmplitude     = 1.0;
    const float offsetFrequency   = 0.5;
    const float offsetSpeed       = 1.33 * overallSpeed;
    const float minOffsetSpread   = 0.6;
    const float maxOffsetSpread   = 2.0;
    const int   linesPerGroup     = 14;

    #define drawCircle(pos,radius,coord)  smoothstep(radius+gridSmoothWidth,radius,length(coord-(pos)))
    #define drawSmoothLine(pos,hw,t)      smoothstep(hw,0.0,abs(pos-(t)))
    #define drawCrispLine(pos,hw,t)       smoothstep(hw+gridSmoothWidth,hw,abs(pos-(t)))
    #define drawPeriodicLine(freq,w,t)    drawCrispLine(freq/2.0,w,abs(mod(t,freq)-(freq)/2.0))

    float random(float t){
      return (cos(t)+cos(t*1.3+1.3)+cos(t*1.4+1.4))/3.0;
    }
    float getPlasmaY(float x,float hFade,float offset){
      return random(x*lineFrequency+iTime*lineSpeed)*hFade*lineAmplitude+offset;
    }

    void main(){
      vec2 fragCoord = gl_FragCoord.xy;
      vec2 uv        = fragCoord/iResolution.xy;
      vec2 space     = (fragCoord-iResolution.xy/2.0)/iResolution.x*2.0*scale;

      float hFade = 1.0-(cos(uv.x*6.28)*0.5+0.5);
      float vFade = 1.0-(cos(uv.y*6.28)*0.5+0.5);

      space.y += random(space.x*warpFrequency+iTime*warpSpeed)*warpAmplitude*(0.5+hFade);
      space.x += random(space.y*warpFrequency+iTime*warpSpeed+2.0)*warpAmplitude*hFade;

      /* very dark background: near-black with a faint warm tint */
      vec4 bgColor1 = vec4(0.145,0.137,0.133,1.0);
      vec4 bgColor2 = vec4(0.173,0.157,0.145,1.0);
      vec4 lines    = vec4(0.0);

      for(int l=0;l<linesPerGroup;l++){
        float nIdx       = float(l)/float(linesPerGroup);
        float offsetTime = iTime*offsetSpeed;
        float offsetPos  = float(l)+space.x*offsetFrequency;
        float rand       = random(offsetPos+offsetTime)*0.5+0.5;
        float halfWidth  = mix(minLineWidth,maxLineWidth,rand*hFade)/2.0;
        float offset     = random(offsetPos+offsetTime*(1.0+nIdx))*mix(minOffsetSpread,maxOffsetSpread,hFade);
        float linePos    = getPlasmaY(space.x,hFade,offset);
        float line       = drawSmoothLine(linePos,halfWidth,space.y)/2.0
                         + drawCrispLine(linePos,halfWidth*0.15,space.y);

        float cx         = mod(float(l)+iTime*lineSpeed,25.0)-12.0;
        vec2  cPos       = vec2(cx,getPlasmaY(cx,hFade,offset));
        float circle     = drawCircle(cPos,0.01,space)*4.0;

        line  += circle;
        /* keep lines subtle — multiply contribution down */
        lines += line*lineColor*rand*0.45;
      }

      vec4 fragColor = mix(bgColor1,bgColor2,uv.x);
      fragColor     *= vFade;
      fragColor.a    = 1.0;
      fragColor     += lines;
      gl_FragColor   = fragColor;
    }
  `;

  const loadShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compile error:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const initShaderProgram = (gl, vs, fs) => {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vs);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fs);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return null;
    }
    return program;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const program = initShaderProgram(gl, vsSource, fsSource);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const info = {
      program,
      attrib: gl.getAttribLocation(program, "aVertexPosition"),
      uRes: gl.getUniformLocation(program, "iResolution"),
      uTime: gl.getUniformLocation(program, "iTime"),
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener("resize", resize);
    resize();

    let rafId;
    const t0 = Date.now();
    const render = () => {
      const t = (Date.now() - t0) / 1000;
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(info.program);
      gl.uniform2f(info.uRes, canvas.width, canvas.height);
      gl.uniform1f(info.uTime, t);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.vertexAttribPointer(info.attrib, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(info.attrib);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

  :root {
    --bg:           #252422;
    --surface:      rgba(38, 36, 33, 0.82);
    --surface-solid:#2e2b28;
    --border:       rgba(255,252,242,0.10);
    --border-hover: rgba(235,94,40,0.45);
    --text:         #fffcf2;
    --muted:        #9e9891;
    --accent:       #eb5e28;
    --accent-dim:   rgba(235,94,40,0.15);
    --accent-hover: #d45524;
    --good:         #7fc97a;
    --warn:         #e8b84b;
    --bad:          #f06b5b;
    --good-bg:      rgba(127,201,122,0.10);
    --warn-bg:      rgba(232,184,75,0.10);
    --bad-bg:       rgba(240,107,91,0.10);
    color-scheme: dark;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--bg);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .cl-app {
    position: relative;
    z-index: 1;
    color: var(--text);
    min-height: 100vh;
    line-height: 1.6;
  }

  /* ── Navbar ── */
  .cl-navbar {
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px;
    height: 60px;
    background: rgba(25, 23, 21, 0.75);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border-bottom: 1px solid var(--border);
  }

  .cl-logo-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .cl-logo {
    font-size: 1.1rem;
    font-weight: 800;
    color: var(--text);
    letter-spacing: -0.03em;
  }

  .cl-logo span { color: var(--accent); }

  .cl-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    font-weight: 500;
    padding: 5px 12px;
    border-radius: 999px;
    border: 1px solid var(--border);
    color: var(--muted);
    background: rgba(255,255,255,0.04);
    letter-spacing: 0.01em;
  }

  .cl-pill .dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }

  .cl-pill.warming .dot { animation: cl-pulse 1.6s ease-in-out infinite; }
  .cl-pill.ready   { color: var(--good);   border-color: rgba(127,201,122,0.35); }
  .cl-pill.slow    { color: var(--warn);   border-color: rgba(232,184,75,0.35); }

  @keyframes cl-pulse {
    0%,100% { opacity: 0.25; transform: scale(0.8); }
    50%      { opacity: 1;    transform: scale(1.2); }
  }

  /* ── Hero ── */
  .cl-hero {
    padding: 72px 24px 56px;
    text-align: center;
    position: relative;
  }

  .cl-hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 20px;
    padding: 6px 14px;
    border: 1px solid rgba(235,94,40,0.30);
    border-radius: 999px;
    background: rgba(235,94,40,0.08);
    backdrop-filter: blur(10px);
  }

  .cl-hero h1 {
    font-size: clamp(2rem, 5vw, 3.2rem);
    font-weight: 900;
    letter-spacing: -0.04em;
    line-height: 1.08;
     color: #ff7a45;
     text-shadow: 0 0 20px rgba(255,122,69,0.35);
    max-width: 700px;
    margin: 0 auto 20px;
  }

  .cl-hero h1 em {
    font-style: normal;
    color: #ffffff;
    text-shadow:
      0 4px 12px rgba(0,0,0,0.5),
      0 8px 40px rgba(0,0,0,0.7);
  }

  .cl-hero p {
    max-width: 520px;
    margin: 0 auto 32px;
    color: var(--muted);
    font-size: 1rem;
    line-height: 1.7;
    font-weight: 400;
  }

  .cl-hero-stats {
    display: inline-flex;
    gap: 0;
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    background: rgba(255,255,255,0.03);
    backdrop-filter: blur(10px);
  }

  .cl-hero-stat {
    padding: 14px 28px;
    text-align: center;
    border-right: 1px solid var(--border);
  }

  .cl-hero-stat:last-child { border-right: none; }

  .cl-hero-stat-num {
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--text);
    letter-spacing: -0.03em;
    display: block;
  }

  .cl-hero-stat-lbl {
    font-size: 0.72rem;
    color: var(--muted);
    letter-spacing: 0.04em;
    display: block;
    margin-top: 2px;
  }

  /* ── Layout ── */
  .cl-container {
    max-width: 820px;
    margin: 0 auto;
    padding: 24px 20px 80px;
  }

  /* ── Step progress ── */
  .cl-steps-wrap {
    margin-bottom: 28px;
    position: relative;
  }

  .cl-steps {
    display: flex;
    align-items: center;
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 18px 24px;
    backdrop-filter: blur(12px);
  }

  .cl-step {
    display: flex;
    align-items: center;
    position: relative;
  }

  .cl-step-circle {
    width: 32px; height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.8rem;
    border: 1.5px solid rgba(255,255,255,0.12);
    color: var(--muted);
    background: transparent;
    flex-shrink: 0;
    transition: all 250ms ease;
    position: relative;
  }

  .cl-step.complete .cl-step-circle {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
    box-shadow: 0 0 16px rgba(235,94,40,0.4);
  }

  .cl-step.active .cl-step-circle {
    border-color: var(--accent);
    color: var(--accent);
    box-shadow: 0 0 0 4px rgba(235,94,40,0.15);
  }

  .cl-step-label {
    margin-left: 10px;
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--muted);
    white-space: nowrap;
    transition: color 200ms;
  }

  .cl-step.active .cl-step-label  { color: var(--text); }
  .cl-step.complete .cl-step-label { color: var(--accent); }

  .cl-step-line {
    flex: 1;
    height: 1.5px;
    margin: 0 14px;
    background: rgba(255,255,255,0.08);
    position: relative;
    overflow: hidden;
    border-radius: 99px;
  }

  .cl-step-line::after {
    content: "";
    position: absolute;
    inset: 0;
    background: var(--accent);
    transform: scaleX(var(--fill, 0));
    transform-origin: left;
    transition: transform 400ms cubic-bezier(.4,0,.2,1);
    border-radius: 99px;
  }

  .cl-steps-mobile {
    display: none;
    font-size: 0.88rem;
    color: var(--muted);
    margin-bottom: 20px;
    padding: 14px 20px;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: 10px;
  }

  .cl-steps-mobile strong { color: var(--text); font-weight: 600; }

  @media (max-width: 600px) {
    .cl-steps     { display: none; }
    .cl-steps-mobile { display: block; }
  }

  /* ── Card ── */
  .cl-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 32px 36px;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.05) inset,
      0 24px 64px rgba(0,0,0,0.45);
  }

  @media (max-width: 600px) {
    .cl-card { padding: 22px 20px; }
  }

  .cl-section-header {
    margin-bottom: 28px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
  }

  .cl-section-eyebrow {
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 6px;
  }

  .cl-card h2 {
    font-size: 1.35rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--text);
    margin-bottom: 6px;
  }

  .cl-step-desc {
    color: var(--muted);
    font-size: 0.88rem;
    line-height: 1.65;
  }

  .cl-fade {
    animation: cl-fade-step 280ms cubic-bezier(.4,0,.2,1);
  }

  @keyframes cl-fade-step {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Form grid & fields ── */
  .cl-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 24px;
  }

  @media (max-width: 600px) {
    .cl-grid { grid-template-columns: 1fr; }
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin-bottom: 20px;
  }

  .field label {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text);
    letter-spacing: 0.01em;
  }

  .field-helper {
    font-size: 0.76rem;
    color: var(--muted);
    line-height: 1.5;
  }

  .input {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.10);
    color: var(--text);
    border-radius: 10px;
    padding: 11px 14px;
    font-size: 0.92rem;
    font-family: inherit;
    width: 100%;
    transition: border-color 150ms, box-shadow 150ms, background 150ms;
    appearance: none;
    -webkit-appearance: none;
  }

  .input option {
    background: #2e2b28;
    color: var(--text);
  }

  .input::placeholder { color: var(--muted); }

  .input:hover {
    border-color: rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.07);
  }

  .input:focus-visible {
    outline: none;
    border-color: var(--accent);
    background: rgba(235,94,40,0.06);
    box-shadow: 0 0 0 3px rgba(235,94,40,0.18);
  }

  .input.error { border-color: var(--bad); }

  .field-error {
    color: #f06b5b;
    font-size: 0.78rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 5px;
    animation: cl-slide-down 200ms ease;
  }

  .field-error::before {
    content: "⚠";
    font-size: 0.72rem;
  }

  @keyframes cl-slide-down {
    from { opacity: 0; transform: translateY(-5px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Radio pills ── */
  .radio-group {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .radio-pill {
    position: relative;
    display: inline-flex;
    align-items: center;
    padding: 8px 16px;
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 10px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--muted);
    background: rgba(255,255,255,0.04);
    transition: all 150ms ease;
    user-select: none;
  }

  .radio-pill input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .radio-pill:hover {
    border-color: var(--accent);
    color: var(--text);
    background: var(--accent-dim);
  }

  .radio-pill.active {
    border-color: var(--accent);
    background: var(--accent-dim);
    color: var(--text);
    font-weight: 600;
    box-shadow: 0 0 0 1px rgba(235,94,40,0.25);
  }

  /* ── Sliders ── */
  .slider-field { margin-bottom: 24px; }

  .slider-label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .slider-label-row label {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text);
  }

  .slider-value {
    font-weight: 800;
    color: var(--accent);
    font-size: 0.95rem;
    min-width: 24px;
    text-align: right;
    font-variant-numeric: tabular-nums;
    background: var(--accent-dim);
    border: 1px solid rgba(235,94,40,0.25);
    border-radius: 6px;
    padding: 2px 8px;
  }

  .slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 5px;
    border-radius: 999px;
    outline: none;
    cursor: pointer;
    background: rgba(255,255,255,0.10);
  }

  .slider:focus-visible {
    box-shadow: 0 0 0 3px rgba(235,94,40,0.25);
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px; height: 18px;
    border-radius: 50%;
    background: #fff;
    border: 3px solid var(--accent);
    cursor: pointer;
    transition: transform 120ms, box-shadow 120ms;
    box-shadow: 0 0 0 0 rgba(235,94,40,0);
  }

  .slider::-webkit-slider-thumb:hover {
    transform: scale(1.15);
    box-shadow: 0 0 0 6px rgba(235,94,40,0.18);
  }

  .slider::-moz-range-thumb {
    width: 18px; height: 18px;
    border-radius: 50%;
    background: #fff;
    border: 3px solid var(--accent);
    cursor: pointer;
  }

  .slider-range-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 7px;
    font-size: 0.72rem;
    color: var(--muted);
    font-weight: 500;
  }

  /* ── Divider ── */
  .cl-divider {
    border: none;
    border-top: 1px solid var(--border);
    margin: 24px 0;
  }

  .cl-subsection-label {
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 16px;
  }

  /* ── Buttons ── */
  .cl-nav-buttons {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 32px;
    gap: 12px;
    padding-top: 24px;
    border-top: 1px solid var(--border);
  }

  .btn {
    font-size: 0.9rem;
    font-weight: 700;
    font-family: inherit;
    padding: 11px 24px;
    border-radius: 10px;
    cursor: pointer;
    border: none;
    transition: all 150ms ease;
    letter-spacing: -0.01em;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(235,94,40,0.30);
  }

  .btn:active { transform: scale(0.97); }

  .btn-primary {
    background: var(--accent);
    color: #fff;
    box-shadow: 0 4px 16px rgba(235,94,40,0.30);
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--accent-hover);
    box-shadow: 0 6px 20px rgba(235,94,40,0.40);
    transform: translateY(-1px);
  }

  .btn-primary:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
  }

  .btn-ghost {
    background: rgba(255,255,255,0.06);
    border: 1px solid var(--border);
    color: var(--muted);
  }

  .btn-ghost:hover { border-color: rgba(255,255,255,0.20); color: var(--text); }

  .btn-outline-accent {
    background: transparent;
    border: 1px solid rgba(235,94,40,0.40);
    color: var(--accent);
  }

  .btn-outline-accent:hover {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
  }

  .spinner {
    display: inline-block;
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.25);
    border-top-color: #fff;
    border-radius: 50%;
    animation: cl-spin 650ms linear infinite;
  }

  @keyframes cl-spin { to { transform: rotate(360deg); } }

  .cl-submit-error {
    color: var(--bad);
    font-size: 0.84rem;
    margin-top: 14px;
    text-align: center;
    padding: 10px 16px;
    background: rgba(240,107,91,0.08);
    border: 1px solid rgba(240,107,91,0.25);
    border-radius: 8px;
  }

  /* ── Skeleton ── */
  .cl-skeleton-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .cl-skeleton-header h3 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 6px;
  }

  .cl-skeleton-header p {
    font-size: 0.85rem;
    color: var(--muted);
  }

  .cl-skeleton-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  @media (max-width: 600px) { .cl-skeleton-grid { grid-template-columns: 1fr; } }

  .skeleton-card {
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 28px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }

  .skeleton-circle, .skeleton-line {
    background: linear-gradient(90deg,
      rgba(255,255,255,0.06) 25%,
      rgba(255,255,255,0.12) 50%,
      rgba(255,255,255,0.06) 75%
    );
    background-size: 200% 100%;
    animation: cl-shimmer 1.5s ease-in-out infinite;
    border-radius: 999px;
  }

  .skeleton-circle { width: 64px; height: 64px; border-radius: 50%; }
  .skeleton-line   { width: 75%;  height: 11px; }
  .skeleton-line.short { width: 48%; }

  @keyframes cl-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── Results ── */
  .cl-results-header {
    text-align: center;
    margin-bottom: 28px;
  }

  .cl-results-header h2 {
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--text);
    margin-bottom: 6px;
  }

  .cl-results-header p {
    font-size: 0.88rem;
    color: var(--muted);
  }

  .cl-results-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  @media (max-width: 640px) { .cl-results-grid { grid-template-columns: 1fr; } }

  .result-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 24px 18px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    transition: border-color 200ms;
  }

  .result-card:hover { border-color: rgba(235,94,40,0.30); }

  .result-card-label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .result-card h3 {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.02em;
  }

  .score-ring { display: block; margin: 6px auto 0; }

  .score-ring-fill { transition: stroke-dashoffset 900ms cubic-bezier(.4,0,.2,1); }

  .score-ring-text {
    fill: var(--text, #fffcf2);
    font-size: 22px;
    font-weight: 800;
    font-family: 'Inter', sans-serif;
    letter-spacing: -0.03em;
  }

  .score-ring-sub {
    fill: #9e9891;
    font-size: 9px;
    font-weight: 500;
    font-family: 'Inter', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .result-badge {
    font-weight: 700;
    font-size: 0.78rem;
    padding: 4px 14px;
    border-radius: 999px;
    letter-spacing: 0.02em;
  }

  .result-badge.good { color: var(--good); background: var(--good-bg); border: 1px solid rgba(127,201,122,0.25); }
  .result-badge.warn { color: var(--warn); background: var(--warn-bg); border: 1px solid rgba(232,184,75,0.25); }
  .result-badge.bad  { color: var(--bad);  background: var(--bad-bg);  border: 1px solid rgba(240,107,91,0.25); }

  .result-accuracy {
    color: #5c5954;
    font-size: 0.7rem;
    margin-top: auto;
    font-variant-numeric: tabular-nums;
    font-weight: 500;
  }

  .counsel-icon-wrap {
    width: 56px; height: 56px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }

  .counsel-icon-wrap.yes {
    background: var(--accent-dim);
    border: 1px solid rgba(235,94,40,0.30);
  }

  .counsel-icon-wrap.no {
    background: var(--good-bg);
    border: 1px solid rgba(127,201,122,0.30);
  }

  .counsel-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text);
  }

  .counsel-sub {
    color: var(--muted);
    font-size: 0.78rem;
    line-height: 1.55;
    text-align: center;
  }

  .cl-disclaimer {
    border: 1px solid var(--border);
    background: rgba(255,255,255,0.02);
    border-radius: 12px;
    padding: 16px 20px;
    color: var(--muted);
    font-size: 0.80rem;
    line-height: 1.65;
  }

  .cl-start-over {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }

  /* ── Responsive ── */
  @media (max-width: 480px) {
    .cl-hero h1     { font-size: 1.8rem; }
    .cl-hero-stats  { flex-direction: column; }
    .cl-hero-stat   { border-right: none; border-bottom: 1px solid var(--border); }
    .cl-hero-stat:last-child { border-bottom: none; }
    .cl-navbar      { padding: 0 16px; }
    .cl-container   { padding: 16px 14px 64px; }
  }

  /* ── Select arrow ── */
  select.input {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' viewBox='0 0 12 7'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239e9891' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 36px;
  }
`;

/* ─────────────────────────────────────────────
   SMALL REUSABLE COMPONENTS
───────────────────────────────────────────── */

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
          background: `linear-gradient(to right, var(--accent) ${pct}%, rgba(255,255,255,0.10) ${pct}%)`,
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

function ScoreRing({ value, max = 10, size = 128, strokeWidth = 9 }) {
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
        stroke="rgba(255,255,255,0.08)"
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
        y="46%"
        textAnchor="middle"
        dominantBaseline="central"
        className="score-ring-text"
      >
        {value.toFixed(1)}
      </text>
      <text
        x="50%"
        y="68%"
        textAnchor="middle"
        dominantBaseline="central"
        className="score-ring-sub"
      >
        / 10
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   VALIDATION (unchanged logic)
───────────────────────────────────────────── */

function isFilledNumber(v) {
  return v !== "" && v !== null && v !== undefined && !Number.isNaN(Number(v));
}

function validateStep(step, data) {
  const errors = {};

  if (step === 1) {
    if (!isFilledNumber(data.age) || data.age < 16 || data.age > 40)
      errors.age = "Enter an age between 16 and 40.";
    if (!data.gender)
      errors.gender = "Select the option that best describes you.";
    if (!data.urban_or_rural)
      errors.urban_or_rural = "Let us know where you're based.";
  }

  if (step === 2) {
    if (!data.degree_type) errors.degree_type = "Select your degree type.";
    if (!data.stream) errors.stream = "Select your stream.";
    if (
      !isFilledNumber(data.year_of_study) ||
      data.year_of_study < 1 ||
      data.year_of_study > 6
    )
      errors.year_of_study = "Enter a year between 1 and 6.";
    if (!data.college_tier) errors.college_tier = "Select your college tier.";
    if (
      !isFilledNumber(data.internship_experience) ||
      data.internship_experience < 0
    )
      errors.internship_experience = "Enter 0 or more internships.";
    if (
      !isFilledNumber(data.skill_development_courses_taken) ||
      data.skill_development_courses_taken < 0
    )
      errors.skill_development_courses_taken = "Enter 0 or more courses.";
    if (
      !isFilledNumber(data.weekly_job_application_count) ||
      data.weekly_job_application_count < 0
    )
      errors.weekly_job_application_count = "Enter 0 or more applications.";
  }

  if (step === 3) {
    if (!data.primary_ai_tools_used)
      errors.primary_ai_tools_used = "Select the AI tool you use most.";
    if (
      !isFilledNumber(data.daily_ai_tool_usage_hrs) ||
      data.daily_ai_tool_usage_hrs < 0 ||
      data.daily_ai_tool_usage_hrs > 24
    )
      errors.daily_ai_tool_usage_hrs = "Enter a value between 0 and 24 hours.";
  }

  if (step === 4) {
    if (
      !isFilledNumber(data.daily_study_hours) ||
      data.daily_study_hours < 0 ||
      data.daily_study_hours > 24
    )
      errors.daily_study_hours = "Enter a value between 0 and 24 hours.";
    if (
      !isFilledNumber(data.self_learning_hours_per_week) ||
      data.self_learning_hours_per_week < 0
    )
      errors.self_learning_hours_per_week = "Enter 0 or more hours.";
    if (
      !isFilledNumber(data.social_media_hrs_per_day) ||
      data.social_media_hrs_per_day < 0 ||
      data.social_media_hrs_per_day > 24
    )
      errors.social_media_hrs_per_day = "Enter a value between 0 and 24 hours.";
    if (
      !isFilledNumber(data.sleep_hours) ||
      data.sleep_hours < 0 ||
      data.sleep_hours > 24
    )
      errors.sleep_hours = "Enter a value between 0 and 24 hours.";
    const total =
      Number(data.daily_ai_tool_usage_hrs || 0) +
      Number(data.daily_study_hours || 0) +
      Number(data.social_media_hrs_per_day || 0) +
      Number(data.sleep_hours || 0);
    if (total > 24)
      errors.total_daily_hours =
        "AI Usage + Study + Social Media + Sleep cannot exceed 24 hours.";
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

/* ─────────────────────────────────────────────
   RESULTS PANEL
───────────────────────────────────────────── */
function ResultsPanel({ results, onReset }) {
  const burnout = Number(results.burnout_score);
  const readiness = Number(results.career_readiness_score);
  const counseling = Math.round(Number(results.career_counseling_score));

  const bBand = burnoutBand(burnout);
  const rBand = readinessBand(readiness);

  return (
    <div className="cl-card cl-fade">
      <div className="cl-results-header">
        <h2>Your Career Insights</h2>
        <p>
          Predicted by ML models trained on real student data. Treat as a
          starting point, not a verdict.
        </p>
      </div>

      <div className="cl-results-grid">
        <div className="result-card">
          <div className="result-card-label">Burnout Risk</div>
          <ScoreRing value={burnout} />
          <span className={`result-badge ${bBand.cls}`}>{bBand.text}</span>
          <p className="result-accuracy">R² 0.56 · RMSE ±1.37</p>
        </div>

        <div className="result-card">
          <div className="result-card-label">Career Readiness</div>
          <ScoreRing value={readiness} />
          <span className={`result-badge ${rBand.cls}`}>{rBand.text}</span>
          <p className="result-accuracy">R² 0.50 · RMSE ±1.13</p>
        </div>

        <div className="result-card">
          <div className="result-card-label">Counselling</div>
          {counseling === 1 ? (
            <>
              <div className="counsel-icon-wrap yes">✓</div>
              <div className="counsel-title">Recommended</div>
              <p className="counsel-sub">
                Career counselling could be highly beneficial for your profile.
              </p>
            </>
          ) : (
            <>
              <div className="counsel-icon-wrap no">✗</div>
              <div className="counsel-title">Not Needed Now</div>
              <p className="counsel-sub">
                Your indicators don't suggest a pressing need right now.
              </p>
            </>
          )}
          <p className="result-accuracy">AUC 0.78 · F1 0.72 (weighted)</p>
        </div>
      </div>

      <div className="cl-disclaimer">
        These predictions are generated by machine-learning models trained on
        student survey data. They are indicative, not diagnostic. Scores carry
        inherent uncertainty — treat them as a starting point for reflection,
        not a verdict.
      </div>

      <div className="cl-start-over">
        <button
          type="button"
          className="btn btn-outline-accent"
          onClick={onReset}
        >
          Start Over
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────── */
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

  /* Wake-up ping — unchanged */
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/model_status`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(() => {
        if (!cancelled) {
          modelReady.current = true;
          setModelStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setModelStatus("slow");
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
    const errs = validateStep(step, formData);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(STEPS.length, s + 1));
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => Math.max(1, s - 1));
  };

  /* Submit — API call unchanged */
  const handleSubmit = async () => {
    const errs = validateStep(4, formData);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
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
      if (!res.ok) throw new Error(`Status ${res.status}`);
      setResults(await res.json());
    } catch {
      setSubmitError(
        "Couldn't reach the prediction service. Please try again in a moment.",
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

      {/* Fixed WebGL background */}
      <ShaderBackground />

      {/* Navbar */}
      <nav className="cl-navbar">
        <div className="cl-logo-wrap">
          <img
            src="/favicon.png"
            alt="CareerLens logo"
            width="28"
            height="28"
            style={{ borderRadius: 6, flexShrink: 0 }}
          />
          <div className="cl-logo">
            Career<span>Lens</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="cl-hero">
        <div className="cl-hero-eyebrow">ML-Powered · Student Edition</div>
        <h1>
          Know Your Career
          <br />
          <em>Before It Defines You</em>
        </h1>
        <p>
          Answer 24 questions about your academics, AI habits, and lifestyle —
          get your burnout risk, career readiness, and counselling need in
          seconds.
        </p>
        <div className="cl-hero-stats">
          <div className="cl-hero-stat">
            <span className="cl-hero-stat-num">24</span>
            <span className="cl-hero-stat-lbl">questions</span>
          </div>
          <div className="cl-hero-stat">
            <span className="cl-hero-stat-num">3</span>
            <span className="cl-hero-stat-lbl">predictions</span>
          </div>
          <div className="cl-hero-stat">
            <span className="cl-hero-stat-num">&lt;60s</span>
            <span className="cl-hero-stat-lbl">to complete</span>
          </div>
        </div>
      </header>

      <main className="cl-container">
        {/* ── FORM ── */}
        {showForm && (
          <>
            <div className="cl-steps-wrap">
              <StepProgress step={step} />
            </div>

            <div className="cl-card">
              <div key={step} className="cl-fade">
                {/* Step 1 — Personal */}
                {step === 1 && (
                  <>
                    <div className="cl-section-header">
                      <div className="cl-section-eyebrow">Step 1 of 4</div>
                      <h2>Personal Details</h2>
                      <p className="cl-step-desc">
                        A bit about you — this helps calibrate the model to your
                        life stage.
                      </p>
                    </div>
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
                        helper="Used to compare you with peers at a similar stage."
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

                {/* Step 2 — Academic */}
                {step === 2 && (
                  <>
                    <div className="cl-section-header">
                      <div className="cl-section-eyebrow">Step 2 of 4</div>
                      <h2>Academic Background</h2>
                      <p className="cl-step-desc">
                        Your course of study and how you've been building your
                        profile so far.
                      </p>
                    </div>
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
                        helper="Include any internship you're currently doing."
                      />
                      <NumberField
                        label="Online Courses Taken"
                        name="skill_development_courses_taken"
                        value={formData.skill_development_courses_taken}
                        onChange={handleChange}
                        min={0}
                        step={1}
                        error={errors.skill_development_courses_taken}
                        helper="Certifications or MOOCs outside your regular coursework."
                      />
                      <NumberField
                        label="Job Applications / Week"
                        name="weekly_job_application_count"
                        value={formData.weekly_job_application_count}
                        onChange={handleChange}
                        min={0}
                        step={1}
                        error={errors.weekly_job_application_count}
                        helper="Average applications you send in a typical week."
                      />
                    </div>
                  </>
                )}

                {/* Step 3 — AI & Career */}
                {step === 3 && (
                  <>
                    <div className="cl-section-header">
                      <div className="cl-section-eyebrow">Step 3 of 4</div>
                      <h2>AI & Career Outlook</h2>
                      <p className="cl-step-desc">
                        How AI tools fit into your routine, and how you feel
                        about your career path right now.
                      </p>
                    </div>
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
                        helper="Hours per day using AI tools for study or work."
                      />
                    </div>

                    <hr className="cl-divider" />
                    <div className="cl-subsection-label">AI Relationship</div>

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

                    <hr className="cl-divider" />
                    <div className="cl-subsection-label">Career Confidence</div>

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

                {/* Step 4 — Lifestyle */}
                {step === 4 && (
                  <>
                    <div className="cl-section-header">
                      <div className="cl-section-eyebrow">Step 4 of 4</div>
                      <h2>Lifestyle & Wellbeing</h2>
                      <p className="cl-step-desc">
                        Almost done — a few questions about how you spend your
                        time day to day.
                      </p>
                    </div>
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
                        helper="Hours per day on coursework, assignments, or revision."
                      />
                      <NumberField
                        label="Self-Learning Hrs / Week"
                        name="self_learning_hours_per_week"
                        value={formData.self_learning_hours_per_week}
                        onChange={handleChange}
                        min={0}
                        step={0.5}
                        error={errors.self_learning_hours_per_week}
                        helper="Time spent learning outside your formal curriculum."
                      />
                      <NumberField
                        label="Social Media Hrs / Day"
                        name="social_media_hrs_per_day"
                        value={formData.social_media_hrs_per_day}
                        onChange={handleChange}
                        min={0}
                        max={24}
                        step={0.5}
                        error={errors.social_media_hrs_per_day}
                        helper="Average hours per day on social media."
                      />
                      <NumberField
                        label="Sleep Hrs / Night"
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

                    {errors.total_daily_hours && (
                      <div className="field-error" style={{ marginBottom: 16 }}>
                        {errors.total_daily_hours}
                      </div>
                    )}

                    <hr className="cl-divider" />
                    <div className="cl-subsection-label">Mental State</div>

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

              {/* Nav buttons */}
              <div className="cl-nav-buttons">
                {step > 1 ? (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={handleBack}
                  >
                    ← Back
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
                    Continue →
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
                        <span className="spinner" /> Analysing…
                      </>
                    ) : (
                      "Get My Results →"
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

        {/* ── SKELETON ── */}
        {showSkeleton && (
          <div className="cl-card cl-fade">
            <div className="cl-skeleton-header">
              <h3>Computing your results…</h3>
              <p>
                Our ML models are crunching your profile. This takes just a
                moment.
              </p>
            </div>
            <div className="cl-skeleton-grid">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {results && <ResultsPanel results={results} onReset={handleReset} />}
      </main>
    </div>
  );
}
