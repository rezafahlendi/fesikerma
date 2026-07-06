"use client";

import { apiFetch } from "@/lib/api";
import { useState, useMemo, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CloseButton } from "@/components/ui/close-button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Plus,
  Download,
  Pencil,
  Trash2,
  X,
  Eye,
  Loader2,
} from "lucide-react";

/* ================= TYPES ================= */

type RealisasiKegiatan = {
  id: string;
  repositoryId?: string
  dokumen: string;
  judul: string;
  peserta: string;
  tanggal: string;
  anggaran: number;
  bentuk?: string
  dosen?: string
  mahasiswa?: string
  hasil?: string
  dokumenFile?: any[]
};

const mapRealisasi = (item: any): RealisasiKegiatan => ({
  id: String(item.id),
  repositoryId: item.repositoryId?.toString() || "",
  dokumen: item.repository?.jenisDokumen || item.repository?.jenis || "-",
  judul: item.judulKegiatan || "",
  peserta:
    item.repository?.mitra?.namaMitra ||
    item.repository?.mitra?.nama ||
    item.repository?.paraPenggiat ||
    "-",
  tanggal: item.tanggalKegiatan || "",
  anggaran: Number(item.anggaran || 0),
  bentuk: item.bentukKegiatan || "",
  dosen: String(item.jumlahDosen ?? 0),
  mahasiswa: String(item.jumlahMahasiswa ?? 0),
  hasil: item.hasilKegiatan || "",
  dokumenFile: item.dokumen || [],
});

/* ================= PAGE ================= */

export default function RealisasiKegiatanPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [deleteRealisasi, setDeleteRealisasi] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [fileRealisasi, setFileRealisasi] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [existingDokumen, setExistingDokumen] = useState<any[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [repoOptions, setRepoOptions] = useState<any[]>([])
  const [bentukOptions, setBentukOptions] = useState<string[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showSuccessAdd, setShowSuccessAdd] = useState(false)
  const [showErrorAdd, setShowErrorAdd] = useState(false)
  const [showSuccessUpdate, setShowSuccessUpdate] = useState(false)
  const [showErrorUpdate, setShowErrorUpdate] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const fetchBentukKegiatan = async (repositoryId: string) => {
    if (!repositoryId) {
      setBentukOptions([])
      return
    }

    const list = await apiFetch(`/repository/${repositoryId}/bentuk-kegiatan`)

    if (!Array.isArray(list)) {
      setBentukOptions([])
      return
    }

    setBentukOptions(
      list.map((b: any) => b.bentuk)
    )
  }

  useEffect(() => {
    fetchRepository()
  }, [])

  const fetchRepository = async () => {
    try {
      const list = await apiFetch("/repository/mydata")
      setRepoOptions(Array.isArray(list) ? list : [])
    } catch (error) {
      console.error(error)
      setRepoOptions([])
    }
  }

  useEffect(() => {
    document.title = "SIKERMA - Realisasi Kegiatan";
  }, []);

  const [newRealisasi, setNewRealisasi] = useState({
    repositoryId: "",
    bentuk: "",
    judul: "",
    tanggal: "",
    anggaran: "",
    dosen: "",
    mahasiswa: "",
    hasil: "",
    file: null as File | null
  });

  /* ================= FILTER ================= */

  const [data, setData] = useState<RealisasiKegiatan[]>([]);
  const [loading, setLoading] = useState(true);

  const filteredData = useMemo(() => {
    return data.filter((item) =>
      `${item.dokumen} ${item.judul} ${item.peserta}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }, [search, data]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const json = await apiFetch("/realisasi");

      if (!Array.isArray(json)) {
        console.error("API response bukan array:", json);
        setData([]);
        return;
      }

      setData(json.map(mapRealisasi));

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteRealisasi) return;

    try {
      await apiFetch(`/realisasi/${deleteRealisasi.id}`, {
        method: "DELETE",
      });

      // Optimistic update — hapus dari state langsung
      setData((prev) => prev.filter((r) => r.id !== deleteRealisasi.id));

      setDeleteRealisasi(null);

      // Sync di background
      fetchData();
    } catch (err) {
      alert("Gagal menghapus data");
    }
  };

  const totalPages = Math.ceil(filteredData.length / limit);

  const paginatedData = filteredData.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    setPage(1);
  }, [search, limit]);

  const startEntry = filteredData.length === 0 ? 0 : (page - 1) * limit + 1;
  const endEntry = Math.min(page * limit, filteredData.length);

  /* ================= PAGE NUMBERS ================= */

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
                  Realisasi Kegiatan
                </h1>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null)

                      setNewRealisasi({
                        repositoryId: "",
                        bentuk: "",
                        judul: "",
                        tanggal: "",
                        anggaran: "",
                        dosen: "",
                        mahasiswa: "",
                        hasil: "",
                        file: null
                      })

                      setFileRealisasi(null)
                      setExistingDokumen([])
                      setBentukOptions([])
                      setErrorMessage("")
                      setShowAddModal(true)
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
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
                      placeholder="Cari kegiatan..."
                    />
                  </div>
                </div>

                {/* TABLE */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-t">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="px-3 py-2 w-[60px] text-center">No</th>
                        <th className="px-3 py-2 text-center">Dokumen</th>
                        <th className="px-3 py-2 text-center">Judul Kegiatan</th>
                        <th className="px-3 py-2 text-center">Peserta</th>
                        <th className="px-3 py-2 text-center">Tgl Kegiatan</th>
                        <th className="px-3 py-2 text-center">Anggaran</th>
                        <th className="px-3 py-2 text-center">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-6 h-6 animate-spin text-primary" />
                              <p className="text-sm text-muted-foreground">Memuat data...</p>
                            </div>
                          </td>
                        </tr>
                      ) : paginatedData.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="text-center py-10 text-muted-foreground"
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
                            <td className="px-3 py-2 text-center">{item.dokumen}</td>
                            <td className="px-3 py-2 text-center">{item.judul}</td>
                            <td className="px-3 py-2 text-center">
                              <div>Dosen : {item.dosen}</div>
                              <div>Mahasiswa : {item.mahasiswa}</div>
                            </td>
                            <td className="px-3 py-2 text-center">
                              {item.tanggal ? new Date(item.tanggal).toLocaleDateString("id-ID") : "-"}
                            </td>
                            <td className="px-3 py-2 text-center">
                              Rp {item.anggaran.toLocaleString("id-ID")}
                            </td>
                            <td className="px-3 py-2 text-center flex gap-1 justify-center">
                              <Button size="sm" variant="outline">
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {

                                  setEditingId(item.id)

                                  setShowAddModal(true)

                                  setNewRealisasi({
                                    repositoryId: item.repositoryId || "",
                                    bentuk: item.bentuk || "",
                                    judul: item.judul,
                                    tanggal: item.tanggal,
                                    anggaran: item.anggaran.toString(),
                                    dosen: item.dosen || "",
                                    mahasiswa: item.mahasiswa || "",
                                    hasil: item.hasil || "",
                                    file: null
                                  })

                                  setExistingDokumen(item.dokumenFile || [])
                                  setFileRealisasi(null)
                                  fetchBentukKegiatan(item.repositoryId || "")

                                }}
                              >

                                <Pencil className="w-4 h-4" />

                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                title="Hapus Dokumen"
                                onClick={() => setDeleteRealisasi(item)}
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
                    Showing {startEntry} to {endEntry} of {filteredData.length}{" "}
                    entries
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
      {/* ================= MODAL ADD REALISASI ================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
          <div
            className="
    bg-white rounded-2xl shadow-xl
    w-full max-w-4xl
    h-[85vh]
    flex flex-col
  "
          >
            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <h2 className="text-base font-semibold">
                {editingId ? "Edit Realisasi" : "Tambah Realisasi"}
              </h2>
              <CloseButton onClick={() => setShowAddModal(false)} />
            </div>

            {/* BODY (SCROLLABLE) */}
            <div className="flex-1 overflow-y-auto px-6 py-4 text-sm space-y-4">
              <SearchableSelect
                label="Dokumen Kerjasama"
                size="xs"

                options={repoOptions.map((r: any) => ({
                  label:
                    r.nomorDokumen +
                    " — " +
                    r.judulKerjasama,

                  value: r.id.toString()
                }))}

                value={newRealisasi.repositoryId}

                onChange={(value) => {
                  setNewRealisasi({
                    ...newRealisasi,
                    repositoryId: value as string,
                    bentuk: ""
                  })
                  fetchBentukKegiatan(value as string)
                }}
              />

              <SearchableSelect
                label="Bentuk Kegiatan"
                size="xs"
                options={bentukOptions}
                value={newRealisasi.bentuk}
                disabled={!newRealisasi.repositoryId}
                onChange={(value) =>
                  setNewRealisasi({
                    ...newRealisasi,
                    bentuk: value as string
                  })
                }
              />

              {/* Judul */}
              <div className="space-y-1">
                <label className="font-medium text-muted-foreground">
                  Judul Kegiatan <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="judul kegiatan"
                  value={newRealisasi.judul}
                  onChange={(e) =>
                    setNewRealisasi({ ...newRealisasi, judul: e.target.value })
                  }
                />
              </div>

              {/* Tanggal */}
              <div className="space-y-1">
                <label className="font-medium text-muted-foreground">
                  Tanggal Kegiatan <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border px-3 py-2"
                  value={newRealisasi.tanggal}
                  onChange={(e) =>
                    setNewRealisasi({
                      ...newRealisasi,
                      tanggal: e.target.value,
                    })
                  }
                />
              </div>

              {/* Anggaran */}
              <div className="space-y-1">
                <label className="font-medium text-muted-foreground">
                  Anggaran <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="Rp."
                  value={newRealisasi.anggaran}
                  onChange={(e) =>
                    setNewRealisasi({
                      ...newRealisasi,
                      anggaran: e.target.value,
                    })
                  }
                />
              </div>

              {/* Jumlah Dosen */}
              <div className="space-y-1">
                <label className="font-medium text-muted-foreground">
                  Jumlah Dosen <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="orang"
                  value={newRealisasi.dosen}
                  onChange={(e) =>
                    setNewRealisasi({ ...newRealisasi, dosen: e.target.value })
                  }
                />
              </div>

              {/* Jumlah Mahasiswa */}
              <div className="space-y-1">
                <label className="font-medium text-muted-foreground">
                  Jumlah Mahasiswa <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="orang"
                  value={newRealisasi.mahasiswa}
                  onChange={(e) =>
                    setNewRealisasi({
                      ...newRealisasi,
                      mahasiswa: e.target.value,
                    })
                  }
                />
              </div>

              {/* Hasil */}
              <div className="space-y-1">
                <label className="font-medium text-muted-foreground">
                  Hasil Kegiatan <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="hasil kegiatan"
                  value={newRealisasi.hasil}
                  onChange={(e) =>
                    setNewRealisasi({ ...newRealisasi, hasil: e.target.value })
                  }
                />
              </div>

              {/* FILE LAPORAN */}
              <div className="space-y-1">
                <label className="font-medium text-muted-foreground">
                  File Laporan
                </label>

                <div className="flex items-center border rounded-md overflow-hidden bg-background">
                  {/* BUTTON */}
                  <label
                    htmlFor="file-realisasi"
                    className="px-3 py-2 text-sm border-r bg-muted cursor-pointer hover:bg-muted/70"
                  >
                    Choose File
                  </label>

                  {/* INPUT HIDDEN */}
                  <input
                    id="file-realisasi"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;

                      if (f.type !== "application/pdf") {
                        alert("File harus PDF");
                        return;
                      }

                      if (f.size > 5 * 1024 * 1024) {
                        alert("Ukuran maksimal 5 MB");
                        return;
                      }

                      setFileRealisasi(f);
                    }}
                  />

                  {/* FILE NAME */}
                  <div className="flex-1 px-3 py-2 text-sm truncate text-muted-foreground">
                    {fileRealisasi ? fileRealisasi.name : "No file chosen"}
                  </div>

                  {/* ACTION */}
                  {fileRealisasi && (
                    <div className="flex items-center gap-1 px-2">
                      <button
                        type="button"
                        onClick={() => setPreviewFile(fileRealisasi)}
                        className="p-1 rounded hover:bg-muted"
                        title="Lihat Dokumen"
                      >
                        <Eye className="w-4 h-4 text-primary" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setFileRealisasi(null)}
                        className="p-1 rounded hover:bg-red-50"
                        title="Hapus File"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-red-500">* file PDF maks 5 MB</p>

                {existingDokumen
                  .filter((d: any) => d.filePath)
                  .map((d: any) => (
                    <div
                      key={d.id}
                      className="text-sm text-blue-600 underline cursor-pointer mt-2"
                      onClick={() => setPreviewUrl(d.filePath)}
                    >
                      Lihat Dokumen Lama
                    </div>
                  ))}
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t shrink-0 bg-background">
              <Button
                variant="destructive"
                onClick={() => setShowAddModal(false)}
              >
                Close
              </Button>
              <Button
                variant="default"
                onClick={async () => {

                  try {

                    // VALIDASI hanya saat tambah
                    if (!editingId) {

                      if (
                        !newRealisasi.repositoryId ||
                        !newRealisasi.bentuk ||
                        !newRealisasi.judul ||
                        !newRealisasi.tanggal ||
                        !newRealisasi.anggaran ||
                        !newRealisasi.dosen ||
                        !newRealisasi.mahasiswa ||
                        !newRealisasi.hasil
                      ) {

                        setErrorMessage("Semua field wajib diisi")
                        setShowErrorAdd(true)
                        return

                      }

                    }

                    const method = editingId ? "PUT" : "POST"

                    const path = editingId
                      ? `/realisasi/${editingId}`
                      : "/realisasi"

                    const payload = {
                      ...newRealisasi,
                      ...(fileRealisasi
                        ? {
                          dokumen: [{
                            jenis: "laporan",
                            fileName: fileRealisasi.name,
                            filePath: fileRealisasi.name,
                            fileSize: fileRealisasi.size,
                          }],
                        }
                        : {}),
                    }

                    await apiFetch(path, {
                      method,
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    })

                    // Optimistic update — langsung update state tanpa fetch ulang
                    const optimisticItem: RealisasiKegiatan = {
                      id: editingId || String(Date.now()),
                      repositoryId: newRealisasi.repositoryId,
                      judul: newRealisasi.judul,
                      tanggal: newRealisasi.tanggal,
                      anggaran: Number(newRealisasi.anggaran) || 0,
                      bentuk: newRealisasi.bentuk,
                      dosen: newRealisasi.dosen,
                      mahasiswa: newRealisasi.mahasiswa,
                      hasil: newRealisasi.hasil,
                      dokumenFile: [],
                      dokumen: "",
                      peserta: "",
                    }

                    if (editingId) {
                      setData((prev) => prev.map((r) => r.id === editingId ? { ...r, ...optimisticItem } : r))
                      setShowSuccessUpdate(true)
                    } else {
                      setData((prev) => [optimisticItem, ...prev])
                      setShowSuccessAdd(true)
                    }

                    setShowAddModal(false)
                    setEditingId(null)
                    setFileRealisasi(null)
                    setExistingDokumen([])

                    // Sync data di background
                    fetchData()

                  } catch (err) {
                    if (editingId) {
                      setShowErrorUpdate(true)
                    } else {
                      setShowErrorAdd(true)
                    }
                  }

                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW FILE */}
      {previewFile && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-xl">
            {/* HEADER */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-sm font-semibold">Preview Dokumen</h3>
              <button onClick={() => setPreviewFile(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CONTENT */}
            <iframe
              src={URL.createObjectURL(previewFile)}
              className="w-full flex-1"
            />
          </div>
        </div>
      )}

      {previewUrl && (

        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-xl">

            <div className="flex items-center justify-between px-4 py-3 border-b">

              <h3 className="text-sm font-semibold">
                Preview Dokumen Lama
              </h3>

              <button
                onClick={() => setPreviewUrl(null)}
              >

                <X className="w-5 h-5" />

              </button>

            </div>

            <iframe
              src={previewUrl}
              className="w-full flex-1"
            />

          </div>

        </div>

      )}

      {deleteRealisasi && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm text-center space-y-4 shadow-lg">

            <div className="flex justify-center">
              <Trash2 className="w-10 h-10 text-red-600" />
            </div>

            <p className="text-base font-medium text-red-600">
              Hapus Data
            </p>

            <p className="text-sm text-muted-foreground">
              Apakah kamu yakin ingin menghapus kegiatan
              <b className="mx-1">{deleteRealisasi.judul}</b>?
            </p>

            <div className="flex justify-center gap-2">

              <Button
                variant="outline"
                onClick={() => setDeleteRealisasi(null)}
              >
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

      {showSuccessAdd && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 text-center space-y-4 w-full max-w-sm">
            <div className="text-green-600 text-4xl">✔</div>
            <h3 className="text-base font-semibold">Berhasil</h3>
            <p className="text-sm text-muted-foreground">Realisasi kegiatan berhasil ditambahkan.</p>
            <Button onClick={() => setShowSuccessAdd(false)} className="w-full">OK</Button>
          </div>
        </div>
      )}

      {showErrorAdd && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 text-center space-y-4 w-full max-w-sm">
            <div className="text-red-600 text-4xl">✘</div>
            <h3 className="text-base font-semibold">Gagal</h3>
            <p className="text-sm text-muted-foreground">{errorMessage || "Gagal menambahkan realiseasi kegiatan."}</p>
            <Button variant="destructive" onClick={() => setShowErrorAdd(false)} className="w-full">Tutup</Button>
          </div>
        </div>
      )}

      {showSuccessUpdate && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 text-center space-y-4 w-full max-w-sm">
            <div className="text-green-600 text-4xl">✔</div>
            <h3 className="text-base font-semibold">Berhasil</h3>
            <p className="text-sm text-muted-foreground">Realisasi kegiatan berhasil diperbarui.</p>
            <Button onClick={() => setShowSuccessUpdate(false)} className="w-full">OK</Button>
          </div>
        </div>
      )}

      {showErrorUpdate && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 text-center space-y-4 w-full max-w-sm">
            <div className="text-red-600 text-4xl">✘</div>
            <h3 className="text-base font-semibold">Gagal</h3>
            <p className="text-sm text-muted-foreground">Gagal memperbarui realiseasi kegiatan.</p>
            <Button variant="destructive" onClick={() => setShowErrorUpdate(false)} className="w-full">Tutup</Button>
          </div>
        </div>
      )}

    </div>
  );
}
