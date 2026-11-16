import { Page, Section, Text, Table, Segmented, Select, Input, Toggle, Grid, Properties, Callout, LinkCards, NumberedList, useState, useMemo, h } from "./runtime.js";
const B = "https://www.apple.com/nl/shop/buy-mac/";
const flat = (n) => (_m) => n;
const MBP_COL = ["Space Black", "Silver"];
const MBA_COL = ["Sky Blue", "Silver", "Starlight", "Midnight"];
const IMAC_COL = ["Blue", "Purple", "Pink", "Orange", "Yellow", "Green", "Silver"];
const MBP_NANO = { label: "Nano-texture display", delta: 165 };
const MBP_MAX_PORTS = "3x Thunderbolt 5, HDMI, SDXC, MagSafe 3";
const MBP_PRO_STORAGE = { 1024: 0, 2048: 550, 4096: 1650 };
const MAX_STORAGE = { 2048: 0, 4096: 1100, 8192: 3300 };
const OLED_MAX_STORAGE = { 2048: 0, 4096: 1100, 8192: 3300, 16384: 7700 };
const OLED = B + "macbook-pro-proled-xdr";
const OLED_NANO = { label: "Nano-texture display", delta: 165 };
const M6_BW = (m) => m >= 24 ? 170 : 153;
const STUDIO_MAX_SSD = { 512: 0, 1024: 330, 2048: 880, 4096: 1980, 8192: 4180 };
const STUDIO_ULTRA_SSD = { 1024: 0, 2048: 550, 4096: 1650, 8192: 3850, 16384: 8250 };
const MBP14_MAX = B + "macbook-pro/14%E2%80%91inch-space-black-display-met-standaardglas-m5-max-chip-18%E2%80%91core-cpu-40%E2%80%91core-gpu-48-gb-geheugen-2tb-opslag";
const MBP16_MAX = B + "macbook-pro/16%E2%80%91inch-space-black-display-met-standaardglas-m5-max-chip-18%E2%80%91core-cpu-40%E2%80%91core-gpu-48-gb-geheugen-2tb-opslag";
const STUDIO_MAX = B + "mac-studio/m5-max-chip-18%E2%80%91core-cpu-40%E2%80%91core-gpu-64-gb-geheugen-1tb-opslag";
const STUDIO_ULTRA = B + "mac-studio/m5-ultra-chip-30%E2%80%91core-cpu-64%E2%80%91core-gpu-96-gb-geheugen-1tb-opslag";
const variants = [
  {
    id: "mbp14-m6",
    model: 'MacBook Pro 14"',
    family: "mbp14",
    form: "laptop",
    chip: "M6",
    cpu: 12,
    gpu: 12,
    ne: 32,
    bw: M6_BW,
    base: 2329,
    mem: { 16: 0, 24: 220, 32: 440 },
    ssd: MBP_PRO_STORAGE,
    nano: MBP_NANO,
    colours: MBP_COL,
    ports: "3x Thunderbolt 4, HDMI, SDXC, MagSafe 3",
    eth10: null,
    ethNote: "Wi-Fi only",
    weight: "1.55 kg",
    battery: "72.4 Wh, up to 24 h video",
    power: "No charger in the box (EU)",
    url: B + "macbook-pro"
  },
  {
    id: "mbp14-m5pro15",
    model: 'MacBook Pro 14"',
    family: "mbp14",
    form: "laptop",
    chip: "M5 Pro",
    cpu: 15,
    gpu: 16,
    ne: 16,
    bw: flat(307),
    base: 2949,
    mem: { 24: 0, 48: 660 },
    ssd: MBP_PRO_STORAGE,
    nano: MBP_NANO,
    colours: MBP_COL,
    ports: MBP_MAX_PORTS,
    eth10: null,
    ethNote: "Wi-Fi only",
    weight: "1.60 kg",
    battery: "72.4 Wh, up to 22 h video",
    power: "No charger in the box (EU); 70W minimum",
    url: B + "macbook-pro"
  },
  {
    id: "mbp14-m5pro18",
    model: 'MacBook Pro 14"',
    family: "mbp14",
    form: "laptop",
    chip: "M5 Pro",
    cpu: 18,
    gpu: 20,
    ne: 16,
    bw: flat(307),
    base: 3199,
    mem: { 24: 0, 48: 660, 64: 1100 },
    ssd: MBP_PRO_STORAGE,
    nano: MBP_NANO,
    colours: MBP_COL,
    ports: MBP_MAX_PORTS,
    eth10: null,
    ethNote: "Wi-Fi only",
    weight: "1.60 kg",
    battery: "72.4 Wh, up to 22 h video",
    power: "No charger in the box (EU); 96W adapter +€85",
    url: B + "macbook-pro"
  },
  {
    id: "mbp14-m5max32",
    model: 'MacBook Pro 14"',
    family: "mbp14",
    form: "laptop",
    chip: "M5 Max",
    cpu: 18,
    gpu: 32,
    ne: 16,
    bw: flat(460),
    base: 4849,
    mem: { 36: 0 },
    ssd: MAX_STORAGE,
    nano: MBP_NANO,
    colours: MBP_COL,
    ports: MBP_MAX_PORTS,
    eth10: null,
    ethNote: "Wi-Fi only",
    weight: "1.62 kg",
    battery: "72.4 Wh, up to 20 h video",
    power: "No charger in the box (EU); 70W minimum",
    url: MBP14_MAX
  },
  {
    id: "mbp14-m5max40",
    model: 'MacBook Pro 14"',
    family: "mbp14",
    form: "laptop",
    chip: "M5 Max",
    cpu: 18,
    gpu: 40,
    ne: 16,
    bw: flat(614),
    base: 5509,
    mem: { 48: 0, 64: 440, 128: 2200 },
    ssd: MAX_STORAGE,
    nano: MBP_NANO,
    colours: MBP_COL,
    ports: MBP_MAX_PORTS,
    eth10: null,
    ethNote: "Wi-Fi only",
    weight: "1.62 kg",
    battery: "72.4 Wh, up to 20 h video",
    power: "No charger in the box (EU); 96W adapter +€85",
    url: MBP14_MAX
  },
  {
    id: "mbp16-m5pro18",
    model: 'MacBook Pro 16"',
    family: "mbp16",
    form: "laptop",
    chip: "M5 Pro",
    cpu: 18,
    gpu: 20,
    ne: 16,
    bw: flat(307),
    base: 3449,
    mem: { 24: 0, 48: 660, 64: 1100 },
    ssd: MBP_PRO_STORAGE,
    nano: MBP_NANO,
    colours: MBP_COL,
    ports: MBP_MAX_PORTS,
    eth10: null,
    ethNote: "Wi-Fi only",
    weight: "2.14 kg",
    battery: "100 Wh, up to 24 h video",
    power: "No charger in the box (EU); 140W minimum",
    url: B + "macbook-pro"
  },
  {
    id: "mbp16-m5max32",
    model: 'MacBook Pro 16"',
    family: "mbp16",
    form: "laptop",
    chip: "M5 Max",
    cpu: 18,
    gpu: 32,
    ne: 16,
    bw: flat(460),
    base: 5149,
    mem: { 36: 0 },
    ssd: MAX_STORAGE,
    nano: MBP_NANO,
    colours: MBP_COL,
    ports: MBP_MAX_PORTS,
    eth10: null,
    ethNote: "Wi-Fi only",
    weight: "2.15 kg",
    battery: "100 Wh, up to 22 h video",
    power: "No charger in the box (EU); 140W minimum",
    url: MBP16_MAX
  },
  {
    id: "mbp16-m5max40",
    model: 'MacBook Pro 16"',
    family: "mbp16",
    form: "laptop",
    chip: "M5 Max",
    cpu: 18,
    gpu: 40,
    ne: 16,
    bw: flat(614),
    base: 5749,
    mem: { 48: 0, 64: 440, 128: 2200 },
    ssd: MAX_STORAGE,
    nano: MBP_NANO,
    colours: MBP_COL,
    ports: MBP_MAX_PORTS,
    eth10: null,
    ethNote: "Wi-Fi only",
    weight: "2.15 kg",
    battery: "100 Wh, up to 22 h video",
    power: "No charger in the box (EU); 140W adapter +€119",
    url: MBP16_MAX
  },
  {
    id: "mbp14o-m5pro15",
    model: 'MacBook Pro 14" OLED',
    family: "mbp14o",
    form: "laptop",
    chip: "M5 Pro",
    cpu: 15,
    gpu: 16,
    ne: 16,
    bw: flat(307),
    base: 3349,
    mem: { 24: 0, 48: 660 },
    ssd: MBP_PRO_STORAGE,
    nano: OLED_NANO,
    colours: MBP_COL,
    ports: MBP_MAX_PORTS,
    eth10: null,
    ethNote: "Wi-Fi only",
    weight: "1.38 kg",
    battery: "72.6 Wh, up to 22 h video",
    power: "No charger in the box (EU); 70W minimum",
    url: OLED
  },
  {
    id: "mbp14o-m5pro18",
    model: 'MacBook Pro 14" OLED',
    family: "mbp14o",
    form: "laptop",
    chip: "M5 Pro",
    cpu: 18,
    gpu: 20,
    ne: 16,
    bw: flat(307),
    base: 3589,
    mem: { 24: 0, 48: 660, 64: 1100 },
    ssd: MBP_PRO_STORAGE,
    nano: OLED_NANO,
    colours: MBP_COL,
    ports: MBP_MAX_PORTS,
    eth10: null,
    ethNote: "Wi-Fi only",
    weight: "1.38 kg",
    battery: "72.6 Wh, up to 22 h video",
    power: "No charger in the box (EU); 96W adapter +€85",
    url: OLED
  },
  {
    id: "mbp14o-m5max32",
    model: 'MacBook Pro 14" OLED',
    family: "mbp14o",
    form: "laptop",
    chip: "M5 Max",
    cpu: 18,
    gpu: 32,
    ne: 16,
    bw: flat(460),
    base: 5249,
    mem: { 36: 0 },
    ssd: OLED_MAX_STORAGE,
    nano: OLED_NANO,
    colours: MBP_COL,
    ports: MBP_MAX_PORTS,
    eth10: null,
    ethNote: "Wi-Fi only",
    weight: "1.40 kg",
    battery: "72.6 Wh, up to 20 h video",
    power: "No charger in the box (EU); 70W minimum",
    url: OLED
  },
  {
    id: "mbp14o-m5max40",
    model: 'MacBook Pro 14" OLED',
    family: "mbp14o",
    form: "laptop",
    chip: "M5 Max",
    cpu: 18,
    gpu: 40,
    ne: 16,
    bw: flat(614),
    base: 5909,
    mem: { 48: 0, 64: 440, 128: 2200 },
    ssd: OLED_MAX_STORAGE,
    nano: OLED_NANO,
    colours: MBP_COL,
    ports: MBP_MAX_PORTS,
    eth10: null,
    ethNote: "Wi-Fi only",
    weight: "1.40 kg",
    battery: "72.6 Wh, up to 20 h video",
    power: "No charger in the box (EU); 96W adapter +€85",
    url: OLED
  },
  {
    id: "mbp16o-m5pro18",
    model: 'MacBook Pro 16" OLED',
    family: "mbp16o",
    form: "laptop",
    chip: "M5 Pro",
    cpu: 18,
    gpu: 20,
    ne: 16,
    bw: flat(307),
    base: 3949,
    mem: { 24: 0, 48: 660, 64: 1100 },
    ssd: MBP_PRO_STORAGE,
    nano: OLED_NANO,
    colours: MBP_COL,
    ports: MBP_MAX_PORTS,
    eth10: null,
    ethNote: "Wi-Fi only",
    weight: "1.82 kg",
    battery: "100 Wh, up to 24 h video",
    power: "No charger in the box (EU); 140W minimum",
    url: OLED
  },
  {
    id: "mbp16o-m5max32",
    model: 'MacBook Pro 16" OLED',
    family: "mbp16o",
    form: "laptop",
    chip: "M5 Max",
    cpu: 18,
    gpu: 32,
    ne: 16,
    bw: flat(460),
    base: 5649,
    mem: { 36: 0 },
    ssd: OLED_MAX_STORAGE,
    nano: OLED_NANO,
    colours: MBP_COL,
    ports: MBP_MAX_PORTS,
    eth10: null,
    ethNote: "Wi-Fi only",
    weight: "1.84 kg",
    battery: "100 Wh, up to 22 h video",
    power: "No charger in the box (EU); 140W minimum",
    url: OLED
  },
  {
    id: "mbp16o-m5max40",
    model: 'MacBook Pro 16" OLED',
    family: "mbp16o",
    form: "laptop",
    chip: "M5 Max",
    cpu: 18,
    gpu: 40,
    ne: 16,
    bw: flat(614),
    base: 6249,
    mem: { 48: 0, 64: 440, 128: 2200 },
    ssd: OLED_MAX_STORAGE,
    nano: OLED_NANO,
    colours: MBP_COL,
    ports: MBP_MAX_PORTS,
    eth10: null,
    ethNote: "Wi-Fi only",
    weight: "1.84 kg",
    battery: "100 Wh, up to 22 h video",
    power: "No charger in the box (EU); 140W minimum",
    url: OLED
  },
  {
    id: "studio-max32",
    model: "Mac Studio",
    family: "studio",
    form: "desktop",
    chip: "M5 Max",
    cpu: 18,
    gpu: 32,
    ne: 16,
    bw: flat(460),
    base: 3029,
    mem: { 36: 0 },
    ssd: STUDIO_MAX_SSD,
    colours: ["Silver"],
    ports: "4x Thunderbolt 5, 2x USB-A, HDMI, 10Gb Ethernet; front 2x USB-C, SDXC",
    eth10: 0,
    ethNote: "10Gb Ethernet included",
    weight: "2.7 kg",
    battery: "Desktop",
    power: "Built-in",
    url: B + "mac-studio"
  },
  {
    id: "studio-max40",
    model: "Mac Studio",
    family: "studio",
    form: "desktop",
    chip: "M5 Max",
    cpu: 18,
    gpu: 40,
    ne: 16,
    bw: flat(614),
    base: 3689,
    mem: { 48: 0, 64: 440, 128: 2200 },
    ssd: STUDIO_MAX_SSD,
    colours: ["Silver"],
    ports: "4x Thunderbolt 5, 2x USB-A, HDMI, 10Gb Ethernet; front 2x USB-C, SDXC",
    eth10: 0,
    ethNote: "10Gb Ethernet included",
    weight: "2.7 kg",
    battery: "Desktop",
    power: "Built-in",
    url: STUDIO_MAX
  },
  {
    id: "studio-ultra30",
    model: "Mac Studio",
    family: "studio",
    form: "desktop",
    chip: "M5 Ultra",
    cpu: 30,
    gpu: 64,
    ne: 32,
    bw: flat(1200),
    base: 6649,
    mem: { 96: 0, 256: 4400 },
    ssd: STUDIO_ULTRA_SSD,
    colours: ["Silver"],
    ports: "4x Thunderbolt 5, 2x USB-A, HDMI, 10Gb Ethernet; front 2x Thunderbolt 5, SDXC",
    eth10: 0,
    ethNote: "10Gb Ethernet included",
    weight: "3.6 kg",
    battery: "Desktop",
    power: "Built-in",
    url: STUDIO_ULTRA
  },
  {
    id: "studio-ultra36",
    model: "Mac Studio",
    family: "studio",
    form: "desktop",
    chip: "M5 Ultra",
    cpu: 36,
    gpu: 80,
    ne: 32,
    bw: flat(1200),
    base: 8079,
    mem: { 96: 0, 256: 4400, 512: 17050 },
    ssd: STUDIO_ULTRA_SSD,
    colours: ["Silver"],
    ports: "4x Thunderbolt 5, 2x USB-A, HDMI, 10Gb Ethernet; front 2x Thunderbolt 5, SDXC",
    eth10: 0,
    ethNote: "10Gb Ethernet included",
    weight: "3.6 kg",
    battery: "Desktop",
    power: "Built-in",
    url: STUDIO_ULTRA
  },
  {
    id: "mini-m6",
    model: "Mac mini",
    family: "mini",
    form: "desktop",
    chip: "M6",
    cpu: 12,
    gpu: 12,
    ne: 32,
    bw: (m) => m >= 24 ? 170 : 153,
    base: 1069,
    mem: { 16: 0, 24: 220, 32: 440 },
    ssd: { 256: 0, 512: 220, 1024: 550, 2048: 1100 },
    colours: ["Silver"],
    ports: "3x Thunderbolt 4, HDMI, 2.5Gb Ethernet; front 2x USB-C",
    eth10: 110,
    ethNote: "2.5Gb Ethernet; 10Gb +€110",
    weight: "0.67 kg",
    battery: "Desktop",
    power: "Built-in",
    url: B + "mac-mini"
  },
  {
    id: "mini-m5pro15",
    model: "Mac mini",
    family: "mini",
    form: "desktop",
    chip: "M5 Pro",
    cpu: 15,
    gpu: 16,
    ne: 16,
    bw: flat(307),
    base: 2019,
    mem: { 24: 0, 48: 660, 64: 1100 },
    ssd: STUDIO_MAX_SSD,
    colours: ["Silver"],
    ports: "3x Thunderbolt 5, HDMI, 2.5Gb Ethernet; front 2x USB-C",
    eth10: 110,
    ethNote: "2.5Gb Ethernet; 10Gb +€110",
    weight: "0.73 kg",
    battery: "Desktop",
    power: "Built-in",
    url: B + "mac-mini"
  },
  {
    id: "mini-m5pro18",
    model: "Mac mini",
    family: "mini",
    form: "desktop",
    chip: "M5 Pro",
    cpu: 18,
    gpu: 20,
    ne: 16,
    bw: flat(307),
    base: 2239,
    mem: { 24: 0, 48: 660, 64: 1100 },
    ssd: STUDIO_MAX_SSD,
    colours: ["Silver"],
    ports: "3x Thunderbolt 5, HDMI, 2.5Gb Ethernet; front 2x USB-C",
    eth10: 110,
    ethNote: "2.5Gb Ethernet; 10Gb +€110",
    weight: "0.73 kg",
    battery: "Desktop",
    power: "Built-in",
    url: B + "mac-mini"
  },
  {
    id: "imac-m6-10",
    model: 'iMac 24"',
    family: "imac",
    form: "desktop",
    chip: "M6",
    cpu: 10,
    gpu: 10,
    ne: 32,
    bw: M6_BW,
    base: 1819,
    mem: { 16: 0, 24: 220 },
    ssd: { 256: 0, 512: 220, 1024: 550 },
    colours: IMAC_COL,
    ports: "2x Thunderbolt 4",
    eth10: null,
    ethNote: "2.5Gb Ethernet +€30; no 10Gb",
    weight: "4.42 kg",
    battery: "Desktop",
    power: "External, included",
    url: B + "imac"
  },
  {
    id: "imac-m6-12",
    model: 'iMac 24"',
    family: "imac",
    form: "desktop",
    chip: "M6",
    cpu: 12,
    gpu: 12,
    ne: 32,
    bw: M6_BW,
    base: 2019,
    mem: { 16: 0, 24: 220, 32: 440 },
    ssd: { 256: 0, 512: 220, 1024: 550, 2048: 1100 },
    skip: [[32, 256]],
    nano: { label: "Nano-texture glass", delta: 220 },
    colours: IMAC_COL,
    ports: "4x Thunderbolt 4, 2.5Gb Ethernet",
    eth10: null,
    ethNote: "2.5Gb Ethernet included; no 10Gb",
    weight: "4.44 kg",
    battery: "Desktop",
    power: "External, included",
    url: B + "imac"
  },
  {
    id: "mba13-8",
    model: 'MacBook Air 13"',
    family: "mba13",
    form: "laptop",
    chip: "M5",
    cpu: 10,
    gpu: 8,
    ne: 16,
    bw: flat(153),
    base: 1429,
    mem: { 16: 0 },
    ssd: { 512: 0 },
    colours: MBA_COL,
    ports: "2x Thunderbolt 4, MagSafe 3",
    eth10: null,
    ethNote: "Wi-Fi only",
    weight: "1.23 kg",
    battery: "53.8 Wh, up to 18 h video",
    power: "No charger in the box (EU)",
    url: B + "macbook-air"
  },
  {
    id: "mba13-10",
    model: 'MacBook Air 13"',
    family: "mba13",
    form: "laptop",
    chip: "M5",
    cpu: 10,
    gpu: 10,
    ne: 16,
    bw: flat(153),
    base: 1539,
    mem: { 16: 0, 24: 110, 32: 330 },
    ssd: { 512: 0, 1024: 220, 2048: 770, 4096: 1870 },
    over: [[24, 1024, 1979], [24, 2048, 2529], [24, 4096, 3629], [32, 1024, 2199], [32, 2048, 2749], [32, 4096, 3849]],
    colours: MBA_COL,
    ports: "2x Thunderbolt 4, MagSafe 3",
    eth10: null,
    ethNote: "Wi-Fi only",
    weight: "1.23 kg",
    battery: "53.8 Wh, up to 18 h video",
    power: "No charger in the box (EU); 30W +€45, 35W/70W +€65",
    url: B + "macbook-air"
  },
  {
    id: "mba15-10",
    model: 'MacBook Air 15"',
    family: "mba15",
    form: "laptop",
    chip: "M5",
    cpu: 10,
    gpu: 10,
    ne: 16,
    bw: flat(153),
    base: 1729,
    mem: { 16: 0, 24: 220, 32: 440 },
    ssd: { 512: 0, 1024: 330, 2048: 880, 4096: 1980 },
    colours: MBA_COL,
    ports: "2x Thunderbolt 4, MagSafe 3",
    eth10: null,
    ethNote: "Wi-Fi only",
    weight: "1.51 kg",
    battery: "66.5 Wh, up to 18 h video",
    power: "No charger in the box (EU)",
    url: B + "macbook-air"
  }
];
const UPG_OB = "https://upgreatest.nl/product/";
const openBox = (id, fam, size, ssdGb, price, newRef, pid, slug, stock) => ({
  id,
  model: "MacBook Pro " + size + '"',
  family: fam,
  form: "laptop",
  chip: "M5 Max",
  cpu: 18,
  gpu: 40,
  ne: 16,
  bw: flat(614),
  base: price,
  mem: { 128: 0 },
  ssd: { [ssdGb]: 0 },
  colours: ["Space Black"],
  ports: MBP_MAX_PORTS,
  eth10: null,
  ethNote: "Wi-Fi only",
  weight: size === "14" ? "1.62 kg" : "2.15 kg",
  battery: size === "14" ? "72.4 Wh, up to 20 h video" : "100 Wh, up to 22 h video",
  power: "No charger in the box (EU)",
  url: UPG_OB + pid + "/" + slug,
  refShop: "UpGreatest (open box)",
  refNote: stock,
  newRef,
  dispNote: "Display type not stated"
});
const openBoxStudio = (id, base, memGb, ssdGb, price, newRef, pid, slug, stock) => ({
  ...base,
  id,
  base: price,
  mem: { [memGb]: 0 },
  ssd: { [ssdGb]: 0 },
  over: void 0,
  skip: void 0,
  url: UPG_OB + pid + "/" + slug,
  refShop: "UpGreatest (open box)",
  refNote: stock,
  newRef
});
const studioVar = (id) => variants.find((v) => v.id === id);
const refurbVariants = [
  openBoxStudio("ob-studio-max40-1tb", studioVar("studio-max40"), 128, 1024, 5989, 6219, "5423", "mac-studio-m5-max-18x-cpu-40x-gpu-128gb-1tb", "listed Nov 3, in stock again Nov 16, delivery expected 18 Nov; up from €5.889 on Nov 10"),
  openBoxStudio("ob-studio-max40-2tb", studioVar("studio-max40"), 128, 2048, 6439, 6769, "5424", "mac-studio-m5-max-18x-cpu-40x-gpu-128gb-2tb", "listed Nov 3, expected 28 Dec (was 24 Dec on Nov 13)"),
  openBoxStudio("ob-studio-ultra30-2tb", studioVar("studio-ultra30"), 256, 2048, 11219, 11599, "5426", "mac-studio-m5-ultra-30x-cpu-64x-gpu-256gb-2tb", "listed Nov 3, expected 24 Feb 2027 (was 23 Nov on Nov 12)"),
  openBox("ob-mbp14-m5max40-2tb", "mbp14", "14", 2048, 7109, 7709, "5127", "macbook-pro-14-inch-m5-max-18x-cpu-40x-gpu-128gb-2tb-spacezwart", "Op bestelling, expected 8 Dec (in stock on the morning of Nov 11)"),
  openBox("ob-mbp16-m5max40-2tb", "mbp16", "16", 2048, 7399, 7949, "5077", "macbook-pro-16-inch-m5-max-18x-cpu-40x-gpu-128gb-2tb-spacezwart", "in stock again Nov 16, delivery expected 18 Nov"),
  openBox("ob-mbp16-m5max40-4tb", "mbp16", "16", 4096, 8499, 9049, "5091", "macbook-pro-16-inch-m5-max-18x-cpu-40x-gpu-128gb-4tb-spacezwart", "new listing Nov 11, Op bestelling, expected 27 Nov"),
  {
    ...openBox("acr-mbp16-m4max40-8tb", "mbp16", "16", 8192, 9579, 0, "", "", "Apple Certified Refurbished, listed Nov 13 (still listed Nov 16), G1FWNN/A, nano-texture, ships within 24 h, limited stock"),
    chip: "M4 Max",
    cpu: 16,
    bw: flat(546),
    power: "140W USB-C adapter included",
    battery: "100 Wh",
    url: "https://www.apple.com/nl/shop/product/g1fwnn/a/Refurbished-16%E2%80%91inch-MacBook-Pro-Apple-M4-Max-chip-met-16%E2%80%91core-CPU-en-40%E2%80%91core-GPU-display-met-nanotextuur-Spacezwart",
    refShop: void 0,
    newRef: void 0,
    dispNote: "Nano-texture Liquid Retina XDR (mini-LED)"
  }
];
const UPG = "https://upgreatest.nl/mac/mac-studio";
const UPG14 = "https://upgreatest.nl/mac/macbook-pro-14";
const UPG16 = "https://upgreatest.nl/mac/macbook-pro-16";
const MM = "https://www.mediamarkt.nl/nl/product/_apple-z1u4000fcctomstdm5m18c401282-1913775.html";
const up = (price, url, stock) => [{ shop: "UpGreatest", price, url, note: stock }];
const retail = {
  "studio-max40|128|1024|0": [
    { shop: "UpGreatest", price: 6089, url: "https://upgreatest.nl/product/5193/mac-studio-m5-max-18x-cpu-40x-gpu-128gb-1tb", note: "build to order, ETA 8 Dec" },
    { shop: "Amac", price: 6219, url: "https://www.amac.nl/mac-studio-m5-max-18c-cpu-40c-gpu-128gb-1tb-10-gbit", note: "about 14 days delivery (Nov 16)" },
    { shop: "MediaMarkt", price: 5899, url: "https://www.mediamarkt.nl/nl/product/_apple-mac-studio-m5-max-cpu-18-core-gpu-40-core-128-gb-1-tb-edition-2026-1914729.html", note: "Black Friday €5.899 (was €6.219); still out of stock online (Nov 16)" }
  ],
  "studio-max40|128|2048|0": [
    { shop: "UpGreatest", price: 6639, url: "https://upgreatest.nl/product/5191/mac-studio-m5-max-18x-cpu-40x-gpu-128gb-2tb", note: "in stock, delivery expected 18 Nov" },
    { shop: "MediaMarkt", price: 6599, url: MM, note: "out of stock online since Nov 3 (still Nov 16)" }
  ],
  "studio-max40|64|1024|0": up(4329, UPG, "Op bestelling"),
  "studio-max40|64|2048|0": up(4879, UPG, "in stock"),
  "studio-max40|48|512|0": up(3559, UPG, "in stock"),
  "studio-max32|36|512|0": up(2790, UPG, "in stock; €2.745 earlier"),
  "studio-max32|36|1024|0": up(3359, UPG, "in stock"),
  "studio-ultra30|96|1024|0": up(6370, UPG, "build to order; €6.552 on Nov 13"),
  "studio-ultra30|256|1024|0": [{ shop: "Amac", price: 11049, url: "https://www.amac.nl/mac-studio-m5-ultra-30c-cpu-64c-gpu-256gb-1tb-10-gbit", note: "not in stock online, about 14 days delivery (Nov 16)" }],
  "studio-ultra30|256|2048|0": up(11419, "https://upgreatest.nl/product/5192/mac-studio-m5-ultra-30x-cpu-64x-gpu-256gb-2tb", "build to order, ETA 24 Feb 2027"),
  "studio-ultra36|512|1024|0": up(24449, "https://upgreatest.nl/product/5405/mac-studio-m5-ultra-36x-cpu-80x-gpu-512gb-1tb", "build to order, ETA 24 Feb 2027"),
  "mbp14-m6|16|1024|0": up(2106, UPG14, "in stock, Space Black or Silver; was €2.279 on Nov 3"),
  "mbp14-m6|24|1024|0": up(2305, UPG14, "in stock, Space Black or Silver; was €2.499 on Nov 3"),
  "mbp14-m6|32|1024|0": up(2663, UPG14, "in stock, Space Black or Silver; Silver was €2.504 on Nov 13"),
  "mbp14o-m5pro15|24|1024|0": up(3030, "https://upgreatest.nl/product/5406/macbook-pro-14-inch-proled-xdr-m5-pro-15x-cpu-16x-gpu-24gb-1tb-spacezwart", "in stock, Space Black or Silver"),
  "mbp14o-m5pro18|48|1024|0": up(3844, "https://upgreatest.nl/product/5409/macbook-pro-14-inch-proled-xdr-m5-pro-18x-cpu-20x-gpu-48gb-1tb-spacezwart", "in stock, Space Black or Silver"),
  "mbp14o-m5max32|36|2048|0": up(4748, "https://upgreatest.nl/product/5411/macbook-pro-14-inch-proled-xdr-m5-max-18x-cpu-32x-gpu-36gb-2tb-spacezwart", "in stock, Space Black or Silver"),
  "mbp14o-m5max40|48|2048|0": up(5909, "https://upgreatest.nl/product/5435/macbook-pro-14-inch-proled-xdr-m5-max-18x-cpu-40x-gpu-48gb-2tb-spacezwart", "listed Nov 4, Space Black or Silver, expected 8 Dec; €5.659 until Nov 10, discount gone Nov 11"),
  "mbp16o-m5pro18|24|1024|0": up(3571, "https://upgreatest.nl/product/5414/macbook-pro-16-inch-proled-xdr-m5-pro-18x-cpu-20x-gpu-24gb-1tb-spacezwart", "in stock, Space Black or Silver"),
  "mbp16o-m5pro18|48|1024|0": up(4168, "https://upgreatest.nl/product/5416/macbook-pro-16-inch-proled-xdr-m5-pro-18x-cpu-20x-gpu-48gb-1tb-zilver", "in stock, Silver; Space Black €4.428"),
  "mbp16o-m5max32|36|2048|0": up(5109, "https://upgreatest.nl/product/5418/macbook-pro-16-inch-proled-xdr-m5-max-18x-cpu-32x-gpu-36gb-2tb-spacezwart", "in stock, Space Black or Silver"),
  "mbp16o-m5max40|48|2048|0": up(5651, "https://upgreatest.nl/product/5419/macbook-pro-16-inch-proled-xdr-m5-max-18x-cpu-40x-gpu-48gb-2tb-spacezwart", "in stock, Space Black or Silver; €6.149 on Nov 13"),
  "mbp14-m5pro15|24|1024|0": up(2670, UPG14, "in stock, Space Black; Silver €2.699 (Op bestelling)"),
  "mbp14-m5pro15|24|2048|0": up(3110, UPG14, "in stock, Silver; Space Black €3.141"),
  "mbp14-m5pro18|24|2048|0": up(3365, UPG14, "in stock, Space Black; Silver Op bestelling"),
  "mbp14-m5pro18|48|1024|0": up(3659, UPG14, "in stock, Space Black"),
  "mbp14-m5max32|36|2048|0": up(4352, UPG14, "Op bestelling, Space Black; Silver €4.354 in stock"),
  "mbp14-m5max40|48|2048|0": up(5059, UPG14, "in stock, Space Black"),
  // "mbp14-m5max40|128|2048|0": UpGreatest's €7.309 listing (product 5147, in stock Nov 12) was gone on Nov 13; the page redirects to the category
  "mbp16-m5pro18|24|1024|0": up(3096, UPG16, "in stock, Silver; Space Black €3.099"),
  "mbp16-m5pro18|48|1024|0": up(3689, UPG16, "in stock, Space Black; Silver Op bestelling"),
  "mbp16-m5pro18|64|1024|0": up(4399, UPG16, "Op bestelling, Space Black"),
  // "mbp16-m5pro18|64|2048|0": no longer listed at UpGreatest (absent on Nov 13 and Nov 16)
  "mbp16-m5max32|36|2048|0": up(4621, UPG16, "in stock, Silver; Space Black €4.624"),
  "mbp16-m5max40|48|2048|0": up(5160, UPG16, "in stock, Space Black; Silver Op bestelling"),
  "mbp16-m5max40|64|2048|0": up(5789, UPG16, "in stock, Space Black; €5.989 on Nov 13"),
  "mbp16-m5max40|128|2048|0": up(7749, "https://upgreatest.nl/product/5143/macbook-pro-16-inch-m5-max-18x-cpu-40x-gpu-128gb-2tb-spacezwart", "Op bestelling, Space Black, expected 8 Dec (was in stock Nov 9)")
};
const keys = (r) => Object.keys(r).map(Number).sort((a, b) => a - b);
const buildConfigs = () => {
  const out = [];
  variants.forEach((v) => {
    keys(v.mem).forEach((m) => {
      keys(v.ssd).forEach((s) => {
        if ((v.skip || []).some((x) => x[0] === m && x[1] === s)) return;
        const o = (v.over || []).find((x) => x[0] === m && x[1] === s);
        const price = o ? o[2] : v.base + v.mem[m] + v.ssd[s];
        const finishes = v.nano ? [false, true] : [false];
        finishes.forEach((n) => {
          const apple = price + (n && v.nano ? v.nano.delta : 0);
          const key = v.id + "|" + m + "|" + s + "|" + (n ? 1 : 0);
          out.push({
            key,
            v,
            memGb: m,
            ssdGb: s,
            nano: n,
            cond: "new",
            apple,
            bw: v.bw(m),
            offers: [{ shop: "Apple NL", price: apple, url: v.url, note: "configure " + m + "GB / " + ssdLabel(s) + (n ? " / nano" : "") }].concat(retail[key] || [])
          });
        });
      });
    });
  });
  refurbVariants.forEach((v) => {
    const m = keys(v.mem)[0];
    const s = keys(v.ssd)[0];
    out.push({
      key: v.id,
      v,
      memGb: m,
      ssdGb: s,
      nano: false,
      cond: "refurb",
      apple: v.newRef || v.base,
      bw: v.bw(m),
      offers: [{ shop: v.refShop || "Apple Refurbished", price: v.base, url: v.url, note: v.refNote }]
    });
  });
  return out;
};
const eur = (n) => "€" + n.toLocaleString("nl-NL");
function ssdLabel(gb) {
  return gb >= 1024 ? gb / 1024 + "TB" : gb + "GB";
}
const bwLabel = (gb) => gb >= 1e3 ? (gb / 1e3).toFixed(1) + " TB/s" : gb + " GB/s";
const best = (c) => c.offers.slice().sort((a, b) => a.price - b.price)[0];
const ethPrice = (c, need) => need && c.v.eth10 ? c.v.eth10 : 0;
const priceOf = (c, need) => best(c).price + ethPrice(c, need);
const ALL = buildConfigs();
const passes = (c, f) => priceOf(c, f.eth) <= f.budget && (f.family === "any" || c.v.family === f.family) && (f.form === "any" || c.v.form === f.form) && (f.chip === "any" || c.v.chip === f.chip) && c.v.cpu >= f.cpu && c.v.gpu >= f.gpu && (f.exact ? c.memGb === f.mem : c.memGb >= f.mem) && c.bw >= f.bw && c.ssdGb >= f.ssd && (f.disp === "any" || !c.v.dispNote && f.disp === "nano" === c.nano) && (f.colour === "any" || c.v.colours.indexOf(f.colour) >= 0) && (!f.eth || c.v.eth10 !== null) && (f.cond === "any" || c.cond === f.cond);
const tierGuide = (mem, bw) => {
  const tps = (13.2 * bw / 614).toFixed(1);
  if (mem <= 16) return [
    "Coding: 7B-8B coding models at Q4-Q8 (for example Qwen2.5-Coder 7B); fine for autocomplete, weak for agents",
    "Image: SDXL and FLUX.2 klein 4B (16.7GB measured) are too tight to run well alongside Xcode",
    "Video: not realistic"
  ];
  if (mem <= 24) return [
    "Coding: 14B models at Q8, or 24B-32B at tight Q4 with little context",
    "Image: FLUX.2 klein 4B (about 5 s per image on M5 Max) and Z-Image Turbo (18.5GB) fit",
    "Video: only small models at low resolution"
  ];
  if (mem <= 36) return [
    "Coding: 32B coding models or 30B MoE models at Q4 with moderate context",
    "Image: most SDXL/Flux-class models fit; Qwen-Image (37.3GB measured) does not",
    "Video: small (about 5B) video models, slowly"
  ];
  if (mem <= 48) return [
    "Coding: 32B at Q8; a 70B model at Q4 (about 42.5GB) only just fits with short context",
    "Image: Qwen-Image (37.3GB) fits; everything smaller runs comfortably",
    "Video: 5B models comfortably, 14B models only heavily quantized"
  ];
  if (mem <= 64) return [
    "Coding: 70B at Q4 with usable context (about " + tps + " tok/s estimated at this bandwidth)",
    "Image: all mainstream open image models fit",
    "Video: 14B video models quantized; expect minutes per short clip"
  ];
  if (mem <= 96) return [
    "Coding: 70B at Q8 (about 75GB), or about 100B MoE models at Q4",
    "Image: any open image model, with room for an LLM loaded at the same time",
    "Video: 14B video models at higher precision; still far slower than an RTX 5090"
  ];
  if (mem <= 128) return [
    "Coding: 70B at Q8 with long context, or gpt-oss-120b-class MoE models; Llama 3.3 70B 4-bit measured at 13.2 tok/s on M5 Max 40c (about " + tps + " tok/s estimated here). Single-user reports on M5 Max 128GB: gpt-oss 120B about 79 tok/s (Ollama), a 27B Qwen at 4-bit about 68 tok/s (MLX)",
    "Image: every open image model fits, alongside a coding model",
    "Video: all open video models fit, but they run slowly; video is the weakest of the three on a Mac"
  ];
  if (mem <= 256) return [
    "Coding: 200B+ MoE models at Q4 (for example Qwen3-235B-A22B, about 130GB), or several 70B models loaded at once (about " + tps + " tok/s estimated for 70B Q4). Measured on an M5 Ultra 256GB review unit: Qwen3.5 122B-A10B at 4-bit writes 65.3 tok/s with a 32K-token prompt (NetworkChuck)",
    "Image: everything, several models resident at once; FLUX.2 klein 4B measured at 1.77 s per image on the M5 Ultra review unit",
    "Video: everything fits; speed is set by GPU cores, not memory"
  ];
  return [
    "Coding: 400B+ models at Q4, or several 200B models resident at once; the 512GB M5 Ultra is orderable in NL since Oct 28 (delivery about early December); so far only Apple's own MLX figures (Qwen 3.8 27B BF16 at 19.7 tok/s, Mistral Medium 3.5 128B FP8 at 7.7 tok/s), no independent benchmarks yet",
    "Image: everything",
    "Video: everything fits; speed is set by GPU cores"
  ];
};
const FAMILY_OPTS = [
  { value: "any", label: "Any model" },
  { value: "mba13", label: 'MacBook Air 13"' },
  { value: "mba15", label: 'MacBook Air 15"' },
  { value: "mbp14", label: 'MacBook Pro 14"' },
  { value: "mbp14o", label: 'MacBook Pro 14" OLED' },
  { value: "mbp16", label: 'MacBook Pro 16"' },
  { value: "mbp16o", label: 'MacBook Pro 16" OLED' },
  { value: "imac", label: 'iMac 24"' },
  { value: "mini", label: "Mac mini" },
  { value: "studio", label: "Mac Studio" }
];
const CHIP_OPTS = ["any", "M5", "M6", "M5 Pro", "M5 Max", "M5 Ultra"].map((c) => ({ value: c, label: c === "any" ? "Any chip" : c }));
const CPU_OPTS = [0, 8, 10, 12, 15, 16, 18, 30, 36].map((n) => ({ value: String(n), label: n === 0 ? "Any" : n + "+ cores" }));
const GPU_OPTS = [0, 8, 10, 12, 16, 20, 32, 40, 64, 80].map((n) => ({ value: String(n), label: n === 0 ? "Any" : n + "+ cores" }));
const MEM_OPTS = [16, 24, 32, 36, 48, 64, 96, 128, 256, 512].map((n) => ({ value: String(n), label: n + "GB" }));
const BW_OPTS = [
  { value: "0", label: "Any" },
  { value: "153", label: "153 GB/s (M5, M6 16GB)" },
  { value: "170", label: "170 GB/s (M6 24GB+)" },
  { value: "307", label: "307 GB/s (M5 Pro)" },
  { value: "460", label: "460 GB/s (M5 Max 32c)" },
  { value: "614", label: "614 GB/s (M5 Max 40c)" },
  { value: "1200", label: "1.2 TB/s (M5 Ultra)" }
];
const SSD_OPTS = [256, 512, 1024, 2048, 4096, 8192, 16384].map((n) => ({ value: String(n), label: ssdLabel(n) }));
const COLOUR_OPTS = [{ value: "any", label: "Any colour" }].concat(
  ["Space Black", "Silver", "Sky Blue", "Starlight", "Midnight", "Blue", "Purple", "Pink", "Orange", "Yellow", "Green"].map((c) => ({ value: c, label: c }))
);
function App() {
  const [budget, setBudget] = useState("8000");
  const [family, setFamily] = useState("any");
  const [form, setForm] = useState("any");
  const [chip, setChip] = useState("any");
  const [cpu, setCpu] = useState("0");
  const [gpu, setGpu] = useState("0");
  const [mem, setMem] = useState("128");
  const [exact, setExact] = useState(false);
  const [bw, setBw] = useState("0");
  const [ssd, setSsd] = useState("256");
  const [disp, setDisp] = useState("any");
  const [colour, setColour] = useState("any");
  const [eth, setEth] = useState(false);
  const [cond, setCond] = useState("any");
  const [prio, setPrio] = useState("value");
  const f = {
    budget: Number(budget) > 0 ? Number(budget) : Infinity,
    family,
    form,
    chip,
    cpu: Number(cpu),
    gpu: Number(gpu),
    mem: Number(mem),
    exact,
    bw: Number(bw),
    ssd: Number(ssd),
    disp,
    colour,
    eth,
    cond
  };
  const ranked = useMemo(() => {
    const list = ALL.filter((c) => passes(c, f));
    const p = (c) => priceOf(c, f.eth);
    const cmp = (a, b) => {
      if (prio === "cheap") return p(a) - p(b);
      if (prio === "fast") return b.bw - a.bw || b.v.gpu - a.v.gpu || p(a) - p(b);
      if (prio === "value") return b.bw / p(b) - a.bw / p(a) || p(a) - p(b);
      return b.memGb / p(b) - a.memGb / p(a) || p(a) - p(b);
    };
    return list.sort(cmp);
  }, [budget, family, form, chip, cpu, gpu, mem, exact, bw, ssd, disp, colour, eth, cond, prio]);
  const relax = [];
  if (ranked.length === 0) {
    const count = (patch) => ALL.filter((c) => passes(c, { ...f, ...patch }));
    const noBudget = count({ budget: Infinity });
    if (noBudget.length > 0) {
      const min = Math.min(...noBudget.map((c) => priceOf(c, f.eth)));
      relax.push("Raise the budget to " + eur(min) + " (" + noBudget.length + " match)");
    }
    const checks = [
      { label: "Set model to Any", patch: { family: "any" } },
      { label: "Set form factor to Any", patch: { form: "any" } },
      { label: "Set chip to Any", patch: { chip: "any" } },
      { label: "Set CPU cores to Any", patch: { cpu: 0 } },
      { label: "Set GPU cores to Any", patch: { gpu: 0 } },
      { label: "Turn off exact memory", patch: { exact: false } },
      { label: "Lower memory to 64GB", patch: { mem: 64, exact: false } },
      { label: "Set bandwidth to Any", patch: { bw: 0 } },
      { label: "Set storage to Any", patch: { ssd: 256 } },
      { label: "Set display to Any", patch: { disp: "any" } },
      { label: "Set colour to Any", patch: { colour: "any" } },
      { label: "Drop the 10Gb Ethernet requirement", patch: { eth: false } },
      { label: "Set condition to Any", patch: { cond: "any" } }
    ];
    checks.forEach((c) => {
      const n = count(c.patch).length;
      if (n > 0) relax.push(c.label + " (" + n + " match)");
    });
    if (relax.length === 0) relax.push("Reset several filters: no single change finds a match");
  }
  const top = ranked[0];
  const shown = ranked.slice(0, 25);
  const name = (c) => c.v.model + " " + c.v.chip + " " + c.v.cpu + "c/" + c.v.gpu + "c";
  const dispLabel = (c) => c.v.dispNote ? "Not stated" : (c.v.family === "mbp14o" || c.v.family === "mbp16o" ? "OLED " : "") + (c.nano ? c.v.nano ? c.v.nano.label.replace(" display", "").replace(" glass", "") : "Nano-texture" : "Standard");
  const rows = shown.map((c, i) => [
    String(i + 1) + ". " + name(c) + (c.cond === "refurb" ? " (refurb)" : ""),
    eur(priceOf(c, f.eth)),
    best(c).shop,
    c.memGb + "GB",
    ssdLabel(c.ssdGb),
    bwLabel(c.bw),
    dispLabel(c),
    c.cond === "new" ? "New" : "Refurb"
  ]);
  const nextMem = (c) => {
    const ms = keys(c.v.mem).filter((m2) => m2 > c.memGb);
    if (c.cond === "refurb" || ms.length === 0) return "Already the most memory this chip takes";
    const m = ms[0];
    return m + "GB adds " + eur(c.v.mem[m] - c.v.mem[c.memGb]) + " at Apple";
  };
  const newCount = ALL.filter((c) => c.cond === "new").length;
  const applePrice = (key) => {
    const c = ALL.find((x) => x.key === key);
    return c ? c.apple : 0;
  };
  return /* @__PURE__ */ h(
    Page,
    {
      title: "Mac picker for local AI",
      summary: "Every orderable Mac config in the Netherlands (" + ALL.length + " priced configs across " + (FAMILY_OPTS.length - 1) + " models), ranked by your needs. Apple NL configurator prices re-checked Nov 16, 2026, incl. VAT; shops re-checked the same day.",
      width: "wide"
    },
    /* @__PURE__ */ h(Section, { heading: "Your needs" }, /* @__PURE__ */ h(Text, null, "[Back to start](index.html)"), /* @__PURE__ */ h(Grid, { columns: 4 }, /* @__PURE__ */ h(Input, { label: "Max budget (€)", type: "number", value: budget, onChange: (v) => setBudget(v) }), /* @__PURE__ */ h(Select, { label: "Model", options: FAMILY_OPTS, value: family, onChange: (v) => setFamily(v) }), /* @__PURE__ */ h(Select, { label: "Chip", options: CHIP_OPTS, value: chip, onChange: (v) => setChip(v) }), /* @__PURE__ */ h(Select, { label: "Memory (at least)", options: MEM_OPTS, value: mem, onChange: (v) => setMem(v) }), /* @__PURE__ */ h(Select, { label: "CPU cores", options: CPU_OPTS, value: cpu, onChange: (v) => setCpu(v) }), /* @__PURE__ */ h(Select, { label: "GPU cores", options: GPU_OPTS, value: gpu, onChange: (v) => setGpu(v) }), /* @__PURE__ */ h(Select, { label: "Minimum bandwidth", options: BW_OPTS, value: bw, onChange: (v) => setBw(v) }), /* @__PURE__ */ h(Select, { label: "Minimum storage", options: SSD_OPTS, value: ssd, onChange: (v) => setSsd(v) }), /* @__PURE__ */ h(Select, { label: "Colour", options: COLOUR_OPTS, value: colour, onChange: (v) => setColour(v) }), /* @__PURE__ */ h(Toggle, { label: "Exactly this memory", value: exact, onChange: (v) => setExact(v) }), /* @__PURE__ */ h(Toggle, { label: "Needs 10Gb Ethernet", value: eth, onChange: (v) => setEth(v) })), /* @__PURE__ */ h(Grid, { columns: 3 }, /* @__PURE__ */ h(
      Segmented,
      {
        options: [{ value: "any", label: "Any form" }, { value: "laptop", label: "Laptop" }, { value: "desktop", label: "Desktop" }],
        value: form,
        onChange: (v) => setForm(v)
      }
    ), /* @__PURE__ */ h(
      Segmented,
      {
        options: [{ value: "any", label: "Any display" }, { value: "standard", label: "Standard" }, { value: "nano", label: "Nano-texture" }],
        value: disp,
        onChange: (v) => setDisp(v)
      }
    ), /* @__PURE__ */ h(
      Segmented,
      {
        options: [{ value: "any", label: "Any" }, { value: "new", label: "New" }, { value: "refurb", label: "Refurbished" }],
        value: cond,
        onChange: (v) => setCond(v)
      }
    )), /* @__PURE__ */ h(
      Segmented,
      {
        options: [
          { value: "cheap", label: "Cheapest" },
          { value: "fast", label: "Fastest for LLMs" },
          { value: "value", label: "Best value (GB/s per €)" },
          { value: "mem", label: "Most memory per €" }
        ],
        value: prio,
        onChange: (v) => setPrio(v)
      }
    )),
    top ? /* @__PURE__ */ h(Section, { heading: "Top match: " + name(top) + ", " + top.memGb + "GB / " + ssdLabel(top.ssdGb) }, /* @__PURE__ */ h(
      Properties,
      {
        items: [
          { label: "Best price", value: eur(priceOf(top, f.eth)) + " at " + best(top).shop + (best(top).note ? " (" + best(top).note + ")" : "") + (ethPrice(top, f.eth) ? ", incl. 10Gb Ethernet +" + eur(ethPrice(top, f.eth)) : "") },
          { label: "Apple price", value: top.cond === "refurb" ? top.v.refShop ? "New at Apple NL: " + eur(top.apple) : eur(top.apple) + " refurbished" : eur(top.apple) + " configured" },
          { label: "Other offers", value: top.offers.filter((o) => o !== best(top)).map((o) => o.shop + " " + eur(o.price) + (o.note ? " (" + o.note + ")" : "")).join("; ") || "None found" },
          { label: "Link", value: best(top).url },
          { label: "Chip", value: top.v.chip + ", " + top.v.cpu + "-core CPU, " + top.v.gpu + "-core GPU, " + top.v.ne + "-core Neural Engine" },
          { label: "Memory", value: top.memGb + "GB at " + bwLabel(top.bw) + "; " + nextMem(top) },
          { label: "Storage", value: ssdLabel(top.ssdGb) + "; this chip offers " + keys(top.v.ssd).map(ssdLabel).join(", ") },
          { label: "Value", value: (top.bw / priceOf(top, f.eth) * 1e3).toFixed(0) + " GB/s and " + (top.memGb / priceOf(top, f.eth) * 1e3).toFixed(1) + "GB memory per €1.000" },
          { label: "Display", value: top.v.dispNote ? top.v.dispNote : top.v.family === "mbp14o" || top.v.family === "mbp16o" ? "PROLED XDR tandem OLED with Touch, 2000 nits peak" + (top.nano ? ", nano-texture" : " (nano-texture +" + eur(165) + ")") : top.v.family === "imac" ? "24-inch 4.5K Retina" + (top.v.nano ? top.nano ? ", nano-texture" : " (nano-texture +" + eur(top.v.nano.delta) + ")" : "") : top.v.form === "desktop" ? "No built-in display" : top.v.nano ? dispLabel(top) + (top.nano ? "" : " (nano-texture +" + eur(top.v.nano.delta) + ")") : "Standard only" },
          { label: "Colours", value: top.v.colours.join(", ") + (top.v.colours.length > 1 ? " (same price)" : "") },
          { label: "Ports", value: top.v.ports + "; " + top.v.ethNote },
          { label: "Weight / battery", value: top.v.weight + " / " + top.v.battery },
          { label: "Power", value: top.v.power },
          { label: "Keyboard", value: top.v.form === "laptop" || top.v.family === "imac" ? "Any layout at no extra cost (Dutch, US-international, German and more)" : "Not included; bring your own" }
        ]
      }
    ), /* @__PURE__ */ h(NumberedList, { items: tierGuide(top.memGb, top.bw) })) : /* @__PURE__ */ h(Section, { heading: "No Mac matches yet" }, /* @__PURE__ */ h(Callout, { lead: "Relax one filter", tone: "info" }, relax.join(". "), ".")),
    ranked.length > 0 ? /* @__PURE__ */ h(
      Section,
      {
        heading: "Ranked matches (" + (ranked.length > 25 ? "top 25 of " : "") + ranked.length + ")",
        caption: "Prices incl. VAT, Nov 16, 2026. Best price is the lowest of Apple NL and the retailers checked. Most high-memory configs are build to order."
      },
      /* @__PURE__ */ h(
        Table,
        {
          columns: ["Mac", "Best price", "Shop", "Memory", "Storage", "Bandwidth", "Display", "Condition"],
          rows,
          emphasis: 0,
          align: ["start", "end", "start", "end", "end", "end", "start", "start"]
        }
      ),
      /* @__PURE__ */ h(
        LinkCards,
        {
          numbered: true,
          links: shown.slice(0, 8).map((c) => ({ title: name(c) + " " + c.memGb + "GB/" + ssdLabel(c.ssdGb) + ", " + eur(priceOf(c, f.eth)), site: best(c).shop, href: best(c).url }))
        }
      )
    ) : null,
    /* @__PURE__ */ h(Section, { heading: "More power: Mac Studio M5 Ultra, 256GB", caption: "A second pick if the M5 Max 40c is not enough. Apple NL prices re-checked Nov 16, 2026, incl. VAT." }, /* @__PURE__ */ h(Callout, { lead: "About 2x the Max on paper, with 128GB more memory", tone: "info" }, "The M5 Ultra has 1.2 TB/s of bandwidth against 614 GB/s and up to 80 GPU cores against 40, so roughly twice the Max for LLM tokens/s and image/video generation, and 256GB of memory against 128GB. Apple NL: " + eur(applePrice("studio-ultra36|256|1024|0")) + " for 36c CPU / 80c GPU with 1TB, or " + eur(applePrice("studio-ultra30|256|1024|0")) + " for 30c/64c (Amac has the same price, not in stock online, about 14 days delivery). Community figures (llmcheck.net): M5 Max 128GB vs M5 Ultra 43 vs 88 tok/s on Qwen3.5-122B-A10B and 76 vs 120 tok/s on gpt-oss-120B, so the real gain is about 1.6x to 2x. To see every storage tier, set Model to Mac Studio, Chip to M5 Ultra and Memory to 256GB."), /* @__PURE__ */ h(
      LinkCards,
      {
        links: [
          { title: "Mac Studio M5 Ultra (configure 256GB)", site: "apple.com/nl", href: STUDIO_ULTRA },
          { title: "Mac Studio M5 Ultra 30c/64c 256GB/2TB, " + eur(11419) + ", ETA 24 Feb 2027", site: "upgreatest.nl", href: "https://upgreatest.nl/product/5192/mac-studio-m5-ultra-30x-cpu-64x-gpu-256gb-2tb" },
          { title: "Mac Studio M5 Ultra 30c/64c 256GB/2TB open box, " + eur(11219) + ", expected 24 Feb 2027", site: "upgreatest.nl", href: "https://upgreatest.nl/product/5426/mac-studio-m5-ultra-30x-cpu-64x-gpu-256gb-2tb" },
          { title: "Mac Studio M5 Ultra 30c/64c 256GB/1TB, " + eur(11049) + ", about 14 days delivery", site: "amac.nl", href: "https://www.amac.nl/mac-studio-m5-ultra-30c-cpu-64c-gpu-256gb-1tb-10-gbit" }
        ]
      }
    )),
    /* @__PURE__ */ h(Section, { heading: "What memory gets you" }, /* @__PURE__ */ h(
      Table,
      {
        columns: ["Memory", "Coding LLMs", "Image", "Video"],
        rows: [16, 24, 32, 48, 64, 96, 128, 256, 512].map((m) => {
          const g = tierGuide(m, 614);
          return [m + "GB", g[0].replace("Coding: ", ""), g[1].replace("Image: ", ""), g[2].replace("Video: ", "")];
        }),
        emphasis: 0,
        align: ["start", "start", "start", "start"]
      }
    )),
    /* @__PURE__ */ h(Section, { heading: "Notes" }, /* @__PURE__ */ h(Text, null, "Covers " + newCount + ` new configs from base price plus Apple's option deltas: MacBook Air 13"/15", MacBook Pro 14"/16" (LCD and the new OLED), iMac 24", Mac mini and Mac Studio, every chip, memory, storage and display combination Apple allows. Plus ` + refurbVariants.length + ' refurbished 128GB+ configs: open-box MacBook Pros and Mac Studios from UpGreatest, plus one Apple Certified Refurbished 16" M4 Max 128GB/8TB (listed since Nov 13). Colour and keyboard layout never change the price. Bandwidth drives LLM token speed; GPU cores drive image and video speed. Token speeds marked estimated scale the measured M5 Max figure by bandwidth; M6 bandwidth is assumed (153 GB/s at 16GB, 170 GB/s above) until Apple or a review confirms it.'), /* @__PURE__ */ h(Text, null, `Not included: the MacBook Neo (A18 Pro, 8GB), Apple Certified Refurbished below 128GB (the only 128GB unit on Nov 16 is included above), iMac M6 12-core with 32GB and 256GB (the configurator will not price it), and shops without usable prices: Coolblue (reachable, but lists no 128GB+ Macs), Bol (search results load, but no 128GB+ Macs listed on Nov 16), Tweakers (DPG consent wall blocks automated access) and TechFabrique (listings not readable). OLED MacBook Pro 128GB totals were re-checked live on Nov 16 (14" €8.109; 16" €8.449) and are unchanged since Nov 4. UpGreatest open-box listings do not state the display type, so the display filter excludes them (the Apple refurbished M4 Max is excluded too). Retailer prices come from the [128GB tracker](tracker.html) and UpGreatest's site; all offers re-read on the afternoon of Nov 16, 2026 (UpGreatest's OLED MacBook Pro listings were added that day). MediaMarkt's Studio 128GB/1TB is Black Friday €5.899 (was €6.219) and 128GB/2TB is €6.599; both remain unavailable online as of Nov 16.`)),
    /* @__PURE__ */ h(Section, { heading: "New since Oct 26" }, /* @__PURE__ */ h(
      NumberedList,
      {
        items: [
          `Nov 16 (about 15:30): no meaningful change on 128GB+ configs. Apple NL is unchanged: a full live crawl of every configurator (all chip, memory and storage combinations and add-ons, incl. OLED and Ultra 512GB) matches Nov 14 exactly, and the buy-mac page lists no new line. Apple Newsroom NL and global have no new Mac or chip. Apple Certified Refurbished NL still lists the 16" M4 Max 128GB/8TB nano-texture at €9.579. No price changes on any 128GB+ config at UpGreatest, MediaMarkt (€5.899 / €6.599, both out of stock online) or Amac (back online: €6.219 / €11.049, about 14 days delivery). UpGreatest stock: open-box Studio Max 128GB/1TB (€5.989) and open-box 16" 128GB/2TB (€7.399) are in stock again, delivery 18 Nov; new Studio Max 128GB/2TB in stock, 18 Nov; open-box 16" 128GB/4TB 27 Nov; new Studio Max 128GB/1TB, new 16" 128GB/2TB, open-box 14" 128GB/2TB and OLED 14" 48GB 8 Dec; open-box Studio Max 128GB/2TB 28 Dec; Ultra 24 Feb 2027. Below 128GB, all UpGreatest offers were re-read: new to this picker are its 7 other OLED MacBook Pro listings, €319–€598 below Apple (for example 16" OLED M5 Max 48GB/2TB €5.651, down from €6.149 on Nov 13, against Apple's €6.249); the 16" M5 Max 64GB/2TB fell to €5.789 (was €5.989), the Ultra 96GB/1TB to €6.370 (was €6.552), and 12 other sub-128GB UpGreatest prices shown here moved by €7–€147 (M6, M5 Pro and M5 Max MacBook Pros, Studio M5 Max 32c); the 16" M5 Pro 64GB/2TB (€4.949) is no longer listed and was removed. New benchmarks: three llamaperf M5 Ultra reports (Nov 14–16: Qwen3.8 Flash-Next about 100 tok/s at 130K–200K context on 256GB; DeepSeek V4.1 Flash 64.1 tok/s and GLM-5.3 753B 25.7 tok/s on 512GB) and Phosphene's crowd-sourced video timings (5-second LTX-2.5 576p clip: M5 Ultra about 45 s, M5 Max 1 min 20 s, M5 Pro 2 min 30 s).`,
          `Nov 13 (about 15:35): two real changes. Apple Certified Refurbished NL lists a 128GB Mac again, the first since Oct 26: MacBook Pro 16" M4 Max 16c CPU / 40c GPU, 128GB/8TB, nano-texture, Space Black (G1FWNN/A), €9.579, ships within 24 h, limited stock (546 GB/s; a new M5 Max 16" 128GB/8TB nano-texture is €11.414 at Apple NL). And UpGreatest's new MacBook Pro 14" M5 Max 128GB/2TB (€7.309, in stock on Nov 12) is gone: its page now redirects to the category. The cheapest new 14" 128GB is now Apple NL at €7.709, and the open box is still €7.109. Apple NL is unchanged: every 128GB+ configurator total and base price is the same. Apple Newsroom NL and global have no new Mac or chip (the only new post is Apple HomeView, Nov 13). MediaMarkt is unchanged at €5.899 / €6.599, both out of stock online. UpGreatest stock moves: open-box Studio Max 128GB/1TB (€5.989) went from in stock to Op bestelling, expected 18 Nov. Open-box Studio Max 128GB/2TB is now 24 Dec (was 18 Nov). Open-box Ultra 256GB/2TB is back to 22 Feb 2027 (was 23 Nov). New Studio Max 128GB/2TB is still in stock, delivery 17 Nov. Open-box 16" 128GB/2TB and 128GB/4TB: 24 Nov. New Studio Max 128GB/1TB, new 16" 128GB/2TB, open-box 14" 128GB/2TB and OLED 14" 48GB: 5 Dec. Ultra build-to-order: 22 Feb 2027. Amac's site was down for maintenance (HTTP 503), so its prices are still the Nov 12 ones. Tweakers is still behind the DPG consent wall. New llamaperf report (Nov 13): Qwen3.8 Flash-Next on an M5 Max 128GB averages about 68 tok/s over an agent session (mlx-serve, 4.7-bit MLX, 100K–190K context). Medians are unchanged.`,
          'Nov 12 afternoon (about 15:30): re-checked everything live. No changes at Apple NL (every 128GB+ configurator total and every base price unchanged), in Apple Newsroom NL or global (no new Mac or chip), at MediaMarkt (€5.899 / €6.599, both still out of stock online), Amac, Coolblue or Bol. No UpGreatest price changes on 128GB+ configs and no new or removed listings; delivery dates moved a day: open-box Studio Max 128GB/1TB, new Studio Max 128GB/2TB and new 14" 128GB/2TB in stock, delivery 14 Nov; new Studio Max 128GB/1TB, new 16" 128GB/2TB, open-box 14" 128GB/2TB and OLED 14" 48GB 4 Dec; Ultra build-to-order 20 Feb 2027. Apple Certified Refurbished NL still tops out at 64GB (only cheaper models rotated). llamaperf medians unchanged; Tweakers still behind the DPG consent wall.',
          'Nov 12 morning: no new Macs, chips or options at Apple NL or in Apple Newsroom NL (the only new post is the Nov 11 Apple Arcade holiday lineup), and no price changes on any 128GB+ config at Apple NL (all configurator totals re-checked live, incl. OLED and Ultra 512GB), UpGreatest, MediaMarkt or Amac. No new or removed offers. UpGreatest stock moved: the new Mac Studio M5 Max 128GB/2TB (€6.639) and the new MacBook Pro 14" M5 Max 128GB/2TB (€7.309) are in stock again, delivery expected 13 Nov (both were ETA 3 Dec on the evening of Nov 11). Other UpGreatest ETAs unchanged: open-box Studio Max 128GB/1TB in stock (13 Nov); new Studio Max 128GB/1TB, new 16" 128GB/2TB, open-box 14" 128GB/2TB and OLED 14" 48GB 3 Dec; open-box Studio Max 128GB/2TB and 16" 128GB/2TB 18 Nov; open-box 16" 128GB/4TB and Ultra 256GB/2TB 23 Nov; Ultra build-to-order 19 Feb 2027. MediaMarkt still shows Black Friday €5.899 (128GB/1TB) and €6.599 (128GB/2TB), both unavailable online. Apple Certified Refurbished NL still tops out at 64GB. Bol now returns search results to automated access but lists no 128GB+ Mac; Tweakers is still behind the DPG consent wall. No new benchmarks: llamaperf medians and reports for the M5 Max 128GB and M5 Ultra 256GB/512GB are unchanged (as of 12 Nov).',
          `Nov 11: no new Macs, chips or options at Apple NL or in Apple Newsroom NL (latest post still the Nov 9 Apple Music update), and no price changes on any 128GB+ config at Apple NL (all configurator totals re-checked live, incl. OLED and Ultra 512GB), MediaMarkt or Amac. New offer: UpGreatest lists an open-box MacBook Pro 16" M5 Max 128GB/4TB at €8.499 (€550 below Apple's €9.049 and €350 below its new one), in stock, delivery expected 12 Nov. UpGreatest dropped its €250 discount on the OLED 14" M5 Max 48GB/2TB (now €5.909, same as Apple; not a 128GB config). UpGreatest ETAs moved a day: new Studio Max 128GB 1TB/2TB, new 16" 128GB/2TB and OLED 14" 48GB 2 Dec; open-box 16" 128GB/2TB 21 Nov; Ultra build-to-order and open-box Ultra 256GB/2TB 18 Feb 2027; open-box Studio Max 128GB/1TB, the 14" 128GB/2TB new and open box, and the 16" 128GB/4TB new are in stock, delivery 12 Nov; open-box Studio Max 2TB still est. 21 Dec. MediaMarkt still shows Black Friday €5.899 (128GB/1TB) and €6.599 (128GB/2TB), both temporarily unavailable online. Apple Certified Refurbished NL still has no 128GB Mac (largest now 64GB). llamaperf (as of 11 Nov): medians unchanged; a new Nov 10 report has Qwen3.8 Flash-Next Uncensored at 239.3 tok/s on an M5 Ultra 256GB (oQ5e, MTP speculative decoding, 4K prompt; 127 tok/s at 64K). Not a product yet: 9to5Mac reports a leaked Apple app, Harbor, for running local models across Thunderbolt 5-linked Macs (private preview, unannounced). Nov 11 evening (about 17:30): re-checked everything live. Apple NL unchanged: every 128GB+ configurator total, every buy page and Newsroom NL (latest post still the Nov 9 Apple Music update). MediaMarkt (Black Friday €5.899 / €6.599, both still sold out online) and Amac unchanged; Apple Certified Refurbished NL still tops out at 64GB. Removed offer: UpGreatest no longer lists the new MacBook Pro 16" M5 Max 128GB/4TB at €8.849, so the best new 128GB/4TB price is Apple's €9.049 (the €8.499 open-box unit is still listed). No UpGreatest price changes, but stock moved: the open-box Ultra 30c/64c 256GB/2TB (€11.219) is now expected 23 Nov (was 18 Feb 2027) and the open-box Studio Max 128GB/2TB (€6.439) 18 Nov (was est. 21 Dec); the 14" 128GB/2TB new (€7.309) and open box (€7.109) went from in stock to Op bestelling, expected 3 Dec; the open-box 16" 128GB/4TB (€8.499) is Op bestelling, expected 23 Nov; the open-box 16" 128GB/2TB is now 18 Nov; the open-box Studio Max 128GB/1TB is still in stock (delivery 13 Nov); new Studio Max 128GB, new 16" 128GB/2TB and OLED 14" 48GB are at ETA 3 Dec; Ultra build-to-order is 19 Feb 2027. New benchmark: Tom's Hardware (Nov 10) found a 256GB M5 Ultra finished an agentic llama.cpp test (Qwen 3.8 27B, MTP) in just under half the time of a DGX Spark-class GB10 with about 16% less energy, but very large models such as DeepSeek V4.1 Flash still run slowly on Mac engines. llamaperf has no new reports dated Nov 11.`,
          `Nov 10: no new Macs, chips or options at Apple NL or in Apple Newsroom NL (the only new posts are Q4 results and Apple Music), and no price changes on any 128GB+ config at Apple NL (all configurator totals re-checked live), MediaMarkt or Amac. UpGreatest raised the open-box Mac Studio M5 Max 128GB/1TB from €5.889 to €5.989, and it is now in stock with delivery expected 11 Nov (was Op bestelling, 19 Nov). UpGreatest stock/ETA moves: open-box MacBook Pro 16" M5 Max 128GB/2TB (€7.399) flipped to Op bestelling, expected 20 Nov; the new 16" 128GB/2TB (€7.749) is now Op bestelling, expected 1 Dec; the 14" 128GB/2TB new (€7.309) and open box (€7.109) and the 16" 128GB/4TB (€8.849) are in stock, delivery 11 Nov; new Studio Max 128GB 1TB/2TB and OLED 14" 48GB 1 Dec; open-box Studio Max 2TB est. 21 Dec; Ultra build-to-order and open-box Ultra 256GB/2TB 17 Feb 2027. MediaMarkt still shows Black Friday €5.899 on the Studio 128GB/1TB and €6.599 on 128GB/2TB, both out of stock online. Apple Certified Refurbished NL still has no 128GB Mac (largest 48GB). llamaperf (as of 10 Nov): medians unchanged; new Nov 10 user report of Kimi K3.1 at 2 tok/s on an M5 Max 128GB MacBook Pro (ds4 engine). gpuwerk.com (Nov 7) compiled llama.cpp's Llama 2 7B Q4_0 test: M5 Max 40c 120 tok/s, M5 Ultra 80c 179, RTX 5090 290.`,
          'MacBook Pro 14" with M6 (12-core CPU, 12-core GPU) from ' + eur(2329) + ", 16-32GB only, so no 128GB option. On sale since Nov 6.",
          'MacBook Pro with PROLED XDR (tandem OLED, touch) in 14" and 16", M5 Pro and M5 Max. About €400 above the LCD model at the same chip; 128GB starts at ' + eur(8109) + ' (14") and ' + eur(8449) + ' (16"). On general sale since Nov 6.',
          'iMac 24" with M6 from ' + eur(1819) + " (10-core) and " + eur(2019) + " (12-core), 16-32GB only. On sale since Nov 6. The M4 iMacs are gone from Apple NL.",
          "Mac Studio M5 Ultra (36-core CPU, 80-core GPU) can now be configured with 512GB, from " + eur(25129) + " at 1TB.",
          "Unchanged at Apple NL on Nov 4: every MacBook Air, MacBook Pro (LCD and OLED), iMac, Mac mini and Mac Studio price, including the 128GB+ configs.",
          "Oct 30: MediaMarkt cut the Studio M5 Max 128GB/2TB to " + eur(6599) + ' (in stock, next-day), UpGreatest cut the MacBook Pro 14" 128GB/2TB to ' + eur(7309) + ", and UpGreatest lists the Ultra 36c 512GB/1TB at " + eur(24449) + ' (€680 below Apple, ETA 10 Feb 2027 as of Nov 3). The open-box MacBook Pro 16" 128GB/4TB (' + eur(8299) + ") is gone.",
          "Oct 30, below 128GB: UpGreatest has an open-box Mac Studio M5 Ultra 30c 96GB/1TB for " + eur(6349) + " (now " + eur(6179) + ", est. 13 Jan 2027 as of Nov 13), not in the table: https://upgreatest.nl/product/5201/mac-studio-m5-ultra-30x-cpu-64x-gpu-96gb-1tb",
          "New benchmarks (mostly community, indicative): llmcheck.net has M5 Max 128GB vs M5 Ultra at 43 vs 88 tok/s on Qwen3.5-122B-A10B and 76 vs 120 tok/s on gpt-oss-120B; llamaperf shows a 256GB Ultra running DeepSeek V4.1 Flash (3-bit) at 73.4 tok/s; a Tbreak review measured gpt-oss-120B at 75.65 tok/s on a Studio M5 Max 128GB.",
          "Nov 2: no price changes at Apple NL, UpGreatest, MediaMarkt or Amac; UpGreatest ETAs slipped about 3 days (Studio M5 Max to 23 Nov, Ultra to 9 Feb 2027). Added benchmarks: Vše Smart (via Bohemian Silicon) ran 32 Ollama models on a 256GB M5 Ultra, e.g. gpt-oss-120b 115 tok/s, Qwen3.5 122B-A10B 85, Llama 3.3 70B 23; Apple's MLX post gives a 512GB M5 Ultra 19.7 tok/s on Qwen 3.8 27B (BF16).",
          "Nov 3: UpGreatest added open-box Mac Studios: M5 Max 40c 128GB/1TB for " + eur(5889) + " (same as Apple's 128GB/512GB; expected 24 Nov), 128GB/2TB for " + eur(6439) + " (est. 14 Dec) and M5 Ultra 30c 256GB/2TB for " + eur(11219) + " (est. 10 Feb 2027). MediaMarkt's Studio 128GB/2TB (" + eur(6599) + ") is now out of stock online. No price changes at Apple NL, UpGreatest (new), Amac or MediaMarkt; UpGreatest ETAs moved a day (Studio M5 Max 24 Nov, Ultra 10 Feb 2027). No new Macs in Apple Newsroom.",
          'Nov 9: no new Macs, chips or options at Apple NL or in Apple Newsroom NL (latest release still Oct 28), and no price changes on any 128GB+ config at Apple NL (all configurator totals re-checked live), UpGreatest, MediaMarkt or Amac. The PROLED XDR, M6 MacBook Pro and M6 iMac pages no longer show the pre-order banner: they are now on general sale. UpGreatest ETAs moved: open-box Studio Max 128GB/1TB (€5.889) now expected 19 Nov (was 27 Nov); open-box Ultra 30c 256GB/2TB (€11.219) is back to a long wait, delivery 16 Feb 2027 (was 27 Nov); new Studio Max 128GB 1TB/2TB 30 Nov; open-box Studio Max 2TB 19 Dec; Ultra build-to-order 16 Feb 2027. Open-box MacBook Pro 14" and 16" M5 Max 128GB/2TB (€7.109 / €7.399) in stock, delivery expected 10 Nov. MediaMarkt still shows Black Friday €5.899 on the Studio 128GB/1TB, still out of stock online. Apple Certified Refurbished NL still has no 128GB Mac (largest 48GB). llamaperf (as of 9 Nov): M5 Ultra 256GB median 73.4 tok/s on DeepSeek V4.1 Flash 552B at 3-bit and 74.7 tok/s on Qwen3.5 122B-A10B at 4-bit; M5 Max 128GB headline unchanged at 17.2 tok/s (Qwen3.6 27B 8-bit).',
          "Nov 4: no new Macs, chips or options at Apple NL or in Apple Newsroom, and no Apple NL price changes. UpGreatest now marks the open-box Mac Studio M5 Max 128GB/1TB (" + eur(5889) + ") and M5 Ultra 30c 256GB/2TB (" + eur(11219) + ', previously est. 10 Feb 2027) as in stock, expected delivery 25 Nov. UpGreatest cut the MacBook Pro 14" M6 (16GB/1TB ' + eur(2118) + ", 24GB/1TB " + eur(2319) + ", 32GB/1TB Silver " + eur(2516) + ') and added the 14" OLED M5 Max 40c 48GB/2TB at ' + eur(5659) + " (" + eur(250) + " below Apple). New benchmark compilation (swarchitect.net, updated Nov 4): Qwen3.8 27B 4-bit at 32.1 tok/s on M5 Max 40c 128GB vs 51.5 on M5 Ultra 80c.",
          "Nov 6: no new Macs in Apple Newsroom. MediaMarkt Black Friday cut Studio M5 Max 128GB/1TB to " + eur(5899) + " (was " + eur(6219) + '; still temporarily unavailable online). Open-box MacBook Pro 16" M5 Max 128GB/2TB (' + eur(7399) + ') back in stock at UpGreatest (delivery expected 7 Nov). Open-box Studio Max 128GB/1TB and Ultra 256GB/2TB flipped from in stock to Op bestelling (expected 27 Nov). UpGreatest ETAs slipped a day (Studio Max / open-box Studios / OLED 48GB: 27 Nov; open-box Studio Max 2TB est. 16 Dec; Ultra BTO 13 Feb 2027). Apple NL configurator 128GB+ totals re-checked live (unchanged). PROLED/M6/iMac still Bestel alvast / Verkrijgbaar vanaf 6 november; OLED 14" 128GB delivery quoted 23–26 Nov. No confirmed 128GB Apple Certified Refurbished. llamaperf (Nov 6): M5 Max 128GB median 17.2 tok/s on Qwen3.6 27B 8-bit; oMLX has fresh Nov 6 community runs. UpGreatest product 5129 (open-box MBP16 128GB/8TB) redirects to the category page (listing gone).',
          'Nov 5: no new Macs or Apple NL price changes. Open-box MacBook Pro 16" M5 Max 128GB/2TB (' + eur(7399) + ") moved from in stock to Op bestelling, expected 26 Nov. UpGreatest ETAs slipped a day (Studio Max / open-box Studios / OLED 48GB: 26 Nov; open-box Studio Max 2TB est. 15 Dec; Ultra BTO 12 Feb 2027). PROLED XDR still pre-order until Nov 6. MediaMarkt 128GB Studios still unavailable. No 128GB Apple Certified Refurbished. llamaperf (Nov 5): M5 Max 128GB median 17.2 tok/s on Qwen3.6 27B 8-bit."
        ]
      }
    ))
  );
}
export {
  App as default
};
