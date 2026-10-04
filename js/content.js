/* ==========================================================================
   CONTENT — the only file you need to touch to update the site.
   --------------------------------------------------------------------------
   • To add a project: copy the PROJECT TEMPLATE at the very bottom of this
     file, paste it into the `projects` list, and fill it in. That's it.
   • No image? Leave `cover` empty — the site paints a unique generative
     cover for every project, seeded by its title.
   • In titles, wrap a word in *asterisks* to set it in italic.
   • Save, refresh. No build step.
   ========================================================================== */

export default {
  /* ---------------------------------------------------------------- profile */
  profile: {
    name: "Priyank Patel",
    fullName: "Priyankkumar Chandrakant Patel",
    initials: "PP",
    role: "AI Engineer",
    location: "Boston, MA",
    email: "patel.priyankk@northeastern.edu",
    github: "https://github.com/priyank1510",
    linkedin: "https://www.linkedin.com/in/priyankk",
    resume: "assets/Priyank-Patel-Resume.pdf", // set to "" to hide the résumé button
    available: true,
    availability: "Open to full-time AI / ML & software roles",
  },

  /* ------------------------------------------------------------------- hero */
  hero: {
    kicker: ["AI Engineer", "MS Computer Science", "Northeastern University"],
    // *word* = italic.
    tagline:
      "I train models and build the software around them — medical-document pipelines, retrieval-augmented chat, and classifiers that hold up *outside* the notebook.",
  },

  /* ------------------------------------------------------------------ about */
  about: {
    // The big scroll-revealed statement. *word* = italic, ^word^ = accent colour.
    statement:
      "I'm Priyank — a computer-science graduate student who likes the *unglamorous* half of machine learning: cleaning the data, measuring where the model ^fails^, and shipping the pipeline so the result is actually useful to someone.",
    paragraphs: [
      "What I care about is the engineering that makes a model trustworthy: evaluation harnesses, clean APIs, reproducible pipelines, and benchmarks that tell the truth.",
    ],
    // Optional count-up numbers, e.g. { value: 95, suffix: "%", label: "F1 on ..." }.
    // Left empty on purpose — the numbers already live in the log and projects.
    stats: [],
  },


  /* ------------------------------------------------------------- experience */
  // Listed oldest → newest: it's a training log.
  experience: [
    {
      role: "Software Development Intern",
      company: "Elsner Technologies",
      location: "Ahmedabad, India",
      start: "Apr 2022",
      end: "Aug 2022",
      points: [
        "Developed iOS task-management features with calendar integration, improving user engagement by 30%.",
        "Optimized app performance, cutting load times by 40% and keeping large task lists responsive.",
      ],
    },
    {
      role: "ML Data Scientist",
      company: "Enlighten Infosystems",
      location: "Vadodara, India",
      start: "Jan 2023",
      end: "Aug 2023",
      points: [
        "Ran EDA across five years of software-sales data to surface what had actually driven the business.",
        "Trained SVMs on 3,000+ sales records to 95% accuracy for performance classification; built regression models reaching 92% for revenue prediction.",
        "Applied clustering for customer segmentation, lifting targeted acquisition by 15%.",
        "Engineered features and benchmarked models with Python, scikit-learn and proper evaluation metrics.",
      ],
    },
    {
      role: "AI Engineer Intern",
      company: "Deepthink Healthcare",
      location: "San Ramon, USA",
      start: "Sep 2025",
      end: "Dec 2025",
      points: [
        "Built an OCR preprocessing pipeline using Tesseract cues and Vision Transformers (ViT) to raise medical-document extraction quality and cut manual review.",
        "Developed transformer-embedding classifiers for medical-device routing — 95% F1 in internal evaluations.",
        "Ran structured QA experiments on MedTech Q&A outputs, isolating failure patterns and lifting reviewed accuracy to 90%.",
        "Wired model outputs into reproducible Python evaluation pipelines for automated routing and benchmarking; curated datasets in Label Studio.",
      ],
    },
  ],

  // The final, open-ended row of the training log.
  nextEpoch: {
    title: "Your team",
    text: "Looking for a full-time role in AI / ML engineering or software. If you're building something that learns, let's talk.",
    cta: "Start a conversation",
  },

  /* --------------------------------------------------------------- projects */
  projects: [
    {
      slug: "computer-use-automation", // used in the URL: #/p/computer-use-automation
      title: "Computer-Use *Automation*",
      kind: "LLM agents · Browser automation",
      year: "2026",
      summary:
        "An LLM learns a legacy back-office UI once; what it learns becomes a typed, reviewable capability that replays deterministically — no model in the loop.",
      tags: ["Python", "Claude", "Playwright", "Agents"],
      cover: "", // optional image, e.g. "assets/projects/shot.jpg" — empty = generative art
      coverStyle: "orbits", // contours | flow | orbits | halftone | spectrum | "" (auto)
      featured: true, // true = big card · false = compact row in the archive list
      links: { github: "https://github.com/priyank1510/computer-use-automation" },
      metrics: [{ value: "0", label: "LLM calls at replay time" }],
      highlights: [
        "Claude explores a bank back-office UI that has no API and no test IDs, picking controls from an observed element index instead of writing selectors.",
        "Each discovered flow is saved as a typed capability — declared inputs, outputs and business outcomes — so it can be reviewed like code.",
        "Replay is deterministic with no model in the loop, and hands off to a human operator when it cannot finish safely.",
        "Handles many tenants running the same vendor product configured differently, and the full test suite runs without an API key.",
      ],
    },
    {
      slug: "multi-doc-rag",
      title: "Multi-Document *RAG*",
      kind: "LLM · Retrieval",
      year: "2026",
      summary:
        "Chat with several PDFs at once. Answers are grounded in the documents, cite the exact file and page, and admit it when nothing relevant is found.",
      tags: ["Python", "FastAPI", "FAISS", "Embeddings", "Claude"],
      cover: "",
      coverStyle: "contours",
      featured: true,
      links: { github: "https://github.com/priyank1510/multi-doc-rag" },
      metrics: [
        { value: "0.971", label: "MRR, best chunking strategy" },
        { value: "100%", label: "Hit@4 on the labelled set" },
      ],
      highlights: [
        "Multi-document ingestion that keeps each chunk's document and page, so every answer carries citations.",
        "MiniLM sentence-transformer embeddings in a FAISS index; follow-up questions are rewritten into standalone queries before retrieval.",
        "Answers only from retrieved sources, refuses below a relevance threshold, and falls back to extractive answers without an API key.",
        "Benchmarked six chunking strategies (Hit@k, MRR, off-topic refusal) — sentence-aligned 250-token chunks ranked best.",
      ],
    },
    {
      slug: "mlb-pitcher-injury",
      title: "MLB Pitcher *Injury* Risk",
      kind: "Machine learning · Sports analytics",
      year: "2026",
      summary:
        "Predicts whether a starting pitcher will suffer an arm injury within the next 21 days, from Statcast pitch tracking, workload and injury history.",
      tags: ["Python", "XGBoost", "scikit-learn", "pybaseball"],
      cover: "",
      coverStyle: "spectrum",
      featured: true,
      links: { github: "https://github.com/priyank1510/MLB-PITCHER-INJURY-PREDICTION" },
      metrics: [
        { value: "72%", label: "Real injuries caught" },
        { value: "41%", label: "Fewer false alarms than random forest" },
      ],
      highlights: [
        "Built a game-level dataset of 49,792 starts across 256 pitchers (2015–2024) from Statcast and MLB Stats API injury records.",
        "Engineered rolling workload, rest, velocity-drop and spin-drop features alongside prior-injury history.",
        "Used a temporal split (train 2015–21, test 2022–24) to prevent leakage, and handled a 3.2% positive rate with class weighting and a lowered threshold.",
        "Compared logistic regression, random forest and XGBoost on PR-AUC, MCC, F1 and Brier score — prior injury history was the strongest predictor.",
      ],
    },
    {
      slug: "food-deserts-usa",
      title: "Food *Deserts* in the USA",
      kind: "Data analysis · R",
      year: "2026",
      summary: "Who lacks access to groceries in the US, and why — an exploratory analysis of the USDA Food Access Research Atlas.",
      tags: ["R", "tidyverse", "ggplot2", "EDA"],
      cover: "",
      coverStyle: "halftone",
      featured: true,
      links: { github: "https://github.com/priyank1510/Food_desert_in_USA" },
      metrics: [
        { value: "39M", label: "People living in food deserts" },
        { value: "4×", label: "Higher risk without a vehicle" },
      ],
      highlights: [
        "Cleaned and engineered features across 72,531 census tracts and 147 variables.",
        "Roughly 1 in 8 tracts are food deserts, concentrated in the South and Southwest; urban tracts are nearly twice as affected as rural ones.",
        "Transportation is the hidden driver: low vehicle access means up to 4× higher food-desert rates.",
        "At the same poverty level, food-desert tracts rely more on SNAP — a disadvantage that goes beyond income.",
      ],
    },
    {
      slug: "boston-crime-analysis",
      title: "Crime Analysis of *Boston*",
      kind: "ML · NLP · Geospatial",
      year: "2024",
      summary: "Predicting crime severity, mapping hotspots over time, and reading public sentiment about safety in Boston.",
      tags: ["XGBoost", "NLP", "Sentiment analysis", "Geospatial"],
      cover: "",
      coverStyle: "flow",
      featured: true,
      role: "Team project",
      links: { github: "https://github.com/priyank1510/Crime_Analysis_Of_Boston" },
      metrics: [],
      highlights: [
        "Classified Boston crime incidents into four severity levels with XGBoost.",
        "Built a cluster map showing where crime concentrates and how it shifts over time.",
        "Applied NLP sentiment analysis to gauge public perception of crime and safety.",
      ],
    },
    {
      slug: "pharma-sales-warehouse",
      title: "Pharma Sales *Data Warehouse*",
      kind: "Data engineering · SQL",
      year: "2024",
      summary: "An ETL pipeline from CSV and XML sources into a dimensional warehouse, with analytical reports on pharmaceutical sales.",
      tags: ["R", "SQL", "MySQL", "SQLite", "ETL"],
      cover: "",
      coverStyle: "contours",
      featured: true,
      links: { github: "https://github.com/priyank1510/Pharmaceutical-Data-Warehouse-Analysis" },
      metrics: [
        { value: "200+", label: "Datasets integrated" },
        { value: "20+", label: "Regions tracked" },
      ],
      highlights: [
        "Extracted sales data from CSV and XML, staged it in SQLite, and loaded it into a dimensional schema in MySQL.",
        "Wrote the ETL in R (RSQLite, RMySQL) and an R Markdown report on sales trends, revenue per product, country sales and rep performance.",
        "Tracked sales performance across 20+ regions with kableExtra tables.",
      ],
    },

    /* ---- archive: compact rows under the grid (featured: false) ---- */
    {
      slug: "kanbas-lms",
      title: "Kanbas *LMS*",
      kind: "Full-stack · MERN",
      year: "2025",
      summary: "A learning management system with role-based views for students, instructors and admins — courses, assignments and auto-scored quizzes.",
      tags: ["React", "TypeScript", "Node.js", "Express", "MongoDB"],
      cover: "",
      coverStyle: "",
      featured: false,
      links: {
        github: "https://github.com/priyank1510/kanbas-react-web-app",
        backend: "https://github.com/priyank1510/kambaz-node-server-app-cs5610-sp25",
      },
      highlights: [
        "Role-based access for students, instructors and admins, with full CRUD for courses, assignments and users.",
        "Quiz builder and quiz attempts with automatic scoring.",
        "React front end on Netlify, Express API on Render, MongoDB Atlas database.",
      ],
    },
    {
      slug: "api-playground",
      title: "API *Playground*",
      kind: "APIs · Reference",
      year: "2026",
      summary: "Thirteen runnable API integrations across LLM providers, REST services and AWS / Snowflake data services, each with inline explanations.",
      tags: ["Python", "OpenAI", "Anthropic", "AWS", "Snowflake"],
      cover: "",
      coverStyle: "",
      featured: false,
      links: { github: "https://github.com/priyank1510/api-playground" },
      highlights: [
        "LLM APIs: chat, streaming, embeddings, function calling, vision and reranking across OpenAI, Anthropic, Groq, Cohere and Hugging Face.",
        "REST APIs with pagination patterns (weather, news, GitHub, NASA).",
        "Data and cloud: S3 presigned URLs, DynamoDB queries vs scans, and Snowflake DDL/DML.",
      ],
    },
    {
      slug: "fake-news-detection",
      title: "Fake News *Detection*",
      kind: "NLP · Sequence models",
      year: "",
      summary: "Sequence models that learn to separate reporting from fabrication.",
      tags: ["NLP", "LSTM", "Deep Learning", "Python"],
      cover: "",
      coverStyle: "",
      featured: false,
      links: {},
      metrics: [
        { value: "+25%", label: "Classification performance" },
        { value: "10k+", label: "Articles in corpus" },
      ],
      highlights: [
        "Experimented with RNN/LSTM sequence architectures on 10,000+ articles, improving classification performance by 25%.",
        "Applied NLP preprocessing, tokenization and sequence modeling to speed up training and improve generalization.",
        "Benchmarked outputs with classification metrics and visualization-driven error analysis.",
      ],
    },
  ],

  /* --------------------------------------------------------------- skills */
  // Rendered as a "model card". Keys are the row labels.
  skills: [
    { key: "languages", items: ["Python", "Java", "C", "JavaScript", "R", "SQL"] },
    { key: "ml / dl", items: ["PyTorch", "TensorFlow", "scikit-learn", "Pandas", "NumPy", "Matplotlib"] },
    { key: "llm stack", items: ["LangChain", "RAG", "Transformers", "Embeddings", "Vector search"] },
    { key: "web & apis", items: ["FastAPI", "REST", "Node.js", "React"] },
    { key: "data & cloud", items: ["PostgreSQL", "MySQL", "MongoDB", "SQLite", "Spark", "AWS", "GCP"] },
    { key: "engineering", items: ["System design", "Testing", "Docker", "CI/CD", "Git", "Agile / Scrum"] },
    { key: "research", items: ["Language modeling", "RAG", "Transformer architectures", "NLP", "Reinforcement learning"] },
  ],

  /* ------------------------------------------------------------ education */
  education: [
    {
      degree: "M.S. Computer Science",
      school: "Northeastern University",
      place: "Boston, MA",
      start: "Jan 2024",
      end: "Present",
      grade: "GPA 3.8 / 4.0",
    },
    {
      degree: "B.Tech. Computer Science & Engineering",
      school: "Gujarat Technological University",
      place: "India",
      start: "Jun 2019",
      end: "May 2023",
      grade: "GPA 4.0 / 4.0",
    },
  ],

  certifications: ["AWS Cloud Architecting", "AWS AML", "AWS Data Engineer"],

  activities: [
    { title: "Coding Teaching Assistant", org: "Masai", text: "Guided 15 students through a junior algorithms track." },
    { title: "Curation Team", org: "Data Analytics Engineering student org, Northeastern", text: "" },
  ],

  /* -------------------------------------------------------------- contact */
  contact: {
    // *word* = italic, ^word^ = accent colour
    headline: "Let's build something that *learns*.",
    text: "The inbox is open — for roles, collaborations, or a good argument about retrieval.",
  },

  /* ---------------------------------------------------------------- music */
  // The ◈ Play buttons. With `src` empty, the site composes its own ambient
  // soundtrack live in the browser. To use a real track instead, put an MP3
  // you have the rights to in assets/ and set src: "assets/your-track.mp3".
  music: {
    src: "",
    title: "Latent Drift",
    credit: "generative",
  },

  /* ------------------------------------------------------------- settings */
  settings: {
    showInProgressCard: false, // true = animated "currently training…" card at the end of the grid
    inProgressText: "Next experiment is currently training. Check back soon.",
    showFiltersAt: 12, // tag filters appear once you have at least this many projects
  },
};

/* ==========================================================================
   PROJECT TEMPLATE — copy everything between the braces into `projects`.
   --------------------------------------------------------------------------
    {
      slug: "my-new-project",              // unique, lowercase, dashes
      title: "My *New* Project",           // *word* → italic
      kind: "Computer vision · PyTorch",   // short category line
      year: "2026",
      summary: "One or two sentences that sell it.",
      tags: ["PyTorch", "CV"],
      cover: "",                           // "assets/projects/my-shot.jpg" or "" for generative art
      coverStyle: "",                      // contours | flow | orbits | halftone | spectrum | "" (auto)
      featured: true,
      role: "",                            // optional, e.g. "Team of 3 — ML lead"
      links: { github: "https://github.com/priyank1510/...", live: "", writeup: "" },
      metrics: [{ value: "93%", label: "Top-1 accuracy" }],
      highlights: ["What you built.", "What you measured.", "What you learned."],
      sections: [                          // optional long-form case study
        { title: "Problem", text: "..." },
        { title: "Approach", text: "..." },
        { title: "Result", text: "..." },
      ],
      gallery: [],                         // optional extra images: ["assets/projects/a.jpg"]
    },
   ========================================================================== */
