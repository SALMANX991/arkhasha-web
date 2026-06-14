import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  Plus, Trash2, Tag, Truck, Store, Bell, TrendingDown, TrendingUp,
  Sparkles, X, Award, ShoppingCart, Target, ChevronLeft, Wallet,
  PackageCheck, ShieldCheck, Send, Loader2, Receipt,
  Home, Smartphone, Baby, Plane, Check, Wand2, ExternalLink, Search,
} from "lucide-react";

const STORE_KEY = "arkhasha:products";
const SAR = (n) =>
  new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 }).format(
    Math.round((n + Number.EPSILON) * 100) / 100
  );

const CONDITIONS = ["جديد", "مجدّد", "مستعمل"];
const CONDITION_TONE = { "جديد": "jade", "مجدّد": "gold", "مستعمل": "muted" };

const CATEGORIES = [
  { key: "الإلكترونيات", icon: Smartphone },
  { key: "تجهيزات المنزل", icon: Home },
  { key: "مستلزمات الأطفال", icon: Baby },
  { key: "السفر", icon: Plane },
];

// روابط بحث جاهزة — تفتح نتيجة المنتج داخل كل متجر (تشتغل دائماً، بدون روابط مكسورة)
const enc = (q) => encodeURIComponent(q || "");
const STORE_GROUPS = [
  {
    label: "إقليمي",
    stores: [
      { name: "نون", build: (q) => `https://www.noon.com/saudi-ar/search?q=${enc(q)}` },
      { name: "أمازون السعودية", build: (q) => `https://www.amazon.sa/s?k=${enc(q)}` },
      { name: "جرير", build: (q) => `https://www.jarir.com/sa-en/catalogsearch/result/?q=${enc(q)}` },
      { name: "أمازون الإمارات", build: (q) => `https://www.amazon.ae/s?k=${enc(q)}` },
    ],
  },
  {
    label: "عالمي",
    stores: [
      { name: "أمازون عالمي", build: (q) => `https://www.amazon.com/s?k=${enc(q)}` },
      { name: "eBay", build: (q) => `https://www.ebay.com/sch/i.html?_nkw=${enc(q)}` },
      { name: "AliExpress", build: (q) => `https://www.aliexpress.com/wholesale?SearchText=${enc(q)}` },
      { name: "Temu", build: (q) => `https://www.temu.com/search_result.html?search_key=${enc(q)}` },
      { name: "Walmart", build: (q) => `https://www.walmart.com/search?q=${enc(q)}` },
      { name: "Best Buy", build: (q) => `https://www.bestbuy.com/site/searchpage.jsp?st=${enc(q)}` },
      { name: "Newegg", build: (q) => `https://www.newegg.com/p/pl?d=${enc(q)}` },
    ],
  },
];
const GOOGLE_SHOP = (q) => `https://www.google.com/search?tbm=shop&q=${enc(q)}`;

// السعر الحقيقي النهائي = السعر + الشحن + الضريبة − الخصم
function finalPrice(o) {
  const base = Number(o.price) || 0;
  const ship = Number(o.shipping) || 0;
  const disc = Number(o.discount) || 0;
  const tax = base * ((Number(o.taxRate) || 0) / 100);
  return Math.max(0, base + ship + tax - disc);
}

const uid = () => Math.random().toString(36).slice(2, 10);

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=Reem+Kufi:wght@500;600;700&display=swap');

.ark-root, .ark-root * { box-sizing: border-box; }
.ark-root {
  --bg:#0E1318; --surface:#161D25; --surface2:#1C2631; --border:#2A3641;
  --text:#EAF0F6; --muted:#8493A3; --faint:#5A6772;
  --jade:#2DD4A7; --jade-dim:rgba(45,212,167,.13);
  --gold:#F6B73C; --gold-dim:rgba(246,183,60,.14);
  --red:#F0676B; --red-dim:rgba(240,103,107,.13);
  direction: rtl;
  font-family:'Tajawal', system-ui, sans-serif;
  color:var(--text);
  background:
    radial-gradient(1100px 480px at 88% -8%, rgba(45,212,167,.07), transparent 60%),
    radial-gradient(900px 420px at 8% 0%, rgba(246,183,60,.06), transparent 55%),
    var(--bg);
  min-height:100vh;
  padding:18px 14px 60px;
  font-feature-settings:'tnum';
}
.ark-wrap { max-width: 940px; margin:0 auto; }

.ark-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:20px; }
.ark-brand { display:flex; align-items:center; gap:11px; }
.ark-logo {
  width:42px; height:42px; border-radius:13px; display:grid; place-items:center;
  background:linear-gradient(150deg, var(--jade), #1c9d7c);
  box-shadow:0 6px 20px rgba(45,212,167,.28); color:#06150f;
}
.ark-title { font-family:'Reem Kufi', sans-serif; font-size:25px; font-weight:700; letter-spacing:-.5px; line-height:1; }
.ark-sub { color:var(--muted); font-size:12.5px; margin-top:3px; }

.ark-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:18px; }
.ark-stat { background:var(--surface); border:1px solid var(--border); border-radius:15px; padding:13px 14px; }
.ark-stat .lab { color:var(--muted); font-size:12px; display:flex; align-items:center; gap:6px; }
.ark-stat .val { font-size:21px; font-weight:800; margin-top:5px; letter-spacing:-.5px; }
.ark-stat .val.green { color:var(--jade); }
.ark-stat .val.gold { color:var(--gold); }

.ark-card { background:var(--surface); border:1px solid var(--border); border-radius:18px; }
.ark-section-h { display:flex; align-items:center; justify-content:space-between; margin:0 2px 11px; }
.ark-section-h h2 { font-family:'Reem Kufi',sans-serif; font-size:16.5px; font-weight:600; margin:0; }

.ark-btn {
  border:none; cursor:pointer; font-family:inherit; font-weight:700; font-size:13.5px;
  border-radius:12px; padding:10px 15px; display:inline-flex; align-items:center; gap:7px;
  transition:transform .12s ease, filter .12s ease; color:#06150f;
  background:linear-gradient(150deg, var(--jade), #20b790);
}
.ark-btn:hover { transform:translateY(-1px); filter:brightness(1.05); }
.ark-btn.ghost { background:var(--surface2); color:var(--text); border:1px solid var(--border); }
.ark-btn.ghost:hover { filter:brightness(1.15); }
.ark-btn.gold { background:linear-gradient(150deg,var(--gold),#e09a1f); }
.ark-btn.sm { padding:7px 11px; font-size:12.5px; border-radius:10px; }
.ark-iconbtn { background:transparent; border:none; cursor:pointer; color:var(--muted); padding:6px; border-radius:9px; display:grid; place-items:center; }
.ark-iconbtn:hover { color:var(--red); background:var(--red-dim); }

.ark-empty { text-align:center; padding:48px 20px; }
.ark-empty .ic { width:62px; height:62px; border-radius:18px; background:var(--jade-dim); color:var(--jade); display:grid; place-items:center; margin:0 auto 16px; }
.ark-empty h3 { font-family:'Reem Kufi',sans-serif; font-size:18px; margin:0 0 7px; }
.ark-empty p { color:var(--muted); font-size:13.5px; max-width:360px; margin:0 auto 18px; line-height:1.7; }

.ark-plist { display:grid; gap:11px; }
.ark-prod { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:14px 15px; cursor:pointer; transition:border-color .15s, transform .12s; }
.ark-prod:hover { border-color:var(--jade); transform:translateY(-1px); }
.ark-prod-top { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
.ark-prod-name { font-weight:700; font-size:15.5px; }
.ark-prod-cat { color:var(--muted); font-size:12px; margin-top:2px; }
.ark-prod-best { text-align:left; }
.ark-prod-best .pl { color:var(--muted); font-size:11px; }
.ark-prod-best .pv { font-weight:800; font-size:19px; color:var(--jade); letter-spacing:-.5px; }
.ark-prod-meta { display:flex; flex-wrap:wrap; gap:7px; margin-top:11px; }

.ark-chip { font-size:11.5px; padding:4px 9px; border-radius:8px; display:inline-flex; align-items:center; gap:5px; font-weight:500; background:var(--surface2); color:var(--muted); }
.ark-chip.jade { background:var(--jade-dim); color:var(--jade); }
.ark-chip.gold { background:var(--gold-dim); color:var(--gold); }
.ark-chip.red  { background:var(--red-dim); color:var(--red); }

.ark-back { display:inline-flex; align-items:center; gap:5px; background:transparent; border:none; color:var(--muted); cursor:pointer; font-family:inherit; font-size:13.5px; font-weight:500; margin-bottom:14px; padding:4px; }
.ark-back:hover { color:var(--text); }

.ark-detail-h { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:6px; }
.ark-detail-name { font-family:'Reem Kufi',sans-serif; font-size:22px; font-weight:600; letter-spacing:-.5px; }

.ark-reveal { background:linear-gradient(150deg, rgba(45,212,167,.10), rgba(246,183,60,.06)); border:1px solid var(--jade); border-radius:18px; padding:18px; margin:16px 0; }
.ark-reveal .lab { color:var(--jade); font-size:12.5px; font-weight:700; display:flex; align-items:center; gap:6px; }
.ark-reveal .big { font-size:34px; font-weight:800; letter-spacing:-1px; margin:6px 0 2px; }
.ark-reveal .store { color:var(--muted); font-size:13.5px; }
.ark-reveal .save { display:inline-flex; align-items:center; gap:6px; margin-top:11px; background:var(--gold-dim); color:var(--gold); padding:6px 11px; border-radius:10px; font-size:12.5px; font-weight:700; }

.ark-offer { background:var(--surface2); border:1px solid var(--border); border-radius:14px; padding:13px 14px; margin-bottom:9px; position:relative; }
.ark-offer.best { border-color:var(--gold); background:linear-gradient(150deg, var(--gold-dim), transparent); }
.ark-offer-top { display:flex; align-items:center; justify-content:space-between; gap:10px; }
.ark-offer-store { font-weight:700; font-size:14.5px; display:flex; align-items:center; gap:7px; }
.ark-offer-final { font-weight:800; font-size:18px; letter-spacing:-.5px; }
.ark-offer-final.best { color:var(--gold); }
.ark-offer-break { color:var(--muted); font-size:11.5px; margin-top:7px; }
.ark-offer-meta { display:flex; flex-wrap:wrap; gap:6px; margin-top:9px; }
.ark-badge-best { position:absolute; top:-9px; inset-inline-start:14px; background:var(--gold); color:#1c1303; font-size:10.5px; font-weight:800; padding:3px 9px; border-radius:8px; display:flex; align-items:center; gap:4px; }

.ark-modal-bg { position:fixed; inset:0; background:rgba(6,10,14,.72); backdrop-filter:blur(3px); display:grid; place-items:center; padding:16px; z-index:50; }
.ark-modal { background:var(--surface); border:1px solid var(--border); border-radius:20px; width:100%; max-width:470px; max-height:90vh; overflow:auto; padding:20px; }
.ark-modal-h { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
.ark-modal-h h3 { font-family:'Reem Kufi',sans-serif; font-size:18px; margin:0; }

.ark-field { margin-bottom:13px; }
.ark-field label { display:block; font-size:12.5px; color:var(--muted); margin-bottom:6px; font-weight:500; }
.ark-input, .ark-select {
  width:100%; background:var(--bg); border:1px solid var(--border); border-radius:11px;
  padding:11px 13px; color:var(--text); font-family:inherit; font-size:14px; outline:none;
}
.ark-input:focus, .ark-select:focus { border-color:var(--jade); }
.ark-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.ark-row3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }

.ark-ai { background:var(--surface); border:1px solid var(--border); border-radius:18px; padding:16px; margin-top:18px; }
.ark-ai-h { display:flex; align-items:center; gap:8px; margin-bottom:12px; }
.ark-ai-h .ic { width:34px; height:34px; border-radius:11px; background:var(--gold-dim); color:var(--gold); display:grid; place-items:center; }
.ark-ai-h h3 { font-family:'Reem Kufi',sans-serif; font-size:16px; margin:0; }
.ark-ai-quick { display:flex; flex-wrap:wrap; gap:7px; margin-bottom:11px; }
.ark-ai-out { background:var(--bg); border:1px solid var(--border); border-radius:13px; padding:14px; font-size:14px; line-height:1.85; white-space:pre-wrap; min-height:20px; }
.ark-ai-form { display:flex; gap:8px; margin-top:11px; }

.ark-footnote { color:var(--faint); font-size:11.5px; text-align:center; margin-top:26px; line-height:1.7; }

.ark-cats { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:18px; }
.ark-cat { background:var(--surface); border:1px solid var(--border); border-radius:15px; padding:14px 10px; text-align:center; cursor:pointer; transition:border-color .15s, transform .12s; }
.ark-cat:hover { border-color:var(--gold); transform:translateY(-2px); }
.ark-cat .ic { width:40px;height:40px;border-radius:12px;background:var(--gold-dim);color:var(--gold);display:grid;place-items:center;margin:0 auto 9px; }
.ark-cat .nm { font-size:12.5px; font-weight:700; }
.ark-cat .hint { font-size:10.5px; color:var(--muted); margin-top:4px; display:inline-flex; align-items:center; gap:3px; }

.ark-sug { border:1px solid var(--border); border-radius:13px; padding:12px 13px; margin-bottom:9px; display:flex; align-items:center; justify-content:space-between; gap:10px; background:var(--surface2); }
.ark-sug .nm { font-weight:700; font-size:14px; }
.ark-sug .meta { color:var(--muted); font-size:11.5px; margin-top:3px; }
.ark-sug .est { color:var(--gold); font-weight:800; font-size:13.5px; white-space:nowrap; }
.ark-note { background:var(--gold-dim); border:1px solid rgba(246,183,60,.3); color:var(--gold); border-radius:11px; padding:10px 12px; font-size:12px; line-height:1.7; margin-bottom:14px; }
.ark-spin{animation:arkspin 1s linear infinite}@keyframes arkspin{to{transform:rotate(360deg)}}
.ark-buy { display:flex; flex-wrap:wrap; gap:8px; }
.ark-buy a { text-decoration:none; }
.ark-suglink { background:transparent; border:1px solid var(--border); color:var(--muted); border-radius:9px; padding:6px; display:grid; place-items:center; text-decoration:none; }
.ark-suglink:hover { color:var(--gold); border-color:var(--gold); }
.ark-cls { background:var(--bg); border:1px solid var(--jade); border-radius:13px; padding:13px; margin-bottom:14px; }
.ark-cls-h { color:var(--jade); font-weight:700; font-size:12.5px; display:flex; align-items:center; gap:6px; margin-bottom:9px; }
.ark-cls-row { display:flex; justify-content:space-between; gap:10px; padding:4px 0; border-bottom:1px solid var(--border); font-size:13px; }
.ark-cls-row:last-of-type { border-bottom:none; }
.ark-cls-row .k { color:var(--muted); }
.ark-cls-row .v { font-weight:700; }
.ark-fetch-bar { display:flex; flex-direction:column; gap:9px; margin-bottom:16px; }
.ark-fetch-msg { font-size:13px; color:var(--jade); font-weight:600; text-align:center; padding:8px; background:var(--jade-dim); border-radius:10px; }
@media (max-width:560px){ .ark-cats{grid-template-columns:1fr 1fr} }
@media (max-width:560px){ .ark-stats{grid-template-columns:1fr 1fr} .ark-row3{grid-template-columns:1fr} .ark-detail-name{font-size:19px} }
`;

export default function Arkhasha() {
  const [products, setProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState({ page: "list", id: null });
  const [modal, setModal] = useState(null); // {type:'product'} | {type:'offer', pid}
  const [suggest, setSuggest] = useState(null); // {category, loading, items, error}

  // تحميل البيانات المحفوظة
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(STORE_KEY);
        if (r && r.value) setProducts(JSON.parse(r.value));
      } catch (e) {
        /* أول مرة — لا توجد بيانات بعد */
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // حفظ تلقائي
  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try { await window.storage.set(STORE_KEY, JSON.stringify(products)); }
      catch (e) { console.error("تعذّر الحفظ:", e); }
    })();
  }, [products, loaded]);

  const selected = useMemo(
    () => products.find((p) => p.id === view.id) || null,
    [products, view.id]
  );

  // إحصائيات
  const stats = useMemo(() => {
    let savings = 0, hits = 0;
    for (const p of products) {
      if (!p.offers?.length) continue;
      const fps = p.offers.map(finalPrice);
      const lo = Math.min(...fps), hi = Math.max(...fps);
      savings += hi - lo;
      if (p.targetPrice && lo <= Number(p.targetPrice)) hits++;
    }
    return { count: products.length, savings, hits };
  }, [products]);

  const addProduct = (p) =>
    setProducts((arr) => [{ ...p, id: uid(), offers: [], createdAt: Date.now() }, ...arr]);
  const deleteProduct = (id) => {
    setProducts((arr) => arr.filter((p) => p.id !== id));
    setView({ page: "list", id: null });
  };
  const addOffer = (pid, o) =>
    setProducts((arr) =>
      arr.map((p) =>
        p.id === pid ? { ...p, offers: [...p.offers, { ...o, id: uid(), loggedAt: Date.now() }] } : p
      )
    );

  const addOffers = (pid, newOffers) =>
    setProducts((arr) =>
      arr.map((p) => p.id === pid ? { ...p, offers: [...p.offers, ...newOffers] } : p)
    );
  const deleteOffer = (pid, oid) =>
    setProducts((arr) =>
      arr.map((p) => (p.id === pid ? { ...p, offers: p.offers.filter((o) => o.id !== oid) } : p))
    );

  // اقتراح منتجات لكل تصنيف عبر الذكاء الاصطناعي (مع بحث الويب)
  const runSuggest = async (category) => {
    setSuggest({ category, loading: true, items: [], error: null });
    try {
      const prompt = `أنت مساعد تسوّق في السوق السعودي. أعطني أبرز 6 منتجات رائجة ويهتم بها المتسوقون حالياً في فئة "${category}". استخدم البحث للحصول على أسعار حديثة قدر الإمكان من متاجر مثل نون وأمازون السعودية وجرير.
لكل منتج أعطِ: الاسم بالعربية، سعر تقديري بالريال السعودي (رقم فقط بدون فواصل)، وأبرز متجرين يبيعونه في السعودية.
أرجع JSON فقط بدون أي نص أو شرح أو علامات Markdown، بهذا الشكل تماماً:
[{"name":"اسم المنتج","estPrice":1234,"stores":["نون","جرير"]}]`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
          tools: [{ type: "web_search_20250305", name: "web_search" }],
        }),
      });
      const data = await res.json();
      let text = (data.content || []).map((c) => (c.type === "text" ? c.text : "")).join("\n");
      text = text.replace(/```json|```/g, "").trim();
      let items = null;
      try { items = JSON.parse(text); }
      catch { const m = text.match(/\[[\s\S]*\]/); if (m) items = JSON.parse(m[0]); }
      if (!Array.isArray(items) || !items.length) throw new Error("no items");
      setSuggest({ category, loading: false, items, error: null });
    } catch (e) {
      setSuggest({ category, loading: false, items: [], error: "ما قدرت أجيب اقتراحات الحين، جرّب مرة ثانية." });
    }
  };

  const addFromSuggestion = (it) =>
    addProduct({
      name: String(it.name || "").trim(),
      category: suggest?.category || "",
      targetPrice: it.estPrice ? String(it.estPrice) : "",
    });

  return (
    <div className="ark-root">
      <style>{STYLES}</style>
      <div className="ark-wrap">
        <header className="ark-head">
          <div className="ark-brand">
            <div className="ark-logo"><Tag size={22} strokeWidth={2.4} /></div>
            <div>
              <div className="ark-title">أرخَصها</div>
              <div className="ark-sub">تتبّع السعر الحقيقي · واعرف الوقت الصح للشراء</div>
            </div>
          </div>
          {view.page === "list" && (
            <button className="ark-btn" onClick={() => setModal({ type: "product" })}>
              <Plus size={17} strokeWidth={2.6} /> منتج جديد
            </button>
          )}
        </header>

        {view.page === "list" ? (
          <ListView
            products={products}
            stats={stats}
            onOpen={(id) => setView({ page: "detail", id })}
            onAdd={() => setModal({ type: "product" })}
            onSuggest={runSuggest}
          />
        ) : (
          selected && (
            <DetailView
              product={selected}
              onBack={() => setView({ page: "list", id: null })}
              onAddOffer={() => setModal({ type: "offer", pid: selected.id })}
              onDeleteOffer={(oid) => deleteOffer(selected.id, oid)}
              onDeleteProduct={() => deleteProduct(selected.id)}
              onAddOffers={addOffers}
            />
          )
        )}

        <div className="ark-footnote">
          بياناتك محفوظة محلياً على جهازك. هذي نواة شغّالة — الأسعار تضيفها أنت يدوياً من المتاجر، والمساعد يحلّلها لك بالذكاء الاصطناعي.
        </div>
      </div>

      {modal?.type === "product" && (
        <ProductModal onClose={() => setModal(null)} onSave={(p) => { addProduct(p); setModal(null); }} />
      )}
      {modal?.type === "offer" && (
        <OfferModal onClose={() => setModal(null)} onSave={(o) => { addOffer(modal.pid, o); setModal(null); }} />
      )}
      {suggest && (
        <SuggestModal state={suggest} onClose={() => setSuggest(null)} onAdd={addFromSuggestion} />
      )}
    </div>
  );
}

function ListView({ products, stats, onOpen, onAdd, onSuggest }) {
  return (
    <>
      <div className="ark-stats">
        <div className="ark-stat">
          <div className="lab"><ShoppingCart size={14} /> منتجات أراقبها</div>
          <div className="val">{stats.count}</div>
        </div>
        <div className="ark-stat">
          <div className="lab"><Wallet size={14} /> فرق التوفير</div>
          <div className="val green">{SAR(stats.savings)} <span style={{ fontSize: 13 }}>ر.س</span></div>
        </div>
        <div className="ark-stat">
          <div className="lab"><Target size={14} /> وصل لسعري المطلوب</div>
          <div className="val gold">{stats.hits}</div>
        </div>
      </div>

      <div className="ark-section-h"><h2>اقترح لي منتجات</h2></div>
      <div className="ark-cats">
        {CATEGORIES.map((c) => {
          const Ic = c.icon;
          return (
            <div key={c.key} className="ark-cat" onClick={() => onSuggest(c.key)}>
              <div className="ic"><Ic size={20} /></div>
              <div className="nm">{c.key}</div>
              <div className="hint"><Wand2 size={11} /> اقترح بالذكاء</div>
            </div>
          );
        })}
      </div>

      <div className="ark-section-h"><h2>قائمة المراقبة</h2></div>

      {products.length === 0 ? (
        <div className="ark-card">
          <div className="ark-empty">
            <div className="ic"><Tag size={28} /></div>
            <h3>ابدأ بأول منتج تبي تراقبه</h3>
            <p>أضف منتج، سجّل أسعاره من المتاجر اللي تشتري منها، وأرخَصها يحسب لك السعر النهائي الحقيقي وينبّهك إذا نزل.</p>
            <button className="ark-btn" onClick={onAdd}><Plus size={17} strokeWidth={2.6} /> أضف منتج</button>
          </div>
        </div>
      ) : (
        <div className="ark-plist">
          {products.map((p) => {
            const fps = p.offers.map(finalPrice);
            const best = fps.length ? Math.min(...fps) : null;
            const hitTarget = p.targetPrice && best != null && best <= Number(p.targetPrice);
            return (
              <div key={p.id} className="ark-prod" onClick={() => onOpen(p.id)}>
                <div className="ark-prod-top">
                  <div>
                    <div className="ark-prod-name">{p.name}</div>
                    {p.category && <div className="ark-prod-cat">{p.category}</div>}
                  </div>
                  <div className="ark-prod-best">
                    <div className="pl">أرخص سعر</div>
                    <div className="pv">{best != null ? `${SAR(best)} ر.س` : "—"}</div>
                  </div>
                </div>
                <div className="ark-prod-meta">
                  <span className="ark-chip"><Store size={12} /> {p.offers.length} عرض</span>
                  {p.targetPrice ? (
                    <span className={`ark-chip ${hitTarget ? "jade" : "gold"}`}>
                      <Target size={12} /> هدفك {SAR(p.targetPrice)} ر.س
                    </span>
                  ) : null}
                  {hitTarget && <span className="ark-chip jade"><Bell size={12} /> نزل لسعرك!</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function DetailView({ product, onBack, onAddOffer, onDeleteOffer, onDeleteProduct, onAddOffers }) {
  const offers = [...product.offers].sort((a, b) => finalPrice(a) - finalPrice(b));
  const fps = offers.map(finalPrice);
  const best = fps.length ? Math.min(...fps) : null;
  const worst = fps.length ? Math.max(...fps) : null;
  const bestOffer = offers[0];
  const hitTarget = product.targetPrice && best != null && best <= Number(product.targetPrice);
  const [fetching, setFetching] = useState(false);
  const [fetchMsg, setFetchMsg] = useState("");

  const chartData = [...product.offers]
    .sort((a, b) => a.loggedAt - b.loggedAt)
    .map((o) => ({
      t: new Date(o.loggedAt).toLocaleDateString("ar-SA", { month: "numeric", day: "numeric" }),
      price: Math.round(finalPrice(o)),
      store: o.store,
    }));

  // ─── عنوان خادمك — غيّره بعد ما تنشر على Railway ───────────────────────────
  const SERVER_URL = "https://arkhasha-server-production.up.railway.app";

  const fetchPrices = async () => {
    setFetching(true);
    setFetchMsg("🔍 أبحث عن أرخص الأسعار...");
    try {
      let newOffers = [];

      // إذا عندك خادم منشور، استخدمه أولاً
      if (SERVER_URL) {
        const res = await fetch(`${SERVER_URL}/api/prices?q=${encodeURIComponent(product.name)}`);
        if (!res.ok) throw new Error("server error");
        const data = await res.json();
        newOffers = (data.results || []).map((it) => ({
          id: Math.random().toString(36).slice(2, 10),
          store: it.store,
          price: String(it.price),
          shipping: String(it.shipping || 0),
          taxRate: "15",
          discount: "0",
          deliveryDays: String(it.deliveryDays || ""),
          condition: it.condition || "جديد",
          warranty: "",
          link: it.link || "",
          note: it.originalCurrency !== "SAR" ? `محوّل من ${it.originalCurrency}` : "",
          loggedAt: Date.now(),
          aiGenerated: false, // بيانات حقيقية من الخادم
        }));
      } else {
        // بدون خادم → استخدم الذكاء كاحتياط
        const prompt = `ابحث الآن في الويب عن أفضل وأرخص ٤ أسعار لهذا المنتج في المتاجر الإلكترونية، مع التركيز على السوق السعودي والخليجي أولاً ثم الدولي.
المنتج: "${product.name}"
لكل نتيجة: اسم المتجر، السعر بالريال السعودي، سعر الشحن، أيام التوصيل، حالة المنتج.
أرجع JSON فقط: [{"store":"","price":0,"shipping":0,"deliveryDays":"2","condition":"جديد","note":""}]
رتّب من الأرخص للأغلى.`;
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 1000,
            messages: [{ role: "user", content: prompt }],
            tools: [{ type: "web_search_20250305", name: "web_search" }],
          }),
        });
        const data = await res.json();
        let text = (data.content || []).map((c) => (c.type === "text" ? c.text : "")).join("\n").replace(/```json|```/g, "").trim();
        let items = null;
        try { items = JSON.parse(text); } catch { const m = text.match(/\[[\s\S]*\]/); if (m) items = JSON.parse(m[0]); }
        if (!Array.isArray(items) || !items.length) throw new Error("no results");
        newOffers = items.map((it) => ({
          id: Math.random().toString(36).slice(2, 10),
          store: String(it.store || "متجر"),
          price: String(Number(it.price) || 0),
          shipping: String(Number(it.shipping) || 0),
          taxRate: "15",
          discount: "0",
          deliveryDays: String(it.deliveryDays || ""),
          condition: it.condition || "جديد",
          warranty: "",
          note: it.note || "",
          loggedAt: Date.now(),
          aiGenerated: true,
        }));
      }

      if (!newOffers.length) throw new Error("no offers");
      onAddOffers(product.id, newOffers);
      setFetchMsg(`✅ وجدت ${newOffers.length} أسعار ${SERVER_URL ? "حقيقية" : "تقديرية"}`);
    } catch (e) {
      setFetchMsg("⚠️ ما قدرت أجيب أسعار الحين، جرّب مرة ثانية");
    } finally {
      setFetching(false);
      setTimeout(() => setFetchMsg(""), 4000);
    }
  };

  return (
    <>
      <button className="ark-back" onClick={onBack}><ChevronLeft size={18} /> رجوع للقائمة</button>

      <div className="ark-detail-h">
        <div>
          <div className="ark-detail-name">{product.name}</div>
          {product.category && <div className="ark-prod-cat">{product.category}</div>}
          {product.classification && (
            <div className="ark-prod-meta" style={{ marginTop: 8 }}>
              {product.classification.subCategory && <span className="ark-chip jade">{product.classification.subCategory}</span>}
              {product.classification.brand && <span className="ark-chip">{product.classification.brand}</span>}
              {product.classification.priceTier && <span className="ark-chip gold">فئة {product.classification.priceTier}</span>}
              {product.classification.demand && <span className="ark-chip">طلب {product.classification.demand}</span>}
            </div>
          )}
        </div>
        <button className="ark-iconbtn" onClick={onDeleteProduct} title="حذف المنتج"><Trash2 size={18} /></button>
      </div>

      {/* زر جلب الأسعار بالذكاء */}
      <div className="ark-fetch-bar">
        <button className="ark-btn gold" onClick={fetchPrices} disabled={fetching} style={{ flex: 1, justifyContent: "center" }}>
          {fetching
            ? <><Loader2 size={16} className="ark-spin" /> جاري البحث...</>
            : <><Sparkles size={16} /> اجلب أرخص الأسعار بالذكاء</>}
        </button>
        {fetchMsg && <div className="ark-fetch-msg">{fetchMsg}</div>}
      </div>

      {best != null && (
        <div className="ark-reveal">
          <div className="lab"><Sparkles size={15} /> السعر الحقيقي النهائي — الأرخص</div>
          <div className="big">{SAR(best)} <span style={{ fontSize: 17, fontWeight: 700 }}>ر.س</span></div>
          <div className="store">من {bestOffer.store} · {bestOffer.condition} · يوصل خلال {bestOffer.deliveryDays || "؟"} يوم</div>
          {worst > best && (
            <div className="save"><TrendingDown size={15} /> توفّر {SAR(worst - best)} ر.س مقارنة بأغلى عرض</div>
          )}
          {hitTarget && (
            <div className="save" style={{ marginInlineStart: 8 }}><Bell size={15} /> نزل لسعرك المطلوب</div>
          )}
        </div>
      )}

      <div className="ark-section-h"><h2>روابط الشراء</h2></div>
      <a className="ark-btn gold" href={GOOGLE_SHOP(product.name)} target="_blank" rel="noopener noreferrer" style={{ marginBottom: 12 }}>
        <ShoppingCart size={15} /> قارن الأسعار عالمياً على جوجل تسوّق <ExternalLink size={12} />
      </a>
      {STORE_GROUPS.map((g) => (
        <div key={g.label} style={{ marginBottom: 12 }}>
          <div style={{ color: "var(--muted)", fontSize: 11.5, fontWeight: 700, margin: "2px 2px 7px" }}>{g.label}</div>
          <div className="ark-buy">
            {g.stores.map((s) => (
              <a key={s.name} className="ark-btn ghost sm" href={s.build(product.name)} target="_blank" rel="noopener noreferrer">
                <Store size={14} /> {s.name} <ExternalLink size={11} />
              </a>
            ))}
          </div>
        </div>
      ))}

      <div className="ark-section-h" style={{ marginTop: 18 }}>
        <h2>العروض المسجّلة</h2>
        <button className="ark-btn sm" onClick={onAddOffer}><Plus size={15} strokeWidth={2.6} /> سجّل عرض</button>
      </div>

      {offers.length === 0 ? (
        <div className="ark-card">
          <div className="ark-empty">
            <div className="ic"><Receipt size={26} /></div>
            <h3>اضغط "اجلب أرخص الأسعار" فوق</h3>
            <p>الذكاء الاصطناعي يبحث في الويب ويسجّل لك أرخص الأسعار من المتاجر تلقائياً — أو سجّلها يدوياً إذا حبيت.</p>
            <button className="ark-btn" onClick={onAddOffer}><Plus size={16} strokeWidth={2.6} /> سجّل يدوياً</button>
          </div>
        </div>
      ) : (
        <div>
          {offers.map((o, i) => {
            const fp = finalPrice(o);
            const isBest = i === 0 && offers.length > 1;
            const tone = CONDITION_TONE[o.condition] || "muted";
            return (
              <div key={o.id} className={`ark-offer ${isBest ? "best" : ""}`}>
                {isBest && <div className="ark-badge-best"><Award size={11} /> الأرخص</div>}
                <div className="ark-offer-top">
                  <div className="ark-offer-store"><Store size={15} /> {o.store}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className={`ark-offer-final ${isBest ? "best" : ""}`}>{SAR(fp)} ر.س</div>
                    <button className="ark-iconbtn" onClick={() => onDeleteOffer(o.id)}><Trash2 size={15} /></button>
                  </div>
                </div>
                <div className="ark-offer-break">
                  السعر {SAR(o.price)}
                  {Number(o.shipping) > 0 && ` + شحن ${SAR(o.shipping)}`}
                  {Number(o.taxRate) > 0 && ` + ضريبة ${o.taxRate}%`}
                  {Number(o.discount) > 0 && ` − خصم ${SAR(o.discount)}`}
                </div>
                <div className="ark-offer-meta">
                  <span className={`ark-chip ${tone}`}><PackageCheck size={12} /> {o.condition}</span>
                  {o.deliveryDays ? <span className="ark-chip"><Truck size={12} /> {o.deliveryDays} يوم</span> : null}
                  {o.warranty ? <span className="ark-chip"><ShieldCheck size={12} /> {o.warranty}</span> : null}
                  {o.aiGenerated && <span className="ark-chip gold"><Sparkles size={11} /> ذكاء اصطناعي ~تقديري</span>}
                  {o.note ? <span className="ark-chip" style={{fontSize:11}}>{o.note}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {chartData.length >= 2 && (
        <div className="ark-card" style={{ padding: 16, marginTop: 16 }}>
          <div className="ark-section-h"><h2>تاريخ السعر</h2></div>
          <div style={{ width: "100%", height: 210 }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 8, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A3641" />
                <XAxis dataKey="t" stroke="#8493A3" fontSize={12} reversed />
                <YAxis stroke="#8493A3" fontSize={12} width={44} />
                <Tooltip
                  contentStyle={{ background: "#161D25", border: "1px solid #2A3641", borderRadius: 12, fontFamily: "Tajawal", direction: "rtl" }}
                  labelStyle={{ color: "#8493A3" }}
                  formatter={(v, _n, p) => [`${SAR(v)} ر.س`, p.payload.store]}
                />
                <Line type="monotone" dataKey="price" stroke="#2DD4A7" strokeWidth={2.5} dot={{ r: 4, fill: "#2DD4A7" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <AIAssistant product={product} offers={offers} best={best} worst={worst} />
    </>
  );
}

function AIAssistant({ product, offers, best, worst }) {
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const outRef = useRef(null);

  const dataSummary = () => {
    if (!offers.length) return "لا توجد عروض مسجّلة بعد لهذا المنتج.";
    const lines = offers
      .slice()
      .sort((a, b) => a.loggedAt - b.loggedAt)
      .map((o) => `- ${o.store}: ${SAR(finalPrice(o))} ر.س (${o.condition}، توصيل ${o.deliveryDays || "؟"} يوم) — سُجّل في ${new Date(o.loggedAt).toLocaleDateString("ar-SA")}`)
      .join("\n");
    return `المنتج: ${product.name}\nالسعر المطلوب (هدف المستخدم): ${product.targetPrice ? product.targetPrice + " ر.س" : "غير محدد"}\nأرخص سعر حالي: ${best != null ? SAR(best) + " ر.س" : "—"}\nأغلى سعر مسجّل: ${worst != null ? SAR(worst) + " ر.س" : "—"}\nالعروض حسب الترتيب الزمني:\n${lines}`;
  };

  const ask = async (question) => {
    setLoading(true);
    setOut("");
    try {
      const prompt = `أنت مستشار شراء ذكي داخل تطبيق "أرخَصها" لمقارنة الأسعار في السعودية. تكلم بلهجة سعودية بسيطة ومباشرة، وباختصار (3-5 أسطر). اعتمد فقط على البيانات التالية ولا تخترع أسعار.

البيانات:
${dataSummary()}

سؤال المستخدم: ${question}

أعطِ توصية واضحة (اشترِ الآن / انتظر / السعر جيد أو لا) مع سبب مبني على الأرقام. إذا البيانات قليلة جداً، انصح المستخدم يسجّل أسعار أكثر على مدى أيام عشان التحليل يصير أدق.`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = (data.content || []).map((c) => (c.type === "text" ? c.text : "")).join("\n").trim();
      setOut(text || "ما قدرت أجيب رد الحين، جرّب مرة ثانية.");
    } catch (e) {
      setOut("صار خطأ في الاتصال بالمساعد. تأكد من الاتصال وجرّب مرة ثانية.");
    } finally {
      setLoading(false);
      setTimeout(() => outRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 60);
    }
  };

  const quicks = [
    "أشتري الحين ولا أنتظر؟",
    "هل هذا السعر جيد؟",
    "وش أفضل عرض من حيث القيمة؟",
  ];

  return (
    <div className="ark-ai">
      <div className="ark-ai-h">
        <div className="ic"><Sparkles size={18} /></div>
        <h3>مساعد الشراء الذكي</h3>
      </div>
      <div className="ark-ai-quick">
        {quicks.map((t) => (
          <button key={t} className="ark-btn ghost sm" disabled={loading} onClick={() => ask(t)}>{t}</button>
        ))}
      </div>
      <div className="ark-ai-out" ref={outRef}>
        {loading ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#8493A3" }}>
            <Loader2 size={15} className="ark-spin" /> أحلّل بياناتك...
          </span>
        ) : out ? out : <span style={{ color: "#5A6772" }}>اسأل عن المنتج، أو اضغط أحد الأسئلة فوق وأحلّل لك أسعارك.</span>}
      </div>
      <div className="ark-ai-form">
        <input
          className="ark-input"
          placeholder="اكتب سؤالك..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && q.trim() && !loading) { ask(q.trim()); setQ(""); } }}
        />
        <button className="ark-btn gold" disabled={loading || !q.trim()} onClick={() => { ask(q.trim()); setQ(""); }}>
          <Send size={16} />
        </button>
      </div>
      <style>{`.ark-spin{animation:arkspin 1s linear infinite}@keyframes arkspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function ProductModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [cls, setCls] = useState(null);
  const [clsLoading, setClsLoading] = useState(false);
  const [clsErr, setClsErr] = useState(null);
  const valid = name.trim().length > 0;

  const analyze = async () => {
    if (name.trim().length < 2) return;
    setClsLoading(true); setClsErr(null); setCls(null);
    try {
      const prompt = `حلّل اسم المنتج التالي وأرجع تصنيفه الكامل. الاسم قد يكون ناقصاً أو غير دقيق — استنتج أفضل تصنيف ممكن باستخدام معرفتك بالمنتجات العالمية. استخدم البحث للتأكد من سنة الإصدار ومستوى الطلب إن أمكن.
المنتج: "${name.trim()}"
أرجع JSON فقط بدون أي نص أو شرح أو علامات Markdown:
{"mainCategory":"","subCategory":"","brand":"","series":"","model":"","variant":"","priceTier":"","releaseYear":"","demand":"","similar":["",""]}
الحقول غير المعروفة اتركها نصاً فارغاً "".`;
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
          tools: [{ type: "web_search_20250305", name: "web_search" }],
        }),
      });
      const data = await res.json();
      let text = (data.content || []).map((c) => (c.type === "text" ? c.text : "")).join("\n").replace(/```json|```/g, "").trim();
      let obj = null;
      try { obj = JSON.parse(text); } catch { const m = text.match(/\{[\s\S]*\}/); if (m) obj = JSON.parse(m[0]); }
      if (!obj) throw new Error("parse");
      setCls(obj);
      if (obj.mainCategory && !category) setCategory(obj.mainCategory);
    } catch (e) {
      setClsErr("ما قدرت أحلّل المنتج الحين، جرّب مرة ثانية.");
    } finally {
      setClsLoading(false);
    }
  };

  const Row = ({ k, v }) => (v ? (
    <div className="ark-cls-row"><span className="k">{k}</span><span className="v">{v}</span></div>
  ) : null);

  return (
    <div className="ark-modal-bg" onClick={onClose}>
      <div className="ark-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ark-modal-h">
          <h3>منتج جديد</h3>
          <button className="ark-iconbtn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="ark-field">
          <label>اسم المنتج *</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="ark-input" autoFocus value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && valid && !clsLoading) analyze(); }}
              placeholder="مثال: iPhone 16 Pro Max 256GB" />
            <button className="ark-btn gold" disabled={!valid || clsLoading} onClick={analyze} title="حلّل المنتج بالذكاء">
              {clsLoading ? <Loader2 size={16} className="ark-spin" /> : <Sparkles size={16} />}
            </button>
          </div>
        </div>

        {clsErr && <div style={{ color: "var(--red)", fontSize: 12.5, marginBottom: 12 }}>{clsErr}</div>}

        {cls && (
          <div className="ark-cls">
            <div className="ark-cls-h"><Sparkles size={14} /> التصنيف التلقائي</div>
            <Row k="التصنيف الرئيسي" v={cls.mainCategory} />
            <Row k="التصنيف الفرعي" v={cls.subCategory} />
            <Row k="العلامة التجارية" v={cls.brand} />
            <Row k="السلسلة" v={cls.series} />
            <Row k="الموديل" v={cls.model} />
            <Row k="الإصدار / السعة" v={cls.variant} />
            <Row k="الفئة السعرية" v={cls.priceTier} />
            <Row k="سنة الإصدار" v={cls.releaseYear} />
            <Row k="مستوى الطلب" v={cls.demand} />
            {Array.isArray(cls.similar) && cls.similar.filter(Boolean).length > 0 && (
              <div style={{ marginTop: 9 }}>
                <div style={{ color: "var(--muted)", fontSize: 11.5, marginBottom: 6 }}>منتجات مشابهة</div>
                <div className="ark-prod-meta" style={{ marginTop: 0 }}>
                  {cls.similar.filter(Boolean).map((s, i) => <span key={i} className="ark-chip">{s}</span>)}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="ark-row">
          <div className="ark-field">
            <label>الفئة</label>
            <input className="ark-input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="تظهر تلقائياً بعد التحليل" />
          </div>
          <div className="ark-field">
            <label>سعرك المطلوب (ر.س)</label>
            <input className="ark-input" type="number" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} placeholder="اختياري" />
          </div>
        </div>
        <button className="ark-btn" style={{ width: "100%", justifyContent: "center", marginTop: 6, opacity: valid ? 1 : 0.5 }}
          disabled={!valid}
          onClick={() => onSave({ name: name.trim(), category: category.trim(), targetPrice, classification: cls })}>
          أضف للمراقبة
        </button>
      </div>
    </div>
  );
}

function OfferModal({ onClose, onSave }) {
  const [f, setF] = useState({ store: "", price: "", shipping: "", taxRate: "", discount: "", deliveryDays: "", condition: "جديد", warranty: "" });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const valid = f.store.trim() && Number(f.price) > 0;
  const preview = valid ? finalPrice(f) : null;
  return (
    <div className="ark-modal-bg" onClick={onClose}>
      <div className="ark-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ark-modal-h">
          <h3>سجّل عرض متجر</h3>
          <button className="ark-iconbtn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="ark-row">
          <div className="ark-field">
            <label>المتجر *</label>
            <input className="ark-input" autoFocus value={f.store} onChange={set("store")} placeholder="نون / أمازون / جرير" />
          </div>
          <div className="ark-field">
            <label>السعر المعروض (ر.س) *</label>
            <input className="ark-input" type="number" value={f.price} onChange={set("price")} placeholder="0" />
          </div>
        </div>
        <div className="ark-row3">
          <div className="ark-field">
            <label>الشحن</label>
            <input className="ark-input" type="number" value={f.shipping} onChange={set("shipping")} placeholder="0" />
          </div>
          <div className="ark-field">
            <label>ضريبة %</label>
            <input className="ark-input" type="number" value={f.taxRate} onChange={set("taxRate")} placeholder="0" />
          </div>
          <div className="ark-field">
            <label>خصم</label>
            <input className="ark-input" type="number" value={f.discount} onChange={set("discount")} placeholder="0" />
          </div>
        </div>
        <div className="ark-row3">
          <div className="ark-field">
            <label>توصيل (يوم)</label>
            <input className="ark-input" type="number" value={f.deliveryDays} onChange={set("deliveryDays")} placeholder="٢" />
          </div>
          <div className="ark-field">
            <label>الحالة</label>
            <select className="ark-select" value={f.condition} onChange={set("condition")}>
              {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="ark-field">
            <label>الضمان</label>
            <input className="ark-input" value={f.warranty} onChange={set("warranty")} placeholder="محلي" />
          </div>
        </div>

        {preview != null && (
          <div style={{ background: "var(--jade-dim)", border: "1px solid var(--jade)", borderRadius: 12, padding: "11px 13px", marginBottom: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--jade)", fontWeight: 700, fontSize: 13 }}>السعر الحقيقي النهائي</span>
            <span style={{ color: "var(--jade)", fontWeight: 800, fontSize: 18 }}>{SAR(preview)} ر.س</span>
          </div>
        )}

        <button className="ark-btn" style={{ width: "100%", justifyContent: "center", opacity: valid ? 1 : 0.5 }}
          disabled={!valid}
          onClick={() => onSave(f)}>
          حفظ العرض
        </button>
      </div>
    </div>
  );
}

function SuggestModal({ state, onClose, onAdd }) {
  const { category, loading, items, error } = state;
  const [added, setAdded] = useState({});
  return (
    <div className="ark-modal-bg" onClick={onClose}>
      <div className="ark-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ark-modal-h">
          <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={18} style={{ color: "var(--gold)" }} /> {category}
          </h3>
          <button className="ark-iconbtn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="ark-note">
          اقتراحات بالذكاء الاصطناعي. الأسعار <b>تقديرية للاسترشاد فقط</b> — بعد الإضافة، سجّل سعر المتجر الحقيقي عشان المقارنة تطلع دقيقة.
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--muted)", fontSize: 14 }}>
            <Loader2 size={26} className="ark-spin" style={{ color: "var(--gold)", marginBottom: 10 }} />
            <div>أبحث عن أبرز منتجات {category} في السوق السعودي...</div>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "26px 10px", color: "var(--red)", fontSize: 14 }}>{error}</div>
        ) : (
          items.map((it, i) => {
            const isAdded = added[it.name];
            return (
              <div key={i} className="ark-sug">
                <div style={{ minWidth: 0 }}>
                  <div className="nm">{it.name}</div>
                  <div className="meta">
                    {Array.isArray(it.stores) && it.stores.length ? it.stores.join(" · ") : "متاجر متعددة"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {it.estPrice ? <div className="est">~{SAR(it.estPrice)} ر.س</div> : null}
                  <a className="ark-suglink" href={GOOGLE_SHOP(it.name)} target="_blank" rel="noopener noreferrer" title="افتح في جوجل تسوّق">
                    <ExternalLink size={14} />
                  </a>
                  {isAdded ? (
                    <button className="ark-btn ghost sm" disabled><Check size={14} /> أُضيف</button>
                  ) : (
                    <button className="ark-btn sm" onClick={() => { onAdd(it); setAdded((s) => ({ ...s, [it.name]: true })); }}>
                      <Plus size={14} /> أضف
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
