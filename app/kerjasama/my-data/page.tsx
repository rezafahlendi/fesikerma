"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { Download, List, Trash2, Pencil } from "lucide-react";
import { RefreshCcw, Plus, ArrowLeft, X } from "lucide-react";

/* ================= TYPES ================= */

type RepositoryDoc = {
  id: string;
  jenis: string;
  nomor: string;
  judul: string;
  tglMulai: string;
  status: string;

  periode?: string;
  deskripsi?: string;
  dasarDokumen?: string;
  unitPelaksana?: string;
  penanggungJawab?: string;
  unitPenanggungJawab?: string;
  sumberDana?: string;
  anggaran?: string;
  bentukKegiatan?: string;
  paraPenggiat?: string;
  skala?: string;
};

/* ================= DUMMY DATA ================= */

const DUMMY_DATA: RepositoryDoc[] = [
  {
    id: "1",
    jenis: "IA",
    nomor: "122/UN26.32/TI.00.03/2019",
    judul:
      "Fasilitasi Pelaksanaan Tes Tertulis Dengan Metode Computer Assisted Test (CAT) Seleksi Calon Anggota KPU Kabupaten/Kota Di Provinsi Lampung Periode 2019–2024",
    tglMulai: "11/09/2019",
    status: "Tidak Aktif",
    periode: "11-09-2019 s.d 12-09-2019",
    deskripsi:
      "Memfasilitasi pelaksanaan tes metode CAT di Gedung/Laboratorium UPT.TIK",
    dasarDokumen: "Tidak ada",
    unitPelaksana: "1. UN26.14 | N | UPA Teknologi Informasi dan Komunikasi",
    sumberDana: "Dinas Provinsi",
    anggaran: "0,00",
    paraPenggiat:
      "Pihak Ke-1 | KPU Provinsi Lampung | Drs. Amrozie W. M.M\n" +
      "Pihak Ke-2 | Universitas Lampung | Dr. Ing. Ardian Ulvan, S.T., M.Sc",
    skala: "",
  },
];

/* ================= STATUS BADGE ================= */

function StatusBadge({ status }: { status: string }) {
  const isActive = status.toLowerCase() === "aktif";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        isActive
          ? "bg-green-600 text-white border border-green-600"
          : "bg-gray-600 text-white border border-gray-600",
      )}
    >
      {status}
    </span>
  );
}

/* ================= PAGE ================= */

export default function MyRepositoryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<RepositoryDoc | null>(null);
  const [data, setData] = useState<RepositoryDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  const [deleteDoc, setDeleteDoc] = useState<RepositoryDoc | null>(null);
  useEffect(() => {
    document.title = "SIKERMA - My Repository";
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const json = await apiFetch("/repository/mydata");
      setData(Array.isArray(json) ? json : []);
    } catch (error) {
      console.error("Gagal mengambil repository my-data", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (doc: RepositoryDoc) => {
    alert(`Download dokumen: ${doc.nomor}`);
  };

  const handleDelete = async () => {
    if (!deleteDoc) return;

    try {
      await apiFetch(`/repository/${deleteDoc.id}`, { method: "DELETE" });
      setData((prev) => prev.filter((item) => item.id !== deleteDoc.id));
      setDeleteDoc(null);
    } catch (error) {
      console.error("Gagal menghapus repository", error);
      alert("Gagal menghapus dokumen");
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

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        onExpandChange={setSidebarExpanded}
      />

      <div
        className={cn(
          "relative transition-all duration-300",
          sidebarExpanded ? "md:ml-64" : "md:ml-[72px]",
        )}
      >
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* HEADER */}
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold">My Repository</h1>

              <div className="flex gap-2">
                <Link href="/kerjasama/repository/create">
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </Link>
              </div>
            </div>

            {/* TABLE CARD */}
            <div className="rounded-lg border bg-card">
              {/* CONTROLS */}
              <div className="flex items-center justify-between p-4 text-sm">
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
                      <th className="px-3 py-2 text-center">Tgl. Mulai</th>
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
                      <tr
                        key={item.id}
                        className="border-b hover:bg-muted/40 transition-colors"
                      >
                        <td className="px-3 py-2 text-center">
                          {(page - 1) * limit + index + 1}
                        </td>
                        <td className="px-3 py-2 text-center">{item.jenis}</td>
                        <td className="px-3 py-2 text-center">{item.nomor}</td>
                        <td className="px-3 py-2 max-w-xl">{item.judul}</td>
                        <td className="px-3 py-2 text-center">
                          {item.tglMulai}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex justify-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              title="Download Dokumen"
                              onClick={() => handleDownload(item)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              title="Detail"
                              onClick={() => setSelectedDoc(item)}
                            >
                              <List className="w-4 h-4" />
                            </Button>

                            <Link href={`/kerjasama/repository/edit/${item.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                title="Edit Dokumen"
                                className="
      group
      border-blue-200
      hover:bg-blue-600 hover:border-blue-600
      transition-colors
    "
                              >
                                <Pencil
                                  className="
        w-4 h-4
        text-black
        group-hover:text-white  
        transition-colors
      "
                                />
                              </Button>
                            </Link>

                            <Button
                              size="sm"
                              variant="outline"
                              title="Hapus Dokumen"
                              onClick={() => setDeleteDoc(item)}
                              className="
                              group
                              border-red-200
                              hover:bg-red-600 hover:border-red-600
                              transition-colors
                            "
                            >
                              <Trash2
                                className="
                                w-4 h-4
                                text-black
                                group-hover:text-white
                                transition-colors
                              "
                              />
                            </Button>
                          </div>
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

                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>

                  <Button size="sm" variant="default">
                    {page}
                  </Button>

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
                ["Dasar Dokumen", selectedDoc.dasarDokumen],
                ["Unit Pelaksana", selectedDoc.unitPelaksana],
                ["Penanggung Jawab", selectedDoc.penanggungJawab],
                ["Unit Penanggungjawab", selectedDoc.unitPenanggungJawab],
                ["Sumber Dana", selectedDoc.sumberDana],
                ["Anggaran", selectedDoc.anggaran],
                ["Bentuk Kegiatan", selectedDoc.bentukKegiatan],
                ["Para Penggiat", selectedDoc.paraPenggiat],
                ["Skala", selectedDoc.skala],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-[170px_1fr] gap-4 py-2 border-b border-muted"
                >
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-foreground leading-relaxed whitespace-pre-line">
                    {value || "-"}
                  </span>
                </div>
              ))}

              {/* DOWNLOAD */}
              <div className="grid grid-cols-[170px_1fr] gap-4 py-4 border-b border-muted">
                <span className="text-muted-foreground">Download File</span>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline">
                    📄 File Dokumen
                  </Button>
                  <Button size="sm" variant="outline">
                    🔗 Link Dokumen
                  </Button>
                  <Button size="sm" variant="outline">
                    📑 Kontrak
                  </Button>
                  <Button size="sm" variant="outline">
                    📘 KAK
                  </Button>
                  <Button size="sm" variant="outline">
                    📊 RAB
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM (OPSIONAL) */}
      {deleteDoc && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm space-y-4">
            <h3 className="text-sm font-semibold text-red-600">
              Hapus Dokumen
            </h3>
            <p className="text-sm">
              Yakin ingin menghapus dokumen:
              <br />
              <b>{deleteDoc.nomor}</b>?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteDoc(null)}>
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
