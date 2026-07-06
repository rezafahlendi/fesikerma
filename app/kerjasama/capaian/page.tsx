"use client";

import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Target,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const JENIS_COLORS: Record<string, string> = {
  MOU: "#6366f1",
  MOA: "#0ea5e9",
  IA: "#a855f7",
};

type TargetData = {
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

type RepoData = {
  id: string;
  jenisDokumen: string;
  statusDokumen: string;
  judulKerjasama: string;
  tanggalMulai: string;
};

type RealisasiData = {
  id: string;
  repositoryId: string;
  bentukKegiatan: string;
  judulKegiatan: string;
  tanggalKegiatan: string;
  jumlahDosen: number;
  jumlahMahasiswa: number;
  hasilKegiatan: string;
  anggaran: number | null;
  repository: {
    id: string;
    jenisDokumen: string;
    tanggalMulai: string;
  };
};

type CapaianResponse = {
  tahun: number;
  target: Partial<TargetData> | null;
  realisasi: {
    mou?: number;
    moa?: number;
    ia?: number;
    aktif?: number;
    kegiatan?: number;
  };
};

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export default function CapaianKerjasamaPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [targetData, setTargetData] = useState<TargetData[]>([]);
  const [repoData, setRepoData] = useState<RepoData[]>([]);
  const [realisasiData, setRealisasiData] = useState<RealisasiData[]>([]);
  const [capaianData, setCapaianData] = useState<CapaianResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeYear, setActiveYear] = useState(new Date().getFullYear());

  useEffect(() => {
    document.title = "SIKERMA - Capaian Kerjasama";
    Promise.all([
      apiFetch("/target-kerjasama"),
      apiFetch("/repository/mydata"),
      apiFetch("/realisasi"),
    ])
      .then(([targets, repos, realizasis]) => {
        if (Array.isArray(targets)) setTargetData(targets);
        if (Array.isArray(repos)) setRepoData(repos);
        if (Array.isArray(realizasis)) setRealisasiData(realizasis);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Gagal memuat capaian"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    apiFetch(`/capaian?tahun=${activeYear}`)
      .then((res) => setCapaianData(res))
      .catch((err) => setError(err instanceof Error ? err.message : "Gagal memuat capaian"));
  }, [activeYear]);

  const availableYears = useMemo(() => {
    const fromTargets = targetData.map((t) => t.tahun);
    const fromRepos = repoData.map((r) => new Date(r.tanggalMulai).getFullYear());
    const fromRealisasi = realisasiData.map((r) => new Date(r.tanggalKegiatan).getFullYear());
    const all = [...fromTargets, ...fromRepos, ...fromRealisasi];
    const unique = Array.from(new Set(all)).sort((a, b) => b - a);
    return unique.length > 0 ? unique : [new Date().getFullYear()];
  }, [targetData, repoData, realisasiData]);

  const target = targetData.find((t) => t.tahun === activeYear);
  const reposThisYear = repoData.filter((r) => new Date(r.tanggalMulai).getFullYear() === activeYear);

  const targetMou = capaianData?.target?.mou ?? target?.mou ?? 0;
  const targetMoa = capaianData?.target?.moa ?? target?.moa ?? 0;
  const targetIa = capaianData?.target?.ia ?? target?.ia ?? 0;

  const realizasisThisYear = realisasiData.filter((r) => new Date(r.tanggalKegiatan).getFullYear() === activeYear);
  const realMou = capaianData?.realisasi?.mou ?? realizasisThisYear.filter((r) => r.repository?.jenisDokumen === "MOU").length;
  const realMoa = capaianData?.realisasi?.moa ?? realizasisThisYear.filter((r) => r.repository?.jenisDokumen === "MOA").length;
  const realIa = capaianData?.realisasi?.ia ?? realizasisThisYear.filter((r) => r.repository?.jenisDokumen === "IA").length;
  const totalTarget = targetMou + targetMoa + targetIa;
  const totalReal = realMou + realMoa + realIa;

  const pctMou = targetMou === 0 ? 0 : Math.round((realMou / targetMou) * 100);
  const pctMoa = targetMoa === 0 ? 0 : Math.round((realMoa / targetMoa) * 100);
  const pctIa = targetIa === 0 ? 0 : Math.round((realIa / targetIa) * 100);
  const pctTotal = totalTarget === 0 ? 0 : Math.round((totalReal / totalTarget) * 100);

  const aktifCount = reposThisYear.filter((r) => r.statusDokumen === "Aktif").length;
  const perpanjanganCount = reposThisYear.filter((r) => r.statusDokumen === "DalamPerpanjangan").length;
  const kadaluarsaCount = reposThisYear.filter((r) => r.statusDokumen === "Kadaluarsa").length;
  const tidakAktifCount = reposThisYear.filter((r) => r.statusDokumen === "TidakAktif").length;

  const targetAktif = capaianData?.target?.aktif ?? target?.aktif ?? 0;
  const targetPerpanjangan = capaianData?.target?.perpanjangan ?? target?.perpanjangan ?? 0;
  const targetKadaluarsa = capaianData?.target?.kadaluarsa ?? target?.kadaluarsa ?? 0;
  const targetTidakAktif = capaianData?.target?.tidakAktif ?? target?.tidakAktif ?? 0;

  const trend = totalReal - totalTarget;
  const trendPct = totalTarget === 0 ? 0 : Math.round(((totalReal - totalTarget) / totalTarget) * 100);

  const lastYear = activeYear - 1;
  const lastYearRealisasi = realisasiData.filter((r) => new Date(r.tanggalKegiatan).getFullYear() === lastYear);
  const lastYearCount = lastYearRealisasi.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Memuat capaian kerjasama...</p>
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

            {/* SECTION 1: HEADER + YEAR FILTER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Capaian Kerjasama</h1>
                <p className="text-sm text-muted-foreground mt-1">Perbandingan target vs realisation kegiatan kerjasama</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {availableYears.map((year) => (
                  <Button key={year} size="sm" variant={activeYear === year ? "default" : "outline"} onClick={() => setActiveYear(year as number)} className={activeYear === year ? "shadow-md" : ""}>
                    {year}
                  </Button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Gagal memuat data capaian dari Laravel API. Pastikan backend berjalan di port 8000.
              </div>
            )}

            {/* SECTION 2: TARGET vs REALISASI OVERVIEW */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Target vs Realisasi {activeYear}</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Target</p>
                        <p className="text-3xl font-extrabold text-foreground mt-1">{totalTarget}</p>
                        <p className="text-xs text-muted-foreground mt-1">dokumen</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                        <Target className="w-5 h-5 text-indigo-600" />
                      </div>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">MoU</span><span className="font-medium">{targetMou}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">MoA</span><span className="font-medium">{targetMoa}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">IA</span><span className="font-medium">{targetIa}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border shadow-sm hover:-translate-y-1 hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-primary uppercase tracking-wide">Terealisasi</p>
                        <p className="text-3xl font-extrabold text-foreground mt-1">{totalReal}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {totalReal >= totalTarget ? (
                            <TrendingUp className="w-3 h-3 text-green-500" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-500" />
                          )}
                          <span className="text-xs font-medium" style={{ color: totalReal >= totalTarget ? "#22c55e" : "#ef4444" }}>{pctTotal}%</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <ProgressBar value={totalReal} max={totalTarget || 1} color="#6366f1" />
                  </CardContent>
                </Card>

                <Card className="border border-green-200 bg-green-50/40 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Aktif</p>
                        <p className="text-3xl font-extrabold text-foreground mt-1">{aktifCount}</p>
                        <p className="text-xs text-green-600 mt-1">target: {targetAktif}</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                    <ProgressBar value={aktifCount} max={targetAktif || 1} color="#22c55e" />
                  </CardContent>
                </Card>

                <Card className="border border-blue-200 bg-blue-50/40 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Perpanjangan</p>
                        <p className="text-3xl font-extrabold text-foreground mt-1">{perpanjanganCount}</p>
                        <p className="text-xs text-blue-600 mt-1">target: {targetPerpanjangan}</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <ProgressBar value={perpanjanganCount} max={targetPerpanjangan || 1} color="#3b82f6" />
                  </CardContent>
                </Card>
              </div>

              {/* KADALUARSA + TIDAK AKTIF + SELISIH */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <Card className="border border-yellow-200 bg-yellow-50/40 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-yellow-700 uppercase tracking-wide">Kadaluarsa</p>
                        <p className="text-3xl font-extrabold text-foreground mt-1">{kadaluarsaCount}</p>
                        <p className="text-xs text-yellow-600 mt-1">target: {targetKadaluarsa}</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      </div>
                    </div>
                    <ProgressBar value={kadaluarsaCount} max={targetKadaluarsa || 1} color="#facc15" />
                  </CardContent>
                </Card>

                <Card className="border border-orange-200 bg-orange-50/40 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-orange-700 uppercase tracking-wide">Tidak Aktif</p>
                        <p className="text-3xl font-extrabold text-foreground mt-1">{tidakAktifCount}</p>
                        <p className="text-xs text-orange-600 mt-1">target: {targetTidakAktif}</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-orange-600" />
                      </div>
                    </div>
                    <ProgressBar value={tidakAktifCount} max={targetTidakAktif || 1} color="#f97316" />
                  </CardContent>
                </Card>

                <Card className={`border shadow-sm ${trend >= 0 ? "border-green-200 bg-green-50/40" : "border-red-200 bg-red-50/40"}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`text-xs font-medium uppercase tracking-wide ${trend >= 0 ? "text-green-700" : "text-red-700"}`}>Selisih</p>
                        <p className="text-3xl font-extrabold text-foreground mt-1">{trend >= 0 ? `+${trend}` : trend}</p>
                        <p className={`text-xs mt-1 ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>{trend >= 0 ? "di atas target" : "di bawah target"}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${trend >= 0 ? "bg-green-100" : "bg-red-100"}`}>
                        {trend >= 0 ? <ArrowUpRight className="w-5 h-5 text-green-600" /> : <ArrowDownRight className="w-5 h-5 text-red-600" />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* TREND INDICATOR */}
            {lastYearCount > 0 && (
              <div className={cn("flex items-center gap-3 rounded-xl border px-5 py-3", trend >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
                {trend >= 0 ? <TrendingUp className="w-5 h-5 text-green-600 shrink-0" /> : <TrendingDown className="w-5 h-5 text-red-600 shrink-0" />}
                <div>
                  <p className="text-sm font-semibold" style={{ color: trend >= 0 ? "#16a34a" : "#dc2626" }}>
                    {trend >= 0 ? `+${trendPct}%` : `${trendPct}%`} dibanding tahun sebelumnya
                  </p>
                  <p className="text-xs text-muted-foreground">{totalReal} dokumen tahun {activeYear} vs {lastYearCount} dokumen tahun {lastYear}</p>
                </div>
              </div>
            )}

            {/* SECTION 3: PER JENIS DOKUMEN */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Pencapaian Per Jenis Dokumen</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { key: "MOU", label: "Nota Kesepahaman", target: targetMou, real: realMou, pct: pctMou, color: JENIS_COLORS["MOU"], icon: "📄" },
                  { key: "MOA", label: "Perjanjian Kerjasama", target: targetMoa, real: realMoa, pct: pctMoa, color: JENIS_COLORS["MOA"], icon: "📋" },
                  { key: "IA", label: "Implementing Agreement", target: targetIa, real: realIa, pct: pctIa, color: JENIS_COLORS["IA"], icon: "📑" },
                ].map((item) => (
                  <Card key={item.key} className="border shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-3xl font-extrabold" style={{ color: item.color }}>{item.real}</p>
                          <p className="font-semibold text-foreground mt-1">Dokumen {item.key}</p>
                          <p className="text-xs text-muted-foreground">{item.label}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${item.color}18` }}>
                          {item.icon}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-muted/40 rounded-lg p-3 text-center">
                          <p className="text-xs text-muted-foreground">Target</p>
                          <p className="text-lg font-bold text-foreground">{item.target}</p>
                        </div>
                        <div className="bg-muted/40 rounded-lg p-3 text-center">
                          <p className="text-xs text-muted-foreground">Realisasi</p>
                          <p className="text-lg font-bold" style={{ color: item.color }}>{item.real}</p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Capaian</span>
                          <span className="font-bold" style={{ color: item.color }}>{item.pct}%</span>
                        </div>
                        <ProgressBar value={item.real} max={item.target || 1} color={item.color} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
