"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

type StatusPencairan = "Draft" | "Diajukan" | "Disetujui" | "Ditolak";

type PencairanDana = {
  id: string;
  repositoryId?: string;
  dasarDokumen: string;
  danaMitra: string;
  jumlah: number;
  tanggal: string;
  tanggalTransfer?: string;
  noSurat?: string;
  tanggalSurat?: string;
  penanggungjawab?: string;
  catatan: string;
  status: StatusPencairan;
  dokumen?: PencairanDokumen[];
};

type PencairanDokumen = {
  id?: string;
  jenisDokumen?: string;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
};

type RepositoryOption = {
  id: string;
  label: string;
  danaMitra: string;
  raw: any;
};

type FileKey =
  | "suratPengajuan"
  | "buktiTransfer"
  | "bukuRekening"
  | "rab"
  | "sptjm";

type PencairanForm = {
  repositoryId: string;
  dasarDokumen: string;
  danaMitra: string;
  jumlah: string;
  penanggungjawab: string;
  tanggalTransfer: string;
  noSurat: string;
  tanggalSurat: string;
  catatan: string;
  status: StatusPencairan;
} & Record<FileKey, File | null>;

type InputProps = {
  label: string;
  type?: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
};

type FileInputProps = {
  label: string;
  file: File | null;
  setFile: (file: File | null) => void;
  onView: (file: File) => void;
};

type ModalProps = {
  editing: boolean;
  repositoryOptions: RepositoryOption[];
  repositoryLoadError: string | null;
  newPencairan: PencairanForm;
  setNewPencairan: React.Dispatch<React.SetStateAction<PencairanForm>>;
  setPreviewFile: (file: File | null) => void;
  onClose: () => void;
  onSave: () => void | Promise<void>;
};

const DOCUMENT_FIELDS: Array<{
  key: FileKey;
  label: string;
  jenisDokumen: string;
}> = [
  { key: "suratPengajuan", label: "Surat Pengajuan", jenisDokumen: "surat_pengajuan" },
  { key: "buktiTransfer", label: "Bukti Transfer", jenisDokumen: "bukti_transfer" },
  { key: "bukuRekening", label: "Buku Rekening", jenisDokumen: "buku_rekening" },
  { key: "rab", label: "RAB", jenisDokumen: "rab" },
  { key: "sptjm", label: "SPTJM", jenisDokumen: "sptjm" },
];

const emptyPencairanForm = (): PencairanForm => ({
  repositoryId: "",
  dasarDokumen: "",
  danaMitra: "",
  jumlah: "",
  penanggungjawab: "",
  tanggalTransfer: "",
  noSurat: "",
  tanggalSurat: "",
  catatan: "",
  status: "Diajukan",
  suratPengajuan: null,
  buktiTransfer: null,
  bukuRekening: null,
  rab: null,
  sptjm: null,
});

const normalizeStatus = (value: unknown): StatusPencairan => {
  const status = String(value || "").toLowerCase();

  if (status === "disetujui") return "Disetujui";
  if (status === "ditolak") return "Ditolak";
  if (status === "draft") return "Draft";

  return "Diajukan";
};

const repositoryId = (item: any): string => String(item?.id || item?.idKerjasama || item?.repositoryId || "");

const repositoryLabel = (item: any): string => {
  const nomor = item?.nomorDokumen || item?.nomor;
  const judul = item?.judulKerjasama || item?.judul;
  const label = [nomor, judul].filter(Boolean).join(" - ");

  return label || repositoryId(item);
};

const repositoryMitra = (item: any): string =>
  item?.mitra?.namaMitra ||
  item?.mitra?.nama ||
  item?.paraPenggiat ||
  item?.namaMitra ||
  "";

const mapRepositoryOption = (item: any): RepositoryOption => ({
  id: repositoryId(item),
  label: repositoryLabel(item),
  danaMitra: repositoryMitra(item),
  raw: item,
});

const mapPencairan = (item: any): PencairanDana => ({
  id: String(item.id),
  repositoryId: item.repositoryId ? String(item.repositoryId) : "",
  dasarDokumen:
    item.dasarDokumen ||
    item.repository?.judulKerjasama ||
    item.repository?.judul ||
    "-",
  danaMitra:
    item.danaMitra ||
    item.repository?.mitra?.namaMitra ||
    item.repository?.mitra?.nama ||
    item.penanggungJawab ||
    item.penanggungjawab ||
    "-",
  jumlah: Number(item.jumlah || item.jmlDicairkan || 0),
  tanggal: item.tanggalTransfer || item.tanggal || "",
  tanggalTransfer: item.tanggalTransfer || item.tanggal || "",
  noSurat: item.noSurat || item.nomorSurat || "",
  tanggalSurat: item.tanggalSurat || "",
  penanggungjawab: item.penanggungJawab || item.penanggungjawab || "",
  catatan: item.catatan || item.noSurat || item.nomorSurat || "-",
  status: normalizeStatus(item.status),
  dokumen: Array.isArray(item.dokumen) ? item.dokumen : [],
});

const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message === "Failed to fetch") {
    return "Backend Laravel belum bisa dihubungi. Pastikan php artisan serve berjalan di http://127.0.0.1:8000.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Terjadi kesalahan saat menghubungi API.";
};

export default function PencairanDanaPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [pencairanData, setPencairanData] = useState<PencairanDana[]>([]);
  const [repositoryOptions, setRepositoryOptions] = useState<RepositoryOption[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [repositoryLoadError, setRepositoryLoadError] = useState<string | null>(null);
  const [newPencairan, setNewPencairan] = useState<PencairanForm>(emptyPencairanForm());

  useEffect(() => {
    document.title = "SIKERMA - Pencairan Dana";
    fetchData();
    fetchRepositoryOptions();
  }, []);

  const fetchRepositoryOptions = async () => {
    try {
      const data = await apiFetch("/repository/mydata");
      setRepositoryOptions(Array.isArray(data) ? data.map(mapRepositoryOption) : []);
      setRepositoryLoadError(null);
    } catch (error) {
      setRepositoryOptions([]);
      setRepositoryLoadError(getApiErrorMessage(error));
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/pencairan-dana");
      const items = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];

      setPencairanData(items.map(mapPencairan));
      setApiError(null);
    } catch (error) {
      setPencairanData([]);
      setApiError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setNewPencairan(emptyPencairanForm());
    setPreviewFile(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (item: PencairanDana) => {
    setEditingId(item.id);
    setNewPencairan({
      ...emptyPencairanForm(),
      repositoryId: item.repositoryId || "",
      dasarDokumen: item.dasarDokumen === "-" ? "" : item.dasarDokumen,
      danaMitra: item.danaMitra === "-" ? "" : item.danaMitra,
      jumlah: String(item.jumlah || ""),
      penanggungjawab: item.penanggungjawab || "",
      tanggalTransfer: item.tanggalTransfer || item.tanggal || "",
      noSurat: item.noSurat || "",
      tanggalSurat: item.tanggalSurat || "",
      catatan: item.catatan === "-" ? "" : item.catatan,
      status: item.status,
    });
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!newPencairan.dasarDokumen || !newPencairan.jumlah || !newPencairan.tanggalTransfer) {
      alert("Dasar dokumen, jumlah, dan tanggal transfer wajib diisi");
      return;
    }

    const dokumen = DOCUMENT_FIELDS
      .map((field) => {
        const file = newPencairan[field.key];

        if (!file) return null;

        return {
          jenisDokumen: field.jenisDokumen,
          fileName: file.name,
          filePath: file.name,
          fileSize: file.size,
          nomorDokumen: newPencairan.noSurat,
          tanggalDokumen: newPencairan.tanggalSurat,
        };
      })
      .filter(Boolean);

    const payload = {
      repositoryId: newPencairan.repositoryId || null,
      dasarDokumen: newPencairan.dasarDokumen,
      danaMitra: newPencairan.danaMitra,
      jumlah: newPencairan.jumlah,
      jmlTrfMitra: newPencairan.jumlah,
      penanggungjawab: newPencairan.penanggungjawab,
      tanggal: newPencairan.tanggalTransfer,
      tanggalTransfer: newPencairan.tanggalTransfer,
      noSurat: newPencairan.noSurat,
      tanggalSurat: newPencairan.tanggalSurat,
      catatan: newPencairan.catatan || newPencairan.noSurat,
      status: newPencairan.status,
      syncStatus: "local",
      ...(dokumen.length > 0 ? { dokumen } : {}),
    };

    try {
      const saved = await apiFetch(
        editingId ? `/pencairan-dana/${editingId}` : "/pencairan-dana",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      );
      const mapped = mapPencairan(saved);

      if (editingId) {
        setPencairanData((prev) => prev.map((item) => (item.id === editingId ? mapped : item)));
      } else {
        setPencairanData((prev) => [mapped, ...prev]);
      }

      setShowAddModal(false);
      resetForm();
      setShowSuccess(true);
      fetchData();
    } catch (error) {
      alert(getApiErrorMessage(error));
    }
  };

  const handleDelete = async (item: PencairanDana) => {
    if (!window.confirm(`Hapus pencairan dana untuk ${item.dasarDokumen}?`)) return;

    try {
      await apiFetch(`/pencairan-dana/${item.id}`, { method: "DELETE" });
      setPencairanData((prev) => prev.filter((row) => row.id !== item.id));
    } catch (error) {
      alert(getApiErrorMessage(error));
    }
  };

  const filteredData = useMemo(() => {
    const keyword = search.toLowerCase();

    return pencairanData.filter((item) =>
      `${item.dasarDokumen} ${item.danaMitra} ${item.status} ${item.catatan}`
        .toLowerCase()
        .includes(keyword)
    );
  }, [search, pencairanData]);

  const totalPages = Math.ceil(filteredData.length / limit);
  const paginatedData = filteredData.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    setPage(1);
  }, [search, limit]);

  const startEntry = filteredData.length === 0 ? 0 : (page - 1) * limit + 1;
  const endEntry = Math.min(page * limit, filteredData.length);

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
          sidebarExpanded ? "md:ml-64" : "md:ml-[72px]"
        )}
      >
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl md:text-2xl font-bold">
                Pencairan Dana
              </h1>

              <Button variant="outline" size="sm" onClick={openAddModal}>
                <Plus className="w-4 h-4 mr-1" />
                Buat Ajuan
              </Button>
            </div>

            {apiError && (
              <div className="rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                {apiError}
              </div>
            )}

            <div className="rounded-lg border bg-card">
              <div className="p-4 flex justify-between text-sm">
                <div>
                  Show{" "}
                  <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="border rounded px-2 py-1 mx-1"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  entries
                </div>

                <div>
                  Search:{" "}
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border rounded px-2 py-1"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-t">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-3 py-2 text-center">No</th>
                      <th className="px-3 py-2 text-center">Dasar Dokumen</th>
                      <th className="px-3 py-2 text-center">Dana Mitra</th>
                      <th className="px-3 py-2 text-center">Jumlah</th>
                      <th className="px-3 py-2 text-center">Tanggal</th>
                      <th className="px-3 py-2 text-center">Catatan</th>
                      <th className="px-3 py-2 text-center">Status</th>
                      <th className="px-3 py-2 text-center">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Memuat data...</p>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-muted-foreground">
                          No data available in table
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((item, i) => (
                        <tr key={item.id} className="border-b">
                          <td className="px-3 py-2 text-center">
                            {(page - 1) * limit + i + 1}
                          </td>
                          <td className="px-3 py-2 text-center">{item.dasarDokumen}</td>
                          <td className="px-3 py-2 text-center">{item.danaMitra}</td>
                          <td className="px-3 py-2 text-center">
                            Rp {item.jumlah.toLocaleString("id-ID")}
                          </td>
                          <td className="px-3 py-2 text-center">{item.tanggal || "-"}</td>
                          <td className="px-3 py-2 text-center">{item.catatan}</td>
                          <td className="px-3 py-2 text-center">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <div className="flex gap-1 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={!item.dokumen?.[0]?.filePath}
                                onClick={() => item.dokumen?.[0]?.filePath && setPreviewUrl(item.dokumen[0].filePath)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => openEditModal(item)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                title="Hapus Dokumen"
                                onClick={() => handleDelete(item)}
                                className="group border-red-200 hover:bg-red-600 hover:border-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-black group-hover:text-white transition-colors" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-4 flex items-center justify-between text-sm">
                <span>
                  Showing {startEntry} to {endEntry} of {filteredData.length} entries
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
                      <span key={i} className="px-2 text-muted-foreground">
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

        {showAddModal && (
          <Modal
            editing={Boolean(editingId)}
            repositoryOptions={repositoryOptions}
            repositoryLoadError={repositoryLoadError}
            onClose={() => {
              setShowAddModal(false);
              resetForm();
            }}
            onSave={handleSave}
            newPencairan={newPencairan}
            setNewPencairan={setNewPencairan}
            setPreviewFile={setPreviewFile}
          />
        )}

        {previewFile && (
          <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
        )}

        {previewUrl && (
          <UrlPreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
        )}

        {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)} />}
      </div>
    </div>
  );
}

function Input({ label, type = "text", value, placeholder, onChange }: InputProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-md px-3 py-2 text-sm"
      />
    </div>
  );
}

const MAX_FILE_SIZE = 2 * 1024 * 1024;

function validatePdf(file: File) {
  if (file.type !== "application/pdf") {
    alert("File harus berformat PDF");
    return false;
  }

  if (file.size > MAX_FILE_SIZE) {
    alert("Ukuran file maksimal 2 MB");
    return false;
  }

  return true;
}

function FileInput({ label, file, setFile, onView }: FileInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    if (!validatePdf(selectedFile)) {
      e.target.value = "";
      return;
    }

    setFile(selectedFile);
  };

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>

      <div className="flex border rounded-md overflow-hidden">
        <label className="px-3 py-2 bg-muted cursor-pointer">
          Choose File
          <input type="file" accept="application/pdf" hidden onChange={handleChange} />
        </label>

        <div className="flex-1 px-3 py-2 text-sm truncate">
          {file ? file.name : "No file chosen"}
        </div>

        {file && (
          <div className="flex gap-1 px-2 items-center">
            <button type="button" onClick={() => onView(file)}>
              <Eye className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => setFile(null)}>
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
        )}
      </div>

      {file && (
        <p className="text-xs text-muted-foreground">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      )}
    </div>
  );
}

function Modal({
  editing,
  repositoryOptions,
  repositoryLoadError,
  onClose,
  onSave,
  newPencairan,
  setNewPencairan,
  setPreviewFile,
}: ModalProps) {
  const handleRepositoryChange = (value: string) => {
    const selected = repositoryOptions.find((item) => item.id === value);

    setNewPencairan((prev) => ({
      ...prev,
      repositoryId: value,
      dasarDokumen: selected?.label || "",
      danaMitra: selected?.danaMitra || "",
    }));
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <h3 className="text-sm font-semibold">
            {editing ? "Edit Pencairan Dana" : "Add Pencairan Dana"}
          </h3>
          <button
            onClick={onClose}
            className="group rounded-sm p-1 transition-colors hover:bg-[#0079C4]"
          >
            <X className="w-4 h-4 text-muted-foreground transition-colors group-hover:text-white" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-3 text-sm overflow-y-auto">
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Dasar Dokumen <span className="text-red-500">*</span>
            </label>
            <select
              value={newPencairan.repositoryId}
              onChange={(e) => handleRepositoryChange(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            >
              <option value="">
                {repositoryOptions.length > 0
                  ? "- Pilih dokumen kerja sama -"
                  : "- Belum ada dokumen kerja sama -"}
              </option>
              {repositoryOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            {repositoryLoadError ? (
              <p className="text-xs text-yellow-700">
                {repositoryLoadError}
              </p>
            ) : repositoryOptions.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Data pilihan diambil dari repository kerja sama. Jika kosong, buat data repository terlebih dahulu atau isi dasar dokumen manual.
              </p>
            ) : null}
          </div>

          {!newPencairan.repositoryId && (
            <Input
              label="Dasar Dokumen Manual"
              value={newPencairan.dasarDokumen}
              onChange={(value) => setNewPencairan((prev) => ({ ...prev, dasarDokumen: value }))}
            />
          )}

          <Input
            label="Dana Mitra"
            value={newPencairan.danaMitra}
            placeholder="nama mitra"
            onChange={(value) => setNewPencairan((prev) => ({ ...prev, danaMitra: value }))}
          />

          <Input
            label="Jumlah Ditransfer"
            placeholder="Rp..."
            value={newPencairan.jumlah}
            onChange={(value) => setNewPencairan((prev) => ({ ...prev, jumlah: value }))}
          />

          <Input
            label="Penanggungjawab"
            placeholder="nama penanggungjawab"
            value={newPencairan.penanggungjawab}
            onChange={(value) => setNewPencairan((prev) => ({ ...prev, penanggungjawab: value }))}
          />

          <Input
            label="Tanggal Ditransfer"
            type="date"
            value={newPencairan.tanggalTransfer}
            onChange={(value) => setNewPencairan((prev) => ({ ...prev, tanggalTransfer: value }))}
          />

          <Input
            label="No. Surat Pengajuan"
            value={newPencairan.noSurat}
            onChange={(value) => setNewPencairan((prev) => ({ ...prev, noSurat: value }))}
          />

          <Input
            label="Tgl. Surat Pengajuan"
            type="date"
            value={newPencairan.tanggalSurat}
            onChange={(value) => setNewPencairan((prev) => ({ ...prev, tanggalSurat: value }))}
          />

          <div className="space-y-1">
            <label className="text-sm font-medium">Catatan</label>
            <textarea
              value={newPencairan.catatan}
              onChange={(e) => setNewPencairan((prev) => ({ ...prev, catatan: e.target.value }))}
              className="w-full border rounded-md px-3 py-2 text-sm"
              rows={2}
            />
          </div>

          {DOCUMENT_FIELDS.map((field) => (
            <FileInput
              key={field.key}
              label={field.label}
              file={newPencairan[field.key]}
              setFile={(file) => setNewPencairan((prev) => ({ ...prev, [field.key]: file }))}
              onView={setPreviewFile}
            />
          ))}

          <p className="text-xs text-red-500">* file wajib PDF maks. 2 MB</p>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t shrink-0 bg-background">
          <Button variant="destructive" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onSave}>Save</Button>
        </div>
      </div>
    </div>
  );
}

function PreviewModal({ file, onClose }: { file: File; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] flex flex-col">
        <div className="p-3 border-b flex justify-between">
          <span>Preview Dokumen</span>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        <iframe src={URL.createObjectURL(file)} className="flex-1" />
      </div>
    </div>
  );
}

function UrlPreviewModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] flex flex-col">
        <div className="p-3 border-b flex justify-between">
          <span>Preview Dokumen</span>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        <iframe src={url} className="flex-1" />
      </div>
    </div>
  );
}

function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-xl p-6 text-center space-y-4">
        <p>Data pencairan dana berhasil disimpan</p>
        <Button onClick={onClose}>OK</Button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: StatusPencairan }) {
  const base = "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium";
  const variants: Record<StatusPencairan, string> = {
    Draft: "bg-gray-600 text-white",
    Diajukan: "bg-blue-600 text-white",
    Disetujui: "bg-green-600 text-white",
    Ditolak: "bg-red-600 text-white",
  };

  return <span className={`${base} ${variants[status]}`}>{status}</span>;
}
