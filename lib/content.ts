// Single source of truth for portfolio copy.
//
// Sources: resume (D:\RESUME\CURRENT\RESUME_KARTIK_ASLIA_CURRENT.LATEX) wins on
// conflict; MASTER_PROFILES.md and Technical_Portfolio/*.md fill in architecture.
//
// ─── CLAIMS TO CONFIRM BEFORE SHIPPING ────────────────────────────────────────
// [TP] = appears only in TECHNICAL_PORTFOLIO*.md (not resume, not master profile)
//   - KarmicDD: 288-page PDF ≈ 75K tokens (detail behind the 93% figure)
//   - KarmicDD: OCR calls cut ~75% (3–4 OCR runs per entity → 1 shared run)
//   - KarmicDD: async jobs took request time from 30–90s to <200ms (202 + poll)
//   - KarmicDD: immutable reports cached cache-first (95%+ hit rate NOT used in copy)
//   - KarmicDD: per-entity job dedup, stage tracking queued→OCR→upload→analysis
//   - KarmicDD: PhonePe access check re-verified with provider on every report open
// [MP] = appears in MASTER_PROFILES.md but not on the resume
//   - 93% fewer tokens (1M+ → 75K) and 80% lower API cost
//   - 96 tools / 11 categories, DeepSearch up to 3M tokens/session
//   - dual-prefix SSE with 3-layer crash recovery (mechanism description is generic)
//   - CLAR for Word: 28 action types, Entra SSO, worker-thread pipelines, ChangeTracker
//   - Oracle→GCP: 107 tables, 29–35 schema migrations, 597 CDN assets, Cloud Armor/IAP,
//     TPM/PCR7 credential hydration, 200+ real-SQL tests across 15 suites
//   - 100+ agentic tasks (SWE-bench / Terminal-Bench / Harbor / SREGym)
//   - Reward-hacking hardening: lockfile pinning, unprivileged UID, process-tree reaping,
//     git-hook neutralization, trusted-side observation (codename "Argus" left out)
//   - "First engineering hire"
// [OLD] = only in the previous content.ts
//   - Dense-LSTM: 99.6% accuracy, −92% compute time; hardest-problem line is framing
// Framing (inferred, not stated in any source — reword if inaccurate):
//   - CLAR for Word: worker threads keep the event loop free for other users
//   - CLAR Workspace: what the crash-recovery layers protect against
//   - QC gate: package fails the build when a cited query returns nothing
//   - Byzanite: resume does not say "p50" for 200ms → 50ms; removed "p50"
// ──────────────────────────────────────────────────────────────────────────────

export const heroOptions = [
  {
    headline: "Environments that can't be gamed. Systems that stay up.",
    subline:
      "I build RL environments, graders and reward-hacking defenses for agent training — and the production AI platforms, pipelines and cloud infrastructure behind them.",
    recommended: true,
  },
  {
    headline: "I build the tests AI has to pass — and the systems it runs on.",
    subline:
      "Agentic coding environments with calibrated graders on one side; live AI products serving 1000+ concurrent users on the other.",
  },
  {
    headline: "Hard tasks for agents. Hard guarantees for users.",
    subline:
      "Sandboxed RL worlds, delivery-QC gates and capture farms — plus multi-agent platforms, zero-trust cloud and 50ms APIs in production.",
  },
  {
    headline: "From sandbox to production.",
    subline:
      "I design the sandboxes agents are trained and evaluated in, and ship the backends, pipelines and infra that real users depend on.",
  },
  {
    headline: "Execute, don't trust.",
    subline:
      "The rule behind my graders that re-run every cited query, and behind the production systems I've migrated, hardened and scaled.",
  },
] as const;

export const profile = {
  name: "Kartik Aslia",
  handle: "Skizzy-Create",
  headline: "Environments that can't be gamed. Systems that stay up.",
  subline:
    "I build RL environments, graders and reward-hacking defenses for agent training — and the production AI platforms, pipelines and cloud infrastructure behind them.",
  roles: [
    "RL Environments Engineer",
    "Production AI Systems",
    "Backend & Cloud Infrastructure",
  ],
  location: "Gurugram, India",
  timezone: "Asia/Kolkata",
  status: "Open to remote roles · Worldwide",
  tagline: "Building the worlds where AI learns.",
  email: "asliakartik@gmail.com",
  resume: "/Kartik_Aslia_Resume.pdf",
  links: {
    github: "https://github.com/Skizzy-create",
    linkedin: "https://linkedin.com/in/kartik-aslia",
    x: "https://x.com/iamKartikAslia",
  },
  manifesto:
    "I build agentic coding environments and the QC gates that stop agents from gaming them. Before that, I was the founding engineer on three live AI products: I scaled a compliance platform to 1000+ concurrent users and moved it from Oracle Cloud to GCP on my own. Either way, I care whether it holds up under load, on deadline, with real users.",
};

export const nav = [
  { label: "About", href: "#about" },
  { label: "Journey", href: "#journey" },
  { label: "Work", href: "#work" },
  { label: "Ecosystem", href: "#ecosystem" },
  { label: "Play", href: "#play" },
  { label: "Contact", href: "#contact" },
] as const;

export const stats = [
  { value: 37, suffix: "×", label: "Faster capture", detail: "Solo-built Docker-in-Docker farm: 50-task batch ~150h → ~4h, built in 3 days" },
  { value: 72, suffix: "%", label: "Of a 50-task delivery", detail: "36 of 50 tasks shipped personally, top of five contributors (next-highest: 10)" },
  { value: 1000, suffix: "+", label: "Concurrent users", detail: "Compliance-heavy due-diligence platform, owned end-to-end" },
  { value: 50, suffix: "ms", label: "API latency", detail: "Down from 200ms via caching, async task queues and worker processing" },
  { value: 93, suffix: "%", label: "Fewer tokens", detail: "1M+ → 75K per report via Gemini File API & a shared OCR registry" },
  { value: 107, suffix: "", label: "Tables migrated", detail: "Oracle Cloud → GCP single-handedly, with KMS envelope encryption & CMEK" },
] as const;

export const principles = [
  {
    title: "Execute, don't trust",
    body: "My delivery-QC gate runs every cited query instead of reading the text, which took a client package to 0 errors and 0 warnings.",
  },
  {
    title: "Fail closed",
    body: "The telemetry slot-shift refuses to merge on any time-window collision, and payment access is re-verified with the provider instead of read from a cached row.",
  },
  {
    title: "Pay for expensive work once",
    body: "One shared OCR pass feeds every due-diligence agent, and documents go in through the File API instead of the prompt, taking reports from 1M+ to 75K tokens.",
  },
  {
    title: "Build the tool the team is blocked on",
    body: "When serial capture was going to take ~150h, I spent 3 days on a parallel farm that the whole team then used, bringing it to ~4h.",
  },
] as const;

export type Role = { title: string; org?: string; period: string; points: string[] };
export type Chapter = {
  org: string;
  title: string;
  period: string;
  mode: string;
  summary: string;
  roles?: Role[];
  points?: string[];
  links?: { label: string; href: string }[];
};

export const journey: Chapter[] = [
  {
    org: "Bespoke Labs",
    title: "RL Environments Engineer — Expert",
    period: "Apr 2026 — Present",
    mode: "Contractor · Remote",
    summary:
      "Turning environment ideas into validated agentic coding tasks at scale, and keeping them honest as volume grows.",
    roles: [
      {
        title: "Expert Reviewer",
        org: "AlphaRecon",
        period: "Aug 2026 — Present",
        points: [
          "Review complex agentic coding environments for prompt quality, environment complexity and up-to-date research/planning context, so they teach agents to research, plan and review.",
          "Gate human- and LLM-produced trajectory annotations for correctness before they enter training and evaluation sets.",
        ],
      },
      {
        title: "RL Environments Engineer",
        org: "Byzanite",
        period: "Jul 2026 — Aug 2026",
        points: [
          "Built a parallel Docker-in-Docker capture farm solo in 3 days. The whole team adopted it: 50-task batch ~150h → ~4h (≈37×).",
          "Wrote delivery-QC gates that execute every cited query, mirror-check repos and guard against internal-material leaks: 0 errors / 0 warnings on the client validator.",
          "Built root-cause-analysis incident worlds on real codebases (Ethereum nonce, Solana watermark, Redis/Postgres cascades, Kafka/JWT, KYC/AML) with graders calibrated to a target pass@1.",
          "Joined ~2 working days before the deadline and landed the 10-task pilot. Then shipped 36 of the 50-task final delivery (72%) across 214 commits, top of five contributors.",
        ],
      },
      {
        title: "Pod Lead → Senior Reviewer",
        org: "Nebula Aurora",
        period: "Apr 2026 — Jul 2026",
        points: [
          "Led Pod 6: authored and QC'd agentic RL tasks against a strict client data contract; onboarded contributors and cleared blockers.",
          "Promoted to Senior Reviewer. Posted the pod's highest client-accepted delivery count in a ~15–20 day window, against peers with 6+ months.",
        ],
      },
    ],
  },
  {
    org: "Clarigen AI",
    title: "Director of Technology & Product Lead",
    period: "Feb 2025 — Present",
    mode: "Founding engineer",
    summary:
      "First engineering hire, owning three live AI products end-to-end: architecture, AI, infrastructure and delivery under audit timelines.",
    points: [
      "Scaled a compliance-heavy due-diligence platform to 1000+ concurrent users and cut latency from 200ms to 50ms with caching, async task queues and workers.",
      "Cut report cost 80% and tokens 93% (1M+ → 75K) with a shared OCR registry and Gemini File API inside a 6-node LangGraph pipeline.",
      "Migrated 107 SQL tables, document stores, containers and 597 CDN assets from Oracle Cloud to GCP single-handedly.",
      "Hardened to zero-trust: KMS envelope encryption, CMEK storage, SBOM + vulnerability gating, 200+ real-SQL integration tests.",
    ],
    links: [
      { label: "KarmicDD", href: "https://karmicdd.clarigenai.com/" },
      { label: "CLAR Workspace", href: "https://clar.clarigenai.com/" },
      { label: "CLAR for Word", href: "https://clarigenai.com/" },
    ],
  },
  {
    org: "Stealth Web3 / Quant",
    title: "Software Engineer",
    period: "Dec 2024 — Jan 2025",
    mode: "Contract",
    summary: "An autonomous market-intelligence engine for on-chain portfolios.",
    points: [
      "Fused on-chain signals, news feeds and 147+ technical indicators into risk-aware automated portfolio decisions.",
      "Owned architecture and system design, trading off requirements directly with the founding team.",
    ],
  },
  {
    org: "Kishvi Studio",
    title: "Software Developer Intern",
    period: "Jun 2024 — Nov 2024",
    mode: "Remote",
    summary: "Real-time backends and secure infrastructure.",
    points: [
      "Built a WebSocket transaction system (+22% efficiency) and a real-time broadcast server.",
      "Built a microservices API gateway (+34% throughput) and an AES-256 encryption portal.",
    ],
  },
  {
    org: "Travel-tech startup (UK)",
    title: "Machine Learning Engineer Intern",
    period: "Aug 2023 — Jan 2024",
    mode: "Remote",
    summary: "LLM itinerary generation with retrieval.",
    points: [
      "Fine-tuned an LLM with RAG and Self-RAG; an internet-connected pipeline added 47% more search context.",
      "Built a token-cost logger that improved cost tracking by 30%.",
    ],
  },
];

export type ProjectCategory = "Production" | "RL & Eval" | "Research";

export type Project = {
  name: string;
  kicker: string;
  category: ProjectCategory;
  role: string;
  blurb: string;
  problem: string;
  approach: string[];
  architecture: string[];
  hardest: string;
  outcome: string[];
  /** Short chips for the card; mirrors `outcome`. */
  metrics: string[];
  stack: string[];
  image: string;
  hue: string;
  href?: string;
  repo?: string;
};

export const projects: Project[] = [
  {
    name: "KarmicDD",
    kicker: "AI due diligence · Live",
    category: "Production",
    role: "Architect & lead engineer",
    blurb:
      "Investor-grade financial, legal, market and belief due diligence from a raw data room: a 6-node LangGraph pipeline with human approval gates.",
    problem:
      "Each analysis agent OCR'd the same data room on its own and pushed 1M+ tokens of raw text into the prompt. Reports were slow and expensive, and long requests blocked users.",
    approach: [
      "A shared OCR registry keyed by entity and document category: the first caller runs OCR and every other agent awaits the same promise.",
      "Documents go to Gemini through the File API instead of being pasted into the prompt, so a 288-page PDF costs ~75K tokens instead of 1M+.",
      "Heavy work moved to deduplicated async jobs. The API returns 202 with a job ID, and clients poll stages (queued → OCR → upload → analysis).",
      "Postgres/Prisma holds users, payments and audit; MongoDB holds documents, reports and caches. Immutable reports are served cache-first, behind JWT + CSRF on client-isolated storage.",
    ],
    architecture: ["Data-room upload", "Shared OCR registry", "Async job queue", "6-node LangGraph", "Human approval gate", "Report cache"],
    hardest:
      "Four agents racing to OCR the same documents. I fixed it with a per-entity, per-category registry where one run is shared and everyone else awaits it, so each document is read once however many analyses need it.",
    outcome: ["1000+ concurrent users", "200ms → 50ms API latency", "93% fewer tokens, 80% lower API cost"],
    metrics: ["1000+ concurrent users", "200ms → 50ms", "93% fewer tokens"],
    stack: ["TypeScript", "Node.js", "LangGraph", "Gemini File API", "PostgreSQL", "Prisma", "MongoDB"],
    image: "/images/work-karmicdd.webp",
    hue: "150 70% 55%",
    href: "https://karmicdd.clarigenai.com/",
  },
  {
    name: "CLAR AI Workspace",
    kicker: "Agentic workspace · Live",
    category: "Production",
    role: "Architect & lead engineer",
    blurb:
      "A 96-tool agent workspace for research and legal work, with a DeepSearch agent that reasons over up to 3M tokens in a session.",
    problem:
      "Research and document tasks run for minutes across dozens of tools. A chat-style request/response loop drops work when a connection or process dies.",
    approach: [
      "96 tools in 11 categories, orchestrated with LangGraph / LangChain and traced end-to-end in LangSmith.",
      "A DeepSearch agent built to hold up to 3M tokens of context per session for multi-step research.",
      "Results stream over dual-prefix SSE with 3-layer crash recovery, so long runs survive dropped connections.",
      "Approval gates and audit logging around AI actions; document pipelines for PDF, DOCX, XLSX, PPTX and OCR.",
    ],
    architecture: ["User task", "LangGraph router", "96 tools · 11 categories", "DeepSearch agent", "SSE stream + recovery", "Audit log"],
    hardest:
      "Keeping multi-minute agent runs alive all the way to the browser. I layered crash recovery onto the SSE stream so a dropped connection doesn't throw away the run.",
    outcome: ["96 tools in production", "Up to 3M tokens / session", "3-layer stream crash recovery"],
    metrics: ["96 tools", "3M tokens / session", "3-layer crash recovery"],
    stack: ["LangGraph", "LangChain", "LangSmith", "Gemini", "SSE", "GCP"],
    image: "/images/work-clar.webp",
    hue: "265 80% 72%",
    href: "https://clar.clarigenai.com/",
  },
  {
    name: "CLAR for Word",
    kicker: "Office.js add-in · Live",
    category: "Production",
    role: "Product & engineering lead",
    blurb:
      "AI editing inside Microsoft Word for enterprise legal teams: 28 typed document actions, Entra SSO and an auditable change history.",
    problem:
      "Enterprise users won't leave Word, and their IT teams won't allow an AI tool that skips corporate sign-on or edits documents without a record.",
    approach: [
      "An Office.js add-in where the AI emits one of 28 document action types instead of free-form rewrites.",
      "Microsoft Entra SSO, so access follows the customer's existing identity policy.",
      "Translation and grammar pipelines run on Node worker threads, off the request path.",
      "A ChangeTracker records every applied edit for review and audit.",
    ],
    architecture: ["Word task pane", "Entra SSO", "Action router · 28 types", "Worker-thread pipelines", "ChangeTracker", "Apply to document"],
    hardest:
      "Running translation and grammar over long contracts without stalling the API. Moving those jobs onto worker threads keeps the event loop free for every other user.",
    outcome: ["28 document action types", "Enterprise SSO via Entra", "Full audit trail of AI edits"],
    metrics: ["28 action types", "Entra SSO", "Audit trail"],
    stack: ["Office.js", "React", "Node.js", "Worker threads", "Microsoft Entra"],
    image: "/images/work-clar-word.webp",
    hue: "200 85% 62%",
    href: "https://clarigenai.com/",
  },
  {
    name: "Capture Farm",
    kicker: "RL infrastructure",
    category: "RL & Eval",
    role: "Sole engineer · built in 3 days",
    blurb:
      "A parallel Docker-in-Docker capture farm with a time-shift scheduler. It turned a week of serial captures into an afternoon, and the whole team adopted it.",
    problem:
      "Each RL environment's telemetry had to be captured one at a time. A 50-task batch took ~150h, longer than the delivery window.",
    approach: [
      "Isolated Docker-in-Docker slots run captures in parallel, each with its own network and cgroup scope.",
      "A time-shift scheduling algorithm keeps parallel captures delivery-compliant.",
      "A Parquet slot-shift and merge (pyarrow over Loki / Tempo / Mimir) lets several incidents share one stack over disjoint time windows.",
      "Merges fail closed on any window collision, so bad telemetry never ships quietly.",
    ],
    architecture: ["Task batch", "Slot scheduler", "DinD workers", "Time-shift", "Parquet merge", "LGTM stack"],
    hardest:
      "Scaling past a few parallel slots hit Docker address-pool exhaustion, a cgroup-delegation race and slot collisions. I cleared all three to make the farm safe at full width.",
    outcome: ["≈37× faster: 150h → 4h", "10-task batch: 21h → 4h", "Adopted by the whole team"],
    metrics: ["≈37× faster", "150h → 4h", "Team-wide adoption"],
    stack: ["Docker-in-Docker", "cgroups & netns", "Python", "pyarrow / Parquet", "Loki / Tempo / Mimir"],
    image: "/images/work-capture-farm.webp",
    hue: "35 95% 65%",
  },
  {
    name: "Delivery-QC Gates",
    kicker: "Reward-hacking defense",
    category: "RL & Eval",
    role: "Author · top contributor on delivery",
    blurb:
      "Automated gates that hold RL task quality as volume grows. They catch grader loopholes, dead citations and leaks before the client does.",
    problem:
      "With five contributors racing to ship 50 tasks, manual review couldn't reliably catch grader loopholes, citations that didn't resolve, or internal material leaking into a package.",
    approach: [
      "A gate that executes each cited query against the evidence stack instead of trusting the text.",
      "Structural checks: a bare-repo git-mirror check (I25) and a relationship-class enum check (I19).",
      "A build-time guard that blocks internal material from reaching the client package.",
      "Sandbox hardening against reward hacking (lockfile pinning, unprivileged UIDs, process-tree reaping, git-hook neutralization), with graders calibrated to a target pass@1.",
    ],
    architecture: ["Task package", "Schema & enum checks", "Execute cited queries", "Git-mirror check", "Leak guard", "Client validator"],
    hardest:
      "Citations that looked correct but returned nothing. The gate re-runs every cited query and fails the build if the evidence isn't there, which closed a whole class of grader loophole.",
    outcome: ["0 errors / 0 warnings on client validator", "36 of 50 tasks shipped personally (72%)", "19/19 environments salvaged, zero recapture"],
    metrics: ["0 errors / 0 warnings", "72% of delivery", "19/19 salvaged"],
    stack: ["Python", "Git", "Docker", "Graders", "pass@1 calibration"],
    image: "/images/work-qc-gates.webp",
    hue: "0 80% 66%",
  },
  {
    name: "Oracle → GCP Migration",
    kicker: "Cloud & security",
    category: "Production",
    role: "Sole engineer",
    blurb:
      "A single-handed move of a live multi-tenant compliance platform from Oracle Cloud to GCP, rebuilt zero-trust from the KMS layer up.",
    problem:
      "A compliance platform with regulated customer data had to leave Oracle Cloud without data loss, and come out with a security posture auditors would accept.",
    approach: [
      "Moved 107 SQL tables to Cloud SQL through versioned schema migrations, along with MongoDB stores, OCI containers to Artifact Registry and 597 CDN assets to CMEK buckets.",
      "KMS envelope encryption and CMEK-backed storage, with staff credentials hydrated through TPM/PCR7 binding.",
      "Cloud Armor and IAP at the edge; Syft SBOM + Grype vulnerability gating on every image.",
      "200+ integration tests across 15 suites that run against real SQL, not mocks.",
    ],
    architecture: ["Oracle Cloud", "Schema migrations", "Cloud SQL + CMEK GCS", "KMS envelope encryption", "SBOM / Grype gate", "Cloud Armor + IAP"],
    hardest:
      "Proving the migrated system behaved like the old one. 200+ integration tests ran against real SQL instead of mocks, so schema drift showed up before cutover.",
    outcome: ["107 tables + 597 CDN assets migrated", "Zero-trust: KMS + CMEK + IAP", "200+ real-SQL integration tests"],
    metrics: ["107 tables", "597 CDN assets", "KMS + CMEK"],
    stack: ["GCP", "Cloud SQL", "Cloud KMS", "Cloud Armor", "IAP", "Syft / Grype"],
    image: "/images/work-gcp.webp",
    hue: "175 70% 50%",
  },
  {
    name: "Dense-LSTM Spacecraft Estimator",
    kicker: "Research · ML",
    category: "Research",
    role: "Researcher",
    blurb:
      "A lightweight Dense-LSTM hybrid for real-time, GPS-denied spacecraft position estimation, trained on Kerbal Space Program telemetry.",
    problem:
      "Without GPS, a spacecraft has to estimate its position from its own telemetry, in real time, on limited onboard compute.",
    approach: [
      "LSTM layers model the time-series dynamics of flight telemetry.",
      "Dense layers regress position, keeping the model small enough for real-time inference.",
      "Trained and evaluated on Kerbal Space Program telemetry as a reproducible flight simulator.",
    ],
    architecture: ["KSP telemetry", "Sequence windows", "LSTM layers", "Dense head", "Position estimate"],
    hardest:
      "Holding accuracy while cutting compute. A shallow hybrid replaced a deep recurrent stack, so it stays light enough for real time.",
    outcome: ["99.6% accuracy", "−92% compute time"],
    metrics: ["99.6% accuracy", "−92% compute time"],
    stack: ["TensorFlow", "LSTM", "Python", "CUDA"],
    image: "/images/work-spacecraft.webp",
    hue: "220 80% 66%",
    repo: "https://github.com/Skizzy-create/Lightweight-Dense-LSTM-Hybrid-Architecture-for-Real-Time-GPS-Denied-Spacecraft-Position-Estimation",
  },
];

export const ecosystem = [
  {
    name: "RL Environments & Eval",
    blurb: "Writing agentic tasks hard enough to matter, and graders strict enough that they can't be gamed.",
    items: ["Agentic task authoring", "Automated grading", "Reward-hacking defense", "Trajectory review", "pass@1 calibration", "SWE-bench", "Terminal-Bench", "Harbor"],
    image: "/images/eco-rl.webp",
    proof: "QC gates that execute every cited query took a client package to 0 errors / 0 warnings.",
  },
  {
    name: "Platform & Infra",
    blurb: "Isolated, parallel, observable execution, for sandboxes and for production alike.",
    items: ["Docker-in-Docker", "cgroups & netns", "Sandboxes", "Grafana LGTM", "Parquet / pyarrow", "GCP", "Cloud KMS & CMEK", "AWS"],
    image: "/images/eco-infra.webp",
    proof: "A solo-built capture farm cut a 50-task batch from ~150h to ~4h; a solo Oracle → GCP migration moved 107 tables.",
  },
  {
    name: "Applied AI",
    blurb: "Multi-agent systems with human gates, audit logs and a token budget.",
    items: ["LangGraph", "LangChain", "LangSmith", "Gemini", "Multi-agent systems", "RAG / Self-RAG", "OCR / document AI"],
    image: "/images/eco-ai.webp",
    proof: "A 6-node LangGraph DD pipeline went from 1M+ to 75K tokens per report; a 96-tool workspace runs in production.",
  },
  {
    name: "Backend & Data",
    blurb: "Async-first TypeScript and Python services on the right store for each job.",
    items: ["Node.js", "TypeScript", "Python", "PostgreSQL", "Prisma", "MongoDB", "Redis", "SSE & WebSockets"],
    image: "/images/eco-backend.webp",
    proof: "Caching, async queues and workers took the platform to 1000+ concurrent users at 50ms.",
  },
];

export const honors = [
  { place: "2nd", title: "TON Gurugram Bootcamp", note: "Led the team — 1,500 USDT prize" },
  { place: "AIR 5", title: "IDEATHON 2023", note: "Out of 500+ teams nationwide" },
  { place: "Top 6", title: "Smart India Hackathon", note: "Team lead" },
];

export const education = {
  school: "Chandigarh University",
  degree: "B.E. Computer Science",
  period: "2022 — 2026",
  grade: "CGPA 7.98 / 10",
};
