import { Page, Section, Text, Table, Select, Toggle, Grid, Properties, Callout, LinkCards, Metrics, Floating, useState, h } from "./runtime.js";
const AS_OF = "14 Nov 2026";
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
const COLORS = [
  { value: "skyblue", label: "Sky Blue" },
  { value: "silver", label: "Silver" },
  { value: "starlight", label: "Starlight" },
  { value: "midnight", label: "Midnight" }
];
const VARIANTS = [
  {
    size: "13inch",
    chip: "10-8",
    chipLabel: "M5, 10-core CPU, 8-core GPU",
    cpu: 10,
    gpu: 8,
    ne: "16-core Neural Engine",
    bw: 153,
    weight: "1.23 kg",
    battery: "53.8 Wh, up to 18 h video streaming",
    ports: "MagSafe 3, 2x Thunderbolt 4 (USB-C)",
    base: 1429,
    defMem: 16,
    defSsd: 512,
    mem: { 16: 0 },
    ssd: { 512: 0 },
    over: [],
    adapters: [{ id: "0w", label: "No power adapter (EU default)", delta: 0 }],
    limit: "This 8-core GPU model is only sold as 16GB / 512GB. 24GB or 32GB, larger SSDs, and a power adapter need the 10-core GPU 13-inch model."
  },
  {
    size: "13inch",
    chip: "10-10",
    chipLabel: "M5, 10-core CPU, 10-core GPU",
    cpu: 10,
    gpu: 10,
    ne: "16-core Neural Engine",
    bw: 153,
    weight: "1.23 kg",
    battery: "53.8 Wh, up to 18 h video streaming",
    ports: "MagSafe 3, 2x Thunderbolt 4 (USB-C)",
    base: 1539,
    defMem: 16,
    defSsd: 512,
    mem: { 16: 0, 24: 110, 32: 330 },
    ssd: { 512: 0, 1024: 220, 2048: 770, 4096: 1870 },
    over: [[24, 1024, 1979], [32, 1024, 2199], [24, 2048, 2529], [32, 2048, 2749], [24, 4096, 3629], [32, 4096, 3849]],
    adapters: [
      { id: "0w", label: "No power adapter (EU default)", delta: 0 },
      { id: "30w", label: "30W USB-C adapter", delta: 45 },
      { id: "35w", label: "35W USB-C adapter with two ports", delta: 65 },
      { id: "70w", label: "70W USB-C adapter", delta: 65 }
    ],
    limit: "Max 32GB and 4TB. Colour and keyboard layout do not change the price."
  },
  {
    size: "15inch",
    chip: "10-10",
    chipLabel: "M5, 10-core CPU, 10-core GPU",
    cpu: 10,
    gpu: 10,
    ne: "16-core Neural Engine",
    bw: 153,
    weight: "1.51 kg",
    battery: "66.5 Wh, up to 18 h video streaming",
    ports: "MagSafe 3, 2x Thunderbolt 4 (USB-C)",
    base: 1729,
    defMem: 16,
    defSsd: 512,
    mem: { 16: 0, 24: 220, 32: 440 },
    ssd: { 512: 0, 1024: 330, 2048: 880, 4096: 1980 },
    over: [],
    adapters: [{ id: "0w", label: "No power adapter (EU default)", delta: 0 }],
    limit: "The 15-inch model is only sold with the 10-core GPU. The Apple NL configurator lists no power-adapter option for this size today, even though Apple's specs mention 35W and 70W adapters."
  }
];
const APPLE = "https://www.apple.com/nl/shop/buy-mac/macbook-air";
const SPECS = "https://www.apple.com/nl/macbook-air/specs/";
function findV(size, chip) {
  return VARIANTS.find((v) => v.size === size && v.chip === chip);
}
function bodyPrice(v, mem, ssd) {
  if (v.mem[mem] === void 0 || v.ssd[ssd] === void 0) return null;
  const o = v.over.find((x) => x[0] === mem && x[1] === ssd);
  return o ? o[2] : v.base + v.mem[mem] + v.ssd[ssd];
}
function App() {
  const [size, setSize] = useState("13inch");
  const [chip, setChip] = useState("10-10");
  const [color, setColor] = useState("skyblue");
  const [mem, setMem] = useState("16");
  const [ssd, setSsd] = useState("512");
  const [adapter, setAdapter] = useState("0w");
  const [kb, setKb] = useState("nld");
  const [logic, setLogic] = useState(false);
  const [fcp, setFcp] = useState(false);
  const [care, setCare] = useState(false);
  const v = findV(size, chip) || (size === "15inch" ? findV("15inch", "10-10") : findV("13inch", "10-10"));
  const active = v;
  const memN = Number(mem);
  const ssdN = Number(ssd);
  const validMem = Object.keys(active.mem).map(Number).sort((a, b) => a - b);
  const validSsd = Object.keys(active.ssd).map(Number).sort((a, b) => a - b);
  const useMem = validMem.indexOf(memN) >= 0 ? memN : active.defMem;
  const useSsd = validSsd.indexOf(ssdN) >= 0 ? ssdN : active.defSsd;
  const useAdapter = active.adapters.some((a) => a.id === adapter) ? adapter : "0w";
  const ad = active.adapters.find((a) => a.id === useAdapter) || active.adapters[0];
  const hardware = bodyPrice(active, useMem, useSsd);
  const soft = (logic ? 229.99 : 0) + (fcp ? 349.99 : 0);
  const total = hardware === null ? null : hardware + ad.delta + soft;
  const breakdown = [
    { label: "Base (" + (active.size === "13inch" ? "13-inch" : "15-inch") + ", " + active.chipLabel + ", " + active.defMem + "GB / " + ssdLabel(active.defSsd) + ")", amount: active.base }
  ];
  if (hardware !== null) {
    const memOnly = bodyPrice(active, useMem, active.defSsd);
    const memDelta = memOnly - active.base;
    const ssdDelta = hardware - memOnly;
    if (memDelta) breakdown.push({ label: "Memory " + useMem + "GB", amount: memDelta });
    if (ssdDelta) breakdown.push({ label: "Storage " + ssdLabel(useSsd), amount: ssdDelta });
    if (ad.delta) breakdown.push({ label: ad.label, amount: ad.delta });
    if (logic) breakdown.push({ label: "Logic Pro (pre-installed)", amount: 229.99 });
    if (fcp) breakdown.push({ label: "Final Cut Pro (pre-installed)", amount: 349.99 });
  }
  const chipsForSize = size === "15inch" ? ["10-10"] : ["10-8", "10-10"];
  const chipOpts = chipsForSize.map((c) => {
    const vv = findV(size, c);
    return { value: c, label: vv.chipLabel + " — from " + eur(vv.base) };
  });
  const memOpts = validMem.map((m) => ({ value: String(m), label: m + "GB" + (m === active.defMem ? "" : " (" + plus(bodyPrice(active, m, active.defSsd) - active.base) + ")") }));
  const ssdOpts = validSsd.map((s) => ({ value: String(s), label: ssdLabel(s) + (s === active.defSsd ? "" : " (" + plus(bodyPrice(active, active.defMem, s) - active.base) + ")") }));
  const adOpts = active.adapters.map((a) => ({ value: a.id, label: a.label + (a.delta ? " (" + plus(a.delta) + ")" : "") }));
  const onSize = (s) => {
    setSize(s);
    if (s === "15inch") setChip("10-10");
  };
  const onChip = (c) => {
    setChip(c);
    const next = findV(size, c);
    if (next) {
      if (next.mem[Number(mem)] === void 0) setMem(String(next.defMem));
      if (next.ssd[Number(ssd)] === void 0) setSsd(String(next.defSsd));
      if (!next.adapters.some((a) => a.id === adapter)) setAdapter("0w");
    }
  };
  const rows = breakdown.map((l) => [l.label, l.amount >= 0 ? l.label.startsWith("Base") ? eur(l.amount) : plus(l.amount) : eur(l.amount)]);
  if (total !== null) rows.push(["Total incl. 21% VAT", eur(total)]);
  return /* @__PURE__ */ h(
    Page,
    {
      title: "Configure MacBook Air (Apple NL)",
      summary: "Build a 13-inch or 15-inch MacBook Air with M5 on apple.com/nl. Totals update from Apple's listed base prices and upcharges, incl. 21% VAT. Prices checked " + AS_OF + ".",
      width: "wide"
    },
    /* @__PURE__ */ h(Section, { heading: "Build your MacBook Air" }, /* @__PURE__ */ h(Grid, { columns: 3 }, /* @__PURE__ */ h(Select, { label: "Size", options: [{ value: "13inch", label: "13-inch" }, { value: "15inch", label: "15-inch" }], value: size, onChange: onSize }), /* @__PURE__ */ h(Select, { label: "Chip", options: chipOpts, value: active.chip, onChange: onChip }), /* @__PURE__ */ h(Select, { label: "Colour (same price)", options: COLORS, value: color, onChange: setColor }), /* @__PURE__ */ h(Select, { label: "Unified memory", options: memOpts, value: String(useMem), onChange: setMem }), /* @__PURE__ */ h(Select, { label: "SSD storage", options: ssdOpts, value: String(useSsd), onChange: setSsd }), /* @__PURE__ */ h(Select, { label: "Power adapter", options: adOpts, value: useAdapter, onChange: setAdapter }), /* @__PURE__ */ h(Select, { label: "Keyboard language (same price)", options: kbOpts, value: kb, onChange: setKb })), /* @__PURE__ */ h(Grid, { columns: 2 }, /* @__PURE__ */ h(Toggle, { label: "Pre-install Logic Pro (" + plus(229.99) + ")", value: logic, onChange: setLogic }), /* @__PURE__ */ h(Toggle, { label: "Pre-install Final Cut Pro (" + plus(349.99) + ")", value: fcp, onChange: setFcp })), /* @__PURE__ */ h(Text, null, active.limit), /* @__PURE__ */ h(Toggle, { label: "Add AppleCare+ (exact price for this build not published as a single figure; Apple NL lists €235 and €265, from €235). Not added to the total.", value: care, onChange: setCare })),
    /* @__PURE__ */ h(Section, { heading: "Price", caption: "Incl. 21% VAT, Apple NL configurator, " + AS_OF + ". Colour and keyboard layout are €0." }, total !== null ? /* @__PURE__ */ h(Metrics, { metrics: [{ value: eur(total), label: "Running total", detail: COLORS.find((c) => c.value === color)?.label + ", " + kbOpts.find((c) => c.value === kb)?.label + " keyboard" }] }) : /* @__PURE__ */ h(Callout, { lead: "This combination is not offered", tone: "warning" }, "Apple NL does not sell this memory and storage pair on this chip. Pick a listed option."), /* @__PURE__ */ h(Table, { columns: ["Item", "Price"], rows, emphasis: rows.length - 1, align: ["start", "end"] })),
    /* @__PURE__ */ h(Section, { heading: "This build" }, /* @__PURE__ */ h(
      Properties,
      {
        items: [
          { label: "Chip", value: active.chipLabel + ", " + active.ne },
          { label: "Memory", value: useMem + "GB unified memory at " + bwLabel(active.bw) },
          { label: "Storage", value: ssdLabel(useSsd) + " SSD" },
          { label: "Display", value: (active.size === "13inch" ? "13.6-inch" : "15.3-inch") + " Liquid Retina, 500 nits" },
          { label: "Ports", value: active.ports },
          { label: "Weight / battery", value: active.weight + " / " + active.battery },
          { label: "Power adapter", value: ad.label },
          { label: "Colour / keyboard", value: (COLORS.find((c) => c.value === color)?.label || color) + " / " + (kbOpts.find((c) => c.value === kb)?.label || kb) },
          { label: "Local AI", value: aiNote(useMem) }
        ]
      }
    )),
    /* @__PURE__ */ h(Section, { heading: "Buy and sources" }, /* @__PURE__ */ h(
      LinkCards,
      {
        links: [
          { title: "Configure this MacBook Air at Apple NL", site: "apple.com/nl", href: APPLE },
          { title: "MacBook Air tech specs", site: "apple.com/nl", href: SPECS }
        ]
      }
    ), /* @__PURE__ */ h(Text, null, "Prices were read from the Apple NL configurator API on " + AS_OF + " and are not a quote; Apple can change them. The 13-inch 10-core GPU model has non-linear memory and storage upcharges, so those totals use the verified combination price, not base plus list deltas. AppleCare+ is offered at checkout; two prices (€235 and €265) appear on the page, but which one applies to which build was not published, so it is not added to the total.")),
    /* @__PURE__ */ h(Floating, { edge: "bottom", bar: true }, /* @__PURE__ */ h(Text, null, total !== null ? "Total " + eur(total) + " incl. VAT — MacBook Air, Apple NL, " + AS_OF : "Pick a valid memory and storage pair to see the total."))
  );
}
export {
  App as default
};
