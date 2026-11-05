"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { withBasePath } from "../_lib/constants";

type TcRecord = {
  AgentCode?: string | number | null;
  AgentName?: string | null;
  T_C_Accepted?: string | null;
  FrCode?: string | number | null;
  RegDate?: string | null;
  SrNo?: number;
};

const PAGE_SIZE = 20;

type SortKey =
  | "SrNo"
  | "FrCode"
  | "AgentCode"
  | "AgentName"
  | "RegDate"
  | "T_C_Accepted";

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

function text(value: string | number | null | undefined) {
  return value === null || value === undefined ? "" : value.toString().trim();
}

// Read a column regardless of the casing SQL returns (agentregdate / AgentRegDate)
function pick(row: Record<string, unknown>, name: string) {
  const key = Object.keys(row).find(
    (k) => k.toLowerCase() === name.toLowerCase()
  );
  const value = key ? row[key] : null;
  return value === null || value === undefined ? null : String(value);
}

// Show dates as DD-MM-YYYY
function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${date.getFullYear()}`;
}

function csvCell(value: string) {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export default function TcReportPage() {
  const router = useRouter();
  const [records, setRecords] = useState<TcRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    if (sessionStorage.getItem("fr-admin-authenticated") !== "true") {
      router.replace("/");
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(withBasePath("/api/agents/tc-status/"), {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load data");
      }
      setRecords(
        ((data.records || []) as Record<string, unknown>[]).map((r, i) => ({
          AgentCode: pick(r, "AgentCode"),
          AgentName: pick(r, "AgentName"),
          T_C_Accepted: pick(r, "T_C_Accepted"),
          FrCode: pick(r, "FrCode"),
          RegDate: pick(r, "agentregdate"),
          SrNo: i + 1,
        }))
      );
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return records;
    return records.filter(
      (r) =>
        text(r.AgentCode).toLowerCase().includes(term) ||
        text(r.FrCode).toLowerCase().includes(term) ||
        formatDate(r.RegDate).includes(term) ||
        text(r.AgentName).toLowerCase().includes(term) ||
        text(r.T_C_Accepted).toLowerCase().includes(term)
    );
  }, [records, search]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const factor = sortDir === "asc" ? 1 : -1;
    // Pre-compute sort keys once, then compare with a shared collator (fast)
    return filtered
      .map((row) => ({ row, key: text(row[sortKey]) }))
      .sort((a, b) => factor * collator.compare(a.key, b.key))
      .map((item) => item.row);
  }, [filtered, sortKey, sortDir]);

  function applySort(key: SortKey, dir: "asc" | "desc") {
    setSortKey(key);
    setSortDir(dir);
    setPage(1);
  }

  function handleSort(key: SortKey) {
    applySort(key, sortKey === key && sortDir === "asc" ? "desc" : "asc");
  }

  function sortHeader(key: SortKey, label: string) {
    const active = sortKey === key;
    const ascActive = active && sortDir === "asc";
    const descActive = active && sortDir === "desc";
    return (
      <th
        className="sortableHeader"
        onClick={() => handleSort(key)}
        aria-sort={
          active ? (sortDir === "asc" ? "ascending" : "descending") : "none"
        }
      >
        <span className="sortLabel">
          {label}
          <span className="sortArrows">
            <button
              type="button"
              title="Sort ascending"
              className={`sortArrowBtn ${ascActive ? "arrowActive" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                applySort(key, "asc");
              }}
            >
              ▲
            </button>
            <button
              type="button"
              title="Sort descending"
              className={`sortArrowBtn ${descActive ? "arrowActive" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                applySort(key, "desc");
              }}
            >
              ▼
            </button>
          </span>
        </span>
      </th>
    );
  }

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageRows = sorted.slice(startIndex, startIndex + PAGE_SIZE);

  function exportToExcel() {
    const header = [
      "Sr No",
      "FR Code",
      "Agent Code",
      "Agent Name",
      "Registration Date",
      "T&C Accepted",
    ];
    const lines = sorted.map((r, i) =>
      [
        String(r.SrNo ?? i + 1),
        text(r.FrCode),
        text(r.AgentCode),
        text(r.AgentName),
        formatDate(r.RegDate),
        text(r.T_C_Accepted),
      ]
        .map(csvCell)
        .join(",")
    );
    const csv = "\uFEFF" + [header.join(","), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TC_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="page reportPage">
      <section className="card reportCard">
        <div className="reportHeader">
          <div className="cardHeader">
            <h1>T&amp;C Acceptance Report</h1>
            <p>Agent-wise Terms &amp; Conditions acceptance status</p>
          </div>
          <div className="reportActions">
            <button
              type="button"
              className="submitButton"
              onClick={exportToExcel}
              disabled={loading || filtered.length === 0}
            >
              Export to Excel
            </button>
          </div>
        </div>

        <div className="reportToolbar">
          <input
            className="reportSearch"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by FR Code, Agent Code, Name, Date or Status"
          />
          <span className="reportCount">
            Total Records: <strong>{filtered.length}</strong>
          </span>
        </div>

        {error && <div className="errorBox">{error}</div>}

        <div className="tableWrap">
          <table className="reportTable">
            <thead>
              <tr>
                {sortHeader("SrNo", "Sr No")}
                {sortHeader("FrCode", "FR Code")}
                {sortHeader("AgentCode", "Agent Code")}
                {sortHeader("AgentName", "Agent Name")}
                {sortHeader("RegDate", "Registration Date")}
                {sortHeader("T_C_Accepted", "T&C Accepted")}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="tableMessage">
                    Loading data...
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="tableMessage">
                    No records found
                  </td>
                </tr>
              ) : (
                pageRows.map((r, i) => {
                  const accepted = text(r.T_C_Accepted) === "TRUE";
                  return (
                    <tr key={`${text(r.AgentCode)}-${r.SrNo}`}>
                      <td>{r.SrNo}</td>
                      <td>{text(r.FrCode)}</td>
                      <td>{text(r.AgentCode)}</td>
                      <td>{text(r.AgentName)}</td>
                      <td>{formatDate(r.RegDate)}</td>
                      <td>
                        <span
                          className={`statusBadge ${
                            accepted ? "statusYes" : "statusNo"
                          }`}
                        >
                          {accepted ? "TRUE" : "FALSE"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="pagination">
            <button
              type="button"
              className="pageNavButton"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ‹ Previous
            </button>
            <div className="pageCenter">
              <span className="pageCurrent">
                Page {currentPage} of {totalPages}
              </span>
              <span className="pageInfo">
                Showing {startIndex + 1}–
                {Math.min(startIndex + PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length} records
              </span>
            </div>
            <button
              type="button"
              className="pageNavButton"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next ›
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
