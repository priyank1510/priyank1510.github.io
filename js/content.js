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
    school: "MS CS @ Northeastern",
    location: "Boston, MA",
    coords: "42.3398° N, 71.0892° W",
    timezone: "America/New_York",
    tzLabel: "BOS",
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
    // Each item is a line; *word* = italic.
    tagline:
      "I train models and build the software around them — medical-document pipelines, retrieval-augmented chat, and classifiers that hold up *outside* the notebook.",
  },

  /* ------------------------------------------------------------------ about */
  about: {
    // The big scroll-revealed statement. *word* = italic, ^word^ = accent colour.
    statement:
      "I'm Priyank — a computer-science graduate student who likes the *unglamorous* half of machine learning: cleaning the data, measuring where the model ^fails^, and shipping the pipeline so the result is actually useful to someone.",
    paragraphs: [
      "Most recently I was an AI Engineer intern at Deepthink Healthcare, building OCR pipelines with Vision Transformers and transformer-embedding classifiers for routing medical devices. Before that I trained forecasting and segmentation models on real sales data, and shipped iOS features as a software intern.",
      "I'm drawn to language modeling, retrieval-augmented generation, transformer architectures, and reinforcement learning — and to the engineering that makes them reproducible: evaluation harnesses, clean APIs, and honest benchmarks.",
    ],
    stats: [
      { value: 95, suffix: "%", label: "F1 — transformer-embedding device router" },
      { value: 90, suffix: "%", label: "Reviewed accuracy on MedTech Q&A" },
      { value: 200, suffix: "+", label: "Pharma datasets warehoused & modeled" },
      { value: 3.8, suffix: "", decimals: 1, label: "GPA — MS CS, Northeastern" },
    ],
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
      stack: ["iOS", "Mobile", "Performance"],
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
      stack: ["Python", "scikit-learn", "Clustering", "Regression"],
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
      stack: ["ViT", "Transformers", "OCR", "Label Studio", "Python"],
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
      slug: "conversational-rag", // used in the URL: #/p/conversational-rag
      title: "Self-Improving *Conversational* RAG",
      kind: "LLM · Retrieval",
      year: "", // e.g. "2025" — leave empty to hide
      summary:
        "Chat with a stack of PDFs — with retrieval, chunking and prompting tuned to keep answers grounded and hallucinations down.",
      tags: ["RAG", "LLM", "FastAPI", "Embeddings", "Python"],
      cover: "", // optional image, e.g. "assets/projects/rag.jpg"
      coverStyle: "contours", // generative cover: contours | flow | orbits | halftone | spectrum (or "" for auto)
      featured: true, // true = big card. false = compact row in the archive list
      role: "Solo build",
      links: {
        github: "", // paste URLs when ready — empty ones are hidden
        live: "",
        writeup: "",
      },
      metrics: [],
      highlights: [
        "Built a RAG system for conversational querying across multiple PDF documents using transformer embeddings.",
        "Evaluated chunking, retrieval and prompt-engineering strategies to improve contextual grounding and reduce hallucinations.",
        "Developed a FastAPI backend integrating semantic search, vector retrieval and conversational workflows.",
        "Benchmarked retrieval quality and response consistency with embedding-similarity and transformer-based evaluation metrics.",
      ],
      // Optional long-form sections for the case-study page:
      // sections: [{ title: "Problem", text: "..." }, { title: "Approach", text: "..." }],
    },
    {
      slug: "fake-news-detection",
      title: "Fake News *Detection*",
      kind: "NLP · Sequence models",
      year: "",
      summary:
        "RNN and LSTM sequence models trained on 10,000+ articles to separate reporting from fabrication.",
      tags: ["NLP", "LSTM", "Deep Learning", "Python"],
      cover: "",
      coverStyle: "flow",
      featured: true,
      role: "Solo build",
      links: { github: "", live: "", writeup: "" },
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
    {
      slug: "pharma-sales-warehouse",
      title: "Pharma Sales *Warehouse* & Forecasting",
      kind: "Data engineering · Time series",
      year: "",
      summary:
        "An ETL pipeline and OLAP warehouse over 200+ pharmaceutical sales datasets, feeding an R dashboard across 20+ regions.",
      tags: ["ETL", "SQL", "Data Warehouse", "R", "Time Series"],
      cover: "",
      coverStyle: "spectrum",
      featured: true,
      role: "Solo build",
      links: { github: "", live: "", writeup: "" },
      metrics: [
        { value: "200+", label: "Datasets integrated" },
        { value: "20+", label: "Regions tracked" },
      ],
      highlights: [
        "Built an ETL pipeline for 200+ pharmaceutical sales datasets using a snowflake schema and normalized relational design.",
        "Constructed a data warehouse on OLAP principles to pull critical sales and performance insights.",
        "Developed an R dashboard with kableExtra to track sales performance across 20+ regions.",
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
    { key: "research", items: ["Language modeling", "RAG", "Transformer architecture", "NLP", "Reinforcement learning"] },
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

  /* ------------------------------------------------------------- settings */
  settings: {
    showInProgressCard: true, // the animated "currently training…" card at the end of the grid
    inProgressText: "Next experiment is currently training. Check back soon.",
    showFiltersAt: 4, // tag filters appear once you have at least this many projects
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
      role: "Solo build",
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
