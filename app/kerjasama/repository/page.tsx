"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import {
  RefreshCcw,
  Plus,
  ArrowLeft,
  Download,
  X,
  List,
  Link as LinkIcon,
  FileText,
  FileCheck,
  FileSpreadsheet,
} from "lucide-react";

/* ================= TYPES ================= */

type RepositoryDoc = {
  id: string;
  jenis: string;
  nomor: string;
  judul: string;
  expired: string;
  status: string;
  periode: string;
  deskripsi: string;
  unitPelaksana: string;
  penanggungJawab: string;
  sumberDana: string;
  anggaran: string;
  bentukKegiatan: string;
  skala: string;
  paraPenggiat: string; // ⬅️ TAMBAHAN
};

/* ================= PAGE ================= */

export default function RepositoryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  const [data, setData] = useState<RepositoryDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<RepositoryDoc | null>(null);
  useEffect(() => {
    document.title = "SIKERMA - Repository";
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const json = await apiFetch("/repository");
      setData(Array.isArray(json) ? json : []);
    } catch (error) {
      console.error("Gagal mengambil repository", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILTER ================= */

  const filteredData = useMemo(() => {
    return data.filter((item) =>
      `${item.jenis} ${item.nomor} ${item.judul} ${item.status}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }, [search, data]);

  const totalPages = Math.ceil(filteredData.length / limit);

  const paginatedData = filteredData.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    setPage(1);
  }, [search, limit]);

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    return [1, 2, 3, "...", totalPages];
  };

  return (
    <div className="min-h-screen bg-background">
      {/* SIDEBAR */}
      <Sidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        onExpandChange={setSidebarExpanded}
      />

      {/* CONTENT */}
      <div
        className={cn(
          "relative transition-all duration-300",
          "ml-0",
          sidebarExpanded ? "md:ml-64" : "md:ml-[72px]",
        )}
      >
        <div className="flex flex-col min-h-screen">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* TITLE */}
              <div className="flex items-center justify-between">
                <h1 className="text-xl md:text-2xl font-bold">
                  Repository Dokumen
                </h1>

                <div className="flex gap-2">
                  <Link href="/kerjasama/repository/create">
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </Link>
                </div>
              </div>

              {/* CARD */}
              <div className="rounded-lg border bg-card">
                {/* CONTROLS */}
                <div className="p-4 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>Show</span>
                    <select
                      value={limit}
                      onChange={(e) => setLimit(Number(e.target.value))}
                      className="border rounded px-2 py-1"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <span>entries</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span>Search:</span>
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="border rounded px-2 py-1"
                      placeholder="Cari dokumen..."
                    />
                  </div>
                </div>

                {/* TABLE */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-t">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="px-3 py-2 text-center">No</th>
                        <th className="px-3 py-2 text-center">Jenis</th>
                        <th className="px-3 py-2 text-center">Nomor Dokumen</th>
                        <th className="px-3 py-2 text-center">Judul Kegiatan</th>
                        <th className="px-3 py-2 text-center">Expired Date</th>
                        <th className="px-3 py-2 text-center">Status</th>
                        <th className="px-3 py-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-3 py-10 text-center text-muted-foreground"
                          >
                            Memuat data repository...
                          </td>
                        </tr>
                      ) : paginatedData.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-3 py-10 text-center text-muted-foreground"
                          >
                            No data available in table
                          </td>
                        </tr>
                      ) : (
                        paginatedData.map((item, index) => (
                        <tr key={item.id} className="border-b">
                          <td className="px-3 py-2 text-center">
                            {(page - 1) * limit + index + 1}
                          </td>
                          <td className="px-3 py-2 text-center">{item.jenis}</td>
                          <td className="px-3 py-2 text-center">{item.nomor}</td>
                          <td className="px-3 py-2 text-center">{item.judul}</td>
                          <td className="px-3 py-2 text-center">{item.expired}</td>
                          <td className="px-3 py-2 text-center">
                            <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">
                              {item.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 flex gap-1 justify-center">
                            {/* DETAIL */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedDoc(item)}
                            >
                              <List className="w-4 h-4" />
                            </Button>

                            {/* DOWNLOAD */}
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* FOOTER */}
                <div className="p-4 flex items-center justify-between text-sm">
                  <span>
                    Showing {(page - 1) * limit + 1} to{" "}
                    {Math.min(page * limit, filteredData.length)} of{" "}
                    {filteredData.length} entries
                  </span>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>

                    {getPageNumbers().map((p, i) =>
                      p === "..." ? (
                        <span key={i} className="px-2">
                          ...
                        </span>
                      ) : (
                        <Button
                          key={i}
                          size="sm"
                          variant={p === page ? "default" : "outline"}
                          onClick={() => setPage(p as number)}
                        >
                          {p}
                        </Button>
                      ),
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page === totalPages || totalPages === 0}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* ================= MODAL DETAIL ================= */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div
            className="
        bg-white rounded-xl shadow-xl
        w-full max-w-2xl
        max-h-[80vh]
        flex flex-col
      "
          >
            {/* HEADER (fixed) */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <h2 className="text-base font-semibold text-foreground">
                Detail Dokumen Kerjasama
              </h2>
              <button
                onClick={() => setSelectedDoc(null)}
                className="
    group
    rounded-sm
    p-1
    transition-colors
    hover:bg-[#0079C4]
  "
              >
                <X
                  className="
      w-4 h-4
      text-muted-foreground
      transition-colors
      group-hover:text-white
    "
                />
              </button>
            </div>

            {/* BODY (scrollable) */}
            <div className="px-6 py-4 text-sm space-y-3 overflow-y-auto">
              {[
                ["Jenis Dokumen", selectedDoc.jenis],
                ["Nomor Dokumen", selectedDoc.nomor],
                ["Judul Kerjasama", selectedDoc.judul],
                ["Status Dokumen", selectedDoc.status],
                ["Periode", selectedDoc.periode],
                ["Deskripsi", selectedDoc.deskripsi],
                ["Unit Pelaksana", selectedDoc.unitPelaksana],
                ["Penanggung Jawab", selectedDoc.penanggungJawab],
                ["Sumber Dana", selectedDoc.sumberDana],
                ["Anggaran", selectedDoc.anggaran],
                ["Bentuk Kegiatan", selectedDoc.bentukKegiatan],
                ["Para Penggiat", selectedDoc.paraPenggiat], // ⬅️ TAMBAHAN
                ["Skala", selectedDoc.skala],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-[170px_1fr] gap-4 py-2 border-b border-muted"
                >
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-foreground leading-relaxed whitespace-pre-line">
                    {value}
                  </span>
                </div>
              ))}

              {/* DOWNLOAD */}
              <div className="grid grid-cols-[170px_1fr] gap-4 py-4 border-b border-muted">
                <span className="text-muted-foreground">Download File</span>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-1" />
                    File Dokumen
                  </Button>
                  <Button size="sm" variant="outline">
                    <LinkIcon className="w-4 h-4 mr-1" />
                    Link Dokumen
                  </Button>
                  <Button size="sm" variant="outline">
                    <FileCheck className="w-4 h-4 mr-1" />
                    Kontrak
                  </Button>
                  <Button size="sm" variant="outline">
                    <FileText className="w-4 h-4 mr-1" />
                    KAK
                  </Button>
                  <Button size="sm" variant="outline">
                    <FileSpreadsheet className="w-4 h-4 mr-1" />
                    RAB
                  </Button>
                </div>
              </div>

              {/* ACTION */}
              <div className="flex justify-center pt-6">
                <Button variant="secondary" className="px-6">
                  Klaim Dokumen Ini?
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
