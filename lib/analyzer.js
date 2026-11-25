const KEYWORD_GROUPS = {
  JavaScript: ["javascript", "ecmascript", "js"],
  TypeScript: ["typescript"],
  React: ["react", "react.js", "reactjs"],
  "React Native": ["react native"],
  "Next.js": ["next.js", "nextjs", "next js"],
  Vue: ["vue", "vue.js", "vuejs"],
  Angular: ["angular"],
  "Node.js": ["node.js", "nodejs", "node js", "node"],
  "Express.js": ["express.js", "expressjs", "express"],
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
  SQL: ["sql", "structured query language"],
  MySQL: ["mysql"],
  PostgreSQL: ["postgresql", "postgres"],
  MongoDB: ["mongodb"],
  Redis: ["redis"],
  Firebase: ["firebase"],
  AWS: ["aws", "amazon web services"],
  Azure: ["azure"],
  "Google Cloud": ["google cloud", "gcp", "google cloud platform"],
  Docker: ["docker"],
  Kubernetes: ["kubernetes", "k8s"],
  Git: ["git", "github", "version control", "version control systems"],
  "REST APIs": ["rest api", "restful api", "rest apis", "restful services"],
  GraphQL: ["graphql"],
  "CI/CD": ["ci/cd", "continuous integration", "continuous deployment", "continuous delivery"],
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
  "Project Management": ["project management", "project coordination"],
  "Code Quality": ["code quality", "maintainable code", "clean code", "efficient code", "reliable code", "high-quality software"],
  "Continuous Learning": ["continuous learning", "up to date", "industry trends", "latest technologies", "emerging technologies", "professional development"],
  "Problem Solving": ["problem solving", "analytical skills", "critical thinking", "resolve issues", "resolve defects", "software defects", "solve problems"],
  Communication: ["communication", "communication skills", "written communication", "verbal communication", "written and verbal communication"],
  Collaboration: ["collaboration", "collaborate", "collaborating", "collaboratively", "teamwork", "cross-functional collaboration", "cross-functional teams", "cross functional teams", "team collaboration"],
  "Technical Documentation": ["technical documentation"],
  "Data Analysis": ["data analysis", "data analytics", "data visualisation", "data visualization"],
  "Machine Learning": ["machine learning"],
  PyTorch: ["pytorch"],
  TensorFlow: ["tensorflow"],
  Testing: ["testing", "unit testing", "integration testing", "automated testing", "test automation"],
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
  "Software Development": ["software development", "software engineering", "software engineer", "software engineers", "software developer", "software developers", "software solutions"],
  "Web Development": ["web development", "web applications"],
  "Mobile Development": ["mobile development", "mobile applications"],
  "Full Stack Development": ["full stack", "full-stack", "fullstack"],
  "Frontend Development": ["frontend", "front end", "front-end"],
  "Backend Development": ["backend", "back end", "back-end"],
  "Responsive Design": ["responsive design", "responsive web design"],
  Debugging: ["debugging", "debug", "debug code", "debug software", "bug fixing", "fix bugs"],
  Troubleshooting: ["troubleshooting", "troubleshoot", "technical troubleshooting", "troubleshoot issues", "troubleshoot software"],
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
  "Security Guard": ["security guard", "security officer", "security personnel", "security staff"],
  CCTV: ["cctv", "closed circuit television", "video surveillance"],
  "Access Control": ["access control", "entry control", "visitor access control"],
  Surveillance: ["surveillance", "monitoring cameras"],
  Patrolling: ["patrolling", "security patrol", "mobile patrol"],
  "Physical Security": ["physical security", "site security"],
  "Emergency Response": ["emergency response", "responding to emergencies"],
  "First Aid": ["first aid", "basic life support", "cpr"],
  "Fire Safety": ["fire safety", "fire prevention", "fire evacuation"],
  "Incident Reporting": ["incident reporting", "incident reports", "incident documentation"],
  "Conflict Resolution": ["conflict resolution", "conflict management"],
  "Crowd Control": ["crowd control", "crowd management"],
  "Loss Prevention": ["loss prevention", "retail loss prevention"],
  "Health and Safety": ["health and safety", "occupational health and safety", "hse"],
  "Visitor Management": ["visitor management", "visitor registration"],
  "Risk Management": ["risk management", "operational risk"],
  "Report Writing": ["report writing", "writing reports"],
  "Microsoft Office": ["microsoft office", "ms office", "office suite"],
  Excel: ["excel", "microsoft excel", "spreadsheet"],
  Word: ["microsoft word", "ms word"],
  PowerPoint: ["powerpoint", "microsoft powerpoint"],
  "Data Entry": ["data entry", "data input"],
  "Administrative Support": ["administrative support", "administration", "admin support"],
  Sales: ["sales", "retail sales"],
  CRM: ["crm", "customer relationship management"],
  SAP: ["sap"],
  "Inventory Management": ["inventory management", "stock control"],
  "Cash Handling": ["cash handling", "cash transactions", "cashiering"],
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

function isResumeSectionHeading(line) {
  return /^(professional )?(summary|profile|experience|employment history|work history|education|skills|technical skills|projects|certifications|achievements|languages|references)$/i.test(line.trim());
}

function mergeBulletContinuations(resumeText) {
  const output = [];

  for (const rawLine of String(resumeText).split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const bullet = /^[-•●▪◦*]\s+/.test(line);
    const previous = output[output.length - 1];

    if (
      !bullet &&
      previous?.bullet &&
      !isResumeSectionHeading(line) &&
      !/\b(?:19|20)\d{2}\b/.test(line)
    ) {
      previous.text += " " + line;
    } else {
      output.push({
        text: line.replace(/^[-•●▪◦*]\s+/, "").trim(),
        bullet
      });
    }
  }

  return output.map((item) => item.text);
}

function extractEvidence(resumeText, matchedKeywords) {
  const lines = mergeBulletContinuations(resumeText)
    .filter((line) => line.length >= 30 && line.length <= 650);

  const scored = [];
  for (const line of lines) {
    const matches = matchedKeywords.filter((keyword) => hasPhrase(line, keyword));
    if (matches.length) scored.push({ text: line, count: matches.length });
  }

  const selected = scored
    .sort((a, b) => b.count - a.count)
    .map((item) => item.text);

  // Do not leave the evidence panel empty just because the job description
  // uses wording that is absent from the resume's documented achievements.
  for (const line of lines) {
    if (selected.length >= 8) break;
    if (!ACTION_VERBS.test(line)) continue;
    if (!selected.some((item) => normalize(item) === normalize(line))) selected.push(line);
  }

  return selected.slice(0, 8);
}

function classifyJobKeywords(jobDescription, keywords) {
  const required = new Set();
  const preferred = new Set();
  let mode = "general";

  for (const rawLine of String(jobDescription).split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    if (REQUIRED_CONTEXT.test(line)) mode = "required";
    else if (PREFERRED_CONTEXT.test(line)) mode = "preferred";
    else if (/^(responsibilities|what you.ll do|about the role|role overview)\b/i.test(line)) {
      mode = "general";
    }

    for (const keyword of keywords) {
      const aliases = KEYWORD_GROUPS[keyword] || [keyword];
      if (!aliases.some((alias) => hasPhrase(line, alias))) continue;
      if (mode === "required") required.add(keyword);
      if (mode === "preferred") preferred.add(keyword);
    }
  }

  for (const keyword of preferred) required.delete(keyword);
  return { required: [...required], preferred: [...preferred] };
}

function sourceSummary(resumeText) {
  const lines = String(resumeText).split(/\r?\n/);
  const index = lines.findIndex((line) =>
    /^(professional )?(summary|profile|career objective|objective)$/i.test(line.trim())
  );
  if (index < 0) return "";

  const content = [];
  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    const line = lines[cursor].trim();
    if (isResumeSectionHeading(line)) break;
    if (line) content.push(line.replace(/^[-•●▪◦*]\s+/, ""));
  }
  const summary = content.join(" ").trim();
  if (
    /candidate targeting .+ add a concise summary of relevant experience/i.test(summary) ||
    /add one specific, verifiable achievement/i.test(summary)
  ) return "";
  return summary;
}

function conciseEvidence(line, maximum = 210) {
  let text = String(line || "").replace(/^[-•●▪◦*]\s+/, "").replace(/\s+/g, " ").trim();
  if (text.length > maximum) {
    const cut = text.lastIndexOf(" ", maximum);
    text = text.slice(0, cut > maximum * 0.65 ? cut : maximum).replace(/[,:;.!? -]+$/, "") + "...";
  }
  if (text && !/[.!?]$/.test(text)) text += ".";
  return text;
}

const ACTION_VERBS = /\b(?:improved|optimized|optimised|built|developed|created|implemented|designed|architected|deployed|automated|integrated|delivered|launched|maintained|reduced|increased|streamlined|configured|managed|led|assisted)\b/i;

function extractActionEvidence(resumeText) {
  return mergeBulletContinuations(resumeText)
    .filter((line) => line.length >= 45 && line.length <= 520 && ACTION_VERBS.test(line))
    .slice(0, 3);
}

function buildSummaryDraft(targetRole, matchedKeywords, resumeSkills, evidence, resumeText) {
  const original = sourceSummary(resumeText);
  const roleSkills = matchedKeywords.filter((keyword) => keyword !== "Software Development").slice(0, 5);
  const documentedSkills = resumeSkills.slice(0, 8);
  const proof = [...extractActionEvidence(resumeText), ...evidence]
    .filter((line, index, all) => all.findIndex((item) => normalize(item) === normalize(line)) === index)
    .slice(0, 2)
    .map((line) => conciseEvidence(line));

  const softwareEngineeringGraduate =
    /\b(?:BSc|B\.Sc|Bachelor(?:'s)?\s+(?:of|in))\s+Software Engineering\b/i.test(resumeText);

  if (!original && !softwareEngineeringGraduate && !documentedSkills.length && !proof.length) return "";

  const parts = [];
  if (original) parts.push(conciseEvidence(original, 300));
  else if (softwareEngineeringGraduate) {
    parts.push("Software Engineering graduate with hands-on experience in web development, automation and full-stack project delivery.");
  } else if (proof.length) parts.push(proof.shift());

  if (roleSkills.length) {
    parts.push("For the " + targetRole + " role, the resume documents relevant skills in " + roleSkills.join(", ") + ".");
  } else if (documentedSkills.length) {
    parts.push("Technical skills listed in the resume include " + documentedSkills.join(", ") + ".");
  }

  parts.push(...proof.filter((item) => !parts.some((part) => part.includes(item))));
  return [...new Set(parts)].join(" ");
}
const RESUME_SECTION_HEADINGS = {
  skills: [
    "skills", "skills and awards", "technical skills", "key skills", "core skills",
    "core competencies", "areas of expertise", "technologies", "technical proficiencies"
  ],
  experience: [
    "experience", "work experience", "professional experience", "employment history",
    "career history", "work history", "internship experience"
  ],
  projects: ["projects", "selected projects", "academic projects", "personal projects", "key projects"],
  education: ["education", "educational background", "academic background", "academic qualifications"],
  certifications: ["certifications", "certificates", "licenses", "licences", "training", "courses", "professional development"],
  achievements: ["achievements", "awards", "honours", "honors", "accomplishments"],
  languages: ["languages", "language skills"]
};

function extractResumeSectionLines(resumeText, targetSection) {
  const lines = [];
  let active = false;

  for (const rawLine of String(resumeText || "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const heading = normalize(line.replace(/^#+\s*/, "").replace(/[:：]\s*$/, ""));
    const matchedSection = Object.entries(RESUME_SECTION_HEADINGS)
      .find(([, aliases]) => aliases.includes(heading))?.[0];

    if (matchedSection) {
      active = matchedSection === targetSection;
      continue;
    }

    if (!active) continue;

    if (targetSection === "skills") {
      const nextLabel = line.search(/\b(?:Languages|Certifications|Awards)\s*:/i);
      const skillsLine = nextLabel >= 0 ? line.slice(0, nextLabel) : line;
      const cleaned = skillsLine.replace(/^Technical Skills\s*:\s*/i, "").trim();
      if (cleaned) lines.push(cleaned);
      if (nextLabel >= 0) break;
    } else {
      lines.push(line);
    }
  }

  return lines;
}

function isResumeBulletLine(line) {
  return /^(?:[-–—•●▪◦*]|\d+[.)])\s+/.test(String(line || "").trim());
}

function selectSectionBullets(resumeText, section, matchedKeywords, limit = 4) {
  const lines = extractResumeSectionLines(resumeText, section)
    .map((line) => line.trim())
    .filter((line) => line.length >= 35 && line.length <= 650)
    .filter((line) => isResumeBulletLine(line) || ACTION_VERBS.test(line))
    .map((line) => line.replace(/^(?:[-–—•●▪◦*]|\d+[.)])\s+/, "").trim());

  const scored = lines.map((text) => ({
    text,
    score: matchedKeywords.filter((keyword) => hasPhrase(text, keyword)).length
  }));

  const relevant = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.text);

  const selected = [...relevant];
  for (const item of scored) {
    if (selected.length >= limit) break;
    if (!selected.some((line) => normalize(line) === normalize(item.text))) {
      selected.push(item.text);
    }
  }

  return selected.slice(0, limit);
}

const KEYWORD_BULLET_TEMPLATES = {
  "Code Quality": "Wrote clean, efficient, maintainable code for [project/component] by applying [specific practices you used], resulting in [verified improvement].",
  "Continuous Learning": "Stayed up to date with [relevant tools or technologies] and applied [specific learning] to [project/task], helping achieve [verified outcome].",
  Collaboration: "Collaborated with [team/stakeholders] to design and deliver [feature/project], contributing [your specific contribution] to [verified result].",
  Communication: "Communicated [technical updates/requirements] to [team/stakeholders] through [method], helping [verified outcome].",
  "Problem Solving": "Investigated and solved [specific technical challenge] in [project/system] using [approach/tools], achieving [verified result].",
  Debugging: "Debugged [application/component] by tracing [specific defect] and implementing [fix], then verified the result with [test/check].",
  Troubleshooting: "Troubleshot [application/system issue] by [diagnostic steps] and applied [fix], restoring [expected behaviour/result].",
  Testing: "Tested [feature/API] using [unit, integration or manual] testing to verify [expected behaviour] and identify [actual issue].",
  "Software Testing": "Performed software testing on [feature/application] using [test approach], documented [actual findings], and verified [result].",
  "Quality Assurance": "Supported quality assurance for [application/feature] by [specific checks or test process], helping ensure [verified outcome].",
  Agile: "Contributed to an Agile delivery process by [planning, prioritising or reviewing specific work] with [team], completing [verified outcome].",
  Scrum: "Participated in Scrum activities such as [specific ceremony] and coordinated [your task] to support [sprint deliverable].",
  "Project Management": "Coordinated [project/workstream] by tracking [tasks, milestones or risks] and delivering [verified outcome] within [actual timeframe].",
  Leadership: "Led [specific task or workstream] by coordinating [people or activities] and achieving [verified outcome].",
  "Technical Documentation": "Created or updated technical documentation for [system/API/process], covering [specific details] to support [actual users or team].",
  "API Integration": "Integrated [specific API/service] with [application/component] using [actual tools or approach], enabling [verified functionality].",
  "REST APIs": "Developed or integrated REST APIs for [application/feature] using [actual framework], supporting [specific endpoints or functionality].",
  "Requirements Analysis": "Analysed [stakeholder/user] requirements for [project/feature] and translated them into [specific technical or functional deliverables].",
  "Time Management": "Prioritised [tasks or deliverables] across [project/timeframe] to meet [actual deadline or milestone].",
  "Attention to Detail": "Reviewed [code, data, configuration or deliverable] for [specific checks], identifying [actual issue] before [release/submission].",
  "Responsive Design": "Implemented responsive design for [website/application] across [actual screen sizes/devices], improving [verified user experience outcome].",
  "UI/UX": "Improved the UI/UX of [application/feature] by [specific design or usability change], resulting in [verified outcome].",
  "Data Analysis": "Analysed [dataset/usage data] using [actual tool or method] to identify [finding] and inform [decision/action].",
  "Customer Service": "Supported [customers/users] by resolving [actual request or issue] through [channel/process], achieving [verified outcome].",
  "Technical Support": "Provided technical support for [system/product] by diagnosing [issue type] and documenting [resolution].",
  "Security Operations": "Supported security operations by [specific monitoring or response task] using [actual tools], documenting [verified result].",
  "Incident Response": "Responded to [type of incident] by following [actual response steps] and documenting [actions and outcome].",
  "Risk Assessment": "Assessed [system/process] for [specific risks] and documented [mitigation or recommendation] based on [actual assessment].",
  "Vulnerability Assessment": "Assessed [application/system] for vulnerabilities using [actual tools or method] and documented [verified findings].",
  "Penetration Testing": "Performed authorised penetration testing on [lab/system in scope] using [actual tools], documenting [verified findings and remediation].",
  "Network Security": "Applied network security practices to [network/lab/system] by [specific control or configuration], helping address [verified risk].",
  Cybersecurity: "Applied cybersecurity concepts to [project/lab] by [specific security task], documenting [verified outcome or finding].",
  "Cloud Security": "Applied cloud security controls to [cloud service/environment] by [actual configuration or review], addressing [verified risk].",
  "Application Security": "Reviewed [application/component] for application security issues using [actual method], documenting [verified finding or fix].",
  "API Security": "Applied API security checks to [API/service] by reviewing [actual control], addressing [verified finding].",
  "Machine Learning": "Built or evaluated a machine learning model for [task] using [actual framework/data], measuring performance with [actual metric].",
  Docker: "Used Docker to package and run [application/service] in a consistent environment, configuring [actual containers or services] for [verified purpose].",
  Kubernetes: "Used Kubernetes to deploy or manage [workload/service] in [environment], configuring [actual resources] to support [verified outcome].",
  AWS: "Used AWS [specific service] to [actual task] for [application/project], supporting [verified outcome].",
  Azure: "Used Microsoft Azure [specific service] to [actual task] for [application/project], supporting [verified outcome].",
  "Google Cloud": "Used Google Cloud [specific service] to [actual task] for [application/project], supporting [verified outcome].",
  Git: "Used Git for version control on [project/repository], managing [branches/commits/merges] to support [actual collaboration or release workflow].",
  Linux: "Used Linux to [configure, administer or troubleshoot] [environment/system], completing [specific task] for [project].",
  SQL: "Wrote SQL queries to [retrieve, update or analyse] [data] for [application/report], supporting [verified result].",
  PostgreSQL: "Used PostgreSQL to store and query [application data], implementing [actual schema/query/task] for [project].",
  MongoDB: "Used MongoDB to model and query [application data] for [project/feature], implementing [actual collections or operations].",
  Python: "Used Python to build [script/tool/feature] for [project/task], automating or supporting [verified outcome].",
  JavaScript: "Used JavaScript to implement [feature/functionality] in [application], integrating [actual tools/APIs] to achieve [verified result].",
  TypeScript: "Used TypeScript to implement [feature/component] in [application], applying [actual types/interfaces] to support [verified result].",
  React: "Built [UI/component/feature] with React for [application], implementing [specific functionality] for [verified users or outcome].",
  "React Native": "Built [mobile screen/feature] with React Native for [application], integrating [actual service/API] to support [functionality].",
  "Node.js": "Used Node.js to develop [API/service/backend feature] for [application], implementing [actual routes/integrations] to support [functionality].",
  "Express.js": "Built [API/service] with Express.js for [application], implementing [actual routes/middleware/integrations] for [functionality].",
  Java: "Used Java to implement [component/feature] for [application], applying [actual libraries or frameworks] to support [functionality].",
  HTML: "Structured [page/component] with HTML for [application], implementing [specific semantic or accessibility features].",
  CSS: "Styled [page/component] with CSS to achieve [responsive/layout/interaction requirement] across [actual devices or viewports].",
  "CI/CD": "Configured or maintained a CI/CD workflow for [project] using [actual platform], automating [build/test/deployment step]."
};

function buildKeywordBulletDraft(keyword) {
  return KEYWORD_BULLET_TEMPLATES[keyword] ||
    `Applied ${keyword} to [specific task or responsibility] in [project/system], using [actual tools or approach] to achieve [verified outcome].`;
}

function buildKeywordBulletDrafts(missingKeywords, missingRequired = [], missingPreferred = [], limit = 8) {
  const ordered = [
    ...missingRequired,
    ...missingKeywords.filter((keyword) => !missingRequired.includes(keyword) && !missingPreferred.includes(keyword)),
    ...missingPreferred
  ];
  const unique = [...new Set(ordered)].slice(0, limit);

  return unique.map((keyword) => ({
    keyword,
    priority: missingRequired.includes(keyword) ? "Required" :
      missingPreferred.includes(keyword) ? "Preferred" : "Mentioned",
    text: buildKeywordBulletDraft(keyword),
    requiresVerification: true
  }));
}

function buildSuggestedEdits({ resumeText, resumeSkills, matchedKeywords, missingKeywords, missingRequired, missingPreferred, summaryDraft }) {
  const skillsText = [...new Set([
    ...matchedKeywords.filter((keyword) =>
      resumeSkills.includes(keyword) &&
      !["Software Development", "Bachelor's Degree", "Master's Degree"].includes(keyword)
    ),
    ...resumeSkills.filter((keyword) =>
      !["Software Development", "Bachelor's Degree", "Master's Degree"].includes(keyword)
    )
  ])].slice(0, 18).join(", ");

  return {
    summary: summaryDraft,
    skillsText,
    experienceBullets: selectSectionBullets(resumeText, "experience", matchedKeywords, 4),
    projectBullets: selectSectionBullets(resumeText, "projects", matchedKeywords, 4),
    keywordBulletDrafts: buildKeywordBulletDrafts(missingKeywords, missingRequired, missingPreferred),
    termsToVerify: missingKeywords
  };
}

export function analyzeResume({ resumeText, jobDescription, jobTitle = "" }) {
  const targetRole = jobTitle.trim() ||
    jobDescription.split(/\r?\n/).map((line) => line.trim()).find((line) => line.length > 4 && line.length < 90) ||
    "Target role";

  const jobKeywords = extractKeywords([jobTitle, jobDescription].filter(Boolean).join("\n"));
  const resumeKeywords = extractKeywords(resumeText);
  const resumeSkills = resumeKeywords.filter((keyword) =>
    !["Software Development", "Bachelor's Degree", "Master's Degree"].includes(keyword)
  );
  const matchedKeywords = jobKeywords.filter((keyword) => resumeKeywords.includes(keyword));
  const missingKeywords = jobKeywords.filter((keyword) => !resumeKeywords.includes(keyword));
  const classified = classifyJobKeywords(jobDescription, jobKeywords);

  const matchedRequired = classified.required.filter((keyword) => matchedKeywords.includes(keyword));
  const missingRequired = classified.required.filter((keyword) => missingKeywords.includes(keyword));
  const matchedPreferred = classified.preferred.filter((keyword) => matchedKeywords.includes(keyword));
  const missingPreferred = classified.preferred.filter((keyword) => missingKeywords.includes(keyword));
  const evidence = extractEvidence(resumeText, matchedKeywords);
  const summaryDraft = buildSummaryDraft(targetRole, matchedKeywords, resumeSkills, evidence, resumeText);
  const suggestedEdits = buildSuggestedEdits({
    resumeText,
    resumeSkills,
    matchedKeywords,
    missingKeywords,
    missingRequired,
    missingPreferred,
    summaryDraft
  });

  const score = jobKeywords.length
    ? Math.round((matchedKeywords.length / jobKeywords.length) * 100)
    : null;

  return {
    targetRole,
    score,
    scoreLabel: score === null ? "Not enough recognised keywords" : "Keyword alignment estimate",
    jobKeywordCount: jobKeywords.length,
    resumeKeywordCount: resumeSkills.length,
    resumeSkills,
    matchedKeywords,
    resumeKeywords,
    missingKeywords,
    requiredKeywords: classified.required,
    matchedRequired,
    missingRequired,
    matchedPreferred,
    missingPreferred,
    evidence,
    summaryDraft,
    suggestedEdits,
    notes: [
      "This is a keyword-alignment estimate, not a score from a specific applicant tracking system.",
      "A missing keyword is not proof that you lack the skill. Add it only if you genuinely have that experience.",
      "The generated summary and selected evidence come from your existing resume. Check every detail before using the draft."
    ]
  };
}
