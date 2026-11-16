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
const COLORS = [{ value: "spaceblack", label: "Space Black" }, { value: "silver", label: "Silver" }];
const NANO = 165;
const VARIANTS = [
  {
    size: "14inch",
    chip: "m5pro-15-16",
    chipLabel: "M5 Pro, 15-core CPU, 16-core GPU",
    cpu: 15,
    gpu: 16,
    ne: "16-core Neural Engine",
    bw: 307,
    weight: "1.38 kg",
    battery: "72.6 Wh, up to 22 h video streaming",
    ports: "MagSafe 3, 3x Thunderbolt 5, HDMI, SDXC",
    base: 3349,
    defMem: 24,
    defSsd: 1024,
    mem: { 24: 0, 48: 660 },
    ssd: { 1024: 0, 2048: 550, 4096: 1650 },
    adapters: [{ id: "0w", label: "No power adapter (EU default)", delta: 0 }],
    limit: "This 15-core M5 Pro goes to 48GB and 4TB. The Apple NL configurator lists no power-adapter option on this OLED 15-core model. 64GB needs the 18-core Pro; 128GB or 8TB/16TB need M5 Max."
  },
  {
    size: "14inch",
    chip: "m5pro-18-20",
    chipLabel: "M5 Pro, 18-core CPU, 20-core GPU",
    cpu: 18,
    gpu: 20,
    ne: "16-core Neural Engine",
    bw: 307,
    weight: "1.38 kg",
    battery: "72.6 Wh, up to 22 h video streaming",
    ports: "MagSafe 3, 3x Thunderbolt 5, HDMI, SDXC",
    base: 3589,
    defMem: 24,
    defSsd: 1024,
    mem: { 24: 0, 48: 660, 64: 1100 },
    ssd: { 1024: 0, 2048: 550, 4096: 1650 },
    adapters: [{ id: "0w", label: "No power adapter (EU default)", delta: 0 }, { id: "96w", label: "96W USB-C adapter", delta: 85 }],
    limit: "This 18-core M5 Pro goes to 64GB and 4TB. 128GB and 8TB or 16TB need M5 Max."
  },
  {
    size: "14inch",
    chip: "m5max-18-32",
    chipLabel: "M5 Max, 18-core CPU, 32-core GPU",
    cpu: 18,
    gpu: 32,
    ne: "16-core Neural Engine",
    bw: 460,
    weight: "1.40 kg",
    battery: "72.6 Wh, up to 20 h video streaming",
    ports: "MagSafe 3, 3x Thunderbolt 5, HDMI, SDXC",
    base: 5249,
    defMem: 36,
    defSsd: 2048,
    mem: { 36: 0 },
    ssd: { 2048: 0, 4096: 1100, 8192: 3300, 16384: 7700 },
    adapters: [{ id: "0w", label: "No power adapter (EU default)", delta: 0 }],
    limit: "The 32-core M5 Max is sold at 36GB only, from 2TB to 16TB. More memory needs the 40-core M5 Max. No power-adapter option is listed on this chip."
  },
  {
    size: "14inch",
    chip: "m5max-18-40",
    chipLabel: "M5 Max, 18-core CPU, 40-core GPU",
    cpu: 18,
    gpu: 40,
    ne: "16-core Neural Engine",
    bw: 614,
    weight: "1.40 kg",
    battery: "72.6 Wh, up to 20 h video streaming",
    ports: "MagSafe 3, 3x Thunderbolt 5, HDMI, SDXC",
    base: 5909,
    defMem: 48,
    defSsd: 2048,
    mem: { 48: 0, 64: 440, 128: 2200 },
    ssd: { 2048: 0, 4096: 1100, 8192: 3300, 16384: 7700 },
    adapters: [{ id: "0w", label: "No power adapter (EU default)", delta: 0 }, { id: "96w", label: "96W USB-C adapter", delta: 85 }],
    limit: "Top 14-inch OLED config: up to 128GB and 16TB."
  },
  {
    size: "16inch",
    chip: "m5pro-18-20",
    chipLabel: "M5 Pro, 18-core CPU, 20-core GPU",
    cpu: 18,
    gpu: 20,
    ne: "16-core Neural Engine",
    bw: 307,
    weight: "1.82 kg",
    battery: "100 Wh, up to 24 h video streaming",
    ports: "MagSafe 3, 3x Thunderbolt 5, HDMI, SDXC",
    base: 3949,
    defMem: 24,
    defSsd: 1024,
    mem: { 24: 0, 48: 660, 64: 1100 },
    ssd: { 1024: 0, 2048: 550, 4096: 1650 },
    adapters: [{ id: "0w", label: "No power adapter (EU default)", delta: 0 }, { id: "140w", label: "140W USB-C adapter", delta: 119 }],
    limit: "The 16-inch OLED model starts at the 18-core M5 Pro (no 15-core Pro). 128GB and 8TB or 16TB need M5 Max."
  },
  {
    size: "16inch",
    chip: "m5max-18-32",
    chipLabel: "M5 Max, 18-core CPU, 32-core GPU",
    cpu: 18,
    gpu: 32,
    ne: "16-core Neural Engine",
    bw: 460,
    weight: "1.84 kg",
    battery: "100 Wh, up to 22 h video streaming",
    ports: "MagSafe 3, 3x Thunderbolt 5, HDMI, SDXC",
    base: 5649,
    defMem: 36,
    defSsd: 2048,
    mem: { 36: 0 },
    ssd: { 2048: 0, 4096: 1100, 8192: 3300, 16384: 7700 },
    adapters: [{ id: "0w", label: "No power adapter (EU default)", delta: 0 }],
    limit: "The 32-core M5 Max is sold at 36GB only, up to 16TB. More memory needs the 40-core M5 Max. No power-adapter option is listed on this chip."
  },
  {
    size: "16inch",
    chip: "m5max-18-40",
    chipLabel: "M5 Max, 18-core CPU, 40-core GPU",
    cpu: 18,
    gpu: 40,
    ne: "16-core Neural Engine",
    bw: 614,
    weight: "1.84 kg",
    battery: "100 Wh, up to 22 h video streaming",
    ports: "MagSafe 3, 3x Thunderbolt 5, HDMI, SDXC",
    base: 6249,
    defMem: 48,
    defSsd: 2048,
    mem: { 48: 0, 64: 440, 128: 2200 },
    ssd: { 2048: 0, 4096: 1100, 8192: 3300, 16384: 7700 },
    adapters: [{ id: "0w", label: "No power adapter (EU default)", delta: 0 }, { id: "140w", label: "140W USB-C adapter", delta: 119 }],
    limit: "Top 16-inch OLED config: up to 128GB and 16TB."
  }
];
const APPLE = "https://www.apple.com/nl/shop/buy-mac/macbook-pro-proled-xdr";
const SPECS = "https://www.apple.com/nl/macbook-pro/proled-xdr-display/specs/";
const chipsFor = (s) => s === "14inch" ? ["m5pro-15-16", "m5pro-18-20", "m5max-18-32", "m5max-18-40"] : ["m5pro-18-20", "m5max-18-32", "m5max-18-40"];
function findV(size, chip) {
  return VARIANTS.find((v) => v.size === size && v.chip === chip);
}
function bodyPrice(v, mem, ssd) {
  if (v.mem[mem] === void 0 || v.ssd[ssd] === void 0) return null;
  return v.base + v.mem[mem] + v.ssd[ssd];
}
function App() {
  const [size, setSize] = useState("14inch");
  const [chip, setChip] = useState("m5pro-15-16");
  const [color, setColor] = useState("spaceblack");
  const [mem, setMem] = useState("24");
  const [ssd, setSsd] = useState("1024");
  const [nano, setNano] = useState(false);
  const [adapter, setAdapter] = useState("0w");
  const [kb, setKb] = useState("nld");
  const [logic, setLogic] = useState(false);
  const [fcp, setFcp] = useState(false);
  const [care, setCare] = useState(false);
  const fallback = size === "16inch" ? "m5pro-18-20" : "m5pro-15-16";
  const active = findV(size, chip) || findV(size, fallback);
  const memN = Number(mem);
  const ssdN = Number(ssd);
  const validMem = Object.keys(active.mem).map(Number).sort((a, b) => a - b);
  const validSsd = Object.keys(active.ssd).map(Number).sort((a, b) => a - b);
  const useMem = validMem.indexOf(memN) >= 0 ? memN : active.defMem;
  const useSsd = validSsd.indexOf(ssdN) >= 0 ? ssdN : active.defSsd;
  const useAdapter = active.adapters.some((a) => a.id === adapter) ? adapter : "0w";
  const ad = active.adapters.find((a) => a.id === useAdapter) || active.adapters[0];
  const hardware = bodyPrice(active, useMem, useSsd);
  const total = hardware === null ? null : hardware + (nano ? NANO : 0) + ad.delta + (logic ? 229.99 : 0) + (fcp ? 349.99 : 0);
  const breakdown = [
    { label: "Base (" + (active.size === "14inch" ? "14-inch" : "16-inch") + " OLED, " + active.chipLabel + ", " + active.defMem + "GB / " + ssdLabel(active.defSsd) + ", standard glass)", amount: active.base }
  ];
  if (hardware !== null) {
    if (useMem !== active.defMem) breakdown.push({ label: "Memory " + useMem + "GB", amount: active.mem[useMem] });
    if (useSsd !== active.defSsd) breakdown.push({ label: "Storage " + ssdLabel(useSsd), amount: active.ssd[useSsd] });
    if (nano) breakdown.push({ label: "Nano-texture display", amount: NANO });
    if (ad.delta) breakdown.push({ label: ad.label, amount: ad.delta });
    if (logic) breakdown.push({ label: "Logic Pro (pre-installed)", amount: 229.99 });
    if (fcp) breakdown.push({ label: "Final Cut Pro (pre-installed)", amount: 349.99 });
  }
  const onSize = (s) => {
    setSize(s);
    if (s === "16inch" && chip === "m5pro-15-16") {
      setChip("m5pro-18-20");
      setMem("24");
      setSsd("1024");
    }
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
  const chipOpts = chipsFor(size).map((c) => {
    const vv = findV(size, c);
    return { value: c, label: vv.chipLabel + " — from " + eur(vv.base) };
  });
  const memOpts = validMem.map((m) => ({ value: String(m), label: m + "GB" + (m === active.defMem ? "" : " (" + plus(active.mem[m]) + ")") }));
  const ssdOpts = validSsd.map((s) => ({ value: String(s), label: ssdLabel(s) + (s === active.defSsd ? "" : " (" + plus(active.ssd[s]) + ")") }));
  const adOpts = active.adapters.map((a) => ({ value: a.id, label: a.label + (a.delta ? " (" + plus(a.delta) + ")" : "") }));
  const rows = breakdown.map((l) => [l.label, l.label.startsWith("Base") ? eur(l.amount) : plus(l.amount)]);
  if (total !== null) rows.push(["Total incl. 21% VAT", eur(total)]);
  return /* @__PURE__ */ h(
    Page,
    {
      title: "Configure MacBook Pro — PROLED XDR (Apple NL)",
      summary: "Build a 14-inch or 16-inch MacBook Pro with the PROLED XDR tandem OLED touch display (M5 Pro or M5 Max). Totals use Apple NL base prices and listed upcharges, incl. 21% VAT. Prices checked " + AS_OF + ".",
      width: "wide"
    },
    /* @__PURE__ */ h(Section, { heading: "Build your MacBook Pro (OLED)" }, /* @__PURE__ */ h(Text, null, "[Back to start](index.html)"), /* @__PURE__ */ h(Grid, { columns: 3 }, /* @__PURE__ */ h(Select, { label: "Size", options: [{ value: "14inch", label: "14-inch" }, { value: "16inch", label: "16-inch" }], value: size, onChange: onSize }), /* @__PURE__ */ h(Select, { label: "Chip", options: chipOpts, value: active.chip, onChange: onChip }), /* @__PURE__ */ h(Select, { label: "Colour (same price)", options: COLORS, value: color, onChange: setColor }), /* @__PURE__ */ h(Select, { label: "Unified memory", options: memOpts, value: String(useMem), onChange: setMem }), /* @__PURE__ */ h(Select, { label: "SSD storage", options: ssdOpts, value: String(useSsd), onChange: setSsd }), /* @__PURE__ */ h(Select, { label: "Power adapter", options: adOpts, value: useAdapter, onChange: setAdapter }), /* @__PURE__ */ h(Select, { label: "Keyboard language (same price)", options: kbOpts, value: kb, onChange: setKb })), /* @__PURE__ */ h(Grid, { columns: 3 }, /* @__PURE__ */ h(Toggle, { label: "Nano-texture display (" + plus(NANO) + ")", value: nano, onChange: setNano }), /* @__PURE__ */ h(Toggle, { label: "Pre-install Logic Pro (" + plus(229.99) + ")", value: logic, onChange: setLogic }), /* @__PURE__ */ h(Toggle, { label: "Pre-install Final Cut Pro (" + plus(349.99) + ")", value: fcp, onChange: setFcp })), /* @__PURE__ */ h(Text, null, active.limit), /* @__PURE__ */ h(Toggle, { label: "Add AppleCare+ (exact price for this build not published as a single figure; Apple NL lists €479 and €579, from €479). Not added to the total.", value: care, onChange: setCare })),
    /* @__PURE__ */ h(Section, { heading: "Price", caption: "Incl. 21% VAT, Apple NL configurator, " + AS_OF + ". Colour and keyboard layout are €0." }, total !== null ? /* @__PURE__ */ h(Metrics, { metrics: [{ value: eur(total), label: "Running total", detail: (nano ? "Nano-texture, " : "Standard glass, ") + (COLORS.find((c) => c.value === color)?.label || "") }] }) : /* @__PURE__ */ h(Callout, { lead: "This combination is not offered", tone: "warning" }, "Apple NL does not sell this memory and storage pair on this chip. Pick a listed option."), /* @__PURE__ */ h(Table, { columns: ["Item", "Price"], rows, emphasis: rows.length - 1, align: ["start", "end"] })),
    /* @__PURE__ */ h(Section, { heading: "This build" }, /* @__PURE__ */ h(
      Properties,
      {
        items: [
          { label: "Chip", value: active.chipLabel + ", " + active.ne },
          { label: "Memory", value: useMem + "GB unified memory at " + bwLabel(active.bw) },
          { label: "Storage", value: ssdLabel(useSsd) + " SSD" },
          { label: "Display", value: (active.size === "14inch" ? "14-inch" : "16-inch") + " PROLED XDR tandem OLED with Touch, 2000 nits peak" + (nano ? ", nano-texture" : " (nano-texture " + plus(NANO) + ")") },
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
          { title: "Configure this PROLED XDR MacBook Pro at Apple NL", site: "apple.com/nl", href: APPLE },
          { title: "MacBook Pro with PROLED XDR — tech specs", site: "apple.com/nl", href: SPECS }
        ]
      }
    ), /* @__PURE__ */ h(Text, null, "Prices were read from the Apple NL configurator API on " + AS_OF + " and are not a quote. The same chip costs about €400 more than the Liquid Retina XDR (LCD) model. AppleCare+ is offered at checkout with two listed prices (€479 and €579); the mapping to a specific build was not published, so it is not added to the total.")),
    /* @__PURE__ */ h(Floating, { edge: "bottom", bar: true }, /* @__PURE__ */ h(Text, null, total !== null ? "Total " + eur(total) + " incl. VAT — MacBook Pro (OLED), Apple NL, " + AS_OF : "Pick a valid memory and storage pair to see the total."))
  );
}
export {
  App as default
};
