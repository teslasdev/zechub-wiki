"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, GitBranch, Maximize2, Minimize2, Search } from "lucide-react";

type Digest = { slug: string; title: string; date: string; excerpt: string; content: string; url: string };
const fallback: Digest[] = [{ slug: "fallback", title: "ZecWeekly", date: "2025-01-10", excerpt: "A community digest of Zcash protocol updates, projects, and conversations.", content: "## Welcome to ZecWeekly\n\nYour weekly digest of Zcash ecosystem updates, community projects, and conversations worth following.\n\n## Zcash Updates\n\n### Community projects\n\nDiscover builders, educators, and local communities making private digital cash easier to use.", url: "https://github.com/ZecHub/zechub/tree/main/newsletter" }];

const formatDate = (date?: string) => {
  if (!date) return "Date unavailable";
  const value = /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T12:00:00` : date;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(parsed);
};

export default function Digestions() {
  const [digests, setDigests] = useState(fallback); const [selected, setSelected] = useState(fallback[0]); const [query, setQuery] = useState(""); const [fromDate, setFromDate] = useState(""); const [toDate, setToDate] = useState(""); const [page, setPage] = useState(0); const [isReading, setIsReading] = useState(false);
  useEffect(() => { fetch("/api/newsletter").then((r) => r.json()).then((data) => { if (data.newsletters?.length) { setDigests(data.newsletters); setSelected(data.newsletters[0]); } }).catch(() => undefined); }, []);
  const filtered = useMemo(() => digests.filter((item) => { const matchesText = `${item.title} ${item.excerpt} ${item.content}`.toLowerCase().includes(query.toLowerCase()); return matchesText && (!fromDate || item.date >= fromDate) && (!toDate || item.date <= toDate); }), [digests, query, fromDate, toDate]); const perPage = 6; const pages = Math.max(1, Math.ceil(filtered.length / perPage)); const visible = filtered.slice(page * perPage, (page + 1) * perPage);

  return <main className="digestions-page"><div className="digestions-shell">
    <header className="digestions-header"><div><div className="digestions-kicker">ZecHub / Digestions</div><h1>The Zcash community, <em>in context.</em></h1><p>Weekly signals, stories, and links from the shielded ecosystem.</p></div><a className="digestions-source" href="https://github.com/ZecHub/zechub/tree/main/newsletter" target="_blank" rel="noreferrer"><GitBranch size={16} /> Source on GitHub <ArrowUpRight size={15} /></a></header>
    <section className={`digestions-layout ${isReading ? "is-reading" : ""}`}><aside className="digestions-index"><div className="digestions-index-head"><span>Archive</span><span>{filtered.length} issues</span></div><label className="digestions-search"><Search size={15} /><input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Search" aria-label="Search digestions" /></label><div className="digestions-date-filter"><div className="digestions-filter-label">Filter by date</div><div className="digestions-date-fields"><label>From<input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(0); }} /></label><label>To<input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(0); }} /></label></div>{(fromDate || toDate) && <button className="digestions-clear-filter" onClick={() => { setFromDate(""); setToDate(""); setPage(0); }}>Clear dates</button>}</div><div className="digestions-list">{visible.map((item, index) => <button className={`digestions-list-item ${selected.slug === item.slug ? "active" : ""}`} key={item.slug} onClick={() => { setSelected(item); setIsReading(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}><span>{String(page * perPage + index + 1).padStart(2, "0")}</span><strong>{item.title}</strong><small>{formatDate(item.date)}</small></button>)}</div><div className="digestions-pager"><button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}><ChevronLeft size={15} /></button><span>{page + 1} / {pages}</span><button disabled={page >= pages - 1} onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}><ChevronRight size={15} /></button></div></aside><article className="digestions-article"><div className="digestions-article-top"><span><CalendarDays size={14} /> {formatDate(selected.date)}</span><div className="digestions-article-actions"><a href={selected.url} target="_blank" rel="noreferrer">Read source <ArrowUpRight size={14} /></a><button className="digestions-expand" onClick={() => setIsReading(!isReading)} aria-label={isReading ? "Restore reader width" : "Expand digestion"} title={isReading ? "Restore reader width" : "Expand digestion"}>{isReading ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button></div></div><h2>{selected.title}</h2><p className="digestions-excerpt">{selected.excerpt}</p><div className="digestions-rule" /><div className="digestions-markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{selected.content}</ReactMarkdown></div></article></section>
    <footer className="digestions-footer"><span>ZecHub / Digestions</span><a href="/newsletter">Subscribe to the shielded newsletter <ArrowUpRight size={14} /></a></footer>
  </div></main>;
}
