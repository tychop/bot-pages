import { Page, Section, Text, Table, Segmented, Bars, Callout, LinkCards, NumberedList, ProsCons, useState, h } from "./runtime.js";
const eur = (n) => "€" + n.toLocaleString("nl-NL");
const macs = [
  { model: "Mac Studio M5 Max", chip: "18c CPU / 40c GPU", bw: 614, memory: "128GB", storage: "512GB", apple: 5889, best: 5889, where: "Apple NL (configure)", condition: "new", form: "desktop", note: "Cheapest 128GB Mac" },
  { model: "Mac Studio M5 Max", chip: "18c CPU / 40c GPU", bw: 614, memory: "128GB", storage: "1TB", apple: 6219, best: 5899, where: "MediaMarkt", condition: "new", form: "desktop", note: "MediaMarkt Black Friday €5.899 (was €6.219; temporarily unavailable online); UpGreatest €6.089 ETA 5 Dec; Amac €6.219 (as of Nov 12; amac.nl down for maintenance Nov 13); MediaMarkt still out of stock online Nov 13" },
  { model: "Mac Studio M5 Max (open box)", chip: "18c CPU / 40c GPU", bw: 614, memory: "128GB", storage: "1TB", apple: 6219, best: 5989, where: "UpGreatest (open box)", condition: "refurb", form: "desktop", note: "Listed Nov 3; price up Nov 10 from €5.889 to €5.989; Op bestelling, expected 18 Nov (was in stock on Nov 12)" },
  { model: "Mac Studio M5 Max", chip: "18c CPU / 40c GPU", bw: 614, memory: "128GB", storage: "2TB", apple: 6769, best: 6599, where: "MediaMarkt", condition: "new", form: "desktop", note: "Out of stock online since Nov 3 (still Nov 13); UpGreatest €6.639, in stock, delivery expected 17 Nov" },
  { model: "Mac Studio M5 Max (open box)", chip: "18c CPU / 40c GPU", bw: 614, memory: "128GB", storage: "2TB", apple: 6769, best: 6439, where: "UpGreatest (open box)", condition: "refurb", form: "desktop", note: "Listed Nov 3; now expected 24 Dec (was 18 Nov on Nov 12)" },
  { model: 'MacBook Pro 14" M5 Max', chip: "18c CPU / 40c GPU", bw: 614, memory: "128GB", storage: "2TB", apple: 7709, best: 7709, where: "Apple NL (configure)", condition: "new", form: "laptop", note: "UpGreatest's €7.309 listing (in stock on Nov 12) was gone on Nov 13 (page redirects to the category); no other shop price found; 2TB is the minimum at 128GB" },
  { model: 'MacBook Pro 14" M5 Max (open box)', chip: "18c CPU / 40c GPU", bw: 614, memory: "128GB", storage: "2TB", apple: 7709, best: 7109, where: "UpGreatest (open box)", condition: "refurb", form: "laptop", note: "Op bestelling, expected 5 Dec; display type not stated" },
  { model: 'MacBook Pro 16" M5 Max', chip: "18c CPU / 40c GPU", bw: 614, memory: "128GB", storage: "2TB", apple: 7949, best: 7749, where: "UpGreatest", condition: "new", form: "laptop", note: "Op bestelling, expected 5 Dec (was in stock Nov 9), Space Black" },
  { model: 'MacBook Pro 16" M5 Max (open box)', chip: "18c CPU / 40c GPU", bw: 614, memory: "128GB", storage: "2TB", apple: 7949, best: 7399, where: "UpGreatest (open box)", condition: "refurb", form: "laptop", note: "Op bestelling, expected 24 Nov (was 18 Nov on Nov 12); display type not stated" },
  { model: 'MacBook Pro 16" M5 Max', chip: "18c CPU / 40c GPU", bw: 614, memory: "128GB", storage: "4TB", apple: 9049, best: 9049, where: "Apple NL (configure)", condition: "new", form: "laptop", note: "UpGreatest's €8.849 listing (in stock on the morning of Nov 11) was gone by the Nov 11 evening check; no other shop price found" },
  { model: 'MacBook Pro 16" M5 Max (open box)', chip: "18c CPU / 40c GPU", bw: 614, memory: "128GB", storage: "4TB", apple: 9049, best: 8499, where: "UpGreatest (open box)", condition: "refurb", form: "laptop", note: "New listing Nov 11; Op bestelling, expected 24 Nov (in stock that morning); €550 below Apple's €9.049; display type not stated" },
  { model: 'MacBook Pro 14" OLED M5 Max', chip: "18c CPU / 40c GPU", bw: 614, memory: "128GB", storage: "2TB", apple: 8109, best: 8109, where: "Apple NL (configure)", condition: "new", form: "laptop", note: "PROLED XDR; on general sale since Nov 6 (pre-order banner gone Nov 9); delivery quote last seen Nov 6: 23–26 Nov (not re-checked Nov 13)" },
  { model: 'MacBook Pro 16" OLED M5 Max', chip: "18c CPU / 40c GPU", bw: 614, memory: "128GB", storage: "2TB", apple: 8449, best: 8449, where: "Apple NL (configure)", condition: "new", form: "laptop", note: "PROLED XDR; on general sale since Nov 6 (pre-order banner gone Nov 9); 128GB total €8.449 (48GB base €6.249 + €2.200); delivery quote not re-checked Nov 13" },
  { model: "Mac Studio M5 Ultra", chip: "30c CPU / 64c GPU", bw: 1200, memory: "256GB", storage: "1TB", apple: 11049, best: 11049, where: "Apple NL (configure)", condition: "new", form: "desktop", note: "No 128GB option; next tier up. Amac €11.049 (not in stock online)" },
  { model: "Mac Studio M5 Ultra", chip: "30c CPU / 64c GPU", bw: 1200, memory: "256GB", storage: "2TB", apple: 11599, best: 11419, where: "UpGreatest", condition: "new", form: "desktop", note: "Build to order, ETA 22 Feb 2027" },
  { model: "Mac Studio M5 Ultra (open box)", chip: "30c CPU / 64c GPU", bw: 1200, memory: "256GB", storage: "2TB", apple: 11599, best: 11219, where: "UpGreatest (open box)", condition: "refurb", form: "desktop", note: "Listed Nov 3; back to a long wait, expected 22 Feb 2027 (was 23 Nov on Nov 12)" },
  { model: "Mac Studio M5 Ultra", chip: "36c CPU / 80c GPU", bw: 1200, memory: "256GB", storage: "1TB", apple: 12479, best: 12479, where: "Apple NL (configure)", condition: "new", form: "desktop", note: "Ultra pick: top GPU config at 256GB (+€1.430 over 30c/64c)" },
  { model: "Mac Studio M5 Ultra", chip: "36c CPU / 80c GPU", bw: 1200, memory: "256GB", storage: "2TB", apple: 13029, best: 13029, where: "Apple NL (configure)", condition: "new", form: "desktop", note: "No reseller listing found for 36c/80c at 256GB" },
  { model: "Mac Studio M5 Ultra", chip: "36c CPU / 80c GPU", bw: 1200, memory: "512GB", storage: "1TB", apple: 25129, best: 24449, where: "UpGreatest", condition: "new", form: "desktop", note: "UpGreatest €680 below Apple, ETA 22 Feb 2027; Apple delivery about early December" },
  { model: 'MacBook Pro 16" M4 Max (Apple refurbished)', chip: "16c CPU / 40c GPU", bw: 546, memory: "128GB", storage: "8TB", apple: null, best: 9579, where: "Apple Certified Refurbished", condition: "refurb", form: "laptop", note: 'Listed Nov 13 (G1FWNN/A): nano-texture, Space Black, first released Oct 2024, ships within 24 h, limited stock; previous-generation chip; a new M5 Max 16" 128GB/8TB nano-texture is €11.414 at Apple NL' }
];
function App() {
  const [kind, setKind] = useState("all");
  const shown = macs.filter(
    (m) => kind === "all" ? true : kind === "new" || kind === "refurb" ? m.condition === kind : m.form === kind
  );
  const rows = shown.map((m) => [
    m.model,
    m.chip,
    m.bw >= 1e3 ? (m.bw / 1e3).toFixed(1) + " TB/s" : m.bw + " GB/s",
    m.memory + " / " + m.storage,
    m.apple === null ? "not listed" : eur(m.apple),
    eur(m.best),
    m.where,
    m.note
  ]);
  const cheapest = [
    macs[0],
    macs[4],
    macs[3],
    macs[5],
    macs[8],
    macs[11]
  ];
  const bars = cheapest.slice().sort((a, b) => b.best - a.best).map((m) => ({ label: m.model + " " + m.memory + "/" + m.storage, value: m.best, display: eur(m.best), meta: m.condition === "refurb" ? "open box" : "new" }));
  const studioIndex = bars.findIndex((b) => b.value === 5889);
  return /* @__PURE__ */ h(
    Page,
    {
      title: "Mac for local AI: 128GB tracker",
      summary: "Every 128GB Apple Silicon Mac you can buy in the Netherlands, with Apple and retailer prices as of Nov 13, 2026, and what that memory gets you for local LLMs, image and video generation.",
      width: "wide"
    },
    /* @__PURE__ */ h(Section, { heading: "Recommendation" }, /* @__PURE__ */ h(Text, null, "[Back to start](index.html)"), /* @__PURE__ */ h(Callout, { lead: "Best value: Mac Studio M5 Max 40-core GPU, 128GB (unchanged since Oct 26)" }, `€5.889 at Apple NL with 512GB storage. UpGreatest's open-box 128GB/1TB went up €100 to €5.989 on Nov 10 and is now Op bestelling (expected 18 Nov; it was in stock on Nov 12); new it is €6.089 (ETA 5 Dec). MediaMarkt shows a Black Friday price of €5.899 on the 128GB/1TB (still out of stock online) and still lists 128GB/2TB at €6.599 out of stock; UpGreatest has the 128GB/2TB new for €6.639, in stock (delivery expected 17 Nov), the quickest 128GB Studio right now, and open box for €6.439 (now expected 24 Dec). Same 614 GB/s bandwidth as the MacBook Pro M5 Max for about €1.700 less. Pick the 14" MacBook Pro only if you need it portable: €7.109 open box at UpGreatest (Op bestelling, expected 5 Dec) or €7.709 new at Apple NL (UpGreatest's €7.309 new listing was gone on Nov 13). Need 4TB? UpGreatest's open-box 16" 128GB/4TB is €8.499 (Op bestelling, expected 24 Nov); its new one at €8.849 is no longer listed. Apple Certified Refurbished NL has a previous-generation 16" M4 Max 128GB/8TB nano-texture for €9.579 (listed Nov 13). The new OLED MacBook Pro (€8.109) costs about €400 more for the same chip, which buys nothing for AI work.`)),
    /* @__PURE__ */ h(Section, { heading: "Ultra pick: Mac Studio M5 Ultra, 256GB", caption: "Second pick for more power. Apple NL configurator prices incl. 21% VAT, re-verified Nov 13, 2026; reseller prices as listed the same day (Amac as of Nov 12; its site was down for maintenance on Nov 13)." }, /* @__PURE__ */ h(Callout, { lead: "More power: Mac Studio M5 Ultra 36c CPU / 80c GPU, 256GB", tone: "info" }, "€12.479 at Apple NL with 1TB (€11.049 for the 30c/64c version). The €11.219 open-box 30c/64c 256GB/2TB at UpGreatest is back to a long wait, expected 22 Feb 2027 (it showed 23 Nov on Nov 12), the same as new ones (ETA 22 Feb 2027). The 18c/40c M5 Max is the cheapest way to 128GB, but its CPU and GPU are modest. The Ultra has 1.2 TB/s of memory bandwidth against 614 GB/s and 80 GPU cores against 40, so about twice the Max on paper for LLM tokens/s and for image and video generation, plus 256GB of memory: 128GB more headroom than the Max pick. Against the Max 128GB/1TB at Apple (€6.219) that costs €6.260 more (36c/80c) or €4.830 more (30c/64c)."), /* @__PURE__ */ h(
      Table,
      {
        columns: ["Storage (256GB memory)", "M5 Ultra 30c/64c, Apple NL", "M5 Ultra 36c/80c, Apple NL", "Reseller prices"],
        rows: [
          ["1TB", "€11.049", "€12.479", "Amac €11.049 (30c/64c, not in stock online)"],
          ["2TB", "€11.599", "€13.029", "UpGreatest €11.419 new (30c/64c, ETA 22 Feb 2027) or €11.219 open box (expected 22 Feb 2027)"],
          ["4TB", "€12.699", "€14.129", "None found"],
          ["8TB", "€14.899", "€16.329", "None found"],
          ["16TB", "€19.299", "€20.729", "None found"]
        ],
        emphasis: 0,
        align: ["start", "end", "end", "start"]
      }
    ), /* @__PURE__ */ h(
      NumberedList,
      {
        items: [
          "Bandwidth sets token speed, and 1.2 TB/s is about 2x the Max 40c. GPU cores set image and video speed: 80 is 2x the Max 40c, and the 30c/64c has 64 (1.6x).",
          "Memory: 256GB fits 200B+ mixture-of-experts models at 4-bit, or several large models resident at once, which 128GB cannot.",
          "Community figures, indicative only: llmcheck.net puts M5 Max 128GB vs M5 Ultra at 43 vs 88 tok/s on Qwen3.5-122B-A10B and 76 vs 120 tok/s on gpt-oss-120B, so the gain is about 2x on one model and about 1.6x on the other, not a guaranteed 2x. A NetworkChuck review of an Apple-loaned 256GB Ultra measured Qwen3.5-122B-A10B at 4-bit at 65.3 tok/s with a 32K-token prompt and FLUX.2 klein 4B at 1.77 s per image (the M5 Max Studio figure of about 5 s comes from a different test).",
          "Not found in NL: any reseller price for the 36c/80c at 256GB (UpGreatest's configurator adds €1.430 for the 36c/80c option, but lists no price for that config), and MediaMarkt only lists the 96GB Ultra."
        ]
      }
    )),
    /* @__PURE__ */ h(Section, { heading: "New this week", caption: "Announced Oct 27-28, 2026, on sale at apple.com/nl since Nov 6" }, /* @__PURE__ */ h(
      NumberedList,
      {
        items: [
          `Nov 13 (about 15:35): two real changes. Apple Certified Refurbished NL lists a 128GB Mac again, the first since Oct 26: MacBook Pro 16" M4 Max 16c CPU / 40c GPU, 128GB/8TB, nano-texture, Space Black (G1FWNN/A), €9.579, ships within 24 h, limited stock (546 GB/s; a new M5 Max 16" 128GB/8TB nano-texture is €11.414 at Apple NL). And UpGreatest's new MacBook Pro 14" M5 Max 128GB/2TB (€7.309, in stock on Nov 12) is gone: its page now redirects to the category. The cheapest new 14" 128GB is now Apple NL at €7.709, and the open box is still €7.109. Apple NL is unchanged: every 128GB+ configurator total and base price is the same. Apple Newsroom NL and global have no new Mac or chip (the only new post is Apple HomeView, Nov 13). MediaMarkt is unchanged at €5.899 / €6.599, both out of stock online. UpGreatest stock moves: open-box Studio Max 128GB/1TB (€5.989) went from in stock to Op bestelling, expected 18 Nov. Open-box Studio Max 128GB/2TB is now 24 Dec (was 18 Nov). Open-box Ultra 256GB/2TB is back to 22 Feb 2027 (was 23 Nov). New Studio Max 128GB/2TB is still in stock, delivery 17 Nov. Open-box 16" 128GB/2TB and 128GB/4TB: 24 Nov. New Studio Max 128GB/1TB, new 16" 128GB/2TB, open-box 14" 128GB/2TB and OLED 14" 48GB: 5 Dec. Ultra build-to-order: 22 Feb 2027. Amac's site was down for maintenance (HTTP 503), so its prices are still the Nov 12 ones. Tweakers is still behind the DPG consent wall. New llamaperf report (Nov 13): Qwen3.8 Flash-Next on an M5 Max 128GB averages about 68 tok/s over an agent session (mlx-serve, 4.7-bit MLX, 100K–190K context). Medians are unchanged.`,
          'Nov 12 afternoon (about 15:30): re-checked everything live. No changes at Apple NL (every 128GB+ configurator total and every base price unchanged), in Apple Newsroom NL or global (no new Mac or chip), at MediaMarkt (€5.899 / €6.599, both still out of stock online), Amac, Coolblue or Bol. No UpGreatest price changes on 128GB+ configs and no new or removed listings; delivery dates moved a day: open-box Studio Max 128GB/1TB, new Studio Max 128GB/2TB and new 14" 128GB/2TB in stock, delivery 14 Nov; new Studio Max 128GB/1TB, new 16" 128GB/2TB, open-box 14" 128GB/2TB and OLED 14" 48GB 4 Dec; Ultra build-to-order 20 Feb 2027. Apple Certified Refurbished NL still tops out at 64GB (only cheaper models rotated). llamaperf medians unchanged; Tweakers still behind the DPG consent wall.',
          'Nov 12 morning: no new Macs, chips or options at Apple NL or in Apple Newsroom NL (the only new post is the Nov 11 Apple Arcade holiday lineup), and no price changes on any 128GB+ config at Apple NL (all configurator totals re-checked live, incl. OLED and Ultra 512GB), UpGreatest, MediaMarkt or Amac. No new or removed offers. UpGreatest stock moved: the new Mac Studio M5 Max 128GB/2TB (€6.639) and the new MacBook Pro 14" M5 Max 128GB/2TB (€7.309) are in stock again, delivery expected 13 Nov (both were ETA 3 Dec on the evening of Nov 11). Other UpGreatest ETAs unchanged: open-box Studio Max 128GB/1TB in stock (13 Nov); new Studio Max 128GB/1TB, new 16" 128GB/2TB, open-box 14" 128GB/2TB and OLED 14" 48GB 3 Dec; open-box Studio Max 128GB/2TB and 16" 128GB/2TB 18 Nov; open-box 16" 128GB/4TB and Ultra 256GB/2TB 23 Nov; Ultra build-to-order 19 Feb 2027. MediaMarkt still shows Black Friday €5.899 (128GB/1TB) and €6.599 (128GB/2TB), both unavailable online. Apple Certified Refurbished NL still tops out at 64GB. Bol now returns search results to automated access but lists no 128GB+ Mac; Tweakers is still behind the DPG consent wall. No new benchmarks: llamaperf medians and reports for the M5 Max 128GB and M5 Ultra 256GB/512GB are unchanged (as of 12 Nov).',
          `Nov 11: no new Macs, chips or options at Apple NL or in Apple Newsroom NL (latest post still the Nov 9 Apple Music update), and no price changes on any 128GB+ config at Apple NL (all configurator totals re-checked live, incl. OLED and Ultra 512GB), MediaMarkt or Amac. New offer: UpGreatest lists an open-box MacBook Pro 16" M5 Max 128GB/4TB at €8.499 (€550 below Apple's €9.049 and €350 below its new one), in stock, delivery expected 12 Nov. UpGreatest dropped its €250 discount on the OLED 14" M5 Max 48GB/2TB (now €5.909, same as Apple; not a 128GB config). UpGreatest ETAs moved a day: new Studio Max 128GB 1TB/2TB, new 16" 128GB/2TB and OLED 14" 48GB 2 Dec; open-box 16" 128GB/2TB 21 Nov; Ultra build-to-order and open-box Ultra 256GB/2TB 18 Feb 2027; open-box Studio Max 128GB/1TB, the 14" 128GB/2TB new and open box, and the 16" 128GB/4TB new are in stock, delivery 12 Nov; open-box Studio Max 2TB still est. 21 Dec. MediaMarkt still shows Black Friday €5.899 (128GB/1TB) and €6.599 (128GB/2TB), both temporarily unavailable online. Apple Certified Refurbished NL still has no 128GB Mac (largest now 64GB). llamaperf (as of 11 Nov): medians unchanged; a new Nov 10 report has Qwen3.8 Flash-Next Uncensored at 239.3 tok/s on an M5 Ultra 256GB (oQ5e, MTP speculative decoding, 4K prompt; 127 tok/s at 64K). Not a product yet: 9to5Mac reports a leaked Apple app, Harbor, for running local models across Thunderbolt 5-linked Macs (private preview, unannounced). Nov 11 evening (about 17:30): re-checked everything live. Apple NL unchanged: every 128GB+ configurator total, every buy page and Newsroom NL (latest post still the Nov 9 Apple Music update). MediaMarkt (Black Friday €5.899 / €6.599, both still sold out online) and Amac unchanged; Apple Certified Refurbished NL still tops out at 64GB. Removed offer: UpGreatest no longer lists the new MacBook Pro 16" M5 Max 128GB/4TB at €8.849, so the best new 128GB/4TB price is Apple's €9.049 (the €8.499 open-box unit is still listed). No UpGreatest price changes, but stock moved: the open-box Ultra 30c/64c 256GB/2TB (€11.219) is now expected 23 Nov (was 18 Feb 2027) and the open-box Studio Max 128GB/2TB (€6.439) 18 Nov (was est. 21 Dec); the 14" 128GB/2TB new (€7.309) and open box (€7.109) went from in stock to Op bestelling, expected 3 Dec; the open-box 16" 128GB/4TB (€8.499) is Op bestelling, expected 23 Nov; the open-box 16" 128GB/2TB is now 18 Nov; the open-box Studio Max 128GB/1TB is still in stock (delivery 13 Nov); new Studio Max 128GB, new 16" 128GB/2TB and OLED 14" 48GB are at ETA 3 Dec; Ultra build-to-order is 19 Feb 2027. New benchmark: Tom's Hardware (Nov 10) found a 256GB M5 Ultra finished an agentic llama.cpp test (Qwen 3.8 27B, MTP) in just under half the time of a DGX Spark-class GB10 with about 16% less energy, but very large models such as DeepSeek V4.1 Flash still run slowly on Mac engines. llamaperf has no new reports dated Nov 11.`,
          `Nov 10: no new Macs, chips or options at Apple NL or in Apple Newsroom NL (the only new posts are Q4 results and Apple Music), and no price changes on any 128GB+ config at Apple NL (all configurator totals re-checked live), MediaMarkt or Amac. UpGreatest raised the open-box Mac Studio M5 Max 128GB/1TB from €5.889 to €5.989, and it is now in stock with delivery expected 11 Nov (was Op bestelling, 19 Nov). UpGreatest stock/ETA moves: open-box MacBook Pro 16" M5 Max 128GB/2TB (€7.399) flipped to Op bestelling, expected 20 Nov; the new 16" 128GB/2TB (€7.749) is now Op bestelling, expected 1 Dec; the 14" 128GB/2TB new (€7.309) and open box (€7.109) and the 16" 128GB/4TB (€8.849) are in stock, delivery 11 Nov; new Studio Max 128GB 1TB/2TB and OLED 14" 48GB 1 Dec; open-box Studio Max 2TB est. 21 Dec; Ultra build-to-order and open-box Ultra 256GB/2TB 17 Feb 2027. MediaMarkt still shows Black Friday €5.899 on the Studio 128GB/1TB and €6.599 on 128GB/2TB, both out of stock online. Apple Certified Refurbished NL still has no 128GB Mac (largest 48GB). llamaperf (as of 10 Nov): medians unchanged; new Nov 10 user report of Kimi K3.1 at 2 tok/s on an M5 Max 128GB MacBook Pro (ds4 engine). gpuwerk.com (Nov 7) compiled llama.cpp's Llama 2 7B Q4_0 test: M5 Max 40c 120 tok/s, M5 Ultra 80c 179, RTX 5090 290.`,
          'Nov 9: no new Macs, chips or options at Apple NL or in Apple Newsroom NL (latest release still Oct 28), and no price changes on any 128GB+ config at Apple NL (all configurator totals re-checked live), UpGreatest, MediaMarkt or Amac. The PROLED XDR, M6 MacBook Pro and M6 iMac pages no longer show the pre-order banner: they are now on general sale. UpGreatest ETAs moved: open-box Studio Max 128GB/1TB (€5.889) now expected 19 Nov (was 27 Nov); open-box Ultra 30c 256GB/2TB (€11.219) is back to a long wait, delivery 16 Feb 2027 (was 27 Nov); new Studio Max 128GB 1TB/2TB 30 Nov; open-box Studio Max 2TB 19 Dec; Ultra build-to-order 16 Feb 2027. Open-box MacBook Pro 14" and 16" M5 Max 128GB/2TB (€7.109 / €7.399) in stock, delivery expected 10 Nov. MediaMarkt still shows Black Friday €5.899 on the Studio 128GB/1TB, still out of stock online. Apple Certified Refurbished NL still has no 128GB Mac (largest 48GB). llamaperf (as of 9 Nov): M5 Ultra 256GB median 73.4 tok/s on DeepSeek V4.1 Flash 552B at 3-bit and 74.7 tok/s on Qwen3.5 122B-A10B at 4-bit; M5 Max 128GB headline unchanged at 17.2 tok/s (Qwen3.6 27B 8-bit).',
          'Nov 6: no new Macs in Apple Newsroom. MediaMarkt cut the Studio M5 Max 128GB/1TB to €5.899 for Black Friday (still temporarily unavailable online). Open-box MacBook Pro 16" M5 Max 128GB/2TB (€7.399) is back in stock at UpGreatest (delivery expected 7 Nov; was Op bestelling 26 Nov). Open-box Studio Max 128GB/1TB and Ultra 256GB/2TB flipped from in stock to Op bestelling (expected 27 Nov). UpGreatest ETAs slipped a day (Studio Max / open-box Studios / OLED 48GB: 27 Nov; open-box Studio Max 2TB est. 16 Dec; Ultra BTO 13 Feb 2027). Apple NL configurator 128GB+ totals re-checked live (unchanged: Studio Max 128/2TB €6.769, Ultra 256/1TB €11.049/€12.479, OLED 14" 128/2TB €8.109). PROLED/M6/iMac still Bestel alvast / Verkrijgbaar vanaf 6 november; OLED 14" 128GB delivery quoted 23–26 Nov. Apple Certified Refurbished NL still has no 128GB Mac. llamaperf still shows M5 Max 128GB median 17.2 tok/s on Qwen3.6 27B 8-bit (as of Nov 6); oMLX posted fresh Nov 6 community runs. UpGreatest open-box MBP16 128GB/8TB product 5129 now redirects to the category page (listing gone).',
          'Nov 5: no new Macs, chips or options at Apple NL or in Apple Newsroom, and no Apple NL or UpGreatest price changes on 128GB+ configs. Open-box MacBook Pro 16" M5 Max 128GB/2TB (€7.399) flipped from in stock to Op bestelling, expected 26 Nov. UpGreatest ETAs slipped a day again (Studio Max / open-box Studios / OLED 48GB listing: 26 Nov; open-box Studio Max 128GB/2TB est. 15 Dec; Ultra BTO 12 Feb 2027). PROLED XDR still pre-order, arrives from Nov 6. MediaMarkt Studio 128GB listings still unavailable online. Apple Certified Refurbished NL still has no 128GB Mac (largest ~48GB). New public figures on llamaperf (as of Nov 5): M5 Max 128GB median 17.2 tok/s on Qwen3.6 27B 8-bit.',
          "Nov 4: no new Macs, chips or options at Apple NL or in Apple Newsroom, and no Apple NL price changes. UpGreatest marked two open-box Mac Studios as in stock with delivery expected 25 Nov: M5 Max 128GB/1TB (€5.889) and M5 Ultra 30c/64c 256GB/2TB (€11.219, previously estimated 10 Feb 2027). UpGreatest build-to-order ETAs moved a day (Studio M5 Max 25 Nov, Ultra 11 Feb 2027). Apple Certified Refurbished NL still has no 128GB Mac.",
          'MacBook Pro with PROLED XDR (tandem OLED, touch), 14" and 16", M5 Pro and M5 Max: on general sale at Apple NL since Nov 6. 128GB configs start at €8.109 (14") and €8.449 (16"), about €400 above the LCD model.',
          'MacBook Pro 14" with M6, from €2.329 and iMac 24" with M6, from €1.819: on sale since Nov 6, but both top out at 32GB, so neither fits this tracker.',
          "Mac Studio M5 Ultra (36c/80c) with 512GB: orderable since Oct 28 at €25.129 (1TB), delivery about early December. Only for models above 256GB.",
          'Gone from Apple NL: the M4 iMacs and the 10-core M5 MacBook Pro 14". Apple Certified Refurbished NL had no 128GB Mac from early November, so the two M4 Max refurbs from Oct 26 were removed; on Nov 13 a 16" M4 Max 128GB/8TB refurb (€9.579) appeared and is in the table.'
        ]
      }
    )),
    /* @__PURE__ */ h(Section, { heading: "All 128GB+ options", caption: "Prices incl. 21% VAT, as of Nov 13, 2026. Most 128GB configs are build to order." }, /* @__PURE__ */ h(
      Segmented,
      {
        options: [
          { value: "all", label: "All" },
          { value: "new", label: "New" },
          { value: "refurb", label: "Open box" },
          { value: "laptop", label: "Laptop" },
          { value: "desktop", label: "Desktop" }
        ],
        value: kind,
        onChange: (v) => setKind(v)
      }
    ), /* @__PURE__ */ h(
      Table,
      {
        columns: ["Model", "Chip", "Bandwidth", "Memory / SSD", "Apple price", "Best price", "Where", "Note"],
        rows,
        align: ["start", "start", "end", "end", "end", "end", "start", "start"]
      }
    )),
    /* @__PURE__ */ h(Section, { heading: "Cheapest way into each model" }, /* @__PURE__ */ h(Bars, { bars, emphasis: studioIndex })),
    /* @__PURE__ */ h(Section, { heading: "Local AI fit" }, /* @__PURE__ */ h(
      NumberedList,
      {
        items: [
          "Coding LLMs: a 70B model at 4-bit uses about 38–45 GB, so it fits with room for long context. oMLX measured Llama 3.3 70B 4-bit at 13.2 tok/s (1k context) and 11.6 tok/s (4k) on an M5 Max 40c 128GB.",
          "Newer mixture-of-experts models are much faster, because only a fraction of the weights are read per token. Single-user community reports on an M5 Max 128GB: gpt-oss 120B about 79 tok/s (Ollama) and a 27B Qwen at 4-bit about 68 tok/s (MLX). Treat these as indicative, not lab results; some runs use speculative decoding.",
          "Q8 70B (about 75 GB) and large MoE models also fit in 128GB; expect slower generation than Q4.",
          "Bandwidth sets token speed: every generated token reads the active weights from memory, so 614 GB/s (M5 Max) is about twice the speed of a 307 GB/s M5 Pro. The M5 Ultra has 1.2 TB/s, about twice the Max on paper; a review of an Apple-loaned 256GB Ultra measured Qwen3.5 122B-A10B at 4-bit at 65.3 tok/s with a 32K-token prompt, and image generation at 1.77 s per FLUX.2 klein 4B image.",
          "Image gen works well: FLUX.2 klein 4B ran at about 5 s per image and Qwen-Image at about 127 s on a 32-core M5 Max Studio (llmonmac.com). Compute-bound work like this is slower than on an RTX 4090/5090.",
          "Video gen runs, but it is the weakest fit; community reports put NVIDIA cards well ahead on speed.",
          "New Oct 30 (mostly community runs, indicative): llmcheck.net puts M5 Max 128GB vs M5 Ultra at 43 vs 88 tok/s on Qwen3.5-122B-A10B and 76 vs 120 tok/s on gpt-oss-120B; a Tbreak review measured gpt-oss-120B at 75.65 tok/s, steady over 20 runs, on a Studio M5 Max 128GB.",
          "Added Nov 2: Vše Smart ran 32 models in Ollama on a 256GB M5 Ultra (summarised by Bohemian Silicon): gpt-oss-120b 115 tok/s, Qwen3.5 122B-A10B 85, Llama 3.3 70B 23, Mistral Large 123B 14. Apple's own MLX figures for a 512GB M5 Ultra: Qwen 3.8 27B (BF16) 19.7 tok/s and Mistral Medium 3.5 128B (FP8) 7.7 tok/s at 8K context, about 1.6x an M3 Ultra.",
          "Added Nov 4 (public oMLX runs, compiled by swarchitect.net, updated Nov 4): Qwen3.8 27B at 4-bit decodes at 32.1 tok/s on an M5 Max 40c 128GB vs 51.5 on an M5 Ultra 80c (1.6x), and the 16K-token first-token wait is 20.5 s vs 10.2 s. A Nov 1 llamaperf user report has a 96GB M5 Ultra running gpt-oss:120b at 95-102 tok/s in Ollama.",
          "Updated Nov 9 (llamaperf community medians, plain runs): M5 Max 128GB still 17.2 tok/s on Qwen3.6 27B at 8-bit and 36.1 tok/s on DeepSeek V4 Flash 284B MoE at 4-bit. M5 Ultra 256GB: 73.4 tok/s on DeepSeek V4.1 Flash 552B (16B active) at 3-bit and 74.7 tok/s on Qwen3.5 122B-A10B at 4-bit; a Nov 7 user report has Qwen3.8 Flash-Next at about 50 tok/s with oMLX on a 256GB Ultra.",
          "Added Nov 10: gpuwerk.com (Nov 7) lined up llama.cpp's standard Llama 2 7B Q4_0 test: M5 Max 40c 120 tok/s generation and 3,220 tok/s prompt processing, M5 Ultra 80c 179 and 4,945, RTX 5090 290 and 14,073. The 5090 is faster but holds only 32GB, so 70B+ models favour the Mac. llamaperf medians are unchanged as of 10 Nov; a new Nov 10 report has Kimi K3.1 crawling at 2 tok/s on an M5 Max 128GB MacBook Pro (ds4 engine), a sign that 1T-class models are out of reach at 128GB.",
          "Added Nov 11: a new llamaperf user report (Nov 10) has Qwen3.8 Flash-Next Uncensored (oQ5e) at 239.3 tok/s generation and 4,317 tok/s prompt processing on an M5 Ultra 256GB with a 4K-token prompt, falling to 155 tok/s at 16K and 127 tok/s at 64K, peak memory 123 GB. It uses MTP speculative decoding, so it is not comparable with the plain-run medians, which are unchanged as of 11 Nov.",
          "Added Nov 13: a new llamaperf user report (Nov 13) has Qwen3.8 125B Flash-Next (6B active, iQ-MLX 4.7-bit) averaging about 68 tok/s over a full agent session on an M5 Max 128GB, with context growing to 100K–190K tokens (mlx-serve from the terminal, 96–100% prompt-cache hits). Long writes ran 55–95 tok/s. The user saw about 37 tok/s for the same model in LM Studio, so the engine matters a lot. Plain-run medians are unchanged as of 13 Nov.",
          "Added Nov 11 evening: Tom's Hardware (Nov 10) tested a 256GB M5 Ultra Mac Studio against a DGX Spark-class Dell GB10. With Qwen 3.8 27B in llama.cpp (MTP on), the Mac finished Artificial Analysis' AgentPerf-Local in just under half the time and used about 16% less energy. Large models lag: DeepSeek V4.1 Flash at 2-bit in llama.cpp needed 10 to 25 minutes to read the longest prompts, against under 5 minutes on a two-GB10 cluster; GLM 5.3 Flash decoded about 3x faster with the TensorFold engine than with llama.cpp. Software support, not memory, is the limit for the biggest models."
        ]
      }
    ), /* @__PURE__ */ h(
      ProsCons,
      {
        prosHeading: "Mac Studio",
        consHeading: "MacBook Pro",
        pros: ["About €1.700 cheaper for the same chip", "Better cooling for long runs", "512GB SSD option at 128GB"],
        cons: ["2TB minimum at 128GB", "Portable, built-in display", "Can throttle on long renders"]
      }
    )),
    /* @__PURE__ */ h(Section, { heading: "Where to buy" }, /* @__PURE__ */ h(
      LinkCards,
      {
        links: [
          { title: "Mac Studio M5 Max 40c (configure 128GB)", site: "apple.com/nl", href: "https://www.apple.com/nl/shop/buy-mac/mac-studio/m5-max-chip-18%E2%80%91core-cpu-40%E2%80%91core-gpu-64-gb-geheugen-1tb-opslag" },
          { title: "Mac Studio M5 Max 128GB/1TB €6.089, ETA 5 Dec", site: "upgreatest.nl", href: "https://upgreatest.nl/product/5193/mac-studio-m5-max-18x-cpu-40x-gpu-128gb-1tb" },
          { title: "Mac Studio M5 Max 128GB/1TB open box €5.989, Op bestelling, expected 18 Nov", site: "upgreatest.nl", href: "https://upgreatest.nl/product/5423/mac-studio-m5-max-18x-cpu-40x-gpu-128gb-1tb" },
          { title: "Mac Studio M5 Max 128GB/2TB open box €6.439, expected 24 Dec", site: "upgreatest.nl", href: "https://upgreatest.nl/product/5424/mac-studio-m5-max-18x-cpu-40x-gpu-128gb-2tb" },
          { title: "Mac Studio M5 Max 128GB/2TB €6.639, in stock, delivery expected 17 Nov", site: "upgreatest.nl", href: "https://upgreatest.nl/product/5191/mac-studio-m5-max-18x-cpu-40x-gpu-128gb-2tb" },
          { title: "Mac Studio M5 Max 128GB/2TB €6.599, out of stock online (Nov 13)", site: "mediamarkt.nl", href: "https://www.mediamarkt.nl/nl/product/_apple-z1u4000fcctomstdm5m18c401282-1913775.html" },
          { title: "Mac Studio M5 Max 128GB/1TB Black Friday €5.899 (out of stock online, Nov 13)", site: "mediamarkt.nl", href: "https://www.mediamarkt.nl/nl/product/_apple-mac-studio-m5-max-cpu-18-core-gpu-40-core-128-gb-1-tb-edition-2026-1914729.html" },
          { title: "Mac Studio M5 Max 128GB/1TB €6.219 (as of Nov 12)", site: "amac.nl", href: "https://www.amac.nl/mac-studio-m5-max-18c-cpu-40c-gpu-128gb-1tb-10-gbit" },
          { title: 'MacBook Pro 14" M5 Max 128GB/2TB open box €7.109, Op bestelling, expected 5 Dec', site: "upgreatest.nl", href: "https://upgreatest.nl/product/5127/macbook-pro-14-inch-m5-max-18x-cpu-40x-gpu-128gb-2tb-spacezwart" },
          { title: 'MacBook Pro 14" M5 Max (configure 128GB)', site: "apple.com/nl", href: "https://www.apple.com/nl/shop/buy-mac/macbook-pro/14%E2%80%91inch-space-black-display-met-standaardglas-m5-max-chip-18%E2%80%91core-cpu-40%E2%80%91core-gpu-48-gb-geheugen-2tb-opslag" },
          { title: 'MacBook Pro 16" M5 Max 128GB/2TB €7.749, Op bestelling, expected 5 Dec', site: "upgreatest.nl", href: "https://upgreatest.nl/product/5143/macbook-pro-16-inch-m5-max-18x-cpu-40x-gpu-128gb-2tb-spacezwart" },
          { title: 'MacBook Pro 16" M5 Max 128GB/4TB open box €8.499, Op bestelling, expected 24 Nov', site: "upgreatest.nl", href: "https://upgreatest.nl/product/5091/macbook-pro-16-inch-m5-max-18x-cpu-40x-gpu-128gb-4tb-spacezwart" },
          { title: 'MacBook Pro 16" M4 Max 128GB/8TB nano-texture, Apple refurbished €9.579 (listed Nov 13)', site: "apple.com/nl", href: "https://www.apple.com/nl/shop/product/g1fwnn/a/Refurbished-16%E2%80%91inch-MacBook-Pro-Apple-M4-Max-chip-met-16%E2%80%91core-CPU-en-40%E2%80%91core-GPU-display-met-nanotextuur-Spacezwart" },
          { title: 'MacBook Pro 16" M5 Max (configure 128GB)', site: "apple.com/nl", href: "https://www.apple.com/nl/shop/buy-mac/macbook-pro/16%E2%80%91inch-space-black-display-met-standaardglas-m5-max-chip-18%E2%80%91core-cpu-40%E2%80%91core-gpu-48-gb-geheugen-2tb-opslag" },
          { title: 'MacBook Pro 14" / 16" OLED (configure 128GB)', site: "apple.com/nl", href: "https://www.apple.com/nl/shop/buy-mac/macbook-pro-proled-xdr" },
          { title: "Mac Studio M5 Ultra 36c/80c 512GB/1TB €24.449, ETA 22 Feb 2027", site: "upgreatest.nl", href: "https://upgreatest.nl/product/5405/mac-studio-m5-ultra-36x-cpu-80x-gpu-512gb-1tb" },
          { title: "Mac Studio M5 Ultra 30c/64c 256GB/2TB €11.419, ETA 22 Feb 2027", site: "upgreatest.nl", href: "https://upgreatest.nl/product/5192/mac-studio-m5-ultra-30x-cpu-64x-gpu-256gb-2tb" },
          { title: "Mac Studio M5 Ultra 30c/64c 256GB/2TB open box €11.219, expected 22 Feb 2027", site: "upgreatest.nl", href: "https://upgreatest.nl/product/5426/mac-studio-m5-ultra-30x-cpu-64x-gpu-256gb-2tb" },
          { title: "Mac Studio M5 Ultra 30c/64c 256GB/1TB €11.049 (as of Nov 12)", site: "amac.nl", href: "https://www.amac.nl/mac-studio-m5-ultra-30c-cpu-64c-gpu-256gb-1tb-10-gbit" },
          { title: "Mac Studio M5 Ultra (configure 256GB / 512GB)", site: "apple.com/nl", href: "https://www.apple.com/nl/shop/buy-mac/mac-studio/m5-ultra-chip-30%E2%80%91core-cpu-64%E2%80%91core-gpu-96-gb-geheugen-1tb-opslag" }
        ]
      }
    )),
    /* @__PURE__ */ h(Section, { heading: "Sources" }, /* @__PURE__ */ h(
      LinkCards,
      {
        links: [
          { title: "14-inch MacBook Pro with M6", site: "Apple Newsroom", date: "Oct 2026", href: "https://www.apple.com/newsroom/2026/10/apple-introduces-the-new-14-inch-macbook-pro-with-m6/" },
          { title: "MacBook Pro with PROLED XDR display", site: "Apple Newsroom", date: "Oct 2026", href: "https://www.apple.com/newsroom/2026/10/apple-unveils-groundbreaking-macbook-pro-with-proled-xdr-display/" },
          { title: "New iMac with M6", site: "Apple Newsroom", date: "Oct 2026", href: "https://www.apple.com/newsroom/2026/10/apple-unveils-new-imac-with-m6/" },
          { title: "Mac Studio with M5 Max and M5 Ultra", site: "Apple Newsroom", date: "Aug 2026", href: "https://www.apple.com/newsroom/2026/08/apple-introduces-new-mac-studio-with-m5-max-and-m5-ultra/" },
          { title: 'Apple Certified Refurbished Mac (one 128GB: 16" M4 Max 128GB/8TB €9.579, Nov 13)', site: "apple.com/nl", href: "https://www.apple.com/nl/shop/refurbished/mac" },
          { title: "MacBook Pro 16 M5 Max review: AI config with 128GB", site: "Tweakers", date: "13 Apr 2026", href: "https://tweakers.net/reviews/14512/apple-macbook-pro-16-inch-met-m5-max-de-ultieme-ai-config-met-128gb-ram.html" },
          { title: "M5 Ultra vs M3 Ultra: local AI, measured", site: "NetworkChuck", href: "https://thenetworkchuck.github.io/mac-studio-m5-ultra-local-ai/" },
          { title: "Llama 3.3 70B on M5 Max 40c 128GB", site: "oMLX benchmarks", href: "https://omlx.ai/benchmarks/performance/coz9dsk8" },
          { title: "M5 Ultra vs M3 Ultra vs M5 Max for local LLMs", site: "llmcheck.net", href: "https://llmcheck.net/blog/m5-ultra-vs-m3-ultra-vs-m5-max-local-llm/" },
          { title: "Mac Studio M5 Max vs Ultra: public LLM benchmarks (re-dated Nov 10, figures unchanged)", site: "swarchitect.net", href: "https://www.swarchitect.net/en/mac-studio-m5-local-llm-2026-10/" },
          { title: "M5 Max 128GB local LLM medians (as of Nov 13)", site: "llamaperf", href: "https://llamaperf.com/gpu/m5-max-128gb" },
          { title: "Mac Studio M5 for local LLMs (Tbreak review summary)", site: "swarchitect.net", href: "https://www.swarchitect.net/mac-studio-m5-local-llm-2026-10/" },
          { title: "M5 Ultra 256GB local LLM medians (as of Nov 13)", site: "llamaperf", href: "https://llamaperf.com/gpu/m5-ultra-256gb" },
          { title: "Mac vs RTX 5090 for LLMs: M5 Max and M5 Ultra numbers", site: "gpuwerk.com", date: "7 Nov 2026", href: "https://gpuwerk.com/blog/mac-vs-rtx-5090-for-llms/" },
          { title: "Mac Studio M5 Ultra vs DGX Spark: local AI in depth", site: "Tom's Hardware", date: "10 Nov 2026", href: "https://www.tomshardware.com/tech-industry/artificial-intelligence/going-deep-on-local-ai-performance-with-apples-mac-studio-with-m5-ultra-inference-engine-recipes-mandatory-for-bigger-models-as-mlx-stack-matures" },
          { title: "Image generation measured on Mac Studio M5 Max", site: "llmonmac.com", href: "https://llmonmac.com/en/images" },
          { title: "M5 Max vs RTX 5080/5090 for image/video AI", site: "r/comfyui", href: "https://www.reddit.com/r/comfyui/comments/1vwipjp/m5_max_vs_rtx_50805090_for_local_imagevideo_ai_am/" }
        ]
      }
    ), /* @__PURE__ */ h(Text, null, 'Prices checked on Nov 13, 2026 and change often. The Studio 128GB/512GB price is the Apple configurator total (€6.219 minus €330 for 512GB). Apple NL configurator 128GB+ totals were re-checked live on Nov 13 and are unchanged since Nov 4 (Studio Max 128GB/2TB €6.769, 128GB/1TB €6.219, Ultra 30c/36c 256GB/1TB €11.049/€12.479, OLED 14\\" 128GB/2TB €8.109). Apple Certified Refurbished NL lists one 128GB Mac on Nov 13 (16" M4 Max 128GB/8TB nano-texture, €9.579, memory confirmed on its product page); everything else there tops out at 64GB. Shop prices were re-checked on the afternoon of Nov 13; Amac was down for maintenance (HTTP 503), so its prices are from Nov 12. Coolblue is reachable but lists no 128GB+ Macs; Bol now returns search results but lists no 128GB+ Macs (Nov 12); Tweakers shows a DPG consent wall to automated access, and TechFabrique listings are not readable, so none of them are priced here. The MacBook Pro 16" 8TB Qwertz listing from Oct 26 was dropped for that reason. The M6 MacBook Pro and iMac are excluded because they max out at 32GB.'))
  );
}
export {
  App as default
};
