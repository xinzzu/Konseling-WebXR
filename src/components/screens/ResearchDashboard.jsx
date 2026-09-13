import { useEffect, useMemo, useState } from "react";
import {
  login as apiLogin,
  fetchSummary,
  fetchData,
  downloadCsv,
  isLoggedIn,
  setStoredToken,
  UNAUTHORIZED_MESSAGE,
} from "../../services/researchService";

const EMPTY_SUMMARY = { totalRows: 0, totalSessions: 0, completedSessions: 0, byEpisode: {} };

const C = {
  bg: "#0B0F14",
  panel: "#131A24",
  panel2: "#18212E",
  line: "rgba(145,175,205,0.16)",
  lineStrong: "rgba(145,175,205,0.32)",
  text: "#E7EEF5",
  muted: "#8FA3B8",
  gold: "#E7C87E",
  teal: "#4CC9A0",
  red: "#E5696A",
  amber: "#E7C87E",
  blue: "#6FA8FF",
};

function fmtTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
}

function skorChip(score) {
  const base = {
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    display: "inline-block",
    minWidth: 34,
    textAlign: "center",
  };
  if (score === 2) return { ...base, color: "#0E2B22", background: "rgba(76,201,160,0.85)" };
  if (score === 1) return { ...base, color: "#33270A", background: "rgba(231,200,126,0.85)" };
  return { ...base, color: "#3A1517", background: "rgba(229,105,106,0.8)" };
}

function StoragePill({ storage }) {
  const neon = storage === "postgres-neon";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        fontWeight: 600,
        padding: "6px 12px",
        borderRadius: 999,
        color: neon ? "#BFEEDD" : "#F3D9A4",
        background: neon ? "rgba(76,201,160,0.16)" : "rgba(231,200,126,0.14)",
        border: `1px solid ${neon ? "rgba(76,201,160,0.4)" : "rgba(231,200,126,0.35)"}`,
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 999, background: neon ? "#4CC9A0" : "#E7C87E" }} />
      {neon ? "Postgres (Neon) · persisten" : "JSONL / temp · tidak persisten"}
    </span>
  );
}

export default function ResearchDashboard() {
  const [authed, setAuthed] = useState(isLoggedIn());
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [whoami, setWhoami] = useState("");
  const [filters, setFilters] = useState({ episodeId: "", sessionId: "", from: "", to: "" });
  const [localSearch, setLocalSearch] = useState("");

  const load = async (f = filters) => {
    setLoading(true);
    setLoadError(null);
    try {
      const [sum, data] = await Promise.all([fetchSummary(f), fetchData(f)]);
      setSummary(sum);
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.message === UNAUTHORIZED_MESSAGE) {
        setStoredToken(null);
        setAuthed(false);
      } else {
        setLoadError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await apiLogin(loginForm.username, loginForm.password);
      setWhoami(res.username || loginForm.username);
      setAuthed(true);
    } catch (err) {
      setLoginError(err.message === UNAUTHORIZED_MESSAGE ? "Username atau sandi salah." : err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setStoredToken(null);
    setAuthed(false);
    setWhoami("");
    setRows([]);
    setSummary(EMPTY_SUMMARY);
  };

  const goMenu = () => {
    history.replaceState(null, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const visibleRows = useMemo(() => {
    const q = localSearch.trim().toLowerCase();
    const list = q
      ? rows.filter(
          (r) =>
            `${r.sessionId} ${r.episodeId} ${r.labelPilihan} ${r.jenisScene}`.toLowerCase().includes(q)
        )
      : rows;
    return list.slice(-200).reverse();
  }, [rows, localSearch]);

  const episodeOptions = useMemo(
    () =>
      Object.entries(summary.byEpisode || {})
        .filter(([, v]) => v)
        .map(([id, v]) => ({ id, tema: v.tema })),
    [summary]
  );

  // ---------------- LOGIN ----------------
  if (!authed) {
    return (
      <div style={styles.loginBg}>
        <div style={styles.loginAside}>
          <div style={styles.brand}>
            <div style={styles.brandMark}>☪</div>
            <div>
              <h1 style={styles.brandTitle}>Konseling VR</h1>
              <p style={styles.brandSub}>Pelajaran Kedamaian · Dashboard Riset</p>
            </div>
          </div>
          <blockquote style={styles.quote}>
            “Ilmu yang baik adalah yang menjadi amal, dan amal yang tulus lahir dari hati yang ikhlas.”
          </blockquote>
          <div style={styles.asideMeta}>
            <span>🔒 Akses terbatas peneliti</span>
            <span>·</span>
            <span>Session JWT 7 hari</span>
          </div>
        </div>

        <div style={styles.loginMain}>
          <form onSubmit={handleLogin} className="fade-in" style={styles.loginCard}>
            <h2 style={styles.h2}>Masuk ke Dashboard</h2>
            <p style={styles.hint}>Pantau riwayat dan skor jawaban siswa lintas episode.</p>

            <label style={styles.fieldLabel}>
              Username / email
              <input
                style={styles.input}
                value={loginForm.username}
                onChange={(e) => setLoginForm((s) => ({ ...s, username: e.target.value }))}
                autoComplete="username"
                autoFocus
                placeholder="admin@sekolah.sch.id"
              />
            </label>

            <label style={styles.fieldLabel}>
              Sandi
              <div style={styles.passWrap}>
                <input
                  style={{ ...styles.input, paddingRight: 64 }}
                  type={showPass ? "text" : "password"}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((s) => ({ ...s, password: e.target.value }))}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  style={styles.passToggle}
                  onClick={() => setShowPass((v) => !v)}
                  tabIndex={-1}
                >
                  {showPass ? "Sembunyi" : "Lihat"}
                </button>
              </div>
            </label>

            {loginError && (
              <div style={styles.alert}>
                <span style={styles.alertDot} /> {loginError}
              </div>
            )}

            <button
              style={{ ...styles.primaryBtn, width: "100%", marginTop: 22, justifyContent: "center" }}
              type="submit"
              disabled={loginLoading}
            >
              {loginLoading ? "Memeriksa…" : "Masuk →"}
            </button>

            <div style={styles.loginDivider} />
            <button style={styles.backLink} onClick={goMenu} type="button">
              ← Kembali ke Menu
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------------- DASHBOARD ----------------
  return (
    <div style={styles.dashBg}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerMark}>☪</span>
          <div>
            <div style={styles.headerTitle}>Dashboard Peneliti</div>
            <div style={styles.headerSub}>
              {whoami ? `Masuk sebagai ${whoami}` : "Panel riset"}
            </div>
          </div>
        </div>
        <div style={styles.headerActions}>
          <StoragePill storage={summary.storage} />
          <button style={styles.ghostBtn} onClick={() => load()} disabled={loading}>
            {loading ? "Memuat…" : "⟳ Muat Ulang"}
          </button>
          <button
            style={styles.ghostBtn}
            onClick={() => downloadCsv(filters, false).catch((e) => setLoadError(e.message))}
          >
            ⬇ CSV ringkas
          </button>
          <button
            style={styles.ghostBtn}
            onClick={() => downloadCsv(filters, true).catch((e) => setLoadError(e.message))}
          >
            ⬇ CSV mentah
          </button>
          <button style={styles.dangerBtn} onClick={handleLogout}>
            Keluar
          </button>
          <button style={styles.linkBtn} onClick={goMenu}>
            Menu
          </button>
        </div>
      </div>

      <div style={styles.dashBody}>
        {loadError && (
          <div style={styles.errorBanner} onClick={() => setLoadError(null)}>
            <span style={styles.alertDot} /> {loadError} <span style={{ marginLeft: 8 }}>— ketuk untuk menutup</span>
          </div>
        )}

        {/* Filter */}
        <div style={styles.filterBar}>
          <select
            style={styles.input}
            value={filters.episodeId}
            onChange={(e) => setFilters((f) => ({ ...f, episodeId: e.target.value }))}
          >
            <option value="">Semua episode</option>
            {episodeOptions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.tema} ({e.id})
              </option>
            ))}
          </select>
          <input
            style={styles.input}
            placeholder="ID sesi (persis)"
            value={filters.sessionId}
            onChange={(e) => setFilters((f) => ({ ...f, sessionId: e.target.value }))}
          />
          <input
            style={{ ...styles.input, width: 132 }}
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
          />
          <span style={styles.filterArrow}>→</span>
          <input
            style={{ ...styles.input, width: 132 }}
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
          />
          <button style={styles.primaryBtn} onClick={() => load()}>
            Terapkan
          </button>
        </div>

        {/* Kartu ringkasan */}
        <div style={styles.cards}>
          <Card icon="🧑‍🎓" label="Sesi terlibat" value={summary.totalSessions ?? 0} tone="#6FA8FF" />
          <Card icon="✅" label="Sesi selesai 10/10" value={summary.completedSessions ?? 0} tone="#4CC9A0" />
          <Card icon="🗂️" label="Data jawaban" value={summary.totalRows ?? 0} tone="#E7C87E" />
          <Card
            icon="📈"
            label="% selesai"
            value={
              summary.totalSessions
                ? `${Math.round((100 * (summary.completedSessions ?? 0)) / summary.totalSessions)}%`
                : "—"
            }
            tone="#B48CFF"
          />
        </div>

        {/* Per episode */}
        <SectionTitle>Ringkasan per episode</SectionTitle>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <Th>Episode</Th>
                <Th>Tema</Th>
                <Th>Data</Th>
                <Th>Sesi</Th>
                <Th>Selesai</Th>
                <Th>Rata-rata skor</Th>
                <Th>Distribusi 0 / 1 / 2</Th>
              </tr>
            </thead>
            <tbody>
              {(Object.entries(summary.byEpisode || {}).length
                ? Object.entries(summary.byEpisode || {})
                : Object.entries(EMPTY_SUMMARY.byEpisode || {})
              ).map(([id, v]) => (
                <tr key={id}>
                  <td style={styles.tdMono}>{id}</td>
                  <td style={styles.td}>{v.tema}</td>
                  <td style={styles.td}>{v.rows}</td>
                  <td style={styles.td}>{v.sessions}</td>
                  <td style={styles.td}>{v.completedSessions}</td>
                  <td style={styles.td}>{v.skorMean === null ? "—" : v.skorMean.toFixed(2)}</td>
                  <td style={styles.td}>
                    <span style={{ color: C.red, fontWeight: 700 }}>{v.skorCounts[0] ?? 0}</span> /{" "}
                    <span style={{ color: C.amber, fontWeight: 700 }}>{v.skorCounts[1] ?? 0}</span> /{" "}
                    <span style={{ color: C.teal, fontWeight: 700 }}>{v.skorCounts[2] ?? 0}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!Object.keys(summary.byEpisode || {}).length && (
          <p style={styles.emptyHint}>Belum ada ringkasan — data episode belum masuk.</p>
        )}

        {/* Riwayat */}
        <div style={styles.sectionRow}>
          <SectionTitle>Riwayat jawaban</SectionTitle>
          <input
            style={{ ...styles.input, width: 240 }}
            placeholder="🔍 Cari di tabel…"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>
        <p style={styles.hintLine}>Menampilkan hingga 200 baris terakhir (terbaru di atas).</p>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <Th>Waktu</Th>
                <Th>Sesi</Th>
                <Th>Episode</Th>
                <Th>Adegan</Th>
                <Th>Pilihan</Th>
                <Th>Skor</Th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 && (
                <tr>
                  <td style={styles.td} colSpan={6}>
                    <div style={styles.emptyBlock}>
                      <div style={styles.emptyEmoji}>🕊️</div>
                      Belum ada data jawaban. Selesaikan satu episode di aplikasi konseling untuk mulai mengumpulkan data.
                    </div>
                  </td>
                </tr>
              )}
              {visibleRows.map((r, i) => (
                <tr key={`${r.receivedAt}-${i}`}>
                  <td style={styles.tdMuted}>{fmtTime(r.receivedAt)}</td>
                  <td style={styles.tdMono}>{r.sessionId}</td>
                  <td style={styles.td}>
                    {r.tema} <span style={{ color: C.muted }}>({r.episodeId})</span>
                  </td>
                  <td style={styles.td}>
                    <SceneBadge type={r.jenisScene} item={r.nomorItem} no={r.sceneNo} />
                  </td>
                  <td style={styles.td}>{r.labelPilihan}</td>
                  <td style={styles.td}>{r.skor === null ? <span style={{ color: C.muted }}>—</span> : <span style={skorChip(r.skor)}>{r.skor}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Card({ icon, label, value, tone }) {
  return (
    <div style={styles.card}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 11,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          background: `${tone}1f`,
          border: `1px solid ${tone}55`,
        }}
      >
        {icon}
      </div>
      <div style={styles.cardRight}>
        <div style={styles.cardValue}>{value}</div>
        <div style={styles.cardLabel}>{label}</div>
      </div>
    </div>
  );
}

const SCENE_LABELS = {
  opening: "Pembuka",
  dialog: "Dialog",
  decision: "Keputusan",
  consequence: "Konsekuensi",
  refleksi_kiai: "Renungan Kiai",
  refleksi_diri: "Refleksi Diri",
  transfer: "Situasimu",
  penutup: "Penutup",
};

function SceneBadge({ type, item, no }) {
  const label = SCENE_LABELS[type] || type || "?";
  const itemTxt = item !== null && item !== undefined ? ` #${item + 1}` : "";
  return (
    <span style={{ color: C.muted, fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          padding: "2px 8px",
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          color: C.blue,
          background: "rgba(111,168,255,0.12)",
          border: "1px solid rgba(111,168,255,0.3)",
        }}
      >
        {label}
        {itemTxt}
      </span>
      {no ? <span>S{no}</span> : null}
    </span>
  );
}

function SectionTitle({ children }) {
  return <h3 style={styles.sectionTitle}>{children}</h3>;
}

function Th({ children }) {
  return <th style={styles.th}>{children}</th>;
}

const baseTableCell = { padding: "10px 14px", borderBottom: "1px solid rgba(145,175,205,0.09)", verticalAlign: "top" };

const styles = {
  // ---------- Shared ----------
  input: {
    padding: "10px 12px",
    fontSize: 13.5,
    color: C.text,
    background: "rgba(8,12,17,0.65)",
    border: `1px solid ${C.line}`,
    borderRadius: 10,
    outline: "none",
    transition: "border .2s",
  },
  primaryBtn: {
    padding: "12px 20px",
    fontSize: 14,
    fontWeight: 700,
    color: "#15100A",
    background: C.gold,
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    transition: "filter .2s, transform .15s",
  },
  loginDivider: {
    height: 1,
    margin: "18px 0 12px",
    background: "linear-gradient(90deg, transparent, rgba(145,175,205,0.3), transparent)",
  },
  backLink: {
    display: "block",
    width: "100%",
    textAlign: "center",
    background: "none",
    border: "none",
    color: C.muted,
    cursor: "pointer",
    fontSize: 13,
    padding: "8px 4px",
    transition: "color .2s",
  },
  ghostBtn: {
    padding: "8px 13px",
    fontSize: 12.5,
    color: C.text,
    background: "rgba(145,175,205,0.08)",
    border: `1px solid ${C.line}`,
    borderRadius: 9,
    cursor: "pointer",
    transition: "border .2s, background .2s",
  },
  dangerBtn: {
    padding: "8px 13px",
    fontSize: 12.5,
    color: "#FFC4C4",
    background: "rgba(229,105,106,0.1)",
    border: "1px solid rgba(229,105,106,0.4)",
    borderRadius: 9,
    cursor: "pointer",
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: C.gold,
    cursor: "pointer",
    fontSize: 13,
    textDecoration: "underline dotted rgba(231,200,126,0.5)",
    textUnderlineOffset: 3,
    padding: "8px 4px",
  },
  fieldLabel: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
    fontSize: 12.5,
    color: C.muted,
    marginTop: 14,
  },
  passWrap: { position: "relative" },
  passToggle: {
    position: "absolute",
    right: 6,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: C.gold,
    fontSize: 12,
    cursor: "pointer",
    padding: "6px 8px",
  },
  alert: {
    marginTop: 14,
    padding: "10px 12px",
    fontSize: 13,
    borderRadius: 9,
    color: "#FFC4C4",
    background: "rgba(229,105,106,0.12)",
    border: "1px solid rgba(229,105,106,0.35)",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  alertDot: { width: 8, height: 8, borderRadius: 999, background: C.red, flexShrink: 0 },

  // ---------- Login ----------
  loginBg: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    display: "grid",
    gridTemplateColumns: "minmax(340px, 5fr) minmax(340px, 4fr)",
    background: `radial-gradient(120% 120% at 15% 0%, #16222F 0%, #0B0F14 55%, #07090D 100%)`,
    color: C.text,
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  },
  loginAside: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "clamp(28px, 5vh, 60px)",
    overflow: "hidden",
  },
  brand: { display: "flex", alignItems: "center", gap: 14 },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    color: "#1B150C",
    background: "linear-gradient(160deg, #F0D590, #C9A24A)",
    boxShadow: "0 8px 24px rgba(231,200,126,0.25)",
  },
  brandTitle: { margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "0.01em" },
  brandSub: { margin: "2px 0 0", fontSize: 12.5, color: C.muted, letterSpacing: "0.04em" },
  quote: {
    margin: "auto 0",
    maxWidth: 440,
    fontSize: "clamp(18px, 2.6vw, 26px)",
    lineHeight: 1.5,
    color: "#F5E9D2",
    fontStyle: "italic",
    fontFamily: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif',
  },
  asideMeta: { display: "flex", gap: 8, fontSize: 12, color: C.muted, flexWrap: "wrap" },
  loginMain: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loginCard: {
    width: "100%",
    maxWidth: 410,
    padding: "30px 30px 22px",
    background: "rgba(19,26,36,0.9)",
    border: `1px solid ${C.lineStrong}`,
    borderRadius: 16,
    boxShadow: "0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.3)",
    backdropFilter: "blur(8px)",
  },
  h2: { margin: 0, fontSize: 21, fontWeight: 800 },
  hint: { margin: "6px 0 4px", fontSize: 13.5, color: C.muted, lineHeight: 1.55 },

  // ---------- Dashboard ----------
  dashBg: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    overflow: "auto",
    background: `radial-gradient(130% 120% at 85% -10%, #16222F 0%, #0B0F14 50%, #07090D 100%)`,
    color: C.text,
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 5,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
    padding: "14px 26px",
    background: "rgba(19,26,36,0.85)",
    borderBottom: `1px solid ${C.line}`,
    backdropFilter: "blur(12px)",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  headerMark: {
    width: 38,
    height: 38,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 19,
    color: "#1B150C",
    background: "linear-gradient(160deg, #F0D590, #C9A24A)",
  },
  headerTitle: { fontSize: 16, fontWeight: 800 },
  headerSub: { fontSize: 11.5, color: C.muted, marginTop: 1 },
  headerActions: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  dashBody: { maxWidth: 1120, margin: "0 auto", padding: "22px 26px 60px" },
  errorBanner: {
    marginBottom: 16,
    padding: "12px 16px",
    fontSize: 13.5,
    borderRadius: 10,
    color: "#FFC4C4",
    background: "rgba(229,105,106,0.1)",
    border: "1px solid rgba(229,105,106,0.35)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  filterBar: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
    padding: "14px 16px",
    borderRadius: 12,
    background: "rgba(19,26,36,0.6)",
    border: `1px solid ${C.line}`,
    margin: "18px 0",
  },
  filterArrow: { color: C.muted, fontSize: 14 },
  cards: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, margin: "18px 0 8px" },
  card: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "16px 18px",
    borderRadius: 14,
    background: "rgba(19,26,36,0.7)",
    border: `1px solid ${C.line}`,
    boxShadow: "0 10px 26px rgba(0,0,0,0.25)",
  },
  cardRight: { display: "flex", flexDirection: "column", gap: 2 },
  cardValue: { fontSize: 28, fontWeight: 800, lineHeight: 1, color: C.text },
  cardLabel: { fontSize: 11.5, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 },
  sectionTitle: { margin: "24px 0 10px", fontSize: 15.5, fontWeight: 800, color: "#EAF1F8" },
  sectionRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" },
  hintLine: { color: C.muted, fontSize: 12, margin: "2px 0 12px" },
  emptyHint: { color: C.muted, fontSize: 12.5, marginTop: 8 },
  emptyBlock: {
    padding: "34px 20px",
    textAlign: "center",
    color: C.muted,
    fontSize: 13.5,
    lineHeight: 1.6,
  },
  emptyEmoji: { fontSize: 30, marginBottom: 8 },
  tableWrap: {
    overflowX: "auto",
    borderRadius: 12,
    border: `1px solid ${C.line}`,
    background: "rgba(13,18,25,0.85)",
    boxShadow: "0 10px 26px rgba(0,0,0,0.25)",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    textAlign: "left",
    padding: "11px 14px",
    fontSize: 10.5,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    color: C.muted,
    borderBottom: `1px solid ${C.line}`,
    whiteSpace: "nowrap",
    background: "rgba(255,255,255,0.02)",
  },
  td: baseTableCell,
  tdMono: { ...baseTableCell, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12 },
  tdMuted: { ...baseTableCell, color: C.muted, fontSize: 12, whiteSpace: "nowrap" },
};

/* Hover baris tabel */
const hoverStyle = `tr:hover td { background: rgba(111,168,255,0.05); }`;
if (typeof document !== "undefined" && !document.getElementById("riset-table-hover")) {
  const el = document.createElement("style");
  el.id = "riset-table-hover";
  el.textContent = hoverStyle;
  document.head.appendChild(el);
}