/* Small DOM runtime for the Mac for local AI pages.
   The original pages targeted a private canvas kit. This file is the
   static-site stand-in: function components, useState/useMemo, and a
   tiny in-place renderer so inputs keep focus. */

const hooks = [];
let hookIndex = 0;
let rootFn = null;
let container = null;
let scheduled = false;

export function h(type, props, ...children) {
  return { type, props: props || {}, children };
}

export function useState(init) {
  const i = hookIndex++;
  if (hooks.length === i) hooks.push({ v: init });
  const set = (next) => {
    const value = typeof next === "function" ? next(hooks[i].v) : next;
    if (Object.is(value, hooks[i].v)) return;
    hooks[i].v = value;
    schedule();
  };
  return [hooks[i].v, set];
}

export function useMemo(fn, deps) {
  const i = hookIndex++;
  const prev = hooks[i];
  const same = prev && prev.deps && deps && prev.deps.length === deps.length && prev.deps.every((d, j) => Object.is(d, deps[j]));
  if (!same) hooks[i] = { deps, value: fn() };
  return hooks[i].value;
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    try {
      renderNow();
    } catch (err) {
      console.error(err);
    }
  });
}

export function mount(App, el) {
  rootFn = App;
  container = el;
  hooks.length = 0;
  renderNow();
}

function renderNow() {
  hookIndex = 0;
  const tree = normalize(h(rootFn, null));
  morphChildren(container, tree);
}

function normalize(node) {
  if (node == null || node === false || node === true) return [];
  if (Array.isArray(node)) return node.flatMap(normalize);
  if (typeof node === "string" || typeof node === "number") {
    const s = String(node);
    return s.trim() === "" ? [] : [s];
  }
  if (typeof node.type === "function") {
    const kids = node.children || [];
    const childProp = kids.length === 0 ? undefined : kids.length === 1 ? kids[0] : kids;
    return normalize(node.type({ ...(node.props || {}), children: childProp }));
  }
  return [{ type: node.type, props: node.props || {}, children: normalize(node.children || []) }];
}

function create(vnode) {
  if (typeof vnode === "string") return document.createTextNode(vnode);
  const el = document.createElement(vnode.type);
  applyProps(el, vnode.props);
  for (const kid of vnode.children) el.appendChild(create(kid));
  if (el.tagName === "SELECT" && vnode.props.value != null) el.value = String(vnode.props.value);
  return el;
}

function morphChildren(parent, kids) {
  for (let i = 0; i < kids.length; i++) {
    const existing = parent.childNodes[i];
    if (!existing) parent.appendChild(create(kids[i]));
    else morphNode(existing, kids[i]);
  }
  while (parent.childNodes.length > kids.length) parent.removeChild(parent.lastChild);
}

function morphNode(el, vnode) {
  if (typeof vnode === "string") {
    if (el.nodeType === 3) {
      if (el.nodeValue !== vnode) el.nodeValue = vnode;
      return;
    }
    el.replaceWith(document.createTextNode(vnode));
    return;
  }
  if (el.nodeType !== 1 || el.tagName !== String(vnode.type).toUpperCase()) {
    el.replaceWith(create(vnode));
    return;
  }
  applyProps(el, vnode.props);
  morphChildren(el, vnode.children || []);
  if (el.tagName === "SELECT" && vnode.props.value != null) el.value = String(vnode.props.value);
}

const SKIP_ATTR = new Set(["children", "key", "ref", "className", "style", "checked", "disabled", "onClick", "onChange", "onInput"]);

function styleToCss(style) {
  if (!style) return "";
  if (typeof style === "string") return style;
  return Object.entries(style).filter(([, v]) => v != null && v !== false).map(([k, v]) => {
    const prop = k.startsWith("--") ? k : k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
    return prop + ":" + v;
  }).join(";");
}

function attrName(k) {
  if (k === "htmlFor") return "for";
  return k;
}

function applyProps(el, props) {
  props = props || {};
  if (props.className) el.className = props.className;
  else el.removeAttribute("class");
  el.style.cssText = styleToCss(props.style);
  if ("disabled" in props) el.disabled = !!props.disabled;
  if (el.tagName === "INPUT") {
    if (props.type) el.type = props.type;
    if (props.type === "checkbox" || props.type === "radio") el.checked = !!props.checked;
    else if (props.value != null && el.value !== String(props.value)) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      el.value = String(props.value);
      if (document.activeElement === el && start != null) {
        try { el.setSelectionRange(start, end); } catch (err) { /* number inputs can reject a range */ }
      }
    }
  }
  el.onclick = props.onClick || null;
  el.oninput = props.onInput || null;
  el.onchange = props.onChange || null;
  for (const [k, v] of Object.entries(props)) {
    if (SKIP_ATTR.has(k) || k === "type") continue;
    if (k === "value" && (el.tagName === "SELECT" || el.tagName === "INPUT")) continue;
    if (v == null || v === false) el.removeAttribute(attrName(k));
    else if (v === true) el.setAttribute(attrName(k), "");
    else el.setAttribute(attrName(k), String(v));
  }
}

function external(href) {
  return typeof href === "string" && /^https?:\/\//.test(href);
}

function anchorProps(href) {
  return external(href) ? { href, target: "_blank", rel: "noopener noreferrer" } : { href };
}

function linkify(node) {
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(linkify);
  if (typeof node !== "string" || node.indexOf("](") === -1) return node;
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  const out = [];
  let last = 0;
  let m;
  while ((m = re.exec(node))) {
    if (m.index > last) out.push(node.slice(last, m.index));
    out.push(h("a", anchorProps(m[2]), m[1]));
    last = m.index + m[0].length;
  }
  if (last === 0) return node;
  if (last < node.length) out.push(node.slice(last));
  return out;
}

function maybeLink(value) {
  if (typeof value !== "string") return value == null ? "" : value;
  const t = value.trim();
  if (/^https?:\/\/\S+$/.test(t)) return h("a", anchorProps(t), t);
  return value;
}

export function Page({ title, summary, width, children }) {
  if (typeof document !== "undefined" && title) document.title = title;
  return h("article", { className: "page" + (width === "wide" ? " is-wide" : "") },
    h("header", { className: "page-head" },
      h("h1", null, title || ""),
      summary ? h("p", { className: "summary" }, summary) : null
    ),
    children
  );
}

export function Section({ heading, caption, children }) {
  return h("section", { className: "section" },
    heading ? h("h2", null, heading) : null,
    caption ? h("p", { className: "caption" }, caption) : null,
    children
  );
}

export function Text({ children }) {
  return h("p", { className: "text" }, linkify(children));
}

export function Grid({ columns, children }) {
  return h("div", { className: "grid", style: { "--cols": String(columns || 1) } }, children);
}

export function Select({ label, options, value, onChange, disabled }) {
  return h("label", { className: "field" },
    h("span", { className: "field-label" }, label),
    h("select", {
      value: value == null ? "" : String(value),
      disabled: !!disabled,
      onChange: (e) => onChange && onChange(e.target.value),
    }, (options || []).map((o) => h("option", { value: o.value }, o.label)))
  );
}

export function Toggle({ label, value, onChange, disabled }) {
  return h("label", { className: "toggle" + (disabled ? " is-disabled" : "") },
    h("input", {
      type: "checkbox",
      checked: !!value,
      disabled: !!disabled,
      onChange: (e) => { if (!disabled && onChange) onChange(e.target.checked); },
    }),
    h("span", null, label)
  );
}

export function Input({ label, type, value, onChange }) {
  return h("label", { className: "field" },
    h("span", { className: "field-label" }, label),
    h("input", {
      type: type || "text",
      value: value == null ? "" : String(value),
      onInput: (e) => onChange && onChange(e.target.value),
    })
  );
}

export function Segmented({ options, value, onChange }) {
  return h("div", { className: "segmented", role: "radiogroup" },
    (options || []).map((o) => h("button", {
      type: "button",
      className: o.value === value ? "is-selected" : "",
      role: "radio",
      "aria-checked": o.value === value ? "true" : "false",
      onClick: () => onChange && onChange(o.value),
    }, o.label))
  );
}

function alignStyle(align, i) {
  if (!align || !align[i] || align[i] === "start") return undefined;
  return { textAlign: align[i] === "end" ? "right" : align[i] };
}

export function Table({ columns, rows, emphasis, align }) {
  return h("div", { className: "table-wrap" },
    h("table", null,
      h("thead", null,
        h("tr", null, (columns || []).map((c, i) => h("th", { scope: "col", style: alignStyle(align, i) }, c)))
      ),
      h("tbody", null, (rows || []).map((r, ri) => h("tr", { className: ri === emphasis ? "is-emphasis" : "" },
        r.map((cell, ci) => h("td", { "data-label": columns[ci] || "", style: alignStyle(align, ci) }, cell == null ? "" : String(cell)))
      )))
    )
  );
}

export function Properties({ items }) {
  return h("dl", { className: "props" },
    (items || []).map((it) => [
      h("dt", null, it.label),
      h("dd", null, maybeLink(it.value)),
    ])
  );
}

export function Callout({ lead, tone, children }) {
  return h("aside", { className: "callout" + (tone ? " tone-" + tone : "") },
    lead ? h("p", { className: "callout-lead" }, lead) : null,
    h("div", { className: "callout-body" }, children)
  );
}

export function Metrics({ metrics }) {
  return h("div", { className: "metrics" },
    (metrics || []).map((m) => h("div", { className: "metric" },
      h("p", { className: "metric-value" }, m.value),
      h("p", { className: "metric-label" }, m.label),
      m.detail ? h("p", { className: "metric-detail" }, m.detail) : null
    ))
  );
}

export function LinkCards({ links, numbered }) {
  return h("ul", { className: "cards" + (numbered ? " is-numbered" : "") },
    (links || []).map((l, i) => h("li", null,
      h("a", anchorProps(l.href),
        numbered ? h("span", { className: "card-num" }, String(i + 1)) : null,
        h("span", { className: "card-title" }, l.title),
        h("span", { className: "card-site" }, [l.site, l.date].filter(Boolean).join(" · "))
      )
    ))
  );
}

export function Bars({ bars, emphasis }) {
  const list = bars || [];
  const max = Math.max(1, ...list.map((b) => b.value));
  return h("div", { className: "bars" },
    list.map((b, i) => h("div", { className: "bar-row" + (i === emphasis ? " is-emphasis" : "") },
      h("div", { className: "bar-label" }, b.label),
      h("div", { className: "bar-track", "aria-hidden": "true" },
        h("div", { className: "bar-fill", style: { width: (100 * b.value / max) + "%" } })
      ),
      h("div", { className: "bar-meta" }, (b.display || "") + (b.meta ? " · " + b.meta : ""))
    ))
  );
}

export function NumberedList({ items }) {
  return h("ol", { className: "numbered" }, (items || []).map((t) => h("li", null, t)));
}

export function ProsCons({ prosHeading, consHeading, pros, cons }) {
  return h("div", { className: "proscons" },
    h("div", null,
      h("h3", null, prosHeading),
      h("ul", null, (pros || []).map((p) => h("li", null, p)))
    ),
    h("div", null,
      h("h3", null, consHeading),
      h("ul", null, (cons || []).map((p) => h("li", null, p)))
    )
  );
}

export function Floating({ children }) {
  if (typeof document !== "undefined") document.body.classList.add("has-float");
  return h("div", { className: "floating-bar", role: "status" }, children);
}
