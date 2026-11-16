import { Page, Section, Text, Table, Select, Toggle, Grid, Properties, Callout, LinkCards, Metrics, Floating, useState, h } from "./runtime.js";
const AS_OF = "16 Nov 2026";
const eur = (n) => {
  const ints = Math.abs(n - Math.round(n)) < 1e-3;
  return (n < 0 ? "−" : "") + "€" + Math.abs(n).toLocaleString("nl-NL", { minimumFractionDigits: ints ? 0 : 2, maximumFractionDigits: 2 });
};
const plus = (n) => n === 0 ? "included" : "+" + eur(n);
const ssdLabel = (gb) => gb >= 1024 ? gb / 1024 + "TB" : gb + "GB";
const kbOpts = [
  { value: "nld", label: "Dutch" },
  { value: "none", label: "English (US)" },
  { value: "int", label: "International English" },
  { value: "gbr", label: "English (UK)" },
  { value: "deu", label: "German" },
  { value: "fra", label: "French" },
  { value: "ita", label: "Italian" },
  { value: "spa", label: "Spanish" },
  { value: "prt", label: "Portuguese" },
  { value: "dnk", label: "Danish" },
  { value: "swe", label: "Swedish" },
  { value: "nob", label: "Norwegian" },
  { value: "swf", label: "Swiss" },
  { value: "trq", label: "Turkish Q" },
  { value: "sau", label: "Arabic" },
  { value: "sun", label: "Russian" }
];
const aiNote = (mem) => {
  if (mem <= 16) return "Local AI: 7B–8B coding models at Q4–Q8 fit. Image models are tight alongside Xcode, and video is not realistic.";
  if (mem <= 24) return "Local AI: 14B models at Q8, or 24B–32B at tight Q4, fit. Small image models such as FLUX.2 klein 4B fit; video only at low resolution.";
  if (mem <= 32) return "Local AI: 32B coding models at Q4 with moderate context. Most SDXL/Flux-class image models fit; a 14B video model only heavily quantized.";
  if (mem <= 36) return "Local AI: 32B models or 30B MoE models at Q4. Most open image models fit; Qwen-Image (about 37GB) does not. Small video models run slowly.";
  if (mem <= 48) return "Local AI: 32B at Q8; a 70B model at Q4 only just fits with short context. Qwen-Image fits. 5B video models run comfortably.";
  if (mem <= 64) return "Local AI: 70B at Q4 with usable context. All mainstream open image models fit. 14B video models run quantized, slowly.";
  if (mem <= 96) return "Local AI: 70B at Q8, or about 100B MoE models at Q4. An image model and an LLM can stay resident together.";
  if (mem <= 128) return "Local AI: 70B at Q8 with long context, or gpt-oss-120B-class MoE models. Every open image model fits beside a coding model. Video fits but runs slowly.";
  if (mem <= 256) return "Local AI: 200B+ MoE models at Q4, or several 70B models at once. Image and video all fit; speed is set by GPU cores and bandwidth, not capacity.";
  return "Local AI: 400B+ models at Q4, or several 200B models resident at once. Image and video all fit; speed is set by GPU cores.";
};
const bwLabel = (gb) => gb >= 1e3 ? (gb / 1e3).toFixed(1).replace(".", ",") + " TB/s" : gb + " GB/s";
const VARIANTS = [
  {
    chip: "m5max-18-32",
    chipLabel: "M5 Max, 18-core CPU, 32-core GPU",
    cpu: 18,
    gpu: 32,
    ne: "16-core Neural Engine",
    bw: 460,
    weight: "2.7 kg",
    ports: "Front 2x USB-C, SDXC; rear 4x Thunderbolt 5, 2x USB-A, HDMI, 10Gb Ethernet",
    base: 3029,
    defMem: 36,
    defSsd: 512,
    mem: { 36: 0 },
    ssd: { 512: 0, 1024: 330, 2048: 880, 4096: 1980, 8192: 4180 },
    limit: "The 32-core M5 Max is sold at 36GB only, from 512GB to 8TB. 48GB or more needs the 40-core Max; 96GB or 16TB needs M5 Ultra."
  },
  {
    chip: "m5max-18-40",
    chipLabel: "M5 Max, 18-core CPU, 40-core GPU",
    cpu: 18,
    gpu: 40,
    ne: "16-core Neural Engine",
    bw: 614,
    weight: "2.7 kg",
    ports: "Front 2x USB-C, SDXC; rear 4x Thunderbolt 5, 2x USB-A, HDMI, 10Gb Ethernet",
    base: 3689,
    defMem: 48,
    defSsd: 512,
    mem: { 48: 0, 64: 440, 128: 2200 },
    ssd: { 512: 0, 1024: 330, 2048: 880, 4096: 1980, 8192: 4180 },
    limit: "The 40-core M5 Max goes to 128GB and 8TB. 256GB or 512GB, and 16TB, need M5 Ultra."
  },
  {
    chip: "m5ultra-30-64",
    chipLabel: "M5 Ultra, 30-core CPU, 64-core GPU",
    cpu: 30,
    gpu: 64,
    ne: "32-core Neural Engine",
    bw: 1200,
    weight: "3.6 kg",
    ports: "Front 2x Thunderbolt 5, SDXC; rear 4x Thunderbolt 5, 2x USB-A, HDMI, 10Gb Ethernet",
    base: 6649,
    defMem: 96,
    defSsd: 1024,
    mem: { 96: 0, 256: 4400 },
    ssd: { 1024: 0, 2048: 550, 4096: 1650, 8192: 3850, 16384: 8250 },
    limit: "The 30-core M5 Ultra goes to 256GB and 16TB. 512GB needs the 36-core / 80-core Ultra."
  },
  {
    chip: "m5ultra-36-80",
    chipLabel: "M5 Ultra, 36-core CPU, 80-core GPU",
    cpu: 36,
    gpu: 80,
    ne: "32-core Neural Engine",
    bw: 1200,
    weight: "3.6 kg",
    ports: "Front 2x Thunderbolt 5, SDXC; rear 4x Thunderbolt 5, 2x USB-A, HDMI, 10Gb Ethernet",
    base: 8079,
    defMem: 96,
    defSsd: 1024,
    mem: { 96: 0, 256: 4400, 512: 17050 },
    ssd: { 1024: 0, 2048: 550, 4096: 1650, 8192: 3850, 16384: 8250 },
    limit: "This is the top Mac Studio: up to 512GB and 16TB. 10Gb Ethernet is included on every Studio."
  }
];
const APPLE = "https://www.apple.com/nl/shop/buy-mac/mac-studio";
const SPECS = "https://www.apple.com/nl/mac-studio/specs/";
function findV(chip) {
  return VARIANTS.find((v) => v.chip === chip);
}
function bodyPrice(v, mem, ssd) {
  if (v.mem[mem] === void 0 || v.ssd[ssd] === void 0) return null;
  return v.base + v.mem[mem] + v.ssd[ssd];
}
function App() {
  const [chip, setChip] = useState("m5max-18-40");
  const [mem, setMem] = useState("128");
  const [ssd, setSsd] = useState("512");
  const [logic, setLogic] = useState(false);
  const [fcp, setFcp] = useState(false);
  const [care, setCare] = useState(false);
  const active = findV(chip);
  const memN = Number(mem);
  const ssdN = Number(ssd);
  const validMem = Object.keys(active.mem).map(Number).sort((a, b) => a - b);
  const validSsd = Object.keys(active.ssd).map(Number).sort((a, b) => a - b);
  const useMem = validMem.indexOf(memN) >= 0 ? memN : active.defMem;
  const useSsd = validSsd.indexOf(ssdN) >= 0 ? ssdN : active.defSsd;
  const hardware = bodyPrice(active, useMem, useSsd);
  const total = hardware === null ? null : hardware + (logic ? 229.99 : 0) + (fcp ? 349.99 : 0);
  const breakdown = [
    { label: "Base (" + active.chipLabel + ", " + active.defMem + "GB / " + ssdLabel(active.defSsd) + ")", amount: active.base }
  ];
  if (hardware !== null) {
    if (useMem !== active.defMem) breakdown.push({ label: "Memory " + useMem + "GB", amount: active.mem[useMem] });
    if (useSsd !== active.defSsd) breakdown.push({ label: "Storage " + ssdLabel(useSsd), amount: active.ssd[useSsd] });
    if (logic) breakdown.push({ label: "Logic Pro (pre-installed)", amount: 229.99 });
    if (fcp) breakdown.push({ label: "Final Cut Pro (pre-installed)", amount: 349.99 });
  }
  const onChip = (c) => {
    setChip(c);
    const next = findV(c);
    if (next.mem[Number(mem)] === void 0) setMem(String(next.defMem));
    if (next.ssd[Number(ssd)] === void 0) setSsd(String(next.defSsd));
  };
  const chipOpts = VARIANTS.map((v) => ({ value: v.chip, label: v.chipLabel + " — from " + eur(v.base) }));
  const memOpts = validMem.map((m) => ({ value: String(m), label: m + "GB" + (m === active.defMem ? "" : " (" + plus(active.mem[m]) + ")") }));
  const ssdOpts = validSsd.map((s) => ({ value: String(s), label: ssdLabel(s) + (s === active.defSsd ? "" : " (" + plus(active.ssd[s]) + ")") }));
  const rows = breakdown.map((l) => [l.label, l.label.startsWith("Base") ? eur(l.amount) : plus(l.amount)]);
  if (total !== null) rows.push(["Total incl. 21% VAT", eur(total)]);
  return /* @__PURE__ */ h(
    Page,
    {
      title: "Configure Mac Studio (Apple NL)",
      summary: "Build a Mac Studio with M5 Max or M5 Ultra. Totals use Apple NL base prices and listed upcharges, incl. 21% VAT. Prices checked " + AS_OF + ".",
      width: "wide"
    },
    /* @__PURE__ */ h(Section, { heading: "Build your Mac Studio" }, /* @__PURE__ */ h(Text, null, "[Back to start](index.html)"), /* @__PURE__ */ h(Grid, { columns: 3 }, /* @__PURE__ */ h(Select, { label: "Chip", options: chipOpts, value: active.chip, onChange: onChip }), /* @__PURE__ */ h(Select, { label: "Unified memory", options: memOpts, value: String(useMem), onChange: setMem }), /* @__PURE__ */ h(Select, { label: "SSD storage", options: ssdOpts, value: String(useSsd), onChange: setSsd })), /* @__PURE__ */ h(Grid, { columns: 2 }, /* @__PURE__ */ h(Toggle, { label: "Pre-install Logic Pro (" + plus(229.99) + ")", value: logic, onChange: setLogic }), /* @__PURE__ */ h(Toggle, { label: "Pre-install Final Cut Pro (" + plus(349.99) + ")", value: fcp, onChange: setFcp })), /* @__PURE__ */ h(Text, null, active.limit), /* @__PURE__ */ h(Toggle, { label: "Add AppleCare+ (no price was published on the Mac Studio configurator page, so it is not added to the total; Apple shows it at checkout).", value: care, onChange: setCare })),
    /* @__PURE__ */ h(Section, { heading: "Price", caption: "Incl. 21% VAT, Apple NL configurator, " + AS_OF + ". 10Gb Ethernet is included on every Studio." }, total !== null ? /* @__PURE__ */ h(Metrics, { metrics: [{ value: eur(total), label: "Running total", detail: useMem + "GB at " + bwLabel(active.bw) }] }) : /* @__PURE__ */ h(Callout, { lead: "This combination is not offered", tone: "warning" }, "Apple NL does not sell this memory and storage pair on this chip. Pick a listed option."), /* @__PURE__ */ h(Table, { columns: ["Item", "Price"], rows, emphasis: rows.length - 1, align: ["start", "end"] })),
    /* @__PURE__ */ h(Section, { heading: "This build" }, /* @__PURE__ */ h(
      Properties,
      {
        items: [
          { label: "Chip", value: active.chipLabel + ", " + active.ne },
          { label: "Memory", value: useMem + "GB unified memory at " + bwLabel(active.bw) },
          { label: "Storage", value: ssdLabel(useSsd) + " SSD" },
          { label: "Display", value: "No built-in display. M5 Max drives up to five displays, M5 Ultra up to eight." },
          { label: "Ports", value: active.ports },
          { label: "Weight", value: active.weight },
          { label: "Local AI", value: aiNote(useMem) }
        ]
      }
    )),
    /* @__PURE__ */ h(Section, { heading: "Buy and sources" }, /* @__PURE__ */ h(
      LinkCards,
      {
        links: [
          { title: "Configure this Mac Studio at Apple NL", site: "apple.com/nl", href: APPLE },
          { title: "Mac Studio tech specs", site: "apple.com/nl", href: SPECS }
        ]
      }
    ), /* @__PURE__ */ h(Text, null, "Prices were read from the Apple NL configurator API on " + AS_OF + " and are not a quote. The 512GB option is only on the 36-core / 80-core M5 Ultra, from €25.129 at 1TB. AppleCare+ is not priced on the Mac Studio buy page and is therefore listed as price unknown.")),
    /* @__PURE__ */ h(Floating, { edge: "bottom", bar: true }, /* @__PURE__ */ h(Text, null, total !== null ? "Total " + eur(total) + " incl. VAT — Mac Studio, Apple NL, " + AS_OF : "Pick a valid memory and storage pair to see the total."))
  );
}
export {
  App as default
};
