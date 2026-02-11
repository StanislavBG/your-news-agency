import { db } from "./db";
import { eq } from "drizzle-orm";
import {
  regions, topics, topicRegions, sources, articles, claims,
  viewpoints, scenarios, timelineEvents, stakeholders, watchSignals,
} from "@shared/schema";

export async function seedDatabase() {
  // Check if already seeded - wrap in try/catch in case tables don't exist yet
  try {
    const existingTopics = await db.select().from(topics);
    if (existingTopics.length > 0) {
      console.log("Database already seeded, skipping.");
      return;
    }
  } catch (err: any) {
    // Table may not exist yet (db:push hasn't run) - the inserts below will also fail
    console.warn("Could not check existing topics (tables may not exist yet):", err?.message);
    throw err;
  }

  console.log("Seeding database with news data...");

  // ── Regions ────────────────────────────────────────────
  const regionData = [
    { slug: "north-america", name: "North America", description: "United States, Canada, Mexico" },
    { slug: "europe", name: "Europe", description: "European Union member states and UK" },
    { slug: "east-asia", name: "East Asia", description: "China, Japan, South Korea, Taiwan" },
    { slug: "middle-east", name: "Middle East", description: "Israel, Palestine, Iran, Saudi Arabia, Gulf States" },
    { slug: "south-asia", name: "South Asia", description: "India, Pakistan, Bangladesh, Sri Lanka" },
    { slug: "africa", name: "Africa", description: "African Union member states" },
    { slug: "latin-america", name: "Latin America", description: "Central and South America, Caribbean" },
    { slug: "southeast-asia", name: "Southeast Asia", description: "ASEAN member states" },
    { slug: "central-asia", name: "Central Asia", description: "Kazakhstan, Uzbekistan, and neighboring states" },
    { slug: "oceania", name: "Oceania", description: "Australia, New Zealand, Pacific Islands" },
  ];
  const insertedRegions = await db.insert(regions).values(regionData).returning();
  const regionMap = Object.fromEntries(insertedRegions.map(r => [r.slug, r.id]));

  // ── Sources ────────────────────────────────────────────
  const sourceData = [
    { name: "Reuters", url: "https://reuters.com", reliability: 0.92 },
    { name: "Associated Press", url: "https://apnews.com", reliability: 0.91 },
    { name: "BBC News", url: "https://bbc.com/news", reliability: 0.88 },
    { name: "The New York Times", url: "https://nytimes.com", reliability: 0.85 },
    { name: "The Guardian", url: "https://theguardian.com", reliability: 0.84 },
    { name: "Al Jazeera", url: "https://aljazeera.com", reliability: 0.80 },
    { name: "South China Morning Post", url: "https://scmp.com", reliability: 0.79 },
    { name: "Financial Times", url: "https://ft.com", reliability: 0.90 },
    { name: "The Economist", url: "https://economist.com", reliability: 0.89 },
    { name: "Nikkei Asia", url: "https://asia.nikkei.com", reliability: 0.85 },
    { name: "Deutsche Welle", url: "https://dw.com", reliability: 0.83 },
    { name: "France 24", url: "https://france24.com", reliability: 0.82 },
  ];
  const insertedSources = await db.insert(sources).values(sourceData).returning();
  const srcMap = Object.fromEntries(insertedSources.map(s => [s.name, s.id]));

  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  // ══════════════════════════════════════════════════════════
  // TOPIC 1: US-China Semiconductor Tensions
  // ══════════════════════════════════════════════════════════
  const [topic1] = await db.insert(topics).values({
    slug: "us-china-semiconductor-tensions",
    title: "US-China Semiconductor Export Controls Escalation",
    description: "The US has expanded semiconductor export restrictions to China, triggering retaliatory measures and reshaping global chip supply chains. The dispute extends beyond trade into national security and technological sovereignty.",
    coreQuestion: "Can the US effectively contain China's semiconductor advancement without fragmenting the global technology ecosystem, and what are the costs of trying?",
    category: "Technology & Trade",
  }).returning();

  await db.insert(topicRegions).values([
    { topicId: topic1.id, regionId: regionMap["north-america"] },
    { topicId: topic1.id, regionId: regionMap["east-asia"] },
    { topicId: topic1.id, regionId: regionMap["europe"] },
  ]);

  const t1Articles = await db.insert(articles).values([
    { sourceId: srcMap["Reuters"], topicId: topic1.id, title: "US announces expanded chip export controls targeting China's AI sector", url: "#", summary: "The Commerce Department unveiled new restrictions on semiconductor exports to China, extending controls to advanced AI training chips and chipmaking equipment.", publishedAt: hoursAgo(3), isRecent: true },
    { sourceId: srcMap["Financial Times"], topicId: topic1.id, title: "China accelerates domestic chip production amid US restrictions", url: "#", summary: "Chinese semiconductor firms are ramping up investment in mature-node chip production, with SMIC expanding capacity despite limited access to extreme ultraviolet lithography.", publishedAt: hoursAgo(6), isRecent: true },
    { sourceId: srcMap["South China Morning Post"], topicId: topic1.id, title: "Beijing retaliates with rare earth export controls on gallium and germanium", url: "#", summary: "China's Ministry of Commerce announced export permit requirements for critical minerals used in semiconductor manufacturing, affecting global chipmakers.", publishedAt: hoursAgo(8), isRecent: true },
    { sourceId: srcMap["The New York Times"], topicId: topic1.id, title: "European chipmakers caught between US pressure and China market access", url: "#", summary: "ASML and other European semiconductor equipment makers face pressure to comply with US restrictions while managing significant China revenue exposure.", publishedAt: hoursAgo(10), isRecent: true },
    { sourceId: srcMap["Nikkei Asia"], topicId: topic1.id, title: "Japan and South Korea align semiconductor policies with Washington", url: "#", summary: "Tokyo and Seoul have signaled readiness to implement parallel export restrictions, consolidating a trilateral approach to technology controls.", publishedAt: hoursAgo(14), isRecent: true },
    { sourceId: srcMap["The Economist"], topicId: topic1.id, title: "The semiconductor cold war: costs of decoupling", url: "#", summary: "Analysis suggests technology bifurcation could cost the global economy $1.5 trillion over the next decade, with both blocs developing less efficient parallel supply chains.", publishedAt: hoursAgo(20), isRecent: true },
    { sourceId: srcMap["BBC News"], topicId: topic1.id, title: "Chip shortage fears return as trade tensions escalate", url: "#", summary: "Industry analysts warn that tit-for-tat restrictions could trigger new supply chain disruptions, particularly in automotive and consumer electronics sectors.", publishedAt: daysAgo(1), isRecent: false },
  ]).returning();

  const t1Claims = await db.insert(claims).values([
    { topicId: topic1.id, statement: "The US Commerce Department expanded export controls to cover advanced AI training chips with processing power above 300 TOPS, effective within 90 days.", category: "what_happened", articleIds: [t1Articles[0].id], isConflicting: false },
    { topicId: topic1.id, statement: "China announced export permit requirements for gallium, germanium, and antimony—critical materials for semiconductor manufacturing—in direct response to US restrictions.", category: "what_happened", articleIds: [t1Articles[2].id], isConflicting: false },
    { topicId: topic1.id, statement: "SMIC has expanded production capacity for 28nm and 14nm chips by 40% year-over-year, focusing on mature nodes that don't require EUV lithography.", category: "what_changed", articleIds: [t1Articles[1].id], isConflicting: false },
    { topicId: topic1.id, statement: "Japan and South Korea are implementing parallel semiconductor export restrictions, creating a coordinated trilateral technology control regime.", category: "what_happened", articleIds: [t1Articles[4].id], isConflicting: false },
    { topicId: topic1.id, statement: "The global cost of semiconductor supply chain bifurcation is estimated at $1.5 trillion over the next decade.", category: "what_changed", articleIds: [t1Articles[5].id], isConflicting: true },
    { topicId: topic1.id, statement: "Chinese industry sources claim the economic impact will be far lower, around $400 billion, as domestic substitution accelerates.", category: "what_changed", articleIds: [t1Articles[1].id, t1Articles[2].id], isConflicting: true },
    { topicId: topic1.id, statement: "ASML reported that 27% of its 2025 revenue came from China-based customers, creating significant compliance pressure from US policy.", category: "who_said", articleIds: [t1Articles[3].id], isConflicting: false },
    { topicId: topic1.id, statement: "Industry analysts expect renewed chip shortages in automotive and consumer electronics if retaliatory restrictions escalate further.", category: "likely_next", articleIds: [t1Articles[6].id], isConflicting: false },
  ]).returning();

  // Link conflicting claims: $1.5T estimate <-> $400B estimate
  await db.update(claims).set({ conflictingClaimId: t1Claims[5].id }).where(eq(claims.id, t1Claims[4].id));
  await db.update(claims).set({ conflictingClaimId: t1Claims[4].id }).where(eq(claims.id, t1Claims[5].id));

  await db.insert(viewpoints).values([
    { topicId: topic1.id, groupName: "US National Security Hawks", position: "Export controls are essential to prevent China from achieving military AI superiority", arguments: ["Advanced chips directly enable military AI systems and autonomous weapons", "Historical precedent shows technology transfers to strategic competitors create long-term security risks", "Short-term economic costs are justified by preserving technological advantage", "Allied coordination makes controls more effective and distributes economic burden"], incentives: "Maintain US technological and military superiority; prevent strategic competitor advancement", constraints: "US semiconductor industry lobbying; allied cooperation required; risk of accelerating China's self-sufficiency", articleIds: [t1Articles[0].id, t1Articles[4].id] },
    { topicId: topic1.id, groupName: "Chinese Government & Industry", position: "Export controls are protectionist measures that violate free trade and will backfire", arguments: ["Restrictions violate WTO principles and established trade norms", "China's domestic chip industry is advancing rapidly and will achieve self-sufficiency", "Rare earth countermeasures demonstrate China's leverage in the supply chain", "Technology bifurcation harms innovation globally and raises costs for all consumers"], incentives: "Achieve semiconductor self-sufficiency; maintain access to global technology markets; demonstrate geopolitical leverage", constraints: "Current dependence on Western chip equipment; EUV lithography gap; talent pipeline challenges", articleIds: [t1Articles[1].id, t1Articles[2].id] },
    { topicId: topic1.id, groupName: "European & Allied Industry", position: "Caught between compliance requirements and commercial reality", arguments: ["European firms face significant revenue losses from China market restrictions", "Technology controls must be balanced with commercial competitiveness", "Unilateral US action without full allied coordination creates uneven playing fields", "Industry needs clear rules and transition periods, not policy uncertainty"], incentives: "Maintain market access in both US and China; protect competitive position; ensure predictable regulatory environment", constraints: "US compliance requirements; China revenue dependence; difficulty replacing China market revenue elsewhere", articleIds: [t1Articles[3].id, t1Articles[4].id] },
    { topicId: topic1.id, groupName: "Global Technology Economists", position: "Decoupling imposes massive costs with uncertain strategic benefits", arguments: ["Parallel supply chains are inherently less efficient, raising costs for everyone", "$1.5 trillion estimated cost exceeds any plausible security benefit", "History shows technology controls slow but rarely prevent determined state programs", "Innovation thrives on open collaboration; bifurcation reduces the pace of progress"], incentives: "Efficient global markets; continued innovation pace; evidence-based policy", constraints: "National security concerns are legitimate; political dynamics make de-escalation difficult", articleIds: [t1Articles[5].id, t1Articles[6].id] },
  ]);

  await db.insert(stakeholders).values([
    { topicId: topic1.id, name: "US Commerce Department (BIS)", role: "Primary regulator implementing export controls", description: "The Bureau of Industry and Security designs and enforces semiconductor export restrictions, balancing national security goals with industry concerns.", articleIds: [t1Articles[0].id] },
    { topicId: topic1.id, name: "SMIC (Semiconductor Manufacturing International Corp)", role: "China's largest chip foundry", description: "Leading China's effort to build domestic semiconductor capacity, currently focused on mature nodes.", articleIds: [t1Articles[1].id] },
    { topicId: topic1.id, name: "ASML", role: "Sole global producer of EUV lithography machines", description: "Dutch company whose equipment is critical for advanced chip manufacturing; caught between US restrictions and China market.", articleIds: [t1Articles[3].id] },
    { topicId: topic1.id, name: "NVIDIA", role: "Leading AI chip designer", description: "Has developed China-specific chip variants to comply with export controls while preserving market access.", articleIds: [t1Articles[0].id, t1Articles[5].id] },
    { topicId: topic1.id, name: "China Ministry of Commerce", role: "Implementing retaliatory trade measures", description: "Announced rare earth export controls as countermeasure to US semiconductor restrictions.", articleIds: [t1Articles[2].id] },
  ]);

  await db.insert(scenarios).values([
    { topicId: topic1.id, title: "Managed Escalation", description: "Both sides continue incremental tit-for-tat restrictions while maintaining backchannels. Chip industry adjusts through workarounds and geographic diversification. Costs are significant but distributed over years.", likelihood: "high", triggers: "Continued domestic political pressure on both sides; successful allied coordination; industry adaptation", implications: "Gradual supply chain restructuring; 15-25% cost increases for affected chips; accelerated investment in chip fabs in US, EU, Japan", articleIds: [t1Articles[0].id, t1Articles[4].id, t1Articles[5].id] },
    { topicId: topic1.id, title: "Full Technological Decoupling", description: "Restrictions expand to cover all semiconductor technology. China achieves partial self-sufficiency in mature nodes but falls further behind in advanced chips. Global tech splits into two ecosystems.", likelihood: "medium", triggers: "Major geopolitical crisis (e.g., Taiwan Strait tensions); domestic political shifts in US; China breakthrough in domestic EUV", implications: "Severe short-term disruption; $1.5T+ economic cost; two incompatible technology standards; innovation slowdown in both blocs", articleIds: [t1Articles[5].id, t1Articles[6].id] },
    { topicId: topic1.id, title: "Negotiated Framework", description: "US and China reach an agreement on semiconductor trade guardrails, establishing categories of restricted vs. permitted technology transfer with verification mechanisms.", likelihood: "low", triggers: "Change in US administration priorities; Chinese concessions on IP protection; mutual economic pain creating negotiation pressure", implications: "Partial restoration of trade flows; industry stability; new international technology governance norms", articleIds: [t1Articles[3].id, t1Articles[5].id] },
  ]);

  await db.insert(timelineEvents).values([
    { topicId: topic1.id, eventDate: daysAgo(730), description: "US passes CHIPS Act, allocating $52 billion for domestic semiconductor manufacturing", significance: "high", isRecent: false },
    { topicId: topic1.id, eventDate: daysAgo(540), description: "First round of US export controls targets advanced chips and chipmaking equipment", significance: "high", isRecent: false },
    { topicId: topic1.id, eventDate: daysAgo(365), description: "China restricts export of gallium and germanium for the first time", significance: "medium", isRecent: false },
    { topicId: topic1.id, eventDate: daysAgo(180), description: "NVIDIA releases China-specific H20 chip variant designed to comply with export limits", significance: "medium", isRecent: false },
    { topicId: topic1.id, eventDate: daysAgo(30), description: "Japan and Netherlands agree to align with US export controls", significance: "high", isRecent: false },
    { topicId: topic1.id, eventDate: hoursAgo(8), description: "China announces expanded rare earth export permit requirements", significance: "high", isRecent: true, articleId: t1Articles[2].id },
    { topicId: topic1.id, eventDate: hoursAgo(3), description: "US Commerce Department announces expanded AI chip export controls", significance: "high", isRecent: true, articleId: t1Articles[0].id },
  ]);

  await db.insert(watchSignals).values([
    { topicId: topic1.id, signal: "ASML quarterly revenue breakdown by region", implication: "Declining China share indicates effective controls; stable share suggests workarounds", articleIds: [t1Articles[3].id] },
    { topicId: topic1.id, signal: "SMIC production yield rates at 7nm and below", implication: "Improving yields would signal China is closing the technology gap faster than expected", articleIds: [t1Articles[1].id] },
    { topicId: topic1.id, signal: "Additional allied countries joining export control coordination", implication: "Broader coalition makes controls more effective; holdouts create leakage paths", articleIds: [t1Articles[4].id] },
    { topicId: topic1.id, signal: "Rare earth price movements for gallium and germanium", implication: "Price spikes indicate effective Chinese countermeasures affecting Western supply chains", articleIds: [t1Articles[2].id] },
  ]);

  // ══════════════════════════════════════════════════════════
  // TOPIC 2: EU AI Regulation Implementation
  // ══════════════════════════════════════════════════════════
  const [topic2] = await db.insert(topics).values({
    slug: "eu-ai-act-implementation",
    title: "EU AI Act Implementation and Global Regulatory Ripple Effects",
    description: "The European Union's AI Act is entering its enforcement phase, creating compliance challenges for global tech companies and sparking debate over whether regulation will protect citizens or stifle innovation.",
    coreQuestion: "Will the EU's risk-based approach to AI regulation become the global standard, and can it balance safety with competitiveness?",
    category: "Technology & Policy",
  }).returning();

  await db.insert(topicRegions).values([
    { topicId: topic2.id, regionId: regionMap["europe"] },
    { topicId: topic2.id, regionId: regionMap["north-america"] },
  ]);

  const t2Articles = await db.insert(articles).values([
    { sourceId: srcMap["Financial Times"], topicId: topic2.id, title: "EU AI Act enforcement begins: first compliance deadlines hit", url: "#", summary: "Companies operating in the EU face the first wave of AI Act compliance requirements, with banned AI practices now officially prohibited.", publishedAt: hoursAgo(4), isRecent: true },
    { sourceId: srcMap["The Guardian"], topicId: topic2.id, title: "Tech startups warn EU AI rules could push innovation to US and Asia", url: "#", summary: "European AI startups report increased costs and regulatory uncertainty, with some considering relocating operations outside the EU.", publishedAt: hoursAgo(9), isRecent: true },
    { sourceId: srcMap["Reuters"], topicId: topic2.id, title: "Major US tech firms establish EU AI compliance teams", url: "#", summary: "Google, Microsoft, and Meta are building dedicated European AI compliance operations, signaling acceptance of the regulatory framework.", publishedAt: hoursAgo(12), isRecent: true },
    { sourceId: srcMap["Deutsche Welle"], topicId: topic2.id, title: "Germany pushes for innovation-friendly AI Act interpretation", url: "#", summary: "Berlin is lobbying for regulatory sandboxes and lighter compliance requirements for SMEs within the AI Act framework.", publishedAt: hoursAgo(16), isRecent: true },
    { sourceId: srcMap["BBC News"], topicId: topic2.id, title: "AI safety advocates praise EU approach as global template", url: "#", summary: "Civil society organizations argue the risk-based framework provides a model for protecting citizens while allowing beneficial AI development.", publishedAt: hoursAgo(22), isRecent: true },
    { sourceId: srcMap["The Economist"], topicId: topic2.id, title: "The Brussels Effect: will EU AI rules reshape global standards?", url: "#", summary: "Analysis of how EU regulation historically influences global standards and whether the AI Act will follow the same pattern as GDPR.", publishedAt: daysAgo(1), isRecent: false },
  ]).returning();

  const t2Claims = await db.insert(claims).values([
    { topicId: topic2.id, statement: "The first compliance deadline of the EU AI Act has taken effect, banning AI systems that use subliminal manipulation, social scoring, and real-time remote biometric identification in public spaces.", category: "what_happened", articleIds: [t2Articles[0].id], isConflicting: false },
    { topicId: topic2.id, statement: "A survey of 200 European AI startups found 67% report increased compliance costs, with 12% actively exploring relocation outside the EU.", category: "what_changed", articleIds: [t2Articles[1].id], isConflicting: true },
    { topicId: topic2.id, statement: "EU Commission officials dispute the relocation risk, citing data showing AI investment in Europe increased 18% year-over-year despite the regulation.", category: "what_changed", articleIds: [t2Articles[3].id], isConflicting: true },
    { topicId: topic2.id, statement: "Google, Microsoft, and Meta have each established EU AI compliance teams of 50+ employees to manage AI Act requirements.", category: "who_said", articleIds: [t2Articles[2].id], isConflicting: false },
    { topicId: topic2.id, statement: "Germany is proposing regulatory sandboxes that would allow companies to test high-risk AI systems under relaxed compliance for up to 24 months.", category: "what_changed", articleIds: [t2Articles[3].id], isConflicting: false },
    { topicId: topic2.id, statement: "Civil society groups including Access Now and AlgorithmWatch called the AI Act 'the most important technology regulation since GDPR' and urged strict enforcement.", category: "who_said", articleIds: [t2Articles[4].id], isConflicting: false },
  ]).returning();

  // Link conflicting claims: startup relocation risk <-> EU Commission disputes
  await db.update(claims).set({ conflictingClaimId: t2Claims[2].id }).where(eq(claims.id, t2Claims[1].id));
  await db.update(claims).set({ conflictingClaimId: t2Claims[1].id }).where(eq(claims.id, t2Claims[2].id));

  await db.insert(viewpoints).values([
    { topicId: topic2.id, groupName: "EU Regulators & Safety Advocates", position: "Risk-based regulation is necessary to protect fundamental rights while enabling responsible AI innovation", arguments: ["Unregulated AI poses real risks to democratic processes, employment, and civil liberties", "The GDPR precedent shows regulation can coexist with—and even strengthen—a thriving digital economy", "Proactive regulation avoids the 'regulate after harm' pattern seen with social media", "Clear rules create market certainty that ultimately benefits responsible innovators"], incentives: "Protect EU citizens; establish global regulatory leadership; create level playing field", constraints: "Must avoid over-regulation that drives companies away; enforcement capacity limitations; need to keep pace with fast-moving technology", articleIds: [t2Articles[0].id, t2Articles[4].id] },
    { topicId: topic2.id, groupName: "Tech Industry & Startups", position: "Current regulations are too burdensome and risk making Europe uncompetitive in AI", arguments: ["Compliance costs disproportionately affect startups and SMEs", "Regulatory uncertainty slows product development cycles", "US and Chinese competitors face lighter regulatory burdens", "Innovation requires experimentation, which rigid classification hinders"], incentives: "Minimize compliance burden; maintain competitive position; access EU market of 450M consumers", constraints: "Cannot ignore EU requirements; reputational risks of opposing safety measures; need EU market access", articleIds: [t2Articles[1].id, t2Articles[2].id] },
    { topicId: topic2.id, groupName: "Member State Pragmatists (Germany-led)", position: "The AI Act is right in principle but needs flexible implementation to preserve EU competitiveness", arguments: ["Regulatory sandboxes can balance safety testing with innovation speed", "SMEs need proportional compliance requirements, not one-size-fits-all rules", "Implementation guidance must be clear and practical, not just legally precise", "EU must invest in AI infrastructure alongside regulation"], incentives: "Maintain domestic AI industry growth; satisfy both safety and competitiveness constituencies; influence EU-level implementation", constraints: "Must work within AI Act framework; diverse member state priorities; limited national enforcement budgets", articleIds: [t2Articles[3].id] },
  ]);

  await db.insert(stakeholders).values([
    { topicId: topic2.id, name: "European Commission (DG CONNECT)", role: "Primary regulatory body", description: "Responsible for AI Act implementation guidance and enforcement coordination.", articleIds: [t2Articles[0].id] },
    { topicId: topic2.id, name: "European AI Startups (lobby coalition)", role: "Industry advocacy group", description: "Coalition of 200+ AI startups advocating for lighter compliance requirements.", articleIds: [t2Articles[1].id] },
    { topicId: topic2.id, name: "German Federal Ministry for Digital", role: "Member state regulator", description: "Leading push for innovation-friendly implementation including regulatory sandboxes.", articleIds: [t2Articles[3].id] },
    { topicId: topic2.id, name: "Access Now / AlgorithmWatch", role: "Civil society watchdogs", description: "Monitoring AI Act enforcement and pushing for strong citizen protections.", articleIds: [t2Articles[4].id] },
  ]);

  await db.insert(scenarios).values([
    { topicId: topic2.id, title: "Brussels Effect (Global Standard)", description: "The EU AI Act becomes the de facto global standard as major companies adopt EU-compliant practices globally rather than maintaining separate systems. Other jurisdictions adopt similar frameworks.", likelihood: "medium", triggers: "Major US tech firms adopt EU standards globally; other countries cite AI Act as model; no major compliance-driven exodus from EU", implications: "Global convergence on risk-based AI regulation; higher baseline safety standards; some innovation friction but predictable rules", articleIds: [t2Articles[2].id, t2Articles[5].id] },
    { topicId: topic2.id, title: "Regulatory Fragmentation", description: "EU rules diverge significantly from US and Chinese approaches, creating three distinct regulatory regimes. Companies must maintain separate compliance frameworks for each market.", likelihood: "high", triggers: "US maintains lighter-touch approach; China pursues state-centric AI governance; EU enforcement creates compliance barriers", implications: "Increased costs for global AI companies; potential EU competitive disadvantage in AI; fragmented global AI development", articleIds: [t2Articles[1].id, t2Articles[5].id] },
    { topicId: topic2.id, title: "Pragmatic Adaptation", description: "Implementation flexibility (sandboxes, SME exemptions) reduces compliance burden while maintaining safety guardrails. EU retains AI competitiveness while setting meaningful standards.", likelihood: "medium", triggers: "Germany-led pragmatic implementation succeeds; sandbox results demonstrate workable balance; startup retention improves", implications: "Moderate regulatory influence globally; balanced innovation-safety outcome; model for adaptive AI governance", articleIds: [t2Articles[3].id, t2Articles[4].id] },
  ]);

  await db.insert(timelineEvents).values([
    { topicId: topic2.id, eventDate: daysAgo(600), description: "EU Parliament approves AI Act with strong majority", significance: "high", isRecent: false },
    { topicId: topic2.id, eventDate: daysAgo(365), description: "AI Act enters into force; 24-month implementation period begins", significance: "high", isRecent: false },
    { topicId: topic2.id, eventDate: daysAgo(180), description: "European Commission publishes first implementation guidance documents", significance: "medium", isRecent: false },
    { topicId: topic2.id, eventDate: hoursAgo(4), description: "First compliance deadline: banned AI practices now officially prohibited", significance: "high", isRecent: true, articleId: t2Articles[0].id },
  ]);

  await db.insert(watchSignals).values([
    { topicId: topic2.id, signal: "Number of AI startups relocating headquarters outside EU", implication: "Rising relocations would signal regulatory burden outweighing market access benefits", articleIds: [t2Articles[1].id] },
    { topicId: topic2.id, signal: "Regulatory sandbox participation rates across member states", implication: "High participation suggests pragmatic implementation is working; low rates suggest regulatory rigidity", articleIds: [t2Articles[3].id] },
    { topicId: topic2.id, signal: "US tech companies adopting EU AI standards globally vs. EU-only", implication: "Global adoption signals Brussels Effect in action; EU-only compliance suggests fragmentation", articleIds: [t2Articles[2].id] },
  ]);

  // ══════════════════════════════════════════════════════════
  // TOPIC 3: Middle East Ceasefire Negotiations
  // ══════════════════════════════════════════════════════════
  const [topic3] = await db.insert(topics).values({
    slug: "middle-east-ceasefire-negotiations",
    title: "Middle East Ceasefire and Hostage Negotiations",
    description: "Multilateral negotiations for a ceasefire agreement continue with competing demands from multiple parties. The humanitarian situation drives urgency while political constraints limit compromises.",
    coreQuestion: "Can mediators bridge the gap between maximalist positions to achieve a durable ceasefire, and what will the regional order look like afterward?",
    category: "Conflict & Diplomacy",
  }).returning();

  await db.insert(topicRegions).values([
    { topicId: topic3.id, regionId: regionMap["middle-east"] },
    { topicId: topic3.id, regionId: regionMap["north-america"] },
  ]);

  const t3Articles = await db.insert(articles).values([
    { sourceId: srcMap["Reuters"], topicId: topic3.id, title: "Mediators present revised ceasefire framework after marathon talks", url: "#", summary: "Qatar and Egyptian mediators have tabled a new phased ceasefire proposal following 72 hours of intensive negotiations in Doha.", publishedAt: hoursAgo(2), isRecent: true },
    { sourceId: srcMap["Al Jazeera"], topicId: topic3.id, title: "Humanitarian agencies report critical supply shortages in conflict zones", url: "#", summary: "UN agencies report that aid delivery has dropped 60% from pre-conflict levels, with medical supplies critically low in northern areas.", publishedAt: hoursAgo(5), isRecent: true },
    { sourceId: srcMap["Associated Press"], topicId: topic3.id, title: "US envoy shuttles between parties as deadline pressure mounts", url: "#", summary: "The US special envoy has conducted six bilateral meetings in 48 hours, signaling Washington's urgency to reach a framework agreement.", publishedAt: hoursAgo(7), isRecent: true },
    { sourceId: srcMap["BBC News"], topicId: topic3.id, title: "Regional powers signal willingness to support reconstruction framework", url: "#", summary: "Saudi Arabia, UAE, and EU have indicated readiness to fund reconstruction efforts contingent on a durable ceasefire agreement.", publishedAt: hoursAgo(15), isRecent: true },
    { sourceId: srcMap["Financial Times"], topicId: topic3.id, title: "Energy markets react to ceasefire uncertainty", url: "#", summary: "Oil prices fluctuated 3% in 24 hours as traders assessed the probability of a deal and its implications for regional stability.", publishedAt: hoursAgo(18), isRecent: true },
    { sourceId: srcMap["The Guardian"], topicId: topic3.id, title: "Analysis: the domestic political constraints blocking a deal", url: "#", summary: "Both sides face hardline domestic constituencies that view significant concessions as politically unacceptable, narrowing the negotiation space.", publishedAt: daysAgo(1), isRecent: false },
  ]).returning();

  const t3Claims = await db.insert(claims).values([
    { topicId: topic3.id, statement: "A revised three-phase ceasefire framework has been presented by Qatari and Egyptian mediators, proposing an initial 60-day humanitarian pause.", category: "what_happened", articleIds: [t3Articles[0].id], isConflicting: false },
    { topicId: topic3.id, statement: "UN agencies report aid delivery has dropped 60% from pre-conflict levels, with medical supplies critically low in northern areas.", category: "what_happened", articleIds: [t3Articles[1].id], isConflicting: false },
    { topicId: topic3.id, statement: "The US special envoy conducted six bilateral meetings in 48 hours, the most intensive diplomatic engagement since negotiations began.", category: "who_said", articleIds: [t3Articles[2].id], isConflicting: false },
    { topicId: topic3.id, statement: "Saudi Arabia, UAE, and EU have committed preliminary reconstruction funding of $20 billion contingent on ceasefire.", category: "who_said", articleIds: [t3Articles[3].id], isConflicting: true },
    { topicId: topic3.id, statement: "Diplomatic sources caution the $20 billion figure is aspirational, with actual committed funds closer to $8 billion.", category: "who_said", articleIds: [t3Articles[4].id], isConflicting: true },
    { topicId: topic3.id, statement: "Oil prices fluctuated 3% within 24 hours as markets priced in shifting ceasefire probabilities.", category: "what_changed", articleIds: [t3Articles[4].id], isConflicting: false },
  ]).returning();

  // Link conflicting claims: $20B commitment <-> $8B actual
  await db.update(claims).set({ conflictingClaimId: t3Claims[4].id }).where(eq(claims.id, t3Claims[3].id));
  await db.update(claims).set({ conflictingClaimId: t3Claims[3].id }).where(eq(claims.id, t3Claims[4].id));

  await db.insert(viewpoints).values([
    { topicId: topic3.id, groupName: "International Mediators (Qatar, Egypt, US)", position: "A phased agreement is the only viable path to ending the humanitarian crisis", arguments: ["Phased approach allows confidence-building before addressing harder political issues", "Humanitarian urgency demands immediate action regardless of final status disagreements", "Reconstruction incentives can create momentum toward a durable settlement", "All parties have domestic reasons to accept a deal they can frame as a win"], incentives: "Regional stability; humanitarian relief; diplomatic achievement; energy market stability", constraints: "Cannot impose terms on sovereign parties; must balance competing interests; credibility depends on enforcement", articleIds: [t3Articles[0].id, t3Articles[2].id] },
    { topicId: topic3.id, groupName: "Hardline Domestic Constituencies (Both Sides)", position: "Significant concessions are unacceptable and would reward the other side's actions", arguments: ["Security guarantees must be ironclad before any agreement", "Territorial and political concessions undermine long-term strategic position", "Domestic political survival requires demonstrating resolve, not compromise", "Previous agreements failed because they didn't address root causes"], incentives: "Domestic political survival; constituency satisfaction; strategic position preservation", constraints: "International pressure; humanitarian costs; economic damage from continued conflict", articleIds: [t3Articles[5].id] },
    { topicId: topic3.id, groupName: "Humanitarian Organizations & Civil Society", position: "Civilian protection and aid access must be prioritized regardless of political negotiations", arguments: ["International humanitarian law requires civilian protection independent of political disputes", "Delay in ceasefire is measured in lives lost and infrastructure destroyed", "Long-term peace requires addressing root causes of civilian suffering", "Aid access should never be used as a bargaining chip"], incentives: "Civilian protection; humanitarian access; long-term peace", constraints: "Limited leverage over armed parties; donor fatigue; security risks for aid workers", articleIds: [t3Articles[1].id] },
  ]);

  await db.insert(stakeholders).values([
    { topicId: topic3.id, name: "Qatar (Mediator)", role: "Primary negotiation venue and mediator", description: "Hosting negotiations and maintaining communication channels between parties.", articleIds: [t3Articles[0].id] },
    { topicId: topic3.id, name: "US Special Envoy", role: "Key diplomatic broker", description: "Leveraging relationships with all parties to push for framework agreement.", articleIds: [t3Articles[2].id] },
    { topicId: topic3.id, name: "UN OCHA", role: "Humanitarian coordination", description: "Coordinating aid delivery and reporting on humanitarian conditions.", articleIds: [t3Articles[1].id] },
    { topicId: topic3.id, name: "Gulf Reconstruction Coalition", role: "Potential reconstruction funders", description: "Saudi Arabia and UAE signaling readiness to fund post-conflict reconstruction.", articleIds: [t3Articles[3].id] },
  ]);

  await db.insert(scenarios).values([
    { topicId: topic3.id, title: "Phased Agreement Holds", description: "The three-phase framework is accepted. Initial humanitarian pause leads to sustained ceasefire. Political negotiations begin under improved conditions.", likelihood: "medium", triggers: "Both sides face sufficient pressure to accept imperfect terms; mediators provide security guarantees; reconstruction incentives prove compelling", implications: "Humanitarian relief within weeks; long political negotiation ahead; reconstruction begins; energy markets stabilize", articleIds: [t3Articles[0].id, t3Articles[3].id] },
    { topicId: topic3.id, title: "Partial Agreement / Fragile Pause", description: "Limited humanitarian pauses occur without a comprehensive framework. Violence periodically resumes. Aid flows improve but remain constrained.", likelihood: "high", triggers: "Parties agree to limited humanitarian measures but cannot bridge political gaps; domestic pressures prevent full commitment", implications: "Reduced but ongoing suffering; continued market uncertainty; mediator fatigue; gradual international attention shift", articleIds: [t3Articles[0].id, t3Articles[5].id] },
    { topicId: topic3.id, title: "Negotiation Collapse", description: "Talks break down entirely. Conflict intensity increases. Regional escalation risks rise significantly.", likelihood: "low", triggers: "Major provocation by either side; mediator withdrawal; domestic political crisis preventing negotiation", implications: "Severe humanitarian crisis; energy price spike; potential regional conflict expansion; long-term instability", articleIds: [t3Articles[4].id, t3Articles[5].id] },
  ]);

  await db.insert(timelineEvents).values([
    { topicId: topic3.id, eventDate: daysAgo(120), description: "Initial ceasefire talks begin in Doha", significance: "high", isRecent: false },
    { topicId: topic3.id, eventDate: daysAgo(60), description: "First humanitarian pause achieved (72 hours)", significance: "medium", isRecent: false },
    { topicId: topic3.id, eventDate: daysAgo(14), description: "Negotiations resume after two-week pause", significance: "medium", isRecent: false },
    { topicId: topic3.id, eventDate: hoursAgo(2), description: "Mediators present revised three-phase ceasefire framework", significance: "high", isRecent: true, articleId: t3Articles[0].id },
  ]);

  await db.insert(watchSignals).values([
    { topicId: topic3.id, signal: "Official statements from both parties on the revised framework", implication: "Acceptance or rejection language indicates deal probability within days", articleIds: [t3Articles[0].id] },
    { topicId: topic3.id, signal: "Aid delivery volumes through humanitarian corridors", implication: "Rising deliveries signal goodwill; falling deliveries signal leverage tactics", articleIds: [t3Articles[1].id] },
    { topicId: topic3.id, signal: "Oil futures price movements", implication: "Markets aggregate intelligence from all sources; sustained decline suggests deal confidence", articleIds: [t3Articles[4].id] },
  ]);

  // ══════════════════════════════════════════════════════════
  // TOPIC 4: Global Climate Finance
  // ══════════════════════════════════════════════════════════
  const [topic4] = await db.insert(topics).values({
    slug: "global-climate-finance-gap",
    title: "Global Climate Finance: Bridging the $2.4 Trillion Gap",
    description: "Developing nations demand scaled-up climate finance as adaptation costs surge. The gap between pledges and delivery threatens both climate targets and geopolitical trust.",
    coreQuestion: "How can the international community mobilize the trillions needed for climate adaptation and mitigation in developing countries, and who bears the cost?",
    category: "Environment & Economics",
  }).returning();

  await db.insert(topicRegions).values([
    { topicId: topic4.id, regionId: regionMap["africa"] },
    { topicId: topic4.id, regionId: regionMap["south-asia"] },
    { topicId: topic4.id, regionId: regionMap["europe"] },
    { topicId: topic4.id, regionId: regionMap["north-america"] },
  ]);

  const t4Articles = await db.insert(articles).values([
    { sourceId: srcMap["Reuters"], topicId: topic4.id, title: "UN report reveals $2.4 trillion annual climate finance gap for developing world", url: "#", summary: "A new UNEP report calculates that developing countries need $2.4 trillion annually by 2030 for climate adaptation and mitigation, far exceeding current flows.", publishedAt: hoursAgo(5), isRecent: true },
    { sourceId: srcMap["Financial Times"], topicId: topic4.id, title: "Multilateral development banks pledge reform to unlock climate capital", url: "#", summary: "World Bank and regional development banks announce balance sheet optimization measures to increase lending capacity by $300 billion over five years.", publishedAt: hoursAgo(11), isRecent: true },
    { sourceId: srcMap["The Guardian"], topicId: topic4.id, title: "African nations form unified negotiating bloc on climate finance", url: "#", summary: "54 African Union member states present a coordinated demand for $1.3 trillion in annual climate finance, including loss and damage payments.", publishedAt: hoursAgo(15), isRecent: true },
    { sourceId: srcMap["The Economist"], topicId: topic4.id, title: "Private capital hesitates: why investors aren't filling the climate gap", url: "#", summary: "Despite blended finance mechanisms, private investment in climate projects in developing countries remains a fraction of what's needed due to risk perceptions.", publishedAt: hoursAgo(20), isRecent: true },
    { sourceId: srcMap["BBC News"], topicId: topic4.id, title: "Small island states face existential threat as adaptation funding lags", url: "#", summary: "Pacific island nations report that sea level rise is outpacing their adaptation capacity, with promised international funding arriving too slowly.", publishedAt: daysAgo(1), isRecent: false },
  ]).returning();

  await db.insert(claims).values([
    { topicId: topic4.id, statement: "Developing countries need $2.4 trillion annually by 2030 for climate adaptation and mitigation, according to a new UNEP assessment.", category: "what_happened", articleIds: [t4Articles[0].id], isConflicting: false },
    { topicId: topic4.id, statement: "Multilateral development banks announced balance sheet reforms expected to unlock $300 billion in additional lending over five years.", category: "what_changed", articleIds: [t4Articles[1].id], isConflicting: false },
    { topicId: topic4.id, statement: "The African Union bloc is demanding $1.3 trillion in annual climate finance including loss and damage payments based on historical emissions responsibility.", category: "who_said", articleIds: [t4Articles[2].id], isConflicting: false },
    { topicId: topic4.id, statement: "Private investment in developing-country climate projects reached only $45 billion in 2025, roughly 2% of the identified need.", category: "what_changed", articleIds: [t4Articles[3].id], isConflicting: false },
  ]);

  await db.insert(viewpoints).values([
    { topicId: topic4.id, groupName: "Developing Nations (G77 + China)", position: "Developed countries have a historical obligation to fund climate adaptation in vulnerable nations", arguments: ["Historical emissions from industrialized nations created the crisis", "Current climate impacts disproportionately affect those least responsible", "Loss and damage payments are a matter of justice, not charity", "Without adequate finance, climate targets are impossible to meet"], incentives: "Secure adaptation funding; establish precedent of climate justice; protect vulnerable populations", constraints: "Limited negotiating leverage; competing national priorities; absorptive capacity for large capital flows", articleIds: [t4Articles[0].id, t4Articles[2].id] },
    { topicId: topic4.id, groupName: "Developed Nations & Institutions", position: "Climate finance must be scaled through reformed institutions and private capital mobilization", arguments: ["Public finance alone cannot bridge the gap; private capital must be unlocked", "MDB reform can multiply the impact of public commitments", "Recipient country governance and investment climate must improve to attract capital", "Shared responsibility means major emerging economies should also contribute"], incentives: "Meet climate commitments without unsustainable fiscal burden; maintain diplomatic relationships; protect economic interests from climate instability", constraints: "Domestic fiscal pressures; taxpayer resistance to large transfers; governance concerns in recipient countries", articleIds: [t4Articles[1].id, t4Articles[3].id] },
  ]);

  await db.insert(stakeholders).values([
    { topicId: topic4.id, name: "UNEP", role: "Assessment and coordination body", description: "Published the definitive assessment of climate finance needs.", articleIds: [t4Articles[0].id] },
    { topicId: topic4.id, name: "World Bank Group", role: "Largest multilateral climate financier", description: "Leading MDB reform efforts to increase lending capacity.", articleIds: [t4Articles[1].id] },
    { topicId: topic4.id, name: "African Union Negotiating Bloc", role: "Unified developing-country voice", description: "Coordinating 54 nations' climate finance demands.", articleIds: [t4Articles[2].id] },
  ]);

  await db.insert(scenarios).values([
    { topicId: topic4.id, title: "MDB Reform Unlocks Partial Gap", description: "Development bank reforms succeed in mobilizing $300-500 billion annually through improved lending terms and blended finance, closing 15-20% of the gap.", likelihood: "high", triggers: "MDB shareholders approve capital reforms; private co-investment materializes; pilot projects demonstrate viability", implications: "Meaningful but insufficient progress; political momentum maintained; vulnerable countries still underfunded for adaptation", articleIds: [t4Articles[1].id, t4Articles[3].id] },
    { topicId: topic4.id, title: "Climate Finance Breakthrough", description: "A combination of new funding mechanisms (carbon border adjustments, shipping levies, financial transaction taxes) provides transformative resources for developing nations.", likelihood: "low", triggers: "Major climate event creates political urgency; EU implements global climate finance mechanisms; US and China find cooperation pathway", implications: "Credible pathway to climate targets; reduced inequality; new international fiscal architecture; significant geopolitical realignment", articleIds: [t4Articles[0].id, t4Articles[2].id] },
  ]);

  await db.insert(timelineEvents).values([
    { topicId: topic4.id, eventDate: daysAgo(365), description: "COP climate finance pledge of $300 billion annually by developed nations", significance: "high", isRecent: false },
    { topicId: topic4.id, eventDate: daysAgo(90), description: "Loss and damage fund becomes operational with initial $700 million", significance: "medium", isRecent: false },
    { topicId: topic4.id, eventDate: hoursAgo(5), description: "UNEP publishes updated $2.4 trillion annual finance gap assessment", significance: "high", isRecent: true, articleId: t4Articles[0].id },
  ]);

  await db.insert(watchSignals).values([
    { topicId: topic4.id, signal: "MDB capital adequacy reform votes at annual meetings", implication: "Approval signals real capacity increase; delays suggest insufficient political will", articleIds: [t4Articles[1].id] },
    { topicId: topic4.id, signal: "Private climate investment flows to developing countries", implication: "Rising flows validate blended finance approach; flat flows suggest structural barriers remain", articleIds: [t4Articles[3].id] },
  ]);

  // ══════════════════════════════════════════════════════════
  // TOPIC 5: India Digital Public Infrastructure
  // ══════════════════════════════════════════════════════════
  const [topic5] = await db.insert(topics).values({
    slug: "india-digital-public-infrastructure",
    title: "India's Digital Public Infrastructure Goes Global",
    description: "India is exporting its digital public infrastructure stack (Aadhaar, UPI, DigiLocker) to developing nations, positioning itself as an alternative to Chinese and Western tech platforms.",
    coreQuestion: "Can India's DPI model become the global standard for digital government services, and what are the implications for data sovereignty and geopolitics?",
    category: "Technology & Development",
  }).returning();

  await db.insert(topicRegions).values([
    { topicId: topic5.id, regionId: regionMap["south-asia"] },
    { topicId: topic5.id, regionId: regionMap["africa"] },
    { topicId: topic5.id, regionId: regionMap["southeast-asia"] },
  ]);

  const t5Articles = await db.insert(articles).values([
    { sourceId: srcMap["Reuters"], topicId: topic5.id, title: "India signs DPI agreements with 12 African nations", url: "#", summary: "India has formalized digital public infrastructure sharing agreements with 12 African countries, including deployment of UPI-based payment systems.", publishedAt: hoursAgo(6), isRecent: true },
    { sourceId: srcMap["Financial Times"], topicId: topic5.id, title: "UPI cross-border payments expand to Southeast Asian markets", url: "#", summary: "India's Unified Payments Interface is now interoperable with payment systems in Singapore, Thailand, and the Philippines.", publishedAt: hoursAgo(13), isRecent: true },
    { sourceId: srcMap["Nikkei Asia"], topicId: topic5.id, title: "Privacy concerns shadow India's DPI export ambitions", url: "#", summary: "Digital rights organizations raise concerns about data protection standards in countries adopting India's digital identity systems.", publishedAt: hoursAgo(19), isRecent: true },
    { sourceId: srcMap["BBC News"], topicId: topic5.id, title: "India positions DPI as 'Global South' alternative to Big Tech", url: "#", summary: "At the G20, India argued its open-source DPI model offers developing nations digital sovereignty without dependence on US or Chinese platforms.", publishedAt: daysAgo(1), isRecent: false },
  ]).returning();

  await db.insert(claims).values([
    { topicId: topic5.id, statement: "India has signed digital public infrastructure agreements with 12 African nations, covering digital identity, payments, and document verification systems.", category: "what_happened", articleIds: [t5Articles[0].id], isConflicting: false },
    { topicId: topic5.id, statement: "UPI cross-border payment interoperability is now live in Singapore, Thailand, and the Philippines, with Indonesia and Vietnam expected by Q3.", category: "what_changed", articleIds: [t5Articles[1].id], isConflicting: false },
    { topicId: topic5.id, statement: "Digital rights organizations including Access Now warn that countries adopting India's Aadhaar-based identity systems lack adequate data protection laws.", category: "who_said", articleIds: [t5Articles[2].id], isConflicting: false },
  ]);

  await db.insert(viewpoints).values([
    { topicId: topic5.id, groupName: "Indian Government", position: "DPI export is a development tool that offers the Global South digital sovereignty", arguments: ["Open-source DPI gives countries control over their digital infrastructure", "India's systems are proven at billion-person scale", "DPI offers an alternative to Chinese surveillance tech and US Big Tech monopolies", "Digital infrastructure accelerates financial inclusion and government efficiency"], incentives: "Geopolitical influence; soft power; Indian tech industry export growth; Global South leadership", constraints: "Must demonstrate data protection adequacy; capacity to support deployments; competition from established alternatives", articleIds: [t5Articles[0].id, t5Articles[3].id] },
    { topicId: topic5.id, groupName: "Digital Rights & Privacy Advocates", position: "DPI deployment without strong data protection frameworks risks mass surveillance", arguments: ["India's own data protection record is concerning", "Biometric ID systems create high-value targets for breaches", "Developing countries adopting DPI often lack regulatory capacity for oversight", "Technology should not outpace governance"], incentives: "Protect individual rights; establish strong data protection norms; prevent surveillance infrastructure", constraints: "Must acknowledge real benefits of digital inclusion; alternative proposals needed, not just criticism", articleIds: [t5Articles[2].id] },
  ]);

  await db.insert(scenarios).values([
    { topicId: topic5.id, title: "DPI Becomes Global South Standard", description: "India's DPI stack is adopted by 40+ developing countries, creating a third digital ecosystem alongside US and Chinese platforms.", likelihood: "medium", triggers: "Successful African deployments; ASEAN payment interoperability proves value; World Bank endorsement", implications: "Increased Indian geopolitical influence; new digital trade corridors; pressure on data protection standards", articleIds: [t5Articles[0].id, t5Articles[1].id] },
    { topicId: topic5.id, title: "Fragmented Adoption with Governance Gaps", description: "DPI is adopted unevenly, with some countries implementing strong safeguards and others using the technology without adequate oversight, leading to data breaches or misuse.", likelihood: "high", triggers: "Rapid deployment outpaces governance capacity; data breach in early adopter; lack of international standards", implications: "Mixed outcomes; trust erosion; calls for international DPI governance framework", articleIds: [t5Articles[2].id, t5Articles[3].id] },
  ]);

  await db.insert(timelineEvents).values([
    { topicId: topic5.id, eventDate: daysAgo(365), description: "India launches Global DPI Repository at G20", significance: "high", isRecent: false },
    { topicId: topic5.id, eventDate: daysAgo(90), description: "UPI-Singapore PayNow interoperability goes live", significance: "medium", isRecent: false },
    { topicId: topic5.id, eventDate: hoursAgo(6), description: "India signs DPI agreements with 12 African nations", significance: "high", isRecent: true, articleId: t5Articles[0].id },
  ]);

  await db.insert(watchSignals).values([
    { topicId: topic5.id, signal: "Number of countries actively deploying India-origin DPI", implication: "Growth indicates model viability; stagnation suggests adoption barriers", articleIds: [t5Articles[0].id] },
    { topicId: topic5.id, signal: "Data protection legislation in DPI-adopting countries", implication: "New laws suggest responsible adoption; absence suggests governance gap", articleIds: [t5Articles[2].id] },
  ]);

  // ══════════════════════════════════════════════════════════
  // TOPIC 6: Arctic Shipping Routes
  // ══════════════════════════════════════════════════════════
  const [topic6] = await db.insert(topics).values({
    slug: "arctic-shipping-route-competition",
    title: "Arctic Shipping Routes: Climate Change Opens Geopolitical Frontiers",
    description: "Melting Arctic ice is making Northern Sea Route shipping commercially viable, triggering competition between Russia, China, and Western nations over control, environmental standards, and military positioning.",
    coreQuestion: "Who will set the rules for Arctic shipping—and can environmental protection keep pace with commercial and strategic interests?",
    category: "Geopolitics & Environment",
  }).returning();

  await db.insert(topicRegions).values([
    { topicId: topic6.id, regionId: regionMap["europe"] },
    { topicId: topic6.id, regionId: regionMap["east-asia"] },
    { topicId: topic6.id, regionId: regionMap["north-america"] },
  ]);

  const t6Articles = await db.insert(articles).values([
    { sourceId: srcMap["Reuters"], topicId: topic6.id, title: "Arctic shipping traffic up 40% as Northern Sea Route season extends", url: "#", summary: "Cargo volume through the Northern Sea Route reached record levels as the ice-free navigation season extended to 5 months.", publishedAt: hoursAgo(8), isRecent: true },
    { sourceId: srcMap["Financial Times"], topicId: topic6.id, title: "China and Russia deepen Arctic shipping partnership", url: "#", summary: "A new bilateral agreement formalizes China-Russia cooperation on Northern Sea Route development, including port infrastructure and icebreaker services.", publishedAt: hoursAgo(14), isRecent: true },
    { sourceId: srcMap["The Guardian"], topicId: topic6.id, title: "Environmental groups warn of 'climate feedback loop' from Arctic shipping", url: "#", summary: "Scientists warn that heavy fuel oil emissions and black carbon from Arctic shipping accelerate ice melt, creating a feedback loop that further opens shipping routes.", publishedAt: hoursAgo(20), isRecent: true },
    { sourceId: srcMap["BBC News"], topicId: topic6.id, title: "NATO allies increase Arctic military presence", url: "#", summary: "Canada, Norway, and Denmark have expanded Arctic patrol capabilities in response to increased Russian and Chinese activity along Northern shipping lanes.", publishedAt: daysAgo(1), isRecent: false },
  ]).returning();

  await db.insert(claims).values([
    { topicId: topic6.id, statement: "Northern Sea Route cargo volume reached 42 million tonnes in 2025, a 40% year-over-year increase, with the ice-free season extending to 5 months.", category: "what_happened", articleIds: [t6Articles[0].id], isConflicting: false },
    { topicId: topic6.id, statement: "China and Russia signed a bilateral agreement formalizing joint development of Northern Sea Route infrastructure including ports, icebreakers, and navigation systems.", category: "what_happened", articleIds: [t6Articles[1].id], isConflicting: false },
    { topicId: topic6.id, statement: "Climate scientists warn that black carbon from Arctic shipping could accelerate ice melt by 10-15%, creating a feedback loop.", category: "who_said", articleIds: [t6Articles[2].id], isConflicting: false },
  ]);

  await db.insert(viewpoints).values([
    { topicId: topic6.id, groupName: "Russia-China Arctic Partnership", position: "The Northern Sea Route is a commercial opportunity and strategic corridor that should be jointly developed", arguments: ["NSR reduces Asia-Europe shipping times by 30% compared to Suez Canal", "Arctic resources and routes are legitimate sovereign interests", "Commercial development benefits global trade efficiency", "Infrastructure investment creates economic opportunity for Arctic communities"], incentives: "Revenue from transit fees; strategic route control; resource access; reduce dependence on Suez/Panama chokepoints", constraints: "Environmental regulation pressure; Western sanctions on Russia; infrastructure costs; harsh operating conditions", articleIds: [t6Articles[0].id, t6Articles[1].id] },
    { topicId: topic6.id, groupName: "NATO Arctic States & Environmentalists", position: "Arctic development must prioritize environmental protection and freedom of navigation", arguments: ["Unregulated shipping threatens fragile Arctic ecosystems", "Military buildup in the Arctic increases conflict risk", "Freedom of navigation principles must apply to Arctic waters", "Indigenous communities must be consulted on development decisions"], incentives: "Environmental protection; freedom of navigation; counter strategic encroachment; protect Indigenous rights", constraints: "Commercial shipping demand is real; cannot prevent climate-driven ice retreat; need to engage rather than isolate", articleIds: [t6Articles[2].id, t6Articles[3].id] },
  ]);

  await db.insert(scenarios).values([
    { topicId: topic6.id, title: "Regulated Commercialization", description: "International Arctic shipping standards are agreed through the IMO, balancing commercial growth with environmental protection. Multiple countries operate along the route.", likelihood: "medium", triggers: "IMO Polar Code enforcement; environmental incident creates regulatory urgency; diplomatic engagement succeeds", implications: "Managed growth in Arctic shipping; meaningful environmental safeguards; reduced geopolitical tension", articleIds: [t6Articles[0].id, t6Articles[2].id] },
    { topicId: topic6.id, title: "Strategic Corridor Competition", description: "Russia and China effectively control the Northern Sea Route as a strategic asset. Western nations develop alternative Arctic routes and increase military presence.", likelihood: "high", triggers: "Russia restricts transit access; China establishes permanent Arctic infrastructure; NATO responds with expanded patrols", implications: "Arctic becomes new zone of geopolitical competition; environmental standards compromised; increased military spending", articleIds: [t6Articles[1].id, t6Articles[3].id] },
  ]);

  await db.insert(timelineEvents).values([
    { topicId: topic6.id, eventDate: daysAgo(365), description: "Arctic sea ice minimum reaches second-lowest recorded extent", significance: "high", isRecent: false },
    { topicId: topic6.id, eventDate: daysAgo(180), description: "Russia opens new deepwater port on Northern Sea Route", significance: "medium", isRecent: false },
    { topicId: topic6.id, eventDate: hoursAgo(8), description: "Record Arctic shipping traffic reported for current season", significance: "high", isRecent: true, articleId: t6Articles[0].id },
  ]);

  await db.insert(watchSignals).values([
    { topicId: topic6.id, signal: "Monthly Northern Sea Route transit volumes", implication: "Accelerating growth signals route becoming mainstream commercial corridor", articleIds: [t6Articles[0].id] },
    { topicId: topic6.id, signal: "IMO Polar Code updates and enforcement actions", implication: "Strengthened regulation signals environmental governance keeping pace; weak enforcement suggests opposite", articleIds: [t6Articles[2].id] },
  ]);

  console.log("Database seeded successfully with 6 topics, articles, claims, viewpoints, scenarios, timelines, and stakeholders.");
}
