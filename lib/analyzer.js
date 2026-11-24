const KEYWORD_GROUPS = {
  JavaScript: ["javascript", "ecmascript"],
  TypeScript: ["typescript"],
  React: ["react", "react.js"],
  "React Native": ["react native"],
  "Next.js": ["next.js", "nextjs"],
  Vue: ["vue", "vue.js"],
  Angular: ["angular"],
  "Node.js": ["node.js", "nodejs"],
  "Express.js": ["express.js", "express"],
  Python: ["python"],
  Java: ["java"],
  "C++": ["c++"],
  "C#": ["c#"],
  ".NET": [".net", "dotnet"],
  PHP: ["php"],
  Laravel: ["laravel"],
  Django: ["django"],
  Flask: ["flask"],
  FastAPI: ["fastapi"],
  HTML: ["html", "html5"],
  CSS: ["css", "css3"],
  "Tailwind CSS": ["tailwind", "tailwind css"],
  SQL: ["sql"],
  MySQL: ["mysql"],
  PostgreSQL: ["postgresql", "postgres"],
  MongoDB: ["mongodb"],
  Redis: ["redis"],
  Firebase: ["firebase"],
  AWS: ["aws", "amazon web services"],
  Azure: ["azure"],
  "Google Cloud": ["google cloud", "gcp"],
  Docker: ["docker"],
  Kubernetes: ["kubernetes", "k8s"],
  Git: ["git", "github"],
  "REST APIs": ["rest api", "restful api", "rest apis"],
  GraphQL: ["graphql"],
  "CI/CD": ["ci/cd", "continuous integration", "continuous deployment"],
  Linux: ["linux"],
  Cybersecurity: ["cybersecurity", "cyber security"],
  "Network Security": ["network security"],
  "Information Security": ["information security"],
  Cryptography: ["cryptography", "cryptographic"],
  "Penetration Testing": ["penetration testing", "pentesting"],
  "Vulnerability Assessment": ["vulnerability assessment"],
  "Threat Detection": ["threat detection"],
  SIEM: ["siem"],
  Splunk: ["splunk"],
  Wireshark: ["wireshark"],
  Scapy: ["scapy"],
  Nmap: ["nmap"],
  "Burp Suite": ["burp suite"],
  OWASP: ["owasp"],
  "TCP/IP": ["tcp/ip", "tcp ip"],
  DNS: ["dns"],
  VPN: ["vpn"],
  "Incident Response": ["incident response"],
  "Risk Assessment": ["risk assessment"],
  Agile: ["agile"],
  Scrum: ["scrum"],
  "Project Management": ["project management"],
  "Problem Solving": ["problem solving"],
  Communication: ["communication skills"],
  Collaboration: ["collaboration", "teamwork"],
  "Technical Documentation": ["technical documentation"],
  "Data Analysis": ["data analysis"],
  "Machine Learning": ["machine learning"],
  PyTorch: ["pytorch"],
  TensorFlow: ["tensorflow"],
  Testing: ["testing", "unit testing", "integration testing"],
  "Quality Assurance": ["quality assurance"],
  "UI/UX": ["ui/ux", "user experience", "user interface"],
  Expo: ["expo", "expo sdk"],
  "AutoHotkey": ["autohotkey", "ahk"],
  JWT: ["jwt", "json web token", "json web tokens"],
  OAuth: ["oauth", "oauth2", "oauth 2.0"],
  JSON: ["json"],
  Postman: ["postman"],
  Swagger: ["swagger", "openapi"],
  Jest: ["jest"],
  Pytest: ["pytest"],
  "GitHub Actions": ["github actions"],
  Vercel: ["vercel"],
  Netlify: ["netlify"],
  Render: ["render"],
  Supabase: ["supabase"],
  Firestore: ["firestore"],
  SQLite: ["sqlite"],
  "Microsoft SQL Server": ["microsoft sql server", "sql server", "mssql"],
  Go: ["golang", "go language"],
  Rust: ["rust"],
  Ruby: ["ruby"],
  Kotlin: ["kotlin"],
  Swift: ["swift"],
  Dart: ["dart"],
  Flutter: ["flutter"],
  Terraform: ["terraform"],
  Nginx: ["nginx"],
  "Active Directory": ["active directory", "windows active directory"],
  "Windows Server": ["windows server"],
  "Cloud Security": ["cloud security"],
  "Application Security": ["application security", "app security"],
  "API Security": ["api security"],
  "Ethical Hacking": ["ethical hacking"],
  "Security Operations": ["security operations", "soc analyst", "security operations center"],
  "Threat Hunting": ["threat hunting"],
  "Malware Analysis": ["malware analysis"],
  Metasploit: ["metasploit"],
  "Digital Forensics": ["digital forensics", "computer forensics"],
  SSH: ["ssh", "secure shell"],
  Firewall: ["firewall", "firewalls"],
  "IDS/IPS": ["ids/ips", "intrusion detection", "intrusion prevention"],
  TLS: ["tls", "transport layer security"],
  SSL: ["ssl", "secure sockets layer"],
  "Identity and Access Management": ["identity and access management", "iam"],
  RBAC: ["rbac", "role based access control"],
  Networking: ["networking", "computer networks"],
  "Software Development": ["software development", "software engineering"],
  "Web Development": ["web development", "web applications"],
  "Mobile Development": ["mobile development", "mobile applications"],
  "Full Stack Development": ["full stack", "full-stack", "fullstack"],
  "Frontend Development": ["frontend", "front end", "front-end"],
  "Backend Development": ["backend", "back end", "back-end"],
  "Responsive Design": ["responsive design", "responsive web design"],
  Debugging: ["debugging", "debug code"],
  Troubleshooting: ["troubleshooting", "technical troubleshooting"],
  "Technical Support": ["technical support", "it support"],
  "Customer Service": ["customer service", "customer support"],
  Leadership: ["leadership", "team leadership"],
  "Time Management": ["time management"],
  "Attention to Detail": ["attention to detail"],
  "Requirements Analysis": ["requirements analysis", "requirement gathering"],
  "Software Testing": ["software testing", "test automation"],
  "API Integration": ["api integration", "integrating apis"],
  "Barcode Scanning": ["barcode scanning", "barcode scanner"],
  ZXing: ["zxing"],
  "Payment Integration": ["payment integration", "payment gateway"],
  "Bachelor's Degree": ["bachelor's degree", "bachelors degree", "bachelor degree", "bsc", "b.eng", "beng"],
  "Master's Degree": ["master's degree", "masters degree", "master degree", "msc", "m.eng", "meng"]
};

const REQUIRED_CONTEXT = /\b(required|must have|must possess|essential|minimum qualifications|you have|we require|requirements include)\b/i;
const PREFERRED_CONTEXT = /\b(preferred|nice to have|bonus|desirable|an advantage)\b/i;

function normalize(text = "") {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9+#./\s-]/g, " ")
    .replace(/[./-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasPhrase(text, phrase) {
  const source = ` ${normalize(text)} `;
  const target = ` ${normalize(phrase)} `;
  return target.length > 2 && source.includes(target);
}

export function extractKeywords(text) {
  return Object.entries(KEYWORD_GROUPS)
    .filter(([, aliases]) => aliases.some((alias) => hasPhrase(text, alias)))
    .map(([keyword]) => keyword);
}

function extractEvidence(resumeText, matchedKeywords) {
  const lines = resumeText
    .split(/\r?\n|(?<=[.!?])\s+(?=[A-Z])/)
    .map((line) => line.replace(/^\s*[-•*\d.)]+\s*/, "").trim())
    .filter((line) => line.length >= 35 && line.length <= 420);

  const unique = new Map();

  for (const line of lines) {
    const matched = matchedKeywords.filter((keyword) => hasPhrase(line, keyword));
    if (matched.length === 0) continue;

    const key = normalize(line);
    if (!unique.has(key)) {
      unique.set(key, { text: line, count: matched.length });
    }
  }

  return [...unique.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((item) => item.text);
}

function classifyJobKeywords(jobDescription, keywords) {
  const lines = jobDescription.split(/\r?\n/).map((line) => line.trim());
  const requiredText = lines.filter((line) => REQUIRED_CONTEXT.test(line)).join(" ");
  const preferredText = lines.filter((line) => PREFERRED_CONTEXT.test(line)).join(" ");

  return {
    required: keywords.filter((keyword) => hasPhrase(requiredText, keyword)),
    preferred: keywords.filter((keyword) => hasPhrase(preferredText, keyword))
  };
}

function buildSummaryDraft(targetRole, matchedKeywords, evidence) {
  if (matchedKeywords.length === 0) {
    return `Resume-based profile for ${targetRole}. Add a short professional summary using relevant skills and achievements you can demonstrate. This scan did not identify recognised keywords shared by the job description and your resume.`;
  }

  const skillText = matchedKeywords.slice(0, 8).join(", ");
  const evidenceText = evidence.length
    ? ` The supplied resume also includes relevant evidence: ${evidence.slice(0, 2).join(" ")}`
    : "";

  return `Resume-based profile for ${targetRole}, highlighting skills already listed in the supplied resume: ${skillText}.${evidenceText}`;
}

export function analyzeResume({ resumeText, jobDescription, jobTitle = "" }) {
  const targetRole = jobTitle.trim() ||
    jobDescription.split(/\r?\n/).map((line) => line.trim()).find((line) => line.length > 4 && line.length < 90) ||
    "Target role";

  const jobKeywords = extractKeywords(jobDescription);
  const resumeKeywords = extractKeywords(resumeText);
  const matchedKeywords = jobKeywords.filter((keyword) => resumeKeywords.includes(keyword));
  const missingKeywords = jobKeywords.filter((keyword) => !resumeKeywords.includes(keyword));
  const classified = classifyJobKeywords(jobDescription, jobKeywords);

  const matchedRequired = classified.required.filter((keyword) => matchedKeywords.includes(keyword));
  const missingRequired = classified.required.filter((keyword) => missingKeywords.includes(keyword));
  const matchedPreferred = classified.preferred.filter((keyword) => matchedKeywords.includes(keyword));
  const evidence = extractEvidence(resumeText, matchedKeywords);

  const score = jobKeywords.length
    ? Math.round((matchedKeywords.length / jobKeywords.length) * 100)
    : null;

  return {
    targetRole,
    score,
    scoreLabel: score === null ? "Not enough recognised keywords" : "Keyword alignment estimate",
    jobKeywordCount: jobKeywords.length,
    resumeKeywordCount: resumeKeywords.length,
    matchedKeywords,
    missingKeywords,
    requiredKeywords: classified.required,
    matchedRequired,
    missingRequired,
    matchedPreferred,
    evidence,
    summaryDraft: buildSummaryDraft(targetRole, matchedKeywords, evidence),
    notes: [
      "This is a keyword-alignment estimate, not a score from a specific applicant tracking system.",
      "A missing keyword is not proof that you lack the skill. Add it only if you genuinely have that experience.",
      "The generated summary and selected evidence come from your existing resume. Check every detail before using the draft."
    ]
  };
}

export function buildDocumentData({ analysis, resumeText }) {
  return {
    targetRole: analysis.targetRole,
    summaryDraft: analysis.summaryDraft,
    matchedKeywords: analysis.matchedKeywords,
    missingKeywords: analysis.missingKeywords,
    evidence: analysis.evidence,
    resumeText,
    notes: analysis.notes
  };
}
