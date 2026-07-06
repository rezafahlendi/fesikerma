"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, Eye, Loader2, Pencil, X } from "lucide-react";

type StatusValidasi = "Menunggu Validasi" | "Ditolak" | "Tervalidasi" | "Draft";

type DokumenValidasi = {
  id: string;
  nomor: string;
  judul: string;
  tanggal: string;
  status: StatusValidasi;
  unit?: string;
  mitra?: string;
  catatan?: string;
  raw?: any;
};

const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message === "Failed to fetch") {
    return "Backend Laravel belum bisa dihubungi. Pastikan php artisan serve berjalan di http://127.0.0.1:8000.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Terjadi kesalahan saat menghubungi API.";
};

const normalizeStatus = (item: any): StatusValidasi => {
  const status = String(item?.statusDokumen || item?.status || "").toLowerCase();
  const crudStatus = String(item?.crudStatus || "").toLowerCase();

  if (crudStatus === "approved" || status.includes("tervalidasi") || status.includes("disetujui")) {
    return "Tervalidasi";
  }

  if (crudStatus === "rejected" || status.includes("ditolak")) {
    return "Ditolak";
  }

  if (status.includes("draft")) {
    return "Draft";
  }

  return "Menunggu Validasi";
};

const mapDokumen = (item: any): DokumenValidasi => ({
  id: String(item?.id || item?.idKerjasama || ""),
  nomor: item?.nomorDokumen || item?.nomor || "-",
  judul: item?.judulKerjasama || item?.judul || "-",
  tanggal: item?.createdAt || item?.updatedAt || item?.tglMulai || "-",
  status: normalizeStatus(item),
  unit: item?.unitPelaksana,
  mitra: item?.mitra?.namaMitra || item?.mitra?.nama || item?.paraPenggiat,
  catatan: item?.verifNote || item?.catatan,
  raw: item,
});

export default function ValidasiKerjasamaPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DokumenValidasi[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DokumenValidasi | null>(null);

  useEffect(() => {
    document.title = "SIKERMA - Validasi Kerjasama";
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/validasi-kerjasama");
      const items = Array.isArray(response) ? response : [];

      setData(items.map(mapDokumen));
      setApiError(null);
    } catch (error) {
      setData([]);
      setApiError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const showDetail = async (item: DokumenValidasi) => {
    try {
      const response = await apiFetch(`/validasi-kerjasama/${item.id}`);
      setSelectedDoc(mapDokumen(response));
    } catch (error) {
      alert(getApiErrorMessage(error));
    }
  };

  const approve = async (item: DokumenValidasi) => {
    if (!window.confirm(`Setujui dokumen ${item.nomor}?`)) return;

    try {
      const response = await apiFetch(`/validasi-kerjasama/${item.id}/approve`, {
        method: "POST",
        body: JSON.stringify({
          statusDokumen: "Tervalidasi",
        }),
      });
      const mapped = mapDokumen(response);

      setData((prev) => prev.filter((row) => row.id !== mapped.id));
      setSelectedDoc(null);
    } catch (error) {
      alert(getApiErrorMessage(error));
    }
  };

  const reject = async (item: DokumenValidasi) => {
    const catatan = window.prompt(`Catatan penolakan untuk ${item.nomor}:`);

    if (catatan === null) return;

    try {
      const response = await apiFetch(`/validasi-kerjasama/${item.id}/reject`, {
        method: "POST",
        body: JSON.stringify({
          statusDokumen: "Ditolak",
          catatan,
        }),
      });
      const mapped = mapDokumen(response);

      setData((prev) => prev.map((row) => (row.id === mapped.id ? mapped : row)));
      setSelectedDoc(null);
    } catch (error) {
      alert(getApiErrorMessage(error));
    }
  };

  const filteredData = useMemo(() => {
    return data.filter((item) =>
      `${item.nomor} ${item.judul} ${item.status}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [search, data]);

  const totalPages = Math.ceil(filteredData.length / limit);
  const paginatedData = filteredData.slice((page - 1) * limit, page * limit);
  const startEntry = filteredData.length === 0 ? 0 : (page - 1) * limit + 1;
  const endEntry = Math.min(page * limit, filteredData.length);

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
      <Sidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        onExpandChange={setSidebarExpanded}
      />

      <div
        className={cn(
          "relative transition-all duration-300",
          "ml-0",
          sidebarExpanded ? "md:ml-64" : "md:ml-[72px]"
        )}
      >
        <div className="flex flex-col min-h-screen">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-xl md:text-2xl font-bold">
                  Validasi Dokumen
                </h1>
                <Button size="sm" variant="outline" onClick={fetchData}>
                  Refresh
                </Button>
              </div>

              {apiError && (
                <div className="rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                  {apiError}
                </div>
              )}

              <div className="rounded-lg border bg-card">
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
                      type="text"
                      className="border rounded px-2 py-1"
                      placeholder="Cari dokumen..."
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-t">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="px-3 py-2 text-center">No</th>
                        <th className="px-3 py-2 text-center">Nomor Dokumen</th>
                        <th className="px-3 py-2 text-center">Judul Kegiatan</th>
                        <th className="px-3 py-2 text-center">Tgl. Unggah</th>
                        <th className="px-3 py-2 text-center">Status</th>
                        <th className="px-3 py-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-6 h-6 animate-spin text-primary" />
                              <p className="text-sm text-muted-foreground">Memuat data...</p>
                            </div>
                          </td>
                        </tr>
                      ) : paginatedData.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-muted-foreground">
                            Tidak ada data validasi
                          </td>
                        </tr>
                      ) : (
                        paginatedData.map((item, index) => (
                          <tr key={item.id} className="border-b">
                            <td className="px-3 py-2 text-center">
                              {(page - 1) * limit + index + 1}
                            </td>
                            <td className="px-3 py-2 text-center">{item.nomor}</td>
                            <td className="px-3 py-2 text-center">{item.judul}</td>
                            <td className="px-3 py-2 text-center">{item.tanggal}</td>
                            <td className="px-3 py-2 text-center">
                              <StatusBadge status={item.status} />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <div className="flex justify-center gap-2">
                                <Button size="sm" variant="outline" title="Detail Dokumen" onClick={() => showDetail(item)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {item.status === "Ditolak" ? (
                                  <Link href={`/kerjasama/repository/edit/${item.id}`}>
                                    <Button size="sm" variant="outline" title="Edit Dokumen">
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                  </Link>
                                ) : (
                                  <>
                                    <Button size="sm" variant="outline" title="Setujui Dokumen" onClick={() => approve(item)}>
                                      <Check className="w-4 h-4 text-green-600" />
                                    </Button>
                                    <Button size="sm" variant="outline" title="Tolak Dokumen" onClick={() => reject(item)}>
                                      <X className="w-4 h-4 text-red-600" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Showing {startEntry} to {endEntry} of {filteredData.length} entries
                  </span>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
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
                          onClick={() => typeof p === "number" && setPage(p)}
                        >
                          {p}
                        </Button>
                      )
                    )}

                    <Button
                      variant="outline"
                      size="sm"
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

      {selectedDoc && (
        <DetailModal
          item={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onApprove={() => approve(selectedDoc)}
          onReject={() => reject(selectedDoc)}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: StatusValidasi }) {
  const variants: Record<StatusValidasi, string> = {
    "Menunggu Validasi": "bg-yellow-600 text-white",
    Ditolak: "bg-red-600 text-white",
    Tervalidasi: "bg-green-600 text-white",
    Draft: "bg-gray-600 text-white",
  };

  return (
    <span className={cn("px-2 py-0.5 rounded text-xs font-medium", variants[status])}>
      {status}
    </span>
  );
}

function DetailModal({
  item,
  onClose,
  onApprove,
  onReject,
}: {
  item: DokumenValidasi;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-semibold">Detail Validasi Dokumen</h2>
          <button onClick={onClose} className="rounded-sm p-1 hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-3 text-sm">
          <Info label="Nomor Dokumen" value={item.nomor} />
          <Info label="Judul Kegiatan" value={item.judul} />
          <Info label="Tanggal" value={item.tanggal} />
          <Info label="Unit" value={item.unit || "-"} />
          <Info label="Mitra" value={item.mitra || "-"} />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Status</span>
            <StatusBadge status={item.status} />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
          {item.status !== "Ditolak" && (
            <>
              <Button variant="destructive" onClick={onReject}>
                Tolak
              </Button>
              <Button onClick={onApprove}>
                Setujui
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 font-medium">{value}</span>
    </div>
  );
}
