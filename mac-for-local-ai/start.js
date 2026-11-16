import { Page, Section, Text, LinkCards, h } from "./runtime.js";
const configurators = [
  { title: 'MacBook Air 13" and 15" (M5)', site: "Configurator", href: "macbook-air.html" },
  { title: 'MacBook Pro 14" and 16", Liquid Retina XDR (M6, M5 Pro, M5 Max)', site: "Configurator", href: "macbook-pro.html" },
  { title: 'MacBook Pro 14" and 16", OLED XDR (M5 Pro, M5 Max)', site: "Configurator", href: "macbook-pro-oled.html" },
  { title: 'iMac 24" (M6)', site: "Configurator", href: "imac.html" },
  { title: "Mac mini (M6, M5 Pro)", site: "Configurator", href: "mac-mini.html" },
  { title: "Mac Studio (M5 Max, M5 Ultra)", site: "Configurator", href: "mac-studio.html" }
];
const tools = [
  { title: "Mac for local AI: 128GB tracker", site: "Best prices across Dutch shops, updated weekdays", href: "tracker.html" },
  { title: "Mac picker for local AI", site: "Filter and compare every config", href: "picker.html" }
];
function App() {
  return /* @__PURE__ */ h(Page, { title: "Mac for local AI", summary: "Start here: build any current M5-or-newer Mac at Apple NL prices, or compare 128GB deals across Dutch shops." }, /* @__PURE__ */ h(Section, { heading: "Build a Mac" }, /* @__PURE__ */ h(Text, null, "One configurator per product line, with Apple NL prices in EUR incl. VAT as of 16 Nov 2026."), /* @__PURE__ */ h(LinkCards, { links: configurators })), /* @__PURE__ */ h(Section, { heading: "Compare and track" }, /* @__PURE__ */ h(LinkCards, { links: tools })));
}
export {
  App as default
};
