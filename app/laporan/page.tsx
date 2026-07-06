"use client";

import { useState, useMemo, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  Loader2,
  FileText,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  BarChart2,
  Download,
  Printer,
  FileCheck,
} from "lucide-react";

/* ================= TYPES ================= */

type LaporanData = {
  tahun: number;
  mou: number;
  moa: number;
  ia: number;
  aktif: number;
  kadaluarsa: number;
  perpanjangan: number;
  tidakAktif: number;
};

type RepoDoc = {
  id: string | number;
  jenis: string;
  nomor: string;
  judul: string;
  status: string;
  tglMulai: string;
  tglBerakhir: string;
  penanggungJawab?: string;
  unitPenanggungJawab?: string;
  sumberDana?: string;
  anggaran?: string;
  skala?: string;
};

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

/* ================= PAGE ================= */

export default function LaporanKerjasamaPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [raw, setRaw] = useState<RepoDoc[]>([]);
  const [tahun, setTahun] = useState<"all" | number>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "SIKERMA - Laporan";
    apiFetch("/laporan")
      .then((res) => {
        const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setRaw(
          items.map((r: any) => ({
            id: r.id,
            jenis: r.jenisDokumen,
            nomor: r.nomorDokumen,
            judul: r.judulKerjasama,
            status: r.statusDokumen,
            tglMulai: r.tanggalMulai,
            tglBerakhir: r.tanggalBerakhir,
            penanggungJawab: r.namaPenanggungJawab,
            unitPenanggungJawab: r.unitPenanggungJawab,
            sumberDana: r.sumberPendanaan,
            anggaran: r.jumlahAnggaran,
            skala: r.skalaKerjasama,
          }))
        );
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Gagal memuat laporan"))
      .finally(() => setLoading(false));
  }, []);

  const laporanData10Tahun = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - 9 + i);

    const result: LaporanData[] = years.map((year) => ({
      tahun: year, mou: 0, moa: 0, ia: 0, aktif: 0, kadaluarsa: 0, perpanjangan: 0, tidakAktif: 0,
    }));

    raw.forEach((d) => {
      const year = new Date(d.tglMulai).getFullYear();
      const index = result.findIndex((r) => r.tahun === year);
      if (index === -1) return;

      const now = new Date();
      const end = new Date(d.tglBerakhir);
      const diffDays = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      if (d.jenis === "MOU") result[index].mou++;
      if (d.jenis === "MOA") result[index].moa++;
      if (d.jenis === "IA") result[index].ia++;

      if (d.status === "Tidak Aktif") result[index].tidakAktif++;
      else if (end < now) result[index].kadaluarsa++;
      else if (diffDays <= 90) result[index].perpanjangan++;
      else result[index].aktif++;
    });

    return result;
  }, [raw]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${String(date.getUTCDate()).padStart(2, "0")}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${date.getUTCFullYear()}`;
  };

  const laporan = useMemo(() => {
    if (tahun === "all") {
      return laporanData10Tahun.reduce(
        (acc, cur) => ({
          tahun: 0, mou: acc.mou + cur.mou, moa: acc.moa + cur.moa, ia: acc.ia + cur.ia,
          aktif: acc.aktif + cur.aktif, kadaluarsa: acc.kadaluarsa + cur.kadaluarsa,
          perpanjangan: acc.perpanjangan + cur.perpanjangan, tidakAktif: acc.tidakAktif + cur.tidakAktif,
        }),
        { tahun: 0, mou: 0, moa: 0, ia: 0, aktif: 0, kadaluarsa: 0, perpanjangan: 0, tidakAktif: 0 }
      );
    }
    return laporanData10Tahun.find((d) => d.tahun === tahun) ?? { tahun: 0, mou: 0, moa: 0, ia: 0, aktif: 0, kadaluarsa: 0, perpanjangan: 0, tidakAktif: 0 };
  }, [tahun, laporanData10Tahun]);

  const tahunOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [{ label: "Semua Tahun", value: "all" as const }, ...Array.from({ length: 10 }, (_, i) => ({ label: String(currentYear - i), value: currentYear - i }))];
  }, []);

  const totalJenis = laporan.mou + laporan.moa + laporan.ia;

  const filteredExportData = useMemo(() => {
    if (tahun === "all") return raw;
    return raw.filter((d) => new Date(d.tglMulai).getFullYear() === tahun);
  }, [raw, tahun]);

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;

    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, pageWidth, 14, "F");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("LAPORAN DATA KERJASAMA", pageWidth / 2, 9, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    const filterText = tahun === "all" ? "Semua Tahun" : `Tahun ${tahun}`;
    doc.text(`Periode: ${filterText}`, margin, 20);
    doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}`, pageWidth - margin, 20, { align: "right" });

    const startY = 24;
    const statsData = [
      ["Total MoU", laporan.mou],
      ["Total MoA", laporan.moa],
      ["Total IA", laporan.ia],
      ["Dokumen Aktif", laporan.aktif],
      ["Perpanjangan", laporan.perpanjangan],
      ["Kadaluarsa", laporan.kadaluarsa],
      ["Tidak Aktif", laporan.tidakAktif],
    ];

    const colWidth = (pageWidth - margin * 2) / statsData.length;
    statsData.forEach((stat, i) => {
      const x = margin + i * colWidth;
      doc.setFillColor(245, 247, 250);
      doc.rect(x, startY, colWidth - 2, 12, "F");
      doc.setDrawColor(200, 210, 220);
      doc.rect(x, startY, colWidth - 2, 12, "S");
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(stat[0], x + (colWidth - 2) / 2, startY + 4, { align: "center" });
      doc.setFontSize(10);
      doc.setTextColor(99, 102, 241);
      doc.setFont("helvetica", "bold");
      doc.text(String(stat[1]), x + (colWidth - 2) / 2, startY + 10, { align: "center" });
    });

    autoTable(doc, {
      startY: startY + 16,
      margin: { left: margin, right: margin },
      styles: { fontSize: 7, cellPadding: 2, valign: "middle" },
      headStyles: { fillColor: [99, 102, 241], textColor: 255, halign: "center", valign: "middle", fontStyle: "bold" },
      bodyStyles: { halign: "left", valign: "middle" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      head: [["No", "Jenis", "Nomor Dokumen", "Judul Kerjasama", "Status", "Tgl Mulai", "Tgl Berakhir", "Penanggung Jawab", "Unit", "Sumber Dana", "Anggaran"]],
      body: filteredExportData.map((d, i) => [
        i + 1,
        d.jenis ?? "-",
        d.nomor ?? "-",
        d.judul ?? "-",
        d.status ?? "-",
        formatDate(d.tglMulai) || "-",
        formatDate(d.tglBerakhir) || "-",
        d.penanggungJawab ?? "-",
        d.unitPenanggungJawab ?? "-",
        d.sumberDana ?? "-",
        d.anggaran ? `Rp ${Number(d.anggaran).toLocaleString("id-ID")}` : "-",
      ]),
      columnStyles: {
        0: { halign: "center", cellWidth: 10 },
        1: { halign: "center", cellWidth: 16 },
        2: { cellWidth: 28 },
        3: { cellWidth: 50 },
        4: { halign: "center", cellWidth: 22 },
        5: { halign: "center", cellWidth: 22 },
        6: { halign: "center", cellWidth: 22 },
        7: { cellWidth: 28 },
        8: { cellWidth: 25 },
        9: { cellWidth: 20 },
        10: { halign: "right", cellWidth: 28 },
      },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.setFont("helvetica", "normal");
      doc.text(`SIKERMA - Halaman ${i} dari ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: "center" });
    }

    doc.save(tahun === "all" ? "laporan_kerjasama.pdf" : `laporan_kerjasama_${tahun}.pdf`);
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Data Kerjasama");

    sheet.columns = [
      { header: "No", key: "no", width: 6 },
      { header: "Jenis", key: "jenis", width: 12 },
      { header: "Nomor Dokumen", key: "nomor", width: 25 },
      { header: "Judul Kerjasama", key: "judul", width: 40 },
      { header: "Status", key: "status", width: 15 },
      { header: "Tgl Mulai", key: "tglMulai", width: 15 },
      { header: "Tgl Berakhir", key: "tglBerakhir", width: 15 },
      { header: "Penanggung Jawab", key: "pj", width: 25 },
      { header: "Unit", key: "unit", width: 20 },
      { header: "Dana", key: "dana", width: 15 },
      { header: "Anggaran", key: "anggaran", width: 18 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6366F1" } };
    });

    filteredExportData.forEach((d, i) => {
      const row = sheet.addRow({
        no: i + 1, jenis: d.jenis ?? "-", nomor: d.nomor ?? "-", judul: d.judul ?? "-",
        status: d.status ?? "-", tglMulai: formatDate(d.tglMulai), tglBerakhir: formatDate(d.tglBerakhir),
        pj: d.penanggungJawab ?? "-", unit: d.unitPenanggungJawab ?? "-",
        dana: d.sumberDana ?? "-", anggaran: d.anggaran ? `Rp ${Number(d.anggaran).toLocaleString("id-ID")}` : "-",
      });
      row.height = 22;
      if (i % 2 === 1) row.eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } }; });
      row.getCell("no").alignment = { horizontal: "center", vertical: "middle" };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), tahun === "all" ? "data_kerjasama.xlsx" : `data_kerjasama_${tahun}.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Memuat laporan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} onExpandChange={setSidebarExpanded} />
      <div className={cn("relative transition-all duration-300", "ml-0", sidebarExpanded ? "md:ml-64" : "md:ml-[72px]")}>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* HEADER + FILTER */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Laporan Kerjasama</h1>
                <p className="text-sm text-muted-foreground mt-1">Statistik data kerjasama</p>
              </div>
              <div className="bg-white rounded-xl border shadow-sm p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center gap-2 shrink-0">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground shrink-0">Tahun:</span>
                    </div>
                    <SearchableSelect
                      options={tahunOptions}
                      value={tahun}
                      onChange={(val) => setTahun(val as "all" | number)}
                    />
                  </div>
                  <div className="h-8 w-px bg-border hidden sm:block shrink-0" />
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={handleExportPDF} className="gap-1.5">
                      <Printer className="w-4 h-4" /> PDF
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleExportExcel} className="gap-1.5">
                      <Download className="w-4 h-4" /> Excel
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Gagal memuat data laporan dari Laravel API. Pastikan backend berjalan di port 8000.
              </div>
            )}

            {/* JENIS DOKUMEN */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileCheck className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Jenis Dokumen</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nota Kesepahaman</p>
                        <p className="text-3xl font-extrabold text-foreground mt-1">{laporan.mou}</p>
                        <p className="text-xs text-muted-foreground mt-1">dokumen MoU</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-indigo-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Perjanjian Kerjasama</p>
                        <p className="text-3xl font-extrabold text-foreground mt-1">{laporan.moa}</p>
                        <p className="text-xs text-muted-foreground mt-1">dokumen MoA</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-sky-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Implementing Agreement</p>
                        <p className="text-3xl font-extrabold text-foreground mt-1">{laporan.ia}</p>
                        <p className="text-xs text-muted-foreground mt-1">dokumen IA</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-violet-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border shadow-sm bg-primary/5">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-primary uppercase tracking-wide">Total Dokumen</p>
                        <p className="text-3xl font-extrabold text-foreground mt-1">{totalJenis}</p>
                        <p className="text-xs text-muted-foreground mt-1">keseluruhan</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* STATUS DOKUMEN */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Status Dokumen</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border border-green-200 bg-green-50/40 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Dokumen Aktif</p>
                        <p className="text-3xl font-extrabold text-foreground mt-1">{laporan.aktif}</p>
                        <p className="text-xs text-green-600 mt-1">dokumen</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-blue-200 bg-blue-50/40 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Dalam Perpanjangan</p>
                        <p className="text-3xl font-extrabold text-foreground mt-1">{laporan.perpanjangan}</p>
                        <p className="text-xs text-blue-600 mt-1">dokumen</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-yellow-200 bg-yellow-50/40 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-yellow-700 uppercase tracking-wide">Kadaluarsa</p>
                        <p className="text-3xl font-extrabold text-foreground mt-1">{laporan.kadaluarsa}</p>
                        <p className="text-xs text-yellow-600 mt-1">dokumen</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-orange-200 bg-orange-50/40 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-orange-700 uppercase tracking-wide">Tidak Aktif</p>
                        <p className="text-3xl font-extrabold text-foreground mt-1">{laporan.tidakAktif}</p>
                        <p className="text-xs text-orange-600 mt-1">dokumen</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* INFO */}
            <div className="bg-muted/30 rounded-lg border px-4 py-3 text-sm text-muted-foreground">
              Gunakan filter tahun untuk melihat data per periode. Data diperbarui secara real-time.
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
