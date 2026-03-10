import { useState, useEffect, useRef } from "react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";

// ── MOCK DATA ────────────────────────────────────────────────────────────────
const ALERTS_RAW = [
  { id:"ALT-7821", customer:"Meridian Corp Ltd",     risk_tier:"HIGH",    brs:94, sla_mins:18,  tx_count:312, prior_sars:3, type:"Structuring",       amount:248000, country:"Nigeria",     status:"URGENT",  analyst:"R. Sharma",   created:"08:14" },
  { id:"ALT-7809", customer:"F. Okonkwo",            risk_tier:"PEP",     brs:88, sla_mins:31,  tx_count:87,  prior_sars:1, type:"Layering",          amount:95000,  country:"UAE",         status:"URGENT",  analyst:"T. Nair",     created:"07:55" },
  { id:"ALT-7798", customer:"Skyline Trading FZE",   risk_tier:"HIGH",    brs:76, sla_mins:47,  tx_count:540, prior_sars:2, type:"Round-tripping",    amount:1200000,country:"Switzerland", status:"URGENT",  analyst:"P. Mehta",    created:"07:30" },
  { id:"ALT-7834", customer:"H. Vasquez",            risk_tier:"MEDIUM",  brs:61, sla_mins:82,  tx_count:44,  prior_sars:0, type:"Unusual Velocity",  amount:32000,  country:"Mexico",      status:"WATCH",   analyst:"L. Chen",     created:"09:02" },
  { id:"ALT-7815", customer:"Pinnacle RE Holdings",  risk_tier:"HIGH",    brs:55, sla_mins:95,  tx_count:201, prior_sars:1, type:"Structuring",       amount:785000, country:"Cyprus",      status:"WATCH",   analyst:"R. Sharma",   created:"08:45" },
  { id:"ALT-7841", customer:"M. Al-Rashid",          risk_tier:"PEP",     brs:48, sla_mins:110, tx_count:29,  prior_sars:0, type:"Cross-border",      amount:67000,  country:"Qatar",       status:"WATCH",   analyst:"T. Nair",     created:"09:18" },
  { id:"ALT-7803", customer:"Delta Imports GmbH",    risk_tier:"MEDIUM",  brs:33, sla_mins:155, tx_count:118, prior_sars:0, type:"Unusual Velocity",  amount:43500,  country:"Germany",     status:"NORMAL",  analyst:"P. Mehta",    created:"07:10" },
  { id:"ALT-7856", customer:"J. Thornton",           risk_tier:"LOW",     brs:18, sla_mins:210, tx_count:12,  prior_sars:0, type:"Threshold Breach",  amount:11200,  country:"UK",          status:"NORMAL",  analyst:"L. Chen",     created:"09:45" },
  { id:"ALT-7862", customer:"Apex Logistics Pvt",    risk_tier:"MEDIUM",  brs:12, sla_mins:280, tx_count:67,  prior_sars:0, type:"Cross-border",      amount:28700,  country:"India",       status:"NORMAL",  analyst:"R. Sharma",   created:"10:01" },
  { id:"ALT-7870", customer:"V. Kowalski",           risk_tier:"LOW",     brs:7,  sla_mins:320, tx_count:8,   prior_sars:0, type:"Threshold Breach",  amount:9800,   country:"Poland",      status:"NORMAL",  analyst:"T. Nair",     created:"10:22" },
];

const HOURLY_ALERTS = [
  { hour:"00:00", alerts:4, breached:0 }, { hour:"02:00", alerts:6, breached:1 },
  { hour:"04:00", alerts:3, breached:0 }, { hour:"06:00", alerts:11, breached:2 },
  { hour:"08:00", alerts:28, breached:3 }, { hour:"10:00", alerts:34, breached:2 },
  { hour:"12:00", alerts:29, breached:4 }, { hour:"14:00", alerts:41, breached:3 },
  { hour:"16:00", alerts:38, breached:5 }, { hour:"18:00", alerts:22, breached:2 },
  { hour:"20:00", alerts:14, breached:1 }, { hour:"22:00", alerts:8,  breached:1 },
];

const BRS_TREND = [
  { day:"Mon", avg_brs:38 }, { day:"Tue", avg_brs:44 }, { day:"Wed", avg_brs:51 },
  { day:"Thu", avg_brs:47 }, { day:"Fri", avg_brs:63 }, { day:"Sat", avg_brs:29 }, { day:"Sun", avg_brs:22 },
];

const TYPE_DIST = [
  { name:"Structuring", value:31, color:"#ef4444" },
  { name:"Layering",    value:22, color:"#f97316" },
  { name:"Velocity",    value:19, color:"#eab308" },
  { name:"Cross-border",value:16, color:"#3b82f6" },
  { name:"Round-trip",  value:12, color:"#8b5cf6" },
];

const ANALYST_PERF = [
  { analyst:"R. Sharma", closed:14, breached:1, avg_time:28 },
  { analyst:"T. Nair",   closed:11, breached:2, avg_time:34 },
  { analyst:"P. Mehta",  closed:16, breached:0, avg_time:22 },
  { analyst:"L. Chen",   closed:9,  breached:1, avg_time:41 },
];

const RADAR_DATA = [
  { metric:"Accuracy",    score:82 }, { metric:"Speed",      score:71 },
  { metric:"Escalation",  score:88 }, { metric:"Compliance",  score:94 },
  { metric:"SLA Adherence", score:78 }, { metric:"Documentation", score:85 },
];

// ── HELPERS ──────────────────────────────────────────────────────────────────
const brsColor = (brs) => brs >= 75 ? "#ef4444" : brs >= 40 ? "#f59e0b" : "#22c55e";
const brsLabel = (brs) => brs >= 75 ? "URGENT" : brs >= 40 ? "WATCH" : "NORMAL";
const tierColor = (t) => ({ HIGH:"#ef4444", PEP:"#a855f7", MEDIUM:"#f59e0b", LOW:"#22c55e" }[t] || "#6b7280");
const fmt = (n) => n >= 1000000 ? `$${(n/1000000).toFixed(2)}M` : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${n}`;

// ── CUSTOM TOOLTIP ─────────────────────────────────────────────────────────
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#0f1419", border:"1px solid #1e2d3d", borderRadius:6, padding:"10px 14px", fontFamily:"'IBM Plex Mono', monospace", fontSize:11 }}>
      <div style={{ color:"#64748b", marginBottom:4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || "#e2e8f0" }}>{p.name}: <span style={{ color:"#f1f5f9", fontWeight:700 }}>{p.value}</span></div>
      ))}
    </div>
  );
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function AMLDashboard() {
  const [alerts, setAlerts] = useState(ALERTS_RAW);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("queue");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [decisionText, setDecisionText] = useState("");
  const [decisionType, setDecisionType] = useState("");
  const [closed, setClosed] = useState([]);
  const [tick, setTick] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // Live BRS ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
      setAlerts(prev => prev.map(a => ({
        ...a,
        brs: Math.min(100, Math.max(0, a.brs + (Math.random() > 0.6 ? 1 : Math.random() > 0.8 ? -1 : 0))),
        sla_mins: Math.max(0, a.sla_mins - 1)
      })).sort((a, b) => b.brs - a.brs));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const filtered = alerts.filter(a => {
    const matchStatus = filterStatus === "ALL" || a.status === filterStatus;
    const matchSearch = a.customer.toLowerCase().includes(searchTerm.toLowerCase()) || a.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const urgentCount = alerts.filter(a => a.brs >= 75).length;
  const watchCount  = alerts.filter(a => a.brs >= 40 && a.brs < 75).length;
  const breachRisk  = alerts.filter(a => a.sla_mins < 30).length;
  const avgBRS      = Math.round(alerts.reduce((s, a) => s + a.brs, 0) / alerts.length);

  const handleDecision = () => {
    if (!decisionType || !decisionText || decisionText.length < 20) return;
    setClosed(prev => [...prev, { ...selected, decision: decisionType, rationale: decisionText, closed_at: new Date().toLocaleTimeString() }]);
    setAlerts(prev => prev.filter(a => a.id !== selected.id));
    setSelected(null);
    setDecisionText("");
    setDecisionType("");
  };

  const styles = {
    root: {
      minHeight: "100vh",
      background: "#070c12",
      color: "#e2e8f0",
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      fontSize: 12,
    },
    topbar: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 24px",
      background: "#0a1018",
      borderBottom: "1px solid #1e2d3d",
      position: "sticky", top: 0, zIndex: 100,
    },
    logo: {
      display: "flex", alignItems: "center", gap: 12,
    },
    logoMark: {
      width: 32, height: 32, background: "#ef4444",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 900, fontSize: 14, color: "#fff", letterSpacing: "-1px",
    },
    logoText: { fontSize: 13, fontWeight: 700, color: "#f1f5f9", letterSpacing: "0.08em" },
    logoSub:  { fontSize: 10, color: "#475569", letterSpacing: "0.12em" },
    liveTag: {
      display: "flex", alignItems: "center", gap: 6,
      background: "#0f1f12", border: "1px solid #166534",
      borderRadius: 3, padding: "4px 10px", fontSize: 10, color: "#4ade80",
    },
    liveDot: {
      width: 6, height: 6, borderRadius: "50%", background: "#4ade80",
      animation: "pulse 1.5s infinite",
    },
    tabs: {
      display: "flex", gap: 2,
      padding: "0 24px",
      background: "#0a1018",
      borderBottom: "1px solid #1e2d3d",
    },
    tab: (active) => ({
      padding: "12px 18px", cursor: "pointer", fontSize: 11, letterSpacing: "0.1em",
      color: active ? "#f1f5f9" : "#475569",
      borderBottom: active ? "2px solid #ef4444" : "2px solid transparent",
      background: "none", border: "none", borderBottomColor: active ? "#ef4444" : "transparent",
      transition: "all 0.15s",
    }),
    body: { display: "flex", flex: 1 },
    main: { flex: 1, padding: 20, overflow: "auto" },
    statsRow: {
      display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20,
    },
    statCard: (accent) => ({
      background: "#0a1018",
      border: `1px solid ${accent}33`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: 4, padding: "16px 18px",
    }),
    statLabel: { fontSize: 9, color: "#475569", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 },
    statValue: (color) => ({ fontSize: 28, fontWeight: 900, color, lineHeight: 1, marginBottom: 4, fontFamily:"'IBM Plex Mono', monospace" }),
    statSub:   { fontSize: 9, color: "#64748b" },
    panel: {
      background: "#0a1018", border: "1px solid #1e2d3d",
      borderRadius: 4, overflow: "hidden", marginBottom: 16,
    },
    panelHead: {
      padding: "12px 16px", borderBottom: "1px solid #1e2d3d",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "#0d1520",
    },
    panelTitle: { fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.15em", textTransform: "uppercase" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: {
      padding: "10px 14px", textAlign: "left", fontSize: 9, color: "#475569",
      letterSpacing: "0.12em", textTransform: "uppercase",
      borderBottom: "1px solid #1e2d3d", background: "#0d1520",
    },
    tr: (brs, sel) => ({
      borderBottom: "1px solid #111c27",
      cursor: "pointer",
      background: sel ? "#0f2236" : "transparent",
      transition: "background 0.1s",
    }),
    td: { padding: "11px 14px", verticalAlign: "middle" },
    brsBar: (brs) => ({
      display: "inline-flex", alignItems: "center", gap: 8,
    }),
    brsNum: (brs) => ({
      fontSize: 13, fontWeight: 900, color: brsColor(brs), minWidth: 28,
      fontFamily: "'IBM Plex Mono', monospace",
    }),
    brsTrack: {
      width: 60, height: 4, background: "#1e2d3d", borderRadius: 2, overflow: "hidden",
    },
    brsFill: (brs) => ({
      height: "100%", width: `${brs}%`, background: brsColor(brs), borderRadius: 2,
      transition: "width 0.5s ease",
    }),
    badge: (status) => {
      const map = { URGENT:["#ef4444","#1f0a0a"], WATCH:["#f59e0b","#1a1000"], NORMAL:["#22c55e","#091209"] };
      const [fg, bg] = map[status] || ["#6b7280","#111"];
      return { fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", color: fg, background: bg, border: `1px solid ${fg}44`, borderRadius: 2, padding: "2px 7px" };
    },
    tierBadge: (tier) => ({
      fontSize: 9, letterSpacing: "0.1em", color: tierColor(tier),
      border: `1px solid ${tierColor(tier)}44`, borderRadius: 2, padding: "2px 6px",
    }),
    slaCell: (mins) => ({
      fontSize: 11, fontWeight: 700, color: mins < 30 ? "#ef4444" : mins < 60 ? "#f59e0b" : "#64748b",
      fontFamily: "'IBM Plex Mono', monospace",
    }),
    sidebar: {
      width: 340, background: "#0a1018", borderLeft: "1px solid #1e2d3d",
      padding: 20, display: "flex", flexDirection: "column", gap: 16,
      overflowY: "auto",
    },
    sideTitle: { fontSize: 9, color: "#475569", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 },
    detailRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid #111c27" },
    detailLabel: { fontSize: 10, color: "#475569" },
    detailValue: { fontSize: 11, color: "#e2e8f0", textAlign: "right", maxWidth: 180, wordBreak: "break-word" },
    decisionBtn: (type, active) => ({
      flex: 1, padding: "10px 0", fontSize: 10, letterSpacing: "0.1em", fontWeight: 700,
      cursor: "pointer", borderRadius: 3, transition: "all 0.15s",
      border: active ? "none" : "1px solid #1e2d3d",
      background: active ? (type === "CLEAR" ? "#166534" : type === "ESCALATE" ? "#1e3a5f" : "#7f1d1d") : "#0d1520",
      color: active ? "#fff" : "#475569",
      fontFamily: "'IBM Plex Mono', monospace",
    }),
    textarea: {
      width: "100%", background: "#070c12", border: "1px solid #1e2d3d",
      borderRadius: 3, padding: "10px 12px", color: "#e2e8f0", fontSize: 11,
      fontFamily: "'IBM Plex Mono', monospace", resize: "vertical", minHeight: 80,
      boxSizing: "border-box", outline: "none",
    },
    submitBtn: (valid) => ({
      width: "100%", padding: "11px 0", fontSize: 10, fontWeight: 700,
      letterSpacing: "0.15em", cursor: valid ? "pointer" : "not-allowed",
      background: valid ? "#ef4444" : "#1e2d3d", color: valid ? "#fff" : "#475569",
      border: "none", borderRadius: 3, fontFamily: "'IBM Plex Mono', monospace",
      transition: "all 0.15s",
    }),
    filterBtn: (active) => ({
      padding: "6px 12px", fontSize: 9, cursor: "pointer",
      background: active ? "#1e2d3d" : "transparent",
      border: "1px solid " + (active ? "#334155" : "#1e2d3d"),
      color: active ? "#f1f5f9" : "#475569", borderRadius: 3,
      letterSpacing: "0.1em", fontFamily: "'IBM Plex Mono', monospace",
    }),
    searchInput: {
      background: "#070c12", border: "1px solid #1e2d3d",
      borderRadius: 3, padding: "6px 12px", color: "#e2e8f0",
      fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", outline: "none",
      width: 180,
    },
    gridTwo: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
    gridThree: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 },
  };

  return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #070c12; }
        ::-webkit-scrollbar-thumb { background: #1e2d3d; border-radius: 2px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        tr:hover td { background: #0d1a26 !important; }
        .submitBtn:hover { opacity: 0.9; }
      `}</style>

      {/* TOPBAR */}
      <div style={styles.topbar}>
        <div style={styles.logo}>
          <div style={styles.logoMark}>AML</div>
          <div>
            <div style={styles.logoText}>SENTINEL · ANALYTICS</div>
            <div style={styles.logoSub}>SUSPICIOUS TRANSACTION PATTERN ANALYSIS</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ fontSize:10, color:"#475569" }}>
            ANALYST: <span style={{ color:"#94a3b8" }}>R. SHARMA</span>
          </div>
          <div style={{ fontSize:10, color:"#475569" }}>
            {new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }).toUpperCase()}
          </div>
          <div style={styles.liveTag}>
            <div style={styles.liveDot} />
            LIVE · BRS REFRESH 5m
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={styles.tabs}>
        {[["queue","ALERT QUEUE"],["analytics","ANALYTICS"],["audit","AUDIT LOG"]].map(([key,label]) => (
          <button key={key} style={styles.tab(activeTab===key)} onClick={() => setActiveTab(key)}>{label}</button>
        ))}
      </div>

      {/* ── QUEUE TAB ──────────────────────────────────────────────────────── */}
      {activeTab === "queue" && (
        <div style={{ display:"flex", flex:1 }}>
          <div style={styles.main}>
            {/* Stats */}
            <div style={styles.statsRow}>
              {[
                { label:"URGENT ALERTS", value: urgentCount, color:"#ef4444", sub:"BRS ≥ 75 — immediate action" },
                { label:"WATCH ALERTS",  value: watchCount,  color:"#f59e0b", sub:"BRS 40–74 — monitor closely" },
                { label:"SLA AT RISK",   value: breachRisk,  color:"#f97316", sub:"< 30 min remaining" },
                { label:"AVG BRS TODAY", value: avgBRS,      color: brsColor(avgBRS), sub:"Team composite score" },
              ].map((s,i) => (
                <div key={i} style={styles.statCard(s.color)}>
                  <div style={styles.statLabel}>{s.label}</div>
                  <div style={styles.statValue(s.color)}>{s.value}</div>
                  <div style={styles.statSub}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ display:"flex", gap:8, marginBottom:14, alignItems:"center" }}>
              <input style={styles.searchInput} placeholder="Search ID or customer..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              <div style={{ flex:1 }} />
              {["ALL","URGENT","WATCH","NORMAL"].map(f => (
                <button key={f} style={styles.filterBtn(filterStatus===f)} onClick={() => setFilterStatus(f)}>{f}</button>
              ))}
            </div>

            {/* Alert Table */}
            <div style={styles.panel}>
              <div style={styles.panelHead}>
                <span style={styles.panelTitle}>RISK-RANKED ALERT QUEUE</span>
                <span style={{ fontSize:9, color:"#475569" }}>{filtered.length} ALERTS · SORTED BY BRS ↓</span>
              </div>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {["ALERT ID","CUSTOMER","RISK TIER","BRS SCORE","STATUS","SLA REMAINING","TYPE","AMOUNT","ANALYST"].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => (
                    <tr key={a.id} style={styles.tr(a.brs, selected?.id===a.id)} onClick={() => setSelected(a)}>
                      <td style={{...styles.td, fontWeight:700, color:"#94a3b8", fontSize:11}}>{a.id}</td>
                      <td style={{...styles.td, color:"#f1f5f9", fontSize:11}}>{a.customer}</td>
                      <td style={styles.td}><span style={styles.tierBadge(a.risk_tier)}>{a.risk_tier}</span></td>
                      <td style={styles.td}>
                        <div style={styles.brsBar(a.brs)}>
                          <span style={styles.brsNum(a.brs)}>{a.brs}</span>
                          <div style={styles.brsTrack}><div style={styles.brsFill(a.brs)} /></div>
                        </div>
                      </td>
                      <td style={styles.td}><span style={styles.badge(a.status)}>{a.status}</span></td>
                      <td style={styles.td}><span style={styles.slaCell(a.sla_mins)}>{a.sla_mins}m</span></td>
                      <td style={{...styles.td, color:"#64748b", fontSize:10}}>{a.type}</td>
                      <td style={{...styles.td, fontWeight:700, color:"#94a3b8", fontSize:11}}>{fmt(a.amount)}</td>
                      <td style={{...styles.td, color:"#64748b", fontSize:10}}>{a.analyst}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SIDEBAR — case detail */}
          <div style={styles.sidebar}>
            {selected ? (
              <div style={{ animation:"fadeIn 0.2s ease" }}>
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:9, color:"#475569", letterSpacing:"0.15em", marginBottom:6 }}>CASE DETAIL</div>
                  <div style={{ fontSize:15, fontWeight:900, color:"#f1f5f9", marginBottom:2 }}>{selected.id}</div>
                  <div style={{ fontSize:11, color:"#94a3b8" }}>{selected.customer}</div>
                </div>

                {/* BRS Gauge */}
                <div style={{ background:"#070c12", border:"1px solid #1e2d3d", borderRadius:4, padding:"14px 16px", marginBottom:16 }}>
                  <div style={styles.sideTitle}>BREACH RISK SCORE</div>
                  <div style={{ fontSize:40, fontWeight:900, color:brsColor(selected.brs), lineHeight:1, fontFamily:"'IBM Plex Mono',monospace" }}>{selected.brs}</div>
                  <div style={{ marginTop:8, background:"#1e2d3d", borderRadius:3, height:6, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${selected.brs}%`, background:brsColor(selected.brs), borderRadius:3, transition:"width 0.5s" }} />
                  </div>
                  <div style={{ marginTop:6, fontSize:9, color: brsColor(selected.brs), letterSpacing:"0.15em" }}>{brsLabel(selected.brs)} — SLA IN {selected.sla_mins}m</div>
                </div>

                {/* Details */}
                <div style={{ background:"#070c12", border:"1px solid #1e2d3d", borderRadius:4, padding:"14px 16px", marginBottom:16 }}>
                  <div style={styles.sideTitle}>CASE INFORMATION</div>
                  {[
                    ["Alert Type", selected.type],
                    ["Amount", fmt(selected.amount)],
                    ["Country", selected.country],
                    ["Risk Tier", selected.risk_tier],
                    ["Tx (30d)", selected.tx_count],
                    ["Prior SARs", selected.prior_sars],
                    ["Created", selected.created],
                    ["Analyst", selected.analyst],
                  ].map(([k,v]) => (
                    <div key={k} style={styles.detailRow}>
                      <span style={styles.detailLabel}>{k}</span>
                      <span style={styles.detailValue}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Decision */}
                <div style={{ background:"#070c12", border:"1px solid #1e2d3d", borderRadius:4, padding:"14px 16px" }}>
                  <div style={styles.sideTitle}>ANALYST DECISION</div>
                  <div style={{ display:"flex", gap:6, marginBottom:12 }}>
                    {["CLEAR","ESCALATE","FILE SAR"].map(t => (
                      <button key={t} style={styles.decisionBtn(t, decisionType===t)} onClick={() => setDecisionType(t)}>{t}</button>
                    ))}
                  </div>
                  <div style={{ fontSize:9, color:"#475569", letterSpacing:"0.1em", marginBottom:6 }}>RATIONALE (min 20 chars)</div>
                  <textarea
                    style={styles.textarea}
                    placeholder="Document your reasoning for this decision..."
                    value={decisionText}
                    onChange={e => setDecisionText(e.target.value)}
                  />
                  <div style={{ fontSize:9, color: decisionText.length >= 20 ? "#22c55e" : "#475569", marginBottom:10, marginTop:4 }}>
                    {decisionText.length}/20 min · {decisionText.length}/2000 max
                  </div>
                  <button
                    style={styles.submitBtn(decisionType && decisionText.length >= 20)}
                    onClick={handleDecision}
                    disabled={!decisionType || decisionText.length < 20}
                  >
                    SUBMIT &amp; CLOSE CASE
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"#1e2d3d", textAlign:"center", gap:12 }}>
                <div style={{ fontSize:32 }}>⬡</div>
                <div style={{ fontSize:10, letterSpacing:"0.15em" }}>SELECT AN ALERT<br/>TO VIEW DETAILS</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ANALYTICS TAB ─────────────────────────────────────────────────── */}
      {activeTab === "analytics" && (
        <div style={{ padding:20 }}>
          <div style={styles.statsRow}>
            {[
              { label:"TOTAL ALERTS TODAY", value:"247", color:"#3b82f6", sub:"↑ 12% vs yesterday" },
              { label:"SLA BREACH RATE",     value:"3.2%", color:"#22c55e", sub:"Target: < 4%" },
              { label:"FALSE POSITIVE RATE", value:"41%",  color:"#f59e0b", sub:"↓ from 68% baseline" },
              { label:"SARS FILED",          value:"8",    color:"#ef4444", sub:"Escalated to MLRO" },
            ].map((s,i) => (
              <div key={i} style={styles.statCard(s.color)}>
                <div style={styles.statLabel}>{s.label}</div>
                <div style={styles.statValue(s.color)}>{s.value}</div>
                <div style={styles.statSub}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div style={styles.gridTwo}>
            {/* Hourly Alerts */}
            <div style={styles.panel}>
              <div style={styles.panelHead}>
                <span style={styles.panelTitle}>HOURLY ALERT VOLUME VS BREACHES</span>
              </div>
              <div style={{ padding:16 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={HOURLY_ALERTS}>
                    <defs>
                      <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="breachGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="#1e2d3d" />
                    <XAxis dataKey="hour" tick={{ fill:"#475569", fontSize:9, fontFamily:"IBM Plex Mono" }} />
                    <YAxis tick={{ fill:"#475569", fontSize:9, fontFamily:"IBM Plex Mono" }} />
                    <Tooltip content={<DarkTooltip />} />
                    <Area type="monotone" dataKey="alerts" name="Alerts" stroke="#3b82f6" fill="url(#alertGrad)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="breached" name="Breached" stroke="#ef4444" fill="url(#breachGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Alert Type Distribution */}
            <div style={styles.panel}>
              <div style={styles.panelHead}>
                <span style={styles.panelTitle}>ALERT TYPE DISTRIBUTION</span>
              </div>
              <div style={{ padding:16, display:"flex", alignItems:"center", gap:20 }}>
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={TYPE_DIST} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {TYPE_DIST.map((e,i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<DarkTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
                  {TYPE_DIST.map((t,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:t.color, flexShrink:0 }} />
                      <span style={{ fontSize:10, color:"#94a3b8", flex:1 }}>{t.name}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:t.color }}>{t.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={styles.gridTwo}>
            {/* 7-Day BRS Trend */}
            <div style={styles.panel}>
              <div style={styles.panelHead}>
                <span style={styles.panelTitle}>7-DAY AVG BREACH RISK SCORE</span>
              </div>
              <div style={{ padding:16 }}>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={BRS_TREND}>
                    <CartesianGrid strokeDasharray="2 4" stroke="#1e2d3d" />
                    <XAxis dataKey="day" tick={{ fill:"#475569", fontSize:9, fontFamily:"IBM Plex Mono" }} />
                    <YAxis domain={[0,100]} tick={{ fill:"#475569", fontSize:9, fontFamily:"IBM Plex Mono" }} />
                    <Tooltip content={<DarkTooltip />} />
                    <Line type="monotone" dataKey="avg_brs" name="Avg BRS" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill:"#f59e0b", r:4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Team Radar */}
            <div style={styles.panel}>
              <div style={styles.panelHead}>
                <span style={styles.panelTitle}>TEAM PERFORMANCE RADAR</span>
              </div>
              <div style={{ padding:16 }}>
                <ResponsiveContainer width="100%" height={180}>
                  <RadarChart data={RADAR_DATA}>
                    <PolarGrid stroke="#1e2d3d" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill:"#475569", fontSize:9, fontFamily:"IBM Plex Mono" }} />
                    <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                    <Tooltip content={<DarkTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Analyst Performance */}
          <div style={styles.panel}>
            <div style={styles.panelHead}>
              <span style={styles.panelTitle}>ANALYST PERFORMANCE — TODAY</span>
            </div>
            <div style={{ padding:16 }}>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={ANALYST_PERF} barSize={28}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#1e2d3d" />
                  <XAxis dataKey="analyst" tick={{ fill:"#475569", fontSize:9, fontFamily:"IBM Plex Mono" }} />
                  <YAxis tick={{ fill:"#475569", fontSize:9, fontFamily:"IBM Plex Mono" }} />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="closed" name="Cases Closed" fill="#22c55e" radius={[2,2,0,0]} />
                  <Bar dataKey="breached" name="SLA Breached" fill="#ef4444" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── AUDIT LOG TAB ──────────────────────────────────────────────────── */}
      {activeTab === "audit" && (
        <div style={{ padding:20 }}>
          <div style={styles.panel}>
            <div style={styles.panelHead}>
              <span style={styles.panelTitle}>IMMUTABLE AUDIT LOG</span>
              <span style={{ fontSize:9, color:"#475569" }}>{closed.length} RECORDS THIS SESSION</span>
            </div>
            {closed.length === 0 ? (
              <div style={{ padding:48, textAlign:"center", color:"#1e2d3d", fontSize:10, letterSpacing:"0.15em" }}>
                NO CLOSED CASES THIS SESSION<br/>
                <span style={{ fontSize:9, color:"#0f1e2d" }}>CLOSE ALERTS FROM THE QUEUE TAB TO SEE RECORDS HERE</span>
              </div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    {["ALERT ID","CUSTOMER","DECISION","BRS AT CLOSE","SLA REMAINING","ANALYST","RATIONALE","TIMESTAMP"].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...closed].reverse().map((c,i) => (
                    <tr key={i} style={{ borderBottom:"1px solid #111c27" }}>
                      <td style={{...styles.td, color:"#94a3b8", fontSize:11, fontWeight:700}}>{c.id}</td>
                      <td style={{...styles.td, color:"#f1f5f9", fontSize:11}}>{c.customer}</td>
                      <td style={styles.td}>
                        <span style={styles.badge(c.decision === "CLEAR" ? "NORMAL" : c.decision === "ESCALATE" ? "WATCH" : "URGENT")}>
                          {c.decision}
                        </span>
                      </td>
                      <td style={{...styles.td, fontWeight:700, color:brsColor(c.brs), fontFamily:"'IBM Plex Mono',monospace"}}>{c.brs}</td>
                      <td style={{...styles.td, color:"#64748b"}}>{c.sla_mins}m</td>
                      <td style={{...styles.td, color:"#64748b", fontSize:10}}>{c.analyst}</td>
                      <td style={{...styles.td, color:"#94a3b8", fontSize:10, maxWidth:240}}>{c.rationale.slice(0,80)}{c.rationale.length>80?"…":""}</td>
                      <td style={{...styles.td, color:"#475569", fontSize:10, fontFamily:"'IBM Plex Mono',monospace"}}>{c.closed_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {closed.length === 0 && (
            <div style={{ ...styles.panel, marginTop:16 }}>
              <div style={styles.panelHead}><span style={styles.panelTitle}>AUDIT TRAIL SPECIFICATION</span></div>
              <div style={{ padding:20 }}>
                {[
                  ["alert_id",          "STRING",   "Actimize",     "Unique alert identifier",              "Not null · UUID"],
                  ["analyst_id",        "STRING",   "IAM System",   "Authenticated analyst session ID",      "Not null · Active session"],
                  ["decision",          "ENUM",     "Dashboard",    "CLEAR / ESCALATE / FILE_SAR",           "Restricted enum"],
                  ["decision_rationale","TEXT",     "Dashboard",    "Free-text reasoning",                   "Min 20 · Max 2000 chars"],
                  ["brs_at_closure",    "INTEGER",  "Scoring API",  "BRS value at time of submission",       "0–100"],
                  ["sla_remaining_mins","INTEGER",  "System",       "Mins remaining on SLA at closure",      ">= 0"],
                  ["audit_timestamp",   "DATETIME", "System",       "UTC; system-generated; tamper-evident", "Immutable"],
                ].map(([field, type, src, desc, rule], i) => (
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"160px 80px 120px 1fr 160px", gap:12, padding:"8px 0", borderBottom:"1px solid #111c27", alignItems:"center" }}>
                    <span style={{ fontSize:10, color:"#3b82f6", fontFamily:"'IBM Plex Mono',monospace" }}>{field}</span>
                    <span style={{ fontSize:9, color:"#f59e0b", border:"1px solid #f59e0b44", borderRadius:2, padding:"1px 5px", width:"fit-content" }}>{type}</span>
                    <span style={{ fontSize:9, color:"#475569" }}>{src}</span>
                    <span style={{ fontSize:10, color:"#94a3b8" }}>{desc}</span>
                    <span style={{ fontSize:9, color:"#64748b", textAlign:"right" }}>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
