// AgriShield AI Assistant — local, eco-friendly, problem-solving agriculture chatbot.
// - Typo-tolerant intent matching (fuzzy keyword rectification)
// - Structured explanatory answers: steps → prevention → eco tip
// - Follow-up memory ("prevention?", "tell me more")
// - Real farm-context awareness (soil, irrigation, scan, weather)
// - English and Telugu

// ---------- helpers ----------
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 3) return 99;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

function fuzzyIncludes(text, keyword) {
  const t = text.toLowerCase();
  const k = keyword.toLowerCase();
  if (t.includes(k)) return true;
  const words = t.split(/[^a-z0-9\u0C00-\u0C7F]+/);
  return words.some((w) => w.length > 3 && levenshtein(w, k) <= (k.length > 5 ? 2 : 1));
}

// ---------- knowledge base ----------
// Each entry: { patterns: string[], en, te }
const KB = [
  {
    patterns: ['irrigat', 'water', 'moisture', 'drip', 'నీరు', 'సేద్యం', 'నీటి'],
    en: `**Eco-friendly irrigation plan:**
1. Check soil moisture 10-15 cm deep — irrigate only if it feels dry.
2. Water early morning or late evening to cut evaporation by up to 30%.
3. Add mulch on the soil surface — it retains moisture and saves 20-40% water.
4. Prefer drip or sprinkler irrigation — 30-50% less water than flooding.
5. If rain probability is 60%+, skip irrigation and check drainage.
🌱 *Prevention: schedule a weekly moisture check instead of fixed-day watering.*`,
    te: `**పర్యావరణ సేద్యం ప్రణాళిక:**
1. మట్టి తేమ 10-15 సెం.మీ లోతులో చూడండి — ఎండినప్పుడే నీరు పోయండి.
2. ఉదయం లేదా సాయంత్రం నీరు పోయాలి; బాష్పీభవనం 30% తగ్గుతుంది.
3. మల్చ్ వేయండి — 20-40% నీరు ఆదా.
4. బిందు/స్ప్రింక్లర్ సేద్యం 30-50% నీరు ఆదా చేస్తుంది.
5. వర్షం 60%+ అవకాశం ఉంటే సేద్యం వాయిదా.
🌱 *నివారణ: నిర్ణీత రోజుకు బదులు వారం వారం తేమ చూసుకోండి.*`,
  },
  {
    patterns: ['soil', 'ph', 'nitrogen', 'phosphorus', 'potassium', 'nutrient', 'fertiliz', 'compost', 'manure', 'urea', 'dap', 'మట్టి', 'ఎరువు', 'సేంద్రీయ'],
    en: `**Soil health, step by step:**
1. Test soil every season (pH, N, P, K) — use the AgriShield Soil Analyzer to get a score.
2. Ideal pH is 6.0-7.5 for most crops. Below 6: add lime. Above 8: add organic matter/gypsum.
3. Add compost or farmyard manure 5-10 tonnes/acre every season — it improves structure and life.
4. Use urea for nitrogen, DAP for phosphorus, MOP for potassium — but only per soil-test results.
5. Practice crop rotation and green manuring (e.g., sunhemp) to restore fertility naturally.
🌱 *Eco tip: home compost turns farm waste into free fertilizer and improves moisture retention.*`,
    te: `**మట్టి ఆరోగ్యం, ደረప వారీగా:**
1. ప్రతి సీజన్ మట్టి పరీక్ష (pH, N, P, K) — AgriShield Soil Analyzer వాడి స్కోర్ తీసుకోండి.
2. చాలా పంటలకు సరైన pH 6.0-7.5. 6 కంటే తక్కువ ఉంటే సున్నం, 8 కంటే ఎక్కువ ఉంటే సేంద్రీయ ఎరువు.
3. సీజనుకు 5-10 టన్నుల కంపోస్ట్/కొట్లు ఎరువు వేయండి.
4. నత్రజనికి యూరియా, భాస్వరానికి DAP, పొటాషియానికి MOP — మట్టి పరీక్ష తర్వాతే.
5. పంట మార్పిడి, పచ్చి ఎరువు (సన్‌హెంప్) ద్వారా సహజ సారవంతం పెంచండి.
🌱 *చిట్కా: పొలం వ్యర్థాలతో ఇంట్లో కంపోస్ట్ చేయండి — ఉచిత ఎరువు, నీటి నిల్వ మెరుగు.*`,
  },
  {
    patterns: ['yellow', 'yellowing', 'pale', 'chlorosis', 'పసుపు', 'పసుపు ఆకు'],
    en: `**Yellowing leaves — likely causes & fixes:**
1. Most common: nitrogen deficiency or over-watering.
2. Quick test: check soil moisture at 10 cm. If waterlogged, improve drainage and skip irrigation.
3. If soil is dry and yellowing persists, apply compost or a nitrogen source (urea per soil test).
4. Check leaf undersides for yellow mites/aphids — treat with neem oil spray if present.
5. Upload a clear leaf photo in **Disease Detection** for a specific diagnosis.
🌱 *Tip: compost tea is a gentle, organic way to boost nitrogen without chemical burn.*`,
    te: `**పసుపు ఆకులు — కారణాలు & పరిష్కారాలు:**
1. ఎక్కువగా: నత్రజని లోపం లేదా అధిక నీరు.
2. పరీక్ష: 10 సెం.మీలో మట్టి తేమ. నీరు నిల్వ ఉంటే మురుగునీటి వసతి పెంచి నీరు నిలిపివేయండి.
3. మట్టి పొడిగా ఉండి పసుపు కొనసాగితే కంపోస్ట్ లేదా నత్రజని ఎరువు (మట్టి పరీక్ష ప్రకారం) వేయండి.
4. ఆకు కింద తెల్ల పురుగులు ఉన్నారా చుసుకోండి — ఉంటే వేపనూనె పిచికారి.
5. **Disease Detection** లో స్పష్టమైన ఆకు ఫోటో అప్‌లోడ్ చేసి నిర్దిష్ట నిర్ధారణ పొందండి.
🌱 *చిట్కా: కంపోస్ట్ టీ సహజ నత్రజని అందజేస్తుంది, రసాయన అలసట లేకుండా.*`,
  },
  {
    patterns: ['disease', 'blast', 'blight', 'spot', 'rot', 'fungus', 'ఆకు తెగులు', 'తెగులు', 'మచ్చ'],
    en: `**Disease management (eco-first approach):**
1. Remove and destroy heavily infected leaves — do not leave them in the field.
2. Avoid overhead watering; keep foliage dry.
3. For fungal issues, spray neem oil or a copper-based fungicide per label.
4. Ensure field drainage; waterlogged soil spreads disease.
5. Rotate crops each season; use resistant varieties next time.
6. Use the **Disease Detection** scanner for a plant-specific reading.
🌱 *Prevention beats cure: resistant seeds + crop rotation + field sanitation.*`,
    te: `**తెగులు నియంత్రణ (పర్యావరణ ప్రాధాన్యం):**
1. తీవ్రంగా సోకిన ఆకులు తొలగించి నాశనం చేయండి.
2. పై నుండి నీరు పోయకండి; ఆకులు పొడిగా ఉంచండి.
3. శిలీంధ్రం ఉంటే వేపనూనె లేదా కాపర్ శిలీంధ్రనాశిని.
4. మురుగునీటి వసతి ఉంచండి; నీటి నిల్వ తెగులుని పెంచుతుంది.
5. ప్రతి సీజన్ పంట మార్పిడి, నిరోధక రకాలు వేసుకోండి.
6. నిర్దిష్ట రీడింగ్ కోసం **Disease Detection** స్కానర్ వాడును.
🌱 *నివారణ ముఖ్యం: నిరోధక విత్తనాలు + పంట మార్పిడి + పారిశుద్ధ్యం.*`,
  },
  {
    patterns: ['pest', 'insect', 'aphid', 'worm', 'borer', 'spray', 'కీట', 'పురుగు', 'పిచికారి'],
    en: `**Eco-friendly pest plan:**
1. Scout fields twice a week — early detection saves the crop.
2. Use pheromone traps to monitor and trap stem borers/bollworms.
3. Prefer neem oil, ash, or bio-pesticides first; chemicals only if infestation is severe.
4. Encourage natural predators (ladybirds, spiders, birds) — avoid broad-spectrum sprays.
5. For heavy damage, consult the local agriculture officer before chemical use.
6. Upload a pest photo in **Pest Detection** for identification.
🌱 *Zero-residue tip: neem oil + regular field cleaning prevents most common infestations.*`,
    te: `**కీటక నియంత్రణ (పర్యావరణ):**
1. వారంలో రెండు సార్లు పొలం చూడండి — ముందస్తు గుర్తింపు పంటను కాపాడుతుంది.
2. ఫెరోమోన్ ట్రాప్‌లు వేసి స్టెమ్ బోరర్లను పట్టుకోండి.
3. మొదట వేపనూనె/బూడిద/జీవ పిచికారి; తీవ్రంగా ఉంటేనే రసాయనం.
4. సహజ శత్రువులు (లేడీబర్డ్‌లు, సాలెపురుగులు, పక్షులు) పెంచండి.
5. తీవ్రమైతే కృషి అధికారిని సంప్రదించండి.
6. గుర్తింపు కోసం **Pest Detection** లో ఫోటో అప్‌లోడ్ చేయండి.
🌱 *వేపనూనె + పొలం శుభ్రతతో చాలా కీటకాలు తగ్గుతాయి.*`,
  },
  {
    patterns: ['crop', 'which crop', 'what to grow', 'recommend', 'season', 'variety', 'పంట', 'ఏ పంట', 'ఏమి పండ'],
    en: `**How to choose the right crop:**
1. Match crop to your season: Kharif (rice, maize, cotton, soybean), Rabi (wheat, chickpea, mustard).
2. Match to soil: black soil → cotton/soybean; red soil → groundnut/pulses; alluvial → rice/sugarcane.
3. Match to water: low water → millets/pulses; high water → rice/sugarcane.
4. Check local mandi demand before sowing.
5. Use AgriShield's **Crop Recommendation** tool — it scores suitability from your exact soil, pH, N/P/K, temperature, rainfall and area.
🌱 *Eco tip: millets and pulses are climate-smart, low-input choices worth rotating in.*`,
    te: `**సరియైన పంట ఎంపిక:**
1. సీజనుకు అనుకూలం: ఖరీఫ్ (వరి, మొక్కజొన్న, పత్తి), రబీ (గోధుమ, శనగ, ఆవాలు).
2. నేలకు అనుకూలం: నల్ల నేల → పత్తి; ఎర్ర నేల → వేరుశెనగ/పప్పుధాన్యాలు; కొలను → వరి.
3. నీటికి అనుకూలం: తక్కువ నీరు → మిల్లెట్లు/పప్పులు; ఎక్కువ నీరు → వరి.
4. విత్తడానికి ముందు local mandi డిమాండ్ చూసుకోండి.
5. **Crop Recommendation** tool మీ మట్టి, pH, N/P/K, ఉష్ణోగ్రత, వర్షం, వైశాల్యం ఆధారంగా స్కోర్ ఇస్తుంది.
🌱 *చిట్కా: మిల్లెట్లు, పప్పుధాన్యాలు తక్కువ ఇన్‌పుట్లతో వాతావరణ అనుకూలం.*`,
  },
  {
    patterns: ['weather', 'rain', 'forecast', 'temperature', 'heat', 'వాతావరణం', 'వర్షం', 'ఎండ'],
    en: `**Weather-smart farming:**
1. Check AgriShield Weather every morning for your farm's exact location.
2. Delay fertilizer/pesticide spraying if heavy rain is expected within 6 hours.
3. During extreme heat (>35°C), irrigate early morning/evening and consider shade nets.
4. Strong wind expected? Avoid spraying and secure greenhouse covers.
5. Plan sowing after soil-moisture builds from pre-monsoon showers.
🌱 *Climate tip: drought-tolerant varieties + mulching are your best long-term strategy.*`,
    te: `**వాతావరణ తెలివైన వ్యవసాయం:**
1. ప్రతి ఉదయం AgriShield Weather లో మీ పొలం ప్రాంతం చూసుకోండి.
2. 6 గంటల్లో భారీ వర్షం ఉంటే ఎరువు/పిచికారి వాయిదా.
3. ఎండ >35°C ఉంటే ఉదయం/సాయంత్రం నీరు, నీడ అట్టలు కట్టుకోండి.
4. గాలి తీవ్రంగా ఉంటే పిచికారి ఆపండి, గ్రీన్‌హౌస్ కవర్లు కట్టుకోండి.
5. ముందు వర్షాల తర్వాత మట్టి నీరు చేరిన తర్వాతే విత్తడం చేయండి.
🌱 *దీర్ఘకాలం: కరువు తట్టుకునే రకాలు + మల్చ్.*`,
  },
  {
    patterns: ['profit', 'price', 'market', 'cost', 'sell', 'mandi', 'లాభం', 'ధర', 'మార్కెట్', 'అమ్మకం'],
    en: `**Profit improvement, step by step:**
1. Record every cost (seed, fertilizer, labor, irrigation, machinery, transport) in the AgriShield Profit Calculator.
2. Raise yield cheaply: compost, timely irrigation, pest scouting.
3. Compare mandi prices before selling — the Market Prices page shows latest government rates.
4. Avoid distress sales: store grain when prices are low; sell in stages.
5. Cut input costs with organic inputs (compost, neem, bio-pesticides) and mixed cropping.
🌱 *Track ROI per season to identify which crop/ever practice gives the best return.*`,
    te: `**లాభ పెంపు దశలు:**
1. ప్రతి ఖర్చు (విత్తనం, ఎరువు, కూలీ, సేద్యం, యంత్రం, రవాణా) Profit Calculator లో నమోదు చేయండి.
2. తక్కువ ఖర్చుతో దిగుబడి పెంచుకోండి: కంపోస్ట్, సకాలంలో సేద్యం, కీటక పర్యవేక్షణ.
3. అమ్మే ముందు మార్కెట్ ధరలు చూసుకోండి — Market Prices page తాజా ప్రభుత్వ ధరలు చూపిస్తుంది.
4. తక్కువ ధరప్పుడు అత్యవసర అమ్మకం చేయవద్దు; దాచుకుని దశలవారీగా అమ్మండి.
5. సేంద్రీయ ఇన్‌పుట్లు (కంపోస్ట్, వేప, జీవ పిచికారి) + మిశ్రమ పంటలతో ఖర్చు తగ్గించుకోండి.
🌱 *ప్రతి సీజన్ ROI చూసి ఏ పంట లాభదాయకమో నిర్ణయించండి.*`,
  },
  {
    patterns: ['scheme', 'subsidy', 'government', 'pm kisan', 'yojana', 'బీమా', 'పథకం', 'subsidie'],
    en: `**Government schemes to check:**
1. **PM-KISAN** – ₹6,000/year direct support for farmer families.
2. **PMFBY** – crop insurance; premium 1.5-2% — enroll before sowing.
3. **Rythu Bandhu** (Telangana) – ₹10,000/acre/year.
4. **Soil Health Card** – free soil testing every 2 years.
5. **PKSY** – drip/sprinkler subsidy up to 55%.
Check the **Government Schemes** page for details and official links.
🌱 *Verify eligibility on the official portal — AgriShield never guarantees eligibility.*`,
    te: `**ప్రభుత్వ పథకాలు:**
1. **PM-KISAN** – రైతు కుటుంబాలకు ₹6,000/సంవత్సరం.
2. **PMFBY** – పంట బీమా, ప్రీమియం 1.5-2%.
3. **రైతు బంధు** (తెలంగాణ) – ఏటా ₹10,000/ఎకరు.
4. **Soil Health Card** – 2 సంవత్సరాలకు ఒకసారి ఉచిత మట్టి పరీక్ష.
5. **PKSY** – బిందు/స్ప్రింక్లర్ సప్సిడీ 55% దాకా.
వివరాలు **Government Schemes** page లో.
🌱 *అధికారిక పోర్టల్‌లో అర్హత తప్పక ధృవీకరించండి.*`,
  },
  {
    patterns: ['organic', 'natural', 'bio', 'eco', 'sustainable', 'సేంద్రీయ', 'సహజ', 'పర్యావరణ'],
    en: `**Eco-friendly farming practices that actually work:**
1. Replace half your chemical fertilizer with compost/FYM — same yield, healthier soil.
2. Use neem oil and bio-pesticides; reserve chemicals for emergencies.
3. Grow legumes (green gram, pigeon pea) every other season — free nitrogen from the air.
4. Mulch with crop residue — cuts weeds, saves water, feeds soil.
5. Maintain field bunds and hedgerows to reduce wind and soil erosion.
🌱 *Every eco step also cuts cost — sustainability and profit go together.*`,
    te: `**నిజమైన పర్యావరణ పద్ధతులు:**
1. రసాయన ఎరువు సగం తగ్గించుకుని కంపోస్ట్/కొట్లు ఎరువు వేయండి — దిగుబడి అంతే, మట్టి బాగుంటుంది.
2. వేపనూనె, జీవ పిచికారి వాడును; రసాయన ఎమర్జెన్సీలో.
3. ప్రతి రెండు సీజన్లకు పప్పుధాన్యాలు పండించండి — గాలి నుండి ఉచిత నత్రజని.
4. పంట అవశేషాలతో మల్చ్ — కలుపు తగ్గుతుంది, నీరు ఆదా, మట్టి పోషణ.
5. పొలం అంచులు కట్టుకోండి — గాలి, మట్టికోత తగ్గుతాయి.
🌱 *ప్రతి eco అడుగు కూడా ఖర్చు తగ్గిస్తుంది.*`,
  },
  {
    patterns: ['weed', ' కలుపు'],
    en: `**Weed control (chemical-free first):**
1. Inter-cultivate or manually weed in the first 30-45 days — most yield loss happens then.
2. Use mulch or cover crops to suppress weeds physically.
3. Avoid tilling wet soil — it brings up weed seeds.
4. Use only recommended herbicide per crop label if weed load is heavy.
🌱 *Prevention: dense planting within row-spacing Smothers many weeds.*`,
    te: `**కలుపు నియంత్రణ (రసాయనం లేని పద్ధతి మొదట):**
1. మొదటి 30-45 రోజుల్లో inter-cultivation/దూరం చేయండి — దిగుబడి నష్టం ఎక్కువ ఇక్కడే.
2. మల్చ్/కవర్ పంటలతో సహజంగా కలుపు అణచండి.
3. తడి మట్టిలో దున్నకండి — కలుపు విత్తనాలు బయటకొస్తాయి.
4. అధికంగా ఉంటే పంట లేబుల్ ప్రకారం సూచించిన కలుపు నాశకం మాత్రమే.
🌱 *నివారణ: సరైన spacing తో దట్టంగా నాటితే కలుపు తక్కువే ఉంటుంది.*`,
  },
  {
    patterns: ['yield', 'production', 'growth', 'దిగుబడి', 'పంట పెరగడం'],
    en: `**Low yield — how to turn it around:**
1. Check soil score — low N/P/K explains most yield gaps.
2. Confirm irrigation timing during flowering/grain-filling stages.
3. Scout for disease/pest damage; treat early.
4. Avoid over-fertilizing — imbalanced nutrition burns yield.
5. Compare your yield with the district average to find the gap.
🌱 *Add the numbers to AgriShield analytics — patterns over 2-3 seasons reveal the real issue.*`,
    te: `**తక్కువ దిగుబడి — మెరుగుదల:**
1. మట్టి స్కోర్ చూడండి — N/P/K లోపం సాధారణ కారణం.
2. పుష్పించే/విత్తనం నిండే దశలో సేద్యం సమయానికి చేయండి.
3. తెగులు/కీటక నష్టం చూసి వెంటనే చర్య తీసుకోండి.
4. ఎక్కువ ఎరువు వేయకండి — అసమతుల్యం దిగుబడిని దెబ్బతీస్తుంది.
5. మీ దిగుబడి జిల్లా సగటుతో పోల్చండి.
🌱 *AgriShield analytics లో 2-3 సీజన్ల డేటా చూస్తే నిజమైన సమస్య కనిపిస్తుంది.*`,
  },
  {
    patterns: ['hello', 'hi', 'namaste', 'hey', 'start', 'help me', 'నమస్తే', 'హలో', 'సహాయం'],
    en: `Namaste! 👋 I'm AgriShield AI Assistant. Tell me your farming problem and I'll help with an eco-friendly, step-by-step solution.

Try asking things like:
• "Why is my crop yellowing?"
• "How do I control pests without chemicals?"
• "Is rain expected this week?"
• "What crop should I grow on red soil?"
• "How can I improve my profit?"

What would you like to solve today? 🌱`,
    te: `నమస్తే! 👋 నేను AgriShield AI సహాయకం. మీ వ్యవసాయ సమస్య చెప్పండి, పర్యావరణదారుణమేరుగా దశలవారీ పరిష్కారం ఇస్తాను.

ఇలా అడగండి:
• "నా పంట ఆకులు ఎందుకు పసుపు?"
• "రసాయనం లేకుండా కీటకాలు ఎలా నియంత్రించాలి?"
• "ఈ వారం వర్షం ఉందా?"
• "ఎర్ర నేల మీద ఏ పంట?"
• "లాభం ఎలా పెంచాలి?"

ఈరోజు ఏ సమస్య solve చేయాలి? 🌱`,
  },
  {
    patterns: ['thank', 'thanks', 'ధన్యవాదాలు', 'thanks a lot'],
    en: `You're welcome! 😊 Keep scouting your fields and using natural inputs where possible. Ask me again anytime — I'm here to help you solve farm problems sustainably. 🌱`,
    te: `మీకు స్వాగతం! 😊 పొలాన్ని రోజూ పర్యవేక్షించండి, సహజ ఇన్‌పుట్లు వాడును. మళ్ళీ అడగండి — పర్యావరణ పరిష్కారంలో సహేతున్నాను. 🌱`,
  },
];

// ---------- follow-up memory ----------
const lastTopic = { current: null };

// ---------- contextual farm data answers ----------
function contextualAnswers(m, ctx) {
  const t = m.toLowerCase();
  const te = /[\u0C00-\u0C7F]/.test(m);

  // irrigation today
  if ((t.includes('irrigat') || t.includes('water') || t.includes('నీరు') || t.includes('సేద్యం')) && !t.includes('drain')) {
    if (ctx.weather) {
      const w = ctx.weather;
      if (w.rainProbability > 60) {
        return te
          ? `కాదు — ${w.location} లో వర్షం అవకాశం ${w.rainProbability}%. ఈ రోజు సేద్యం వద్దు, మురుగునీటి వసతి చూసుకోండి.`
          : `No — rain chance in ${w.location} is ${w.rainProbability}%. Skip irrigation today, ensure drainage.`;
      }
      if (ctx.irrigation) {
        return te
          ? `మీ తాజా విశ్లేషణ: మట్టి తేమ ${ctx.irrigation.soilMoisture}%, ఉష్ణోగ్రత ${ctx.irrigation.temperature}°C, వర్షం ${ctx.irrigation.rainProbability}%. సూచిన చర్య: ${ctx.irrigation.decision?.replace(/_/g, ' ')}. కారణం: ${ctx.irrigation.reason}`
          : `Your latest analysis: soil moisture ${ctx.irrigation.soilMoisture}%, temp ${ctx.irrigation.temperature}°C, rain chance ${ctx.irrigation.rainProbability}%. Decision: ${ctx.irrigation.decision?.replace(/_/g, ' ')}. Reason: ${ctx.irrigation.reason}`;
      }
      return te
        ? `${w.location} లో వర్షం అవకాశం ${w.rainProbability}%, ఉష్ణోగ్రత ${w.temperature}°C. 10-15 సెం.మీలో మట్టి తేమ తనిఖీ చేసి పొడి ఉంటే నీరు పోయండి.`
        : `Current: ${w.location} — ${w.temperature}°C, rain chance ${w.rainProbability}%. Check moisture at 10-15 cm; irrigate only if dry.`;
    }
    if (ctx.irrigation) {
      return te
        ? `మీ తాజా విశ్లేషణ: మట్టి తేమ ${ctx.irrigation.soilMoisture}%, ఉష్ణోగ్రత ${ctx.irrigation.temperature}°C. సూచిన చర్య: ${ctx.irrigation.decision?.replace(/_/g, ' ')}.`
        : `Latest record: soil moisture ${ctx.irrigation.soilMoisture}%, temp ${ctx.irrigation.temperature}°C. Decision: ${ctx.irrigation.decision?.replace(/_/g, ' ')}.`;
    }
    return null;
  }

  // disease / latest scan
  if ((t.includes('disease') || t.includes('scan') || t.includes('blast') || t.includes('blight') || t.includes('తెగులు')) && ctx.latestScan) {
    const s = ctx.latestScan;
    if (s.risk === 'HIGH') {
      return te
        ? `మీ తాజా స్కాన్: ${s.disease} (${s.confidence}% నమోదు, HIGH ప్రమాదం). వెంటనే: ${(s.recommendations || []).slice(0, 2).join('; ')}.`
        : `Your latest scan: ${s.disease} (${s.confidence}% confidence, HIGH risk). Act now: ${(s.recommendations || []).slice(0, 2).join('; ')}.`;
    }
    return te
      ? `మీ తాజా స్కాన్: ${s.crop} — ${s.disease} (${s.confidence}%).`
      : `Your latest scan: ${s.crop} — ${s.disease} (${s.confidence}%).`;
  }

  // farm risk
  if ((t.includes('risk') || t.includes('ప్రమాద')) && ctx.farm) {
    return te
      ? `మీ పొలం "${ctx.farm.farmName}" (${ctx.farm.area} ${ctx.farm.unit}, ${ctx.farm.soilType}) — ప్రస్తుత పంట: ${ctx.farm.currentCrop || '—'}. పూర్తి రిస్క్ విశ్లేషణ Risk & Alerts పేజీలో చూడండి.`
      : `Your farm "${ctx.farm.farmName}" (${ctx.farm.area} ${ctx.farm.unit}, ${ctx.farm.soilType}) — crop: ${ctx.farm.currentCrop || '—'}. Full risk report is on the Risk & Alerts page.`;
  }

  // weather
  if (t.includes('weather') || t.includes('వాతావరణ') || t.includes('rain') || t.includes('వర్షం')) {
    if (ctx.weather) {
      const w = ctx.weather;
      return te
        ? `${w.location} తాజా: ${w.temperature}°C, తేమ ${w.humidity}%, వర్షం అవకాశం ${w.rainProbability}%, గాలి ${w.windSpeed} km/h, ${w.condition}.`
        : `${w.location} now: ${w.temperature}°C, humidity ${w.humidity}%, rain chance ${w.rainProbability}%, wind ${w.windSpeed} km/h, ${w.condition}.`;
    }
    return null;
  }

  // soil score
  if ((t.includes('soil') || t.includes('మట్టి')) && ctx.soil) {
    const s = ctx.soil;
    return te
      ? `మీ తాజా మట్టి విశ్లేషణ: స్కోర్ ${s.score}/100, pH ${s.ph} (${s.phCondition}), నత్రజని ${s.nitrogenStatus}, భాస్వరం ${s.phosphorusStatus}, పొటాషియం ${s.potassiumStatus}.`
      : `Latest soil analysis: score ${s.score}/100, pH ${s.ph} (${s.phCondition}), N ${s.nitrogenStatus}, P ${s.phosphorusStatus}, K ${s.potassiumStatus}.`;
  }

  return null;
}

// ---------- pick best fuzzy topic ----------
function matchTopic(message) {
  const t = message.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const entry of KB) {
    let score = 0;
    for (const pat of entry.patterns) {
      if (t.includes(pat)) score += 3;
      else if (fuzzyIncludes(t, pat)) score += 1.5;
    }
    if (score > bestScore) { bestScore = score; best = entry; }
  }
  return bestScore > 0 ? { entry: best, score: bestScore } : null;
}

// ---------- main responder ----------
function chatRespond(message, language = 'English', context = {}) {
  const m = String(message || '').toLowerCase().trim();
  const isTe = language.toLowerCase().includes('telugu') || language === 'తెలుగు' || /[\u0C00-\u0C7F]/.test(message);

  // 1. Real-time context answers (irrigation today, latest scan, soil, weather, risk)
  const ctx = contextualAnswers(m, context || {});
  if (ctx) {
    lastTopic.current = 'context';
    return ctx;
  }

  // 2. Follow-up reference to previous topic — only for short, clearly-referential phrases
  if (lastTopic.current && lastTopic.current !== 'context' &&
      /^(prevention|నీవారణ|tell me more|more|how|what about prevention|మరింత|details?)[?\. ]*$/i.test(m)) {
    const entry = KB.find((e) => e.patterns.includes(lastTopic.current)) || KB.find((e) => e.patterns[0] === lastTopic.current);
    if (entry) return isTe ? entry.te : entry.en;
  }

  // 3. Topic match (fuzzy)
  const hit = matchTopic(m);
  if (hit) {
    lastTopic.current = hit.entry.patterns[0];
    return isTe ? hit.entry.te : hit.entry.en;
  }

  // 4. Clarifying question for vague inputs
  if (m.length < 12 || /^(help|ok|yes|no|hmm|what|why|how|explain|problem|issue)$/i.test(m)) {
    return isTe
      ? `దయచేసి మీ సమస్య కొంచెం వివరంగా చెప్పండి. ఉదాహరణకు: "ఆకుల్లో మచ్చలు", "దిగుబడి తక్కువ", "సేద్యం ఎప్పుడు", "ఎరువులు ఏవి". నేను దశలవారీ పరిష్కారం చెప్తాను. 🌱`
      : `Please describe your problem a bit more — e.g. "spots on leaves", "low yield", "when to irrigate", "which fertilizer". I'll give you a step-by-step solution. 🌱`;
  }

  // 5. Friendly, structured fallback
  lastTopic.current = null;
  return isTe
    ? `మీ ప్రశ్నకు నేను పూర్తిగా అర్థమయిన్. కానీ సహాయం చేయాలనుకుంటున్నాను. దయచేసి ఏమి సమస్యో చెప్పండి: పంట, తెగులు, నీరు, మట్టి, ఎరువు, వాతావరణం, మార్కెట్ ధర, లాభం, లేక ప్రభుత్వ పథకం? నేను దశలవారీ పరిష్కారం ఇస్తాను. 🌱`
    : `I want to help, but I didn't fully catch your question. Please tell me the farming problem you're facing — crop, pest, water, soil, fertilizer, weather, market price, profit, or a government scheme? I'll give you a step-by-step, eco-friendly solution. 🌱`;
}

module.exports = { chatRespond };
