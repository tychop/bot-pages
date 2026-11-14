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
  { value: "blue", label: "Blue" },
  { value: "purple", label: "Purple" },
  { value: "pink", label: "Pink" },
  { value: "orange", label: "Orange" },
  { value: "yellow", label: "Yellow" },
  { value: "green", label: "Green" },
  { value: "silver", label: "Silver" }
];
const NANO = 220;
const CARE = 219;
const VARIANTS = [
  {
    chip: "10-10",
    chipLabel: "M6, 10-core CPU, 10-core GPU",
    cpu: 10,
    gpu: 10,
    ne: "Dual 16-core Neural Engine",
    bw: (m) => m >= 24 ? 170 : 153,
    weight: "4.42 kg",
    ports: "2x Thunderbolt 4 (optional 2.5Gb Ethernet +€30)",
    base: 1819,
    defMem: 16,
    defSsd: 256,
    mem: { 16: 0, 24: 220 },
    ssd: { 256: 0, 512: 220, 1024: 550 },
    skip: [],
    ethernet: { available: true, included: false, delta: 30 },
    hasNano: false,
    nanoDelta: 0,
    kbNumericDelta: 80,
    kbDefaultLabel: "Magic Keyboard (no Touch ID)",
    kbNumericLabel: "Magic Keyboard with Touch ID and numeric keypad",
    limit: "The 10-core iMac goes to 24GB and 1TB, with two Thunderbolt ports. 32GB, 2TB, and nano-texture glass need the 12-core model. 2.5Gb Ethernet is optional. The default keyboard has no Touch ID."
  },
  {
    chip: "12-12",
    chipLabel: "M6, 12-core CPU, 12-core GPU",
    cpu: 12,
    gpu: 12,
    ne: "Dual 16-core Neural Engine",
    bw: (m) => m >= 24 ? 170 : 153,
    weight: "4.44 kg",
    ports: "4x Thunderbolt 4, 2.5Gb Ethernet included",
    base: 2019,
    defMem: 16,
    defSsd: 256,
    mem: { 16: 0, 24: 220, 32: 440 },
    ssd: { 256: 0, 512: 220, 1024: 550, 2048: 1100 },
    skip: [[32, 256]],
    ethernet: { available: false, included: true, delta: 0 },
    hasNano: true,
    nanoDelta: NANO,
    kbNumericDelta: 30,
    kbDefaultLabel: "Magic Keyboard with Touch ID",
    kbNumericLabel: "Magic Keyboard with Touch ID and numeric keypad",
    limit: "The 12-core iMac goes to 32GB and 2TB, with four Thunderbolt ports and 2.5Gb Ethernet included. 32GB is not offered with the 256GB SSD. Nano-texture glass is +€220. There is no 10Gb Ethernet option."
  }
];
const APPLE = "https://www.apple.com/nl/shop/buy-mac/imac";
const SPECS = "https://www.apple.com/nl/imac/specs/";
function findV(chip) {
  return VARIANTS.find((v) => v.chip === chip);
}
function bodyPrice(v, mem, ssd) {
  if (v.mem[mem] === void 0 || v.ssd[ssd] === void 0) return null;
  if (v.skip.some((x) => x[0] === mem && x[1] === ssd)) return null;
  return v.base + v.mem[mem] + v.ssd[ssd];
}
function App() {
  const [chip, setChip] = useState("10-10");
  const [color, setColor] = useState("blue");
  const [mem, setMem] = useState("16");
  const [ssd, setSsd] = useState("256");
  const [nano, setNano] = useState(false);
  const [eth, setEth] = useState(false);
  const [vesa, setVesa] = useState(false);
  const [trackpad, setTrackpad] = useState(false);
  const [kbForm, setKbForm] = useState("default");
  const [kb, setKb] = useState("nld");
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
  const useNano = active.hasNano && nano;
  const useEth = active.ethernet.available && eth;
  const hardware = bodyPrice(active, useMem, useSsd);
  const addons = (useNano ? active.nanoDelta : 0) + (useEth ? active.ethernet.delta : 0) + (trackpad ? 54 : 0) + (kbForm === "numeric" ? active.kbNumericDelta : 0) + (logic ? 229.99 : 0) + (fcp ? 349.99 : 0) + (care ? CARE : 0);
  const total = hardware === null ? null : hardware + addons;
  const invalidReason = useMem === 32 && useSsd === 256 ? "Apple NL will not price the 12-core iMac with 32GB memory and 256GB storage." : null;
  const breakdown = [
    { label: "Base (24-inch " + active.chipLabel + ", " + active.defMem + "GB / " + ssdLabel(active.defSsd) + ", Magic Mouse, " + active.kbDefaultLabel + ")", amount: active.base }
  ];
  if (hardware !== null) {
    if (useMem !== active.defMem) breakdown.push({ label: "Memory " + useMem + "GB", amount: active.mem[useMem] });
    if (useSsd !== active.defSsd) breakdown.push({ label: "Storage " + ssdLabel(useSsd), amount: active.ssd[useSsd] });
    if (useNano) breakdown.push({ label: "Nano-texture glass", amount: active.nanoDelta });
    if (useEth) breakdown.push({ label: "2.5Gb Ethernet", amount: active.ethernet.delta });
    if (trackpad) breakdown.push({ label: "Magic Trackpad instead of Magic Mouse", amount: 54 });
    if (kbForm === "numeric") breakdown.push({ label: active.kbNumericLabel, amount: active.kbNumericDelta });
    if (logic) breakdown.push({ label: "Logic Pro (pre-installed)", amount: 229.99 });
    if (fcp) breakdown.push({ label: "Final Cut Pro (pre-installed)", amount: 349.99 });
    if (care) breakdown.push({ label: "AppleCare+", amount: CARE });
  }
  const onChip = (c) => {
    setChip(c);
    const next = findV(c);
    if (next.mem[Number(mem)] === void 0) setMem(String(next.defMem));
    if (next.ssd[Number(ssd)] === void 0) setSsd(String(next.defSsd));
    if (!next.hasNano) setNano(false);
    if (!next.ethernet.available) setEth(false);
  };
  const chipOpts = VARIANTS.map((v) => ({ value: v.chip, label: v.chipLabel + " — from " + eur(v.base) }));
  const memOpts = validMem.map((m) => ({ value: String(m), label: m + "GB" + (m === active.defMem ? "" : " (" + plus(active.mem[m]) + ")") }));
  const ssdOpts = validSsd.map((s) => {
    const blocked = bodyPrice(active, useMem, s) === null && active.ssd[s] !== void 0;
    return { value: String(s), label: ssdLabel(s) + (s === active.defSsd ? "" : " (" + plus(active.ssd[s]) + ")") + (blocked ? " — not offered with " + useMem + "GB" : "") };
  });
  const kbFormOpts = [
    { value: "default", label: active.kbDefaultLabel },
    { value: "numeric", label: active.kbNumericLabel + " (" + plus(active.kbNumericDelta) + ")" }
  ];
  const rows = breakdown.map((l) => [l.label, l.label.startsWith("Base") ? eur(l.amount) : plus(l.amount)]);
  if (total !== null) rows.push(["Total incl. 21% VAT", eur(total)]);
  return /* @__PURE__ */ h(
    Page,
    {
      title: "Configure iMac (Apple NL)",
      summary: "Build a 24-inch iMac with M6. Totals use Apple NL base prices and listed upcharges, incl. 21% VAT. Prices checked " + AS_OF + ".",
      width: "wide"
    },
    /* @__PURE__ */ h(Section, { heading: "Build your iMac" }, /* @__PURE__ */ h(Grid, { columns: 3 }, /* @__PURE__ */ h(Select, { label: "Chip", options: chipOpts, value: active.chip, onChange: onChip }), /* @__PURE__ */ h(Select, { label: "Colour (same price)", options: COLORS, value: color, onChange: setColor }), /* @__PURE__ */ h(Select, { label: "Unified memory", options: memOpts, value: String(useMem), onChange: setMem }), /* @__PURE__ */ h(Select, { label: "SSD storage", options: ssdOpts, value: String(useSsd), onChange: setSsd }), /* @__PURE__ */ h(Select, { label: "Keyboard", options: kbFormOpts, value: kbForm, onChange: setKbForm }), /* @__PURE__ */ h(Select, { label: "Keyboard language (same price)", options: kbOpts, value: kb, onChange: setKb })), /* @__PURE__ */ h(Grid, { columns: 3 }, /* @__PURE__ */ h(Toggle, { label: "VESA mount instead of stand (€0)", value: vesa, onChange: setVesa }), /* @__PURE__ */ h(Toggle, { label: "Magic Trackpad instead of Magic Mouse (" + plus(54) + ")", value: trackpad, onChange: setTrackpad }), /* @__PURE__ */ h(Toggle, { label: active.hasNano ? "Nano-texture glass (" + plus(NANO) + ")" : "Nano-texture glass (only on the 12-core iMac)", value: useNano, onChange: setNano, disabled: !active.hasNano }), /* @__PURE__ */ h(Toggle, { label: active.ethernet.available ? "Add 2.5Gb Ethernet (" + plus(30) + ")" : "2.5Gb Ethernet (included on 12-core)", value: active.ethernet.included || useEth, onChange: setEth, disabled: !active.ethernet.available }), /* @__PURE__ */ h(Toggle, { label: "Pre-install Logic Pro (" + plus(229.99) + ")", value: logic, onChange: setLogic }), /* @__PURE__ */ h(Toggle, { label: "Pre-install Final Cut Pro (" + plus(349.99) + ")", value: fcp, onChange: setFcp })), /* @__PURE__ */ h(Text, null, active.limit), /* @__PURE__ */ h(Toggle, { label: "Add AppleCare+ (" + plus(CARE) + "). Apple NL lists a single price for iMac.", value: care, onChange: setCare })),
    /* @__PURE__ */ h(Section, { heading: "Price", caption: "Incl. 21% VAT, Apple NL configurator, " + AS_OF + ". Colour, keyboard language and VESA mount are €0." }, total !== null ? /* @__PURE__ */ h(Metrics, { metrics: [{ value: eur(total), label: "Running total", detail: (COLORS.find((c) => c.value === color)?.label || "") + (vesa ? ", VESA mount" : ", desktop stand") }] }) : /* @__PURE__ */ h(Callout, { lead: "This combination is not offered", tone: "warning" }, invalidReason || "Apple NL does not sell this memory and storage pair on this chip."), /* @__PURE__ */ h(Table, { columns: ["Item", "Price"], rows, emphasis: rows.length - 1, align: ["start", "end"] })),
    /* @__PURE__ */ h(Section, { heading: "This build" }, /* @__PURE__ */ h(
      Properties,
      {
        items: [
          { label: "Chip", value: active.chipLabel + ", " + active.ne },
          { label: "Memory", value: useMem + "GB unified memory at " + bwLabel(active.bw(useMem)) + " (Apple's iMac specs say up to 170 GB/s; 153 GB/s at 16GB and 170 GB/s above is the official M6 split on MacBook Pro and Mac mini)" },
          { label: "Storage", value: ssdLabel(useSsd) + " SSD" },
          { label: "Display", value: "24-inch 4.5K Retina" + (useNano ? ", nano-texture glass" : active.hasNano ? " (nano-texture " + plus(NANO) + ")" : ". Nano-texture is only offered on the 12-core iMac") },
          { label: "Ports", value: active.ethernet.included || useEth ? active.ports.replace("optional 2.5Gb Ethernet +€30", "2.5Gb Ethernet") : "2x Thunderbolt 4, no Ethernet" },
          { label: "Stand", value: vesa ? "VESA mount (same price as the desktop stand)" : "Desktop stand (VESA mount is €0)" },
          { label: "Pointing device", value: trackpad ? "Magic Trackpad" : "Magic Mouse" },
          { label: "Keyboard", value: (kbForm === "numeric" ? active.kbNumericLabel : active.kbDefaultLabel) + ", " + (kbOpts.find((c) => c.value === kb)?.label || kb) },
          { label: "Weight", value: active.weight },
          { label: "Local AI", value: aiNote(useMem) }
        ]
      }
    )),
    /* @__PURE__ */ h(Section, { heading: "Buy and sources" }, /* @__PURE__ */ h(
      LinkCards,
      {
        links: [
          { title: "Configure this iMac at Apple NL", site: "apple.com/nl", href: APPLE },
          { title: "iMac tech specs", site: "apple.com/nl", href: SPECS }
        ]
      }
    ), /* @__PURE__ */ h(Text, null, "Prices were read from the Apple NL configurator API on " + AS_OF + " and are not a quote. The 12-core, 32GB, 256GB combination is excluded because the configurator will not price it. AppleCare+ is listed at a single iMac price of €219 and is included in the total when selected.")),
    /* @__PURE__ */ h(Floating, { edge: "bottom", bar: true }, /* @__PURE__ */ h(Text, null, total !== null ? "Total " + eur(total) + " incl. VAT — iMac, Apple NL, " + AS_OF : "Pick a valid memory and storage pair to see the total."))
  );
}
export {
  App as default
};
