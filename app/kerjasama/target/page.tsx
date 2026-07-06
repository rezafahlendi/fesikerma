"use client";

import { apiFetch } from "@/lib/api";
import { useState, useMemo, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CloseButton } from "@/components/ui/close-button";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";

type TargetKerjasama = {
  id: string;
  tahun: number;
  mou: number;
  moa: number;
  ia: number;
  aktif: number;
  perpanjangan: number;
  kadaluarsa: number;
  tidakAktif: number;
  status: string;
};

export default function TargetKerjasamaPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TargetKerjasama[]>([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<TargetKerjasama | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TargetKerjasama | null>(null);
  const [showSuccess, setShowSuccess] = useState<null | "add" | "edit" | "delete">(null);

  const [newTarget, setNewTarget] = useState({
    tahun: new Date().getFullYear(),
    mou: 0, moa: 0, ia: 0,
    aktif: 0, perpanjangan: 0, kadaluarsa: 0, tidakAktif: 0,
  });

  useEffect(() => {
    document.title = "SIKERMA - Target Kerjasama";
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const json = await apiFetch("/target-kerjasama");
      if (Array.isArray(json)) setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter((item) =>
      `${item.tahun} ${item.status}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, data]);

  const totalPages = Math.ceil(filteredData.length / limit);
  const paginatedData = filteredData.slice((page - 1) * limit, page * limit);
  const startEntry = filteredData.length === 0 ? 0 : (page - 1) * limit + 1;
  const endEntry = Math.min(page * limit, filteredData.length);

  useEffect(() => { setPage(1); }, [search, limit]);

  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    return [1, 2, 3, "...", totalPages];
  };

  useEffect(() => {
    if (showSuccess) {
      const t = setTimeout(() => setShowSuccess(null), 2500);
      return () => clearTimeout(t);
    }
  }, [showSuccess]);

  useEffect(() => {
    document.body.style.overflow = (showAddModal || showEditModal || !!deleteTarget) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showAddModal, showEditModal, deleteTarget]);

  const handleSaveAdd = async () => {
    try {
      const res = await apiFetch("/target-kerjasama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTarget),
      });
      if (!res.ok) throw new Error();
      setShowAddModal(false);
      setShowSuccess("add");
      setNewTarget({ tahun: new Date().getFullYear(), mou: 0, moa: 0, ia: 0, aktif: 0, perpanjangan: 0, kadaluarsa: 0, tidakAktif: 0 });
      fetchData();
    } catch {
      alert("Gagal menyimpan data");
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedTarget) return;
    try {
      const res = await apiFetch(`/target-kerjasama/${selectedTarget.id}`, {
  method: "PUT",
  body: JSON.stringify(selectedTarget),
});
      if (!res.ok) throw new Error();
      setShowEditModal(false);
      setSelectedTarget(null);
      setShowSuccess("edit");
      fetchData();
    } catch {
      alert("Gagal memperbarui data");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await apiFetch(`/target-kerjasama/${deleteTarget.id}`, {method: "DELETE",});
      if (!res.ok) throw new Error();
      setData((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
      setShowSuccess("delete");
    } catch {
      alert("Gagal menghapus data");
    }
  };

  const fields: [string, keyof TargetKerjasama][] = [
    ["Target Tahun", "tahun"],
    ["Jumlah MoU", "mou"],
    ["Jumlah MoA", "moa"],
    ["Jumlah IA", "ia"],
    ["Dokumen Aktif", "aktif"],
    ["Dok. Kadaluarsa", "kadaluarsa"],
    ["Dok. Perpanjangan", "perpanjangan"],
    ["Dok. Tidak Aktif", "tidakAktif"],
  ];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} onExpandChange={setSidebarExpanded} />

      <div className={cn("relative transition-all duration-300", "ml-0", sidebarExpanded ? "md:ml-64" : "md:ml-[72px]")}>
        <div className="flex flex-col min-h-screen">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

              {/* HEADER */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold">Target Kerjasama</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">Pengaturan target tahunan capaian kerjasama</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>

              {/* INFO */}
              <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                <strong>Informasi!</strong> Target kerjasama diisi setiap tahun dan dapat diubah sebelum data terkirim.
              </div>

              {/* CARD TABLE */}
              <div className="rounded-lg border bg-card">
                <div className="p-4 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>Show</span>
                    <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="border rounded px-2 py-1">
                      <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
                    </select>
                    <span>entries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Search:</span>
                    <input value={search} onChange={(e) => setSearch(e.target.value)} className="border rounded px-2 py-1" placeholder="Cari tahun..." />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 border-b-2 border-primary/30">
                      <tr>
                        <th rowSpan={2} className="px-3 py-3 text-left font-semibold">No</th>
                        <th rowSpan={2} className="px-3 py-3 text-left font-semibold">Tahun</th>
                        <th colSpan={3} className="px-3 py-3 text-center font-semibold border-l">Jenis Kerjasama</th>
                        <th colSpan={4} className="px-3 py-3 text-center font-semibold border-l">Status Kerjasama</th>
                        <th rowSpan={2} className="px-3 py-3 text-left font-semibold border-l">Status</th>
                        <th rowSpan={2} className="px-3 py-3 text-center font-semibold border-l">Action</th>
                      </tr>
                      <tr className="border-b border-primary/20">
                        <th className="px-3 py-2 text-center font-medium text-muted-foreground">MoU</th>
                        <th className="px-3 py-2 text-center font-medium text-muted-foreground">MoA</th>
                        <th className="px-3 py-2 text-center font-medium text-muted-foreground">IA</th>
                        <th className="px-3 py-2 text-center font-medium text-muted-foreground">Aktif</th>
                        <th className="px-3 py-2 text-center font-medium text-muted-foreground">Perpanjangan</th>
                        <th className="px-3 py-2 text-center font-medium text-muted-foreground">Kadaluarsa</th>
                        <th className="px-3 py-2 text-center font-medium text-muted-foreground">Tidak Aktif</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={12} className="py-10 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-6 h-6 animate-spin text-primary" />
                              <p className="text-sm text-muted-foreground">Memuat data...</p>
                            </div>
                          </td>
                        </tr>
                      ) : paginatedData.length === 0 ? (
                        <tr><td colSpan={12} className="text-center py-10 text-muted-foreground">No data available in table</td></tr>
                      ) : paginatedData.map((item, index) => (
                        <tr key={item.id} className="border-b hover:bg-muted/20 transition-colors">
                          <td className="px-3 py-2">{(page - 1) * limit + index + 1}</td>
                          <td className="px-3 py-2 font-semibold">{item.tahun}</td>
                          <td className="px-3 py-2 text-center">{item.mou}</td>
                          <td className="px-3 py-2 text-center">{item.moa}</td>
                          <td className="px-3 py-2 text-center">{item.ia}</td>
                          <td className="px-3 py-2 text-center text-green-600 font-medium">{item.aktif}</td>
                          <td className="px-3 py-2 text-center text-blue-600 font-medium">{item.perpanjangan}</td>
                          <td className="px-3 py-2 text-center text-yellow-600 font-medium">{item.kadaluarsa}</td>
                          <td className="px-3 py-2 text-center text-orange-600 font-medium">{item.tidakAktif}</td>
                          <td className="px-3 py-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.status === "Open" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            {item.status === "Open" ? (
                              <div className="flex gap-1 justify-center">
                                <Button size="sm" variant="outline" onClick={() => { setSelectedTarget(item); setShowEditModal(true); }}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(item)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-green-600 text-xs font-medium">Terkirim</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* FOOTER PAGINATION */}
                <div className="p-4 flex items-center justify-between text-sm">
                  <span>Showing {startEntry} to {endEntry} of {filteredData.length} entries</span>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                    {getPageNumbers().map((p, i) =>
                      p === "..." ? <span key={i} className="px-2">...</span> :
                        <Button key={i} size="sm" variant={p === page ? "default" : "outline"} onClick={() => setPage(p as number)}>{p}</Button>
                    )}
                    <Button size="sm" variant="outline" disabled={page === totalPages || totalPages === 0} onClick={() => setPage((p) => p + 1)}>Next</Button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* MODAL ADD */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <h2 className="text-base font-semibold">Buat Target Tahunan</h2>
              <CloseButton onClick={() => setShowAddModal(false)} />
            </div>
            <div className="px-6 py-4 text-sm overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map(([label, key]) => (
                  <div key={key} className="space-y-1">
                    <label className="font-medium text-muted-foreground">{label} <span className="text-red-500">*</span></label>
                    <input type="number" value={(newTarget as any)[key]} onChange={(e) => setNewTarget((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                      className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t shrink-0 bg-background">
              <Button variant="destructive" onClick={() => setShowAddModal(false)}>Close</Button>
              <Button variant="default" onClick={handleSaveAdd}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT */}
      {showEditModal && selectedTarget && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <h2 className="text-base font-semibold">Edit Target Tahunan</h2>
              <CloseButton onClick={() => { setShowEditModal(false); setSelectedTarget(null); }} />
            </div>
            <div className="px-6 py-4 text-sm overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map(([label, key]) => (
                  <div key={key} className="space-y-1">
                    <label className="font-medium text-muted-foreground">{label} <span className="text-red-500">*</span></label>
                    <input type="number" value={(selectedTarget as any)[key]} onChange={(e) => setSelectedTarget((prev) => prev ? { ...prev, [key]: Number(e.target.value) } : prev)}
                      className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t shrink-0 bg-background">
              <Button variant="destructive" onClick={() => { setShowEditModal(false); setSelectedTarget(null); }}>Close</Button>
              <Button variant="default" onClick={handleSaveEdit}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DELETE CONFIRM */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm text-center space-y-4 shadow-lg">
            <div className="flex justify-center"><Trash2 className="w-10 h-10 text-red-600" /></div>
            <p className="text-base font-semibold text-red-600">Hapus Data</p>
            <p className="text-sm text-muted-foreground">
              Hapus target tahun <b>{deleteTarget.tahun}</b>? Data yang dihapus tidak dapat dikembalikan.
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
              <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUCCESS */}
      {showSuccess && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm text-center space-y-4 shadow-lg">
            <div className="text-green-600 text-4xl">✓</div>
            <h3 className="text-base font-semibold">Berhasil</h3>
            <p className="text-sm text-muted-foreground">
              {showSuccess === "add" ? "Target tahunan berhasil ditambahkan." :
               showSuccess === "edit" ? "Target tahunan berhasil diperbarui." :
               "Target tahunan berhasil dihapus."}
            </p>
            <Button className="w-full" onClick={() => setShowSuccess(null)}>OK</Button>
          </div>
        </div>
      )}
    </div>
  );
}