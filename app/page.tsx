"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { StatsCards } from "@/components/stats-cards";
import { DonutChart } from "@/components/donut-chart";
import { BarChart } from "@/components/bar-chart";
import { cn } from "@/lib/utils";

type DashboardResponse = {
  totalKerjasama?: number;
  kerjasamaAktif?: number;
  menungguValidasi?: number;
  totalRealisasi?: number;
  totalPencairan?: number;
};

type LaporanItem = {
  jenis?: string;
  jenisDokumen?: string;
  status?: string;
  statusDokumen?: string;
  tanggalMulai?: string;
  tglMulai?: string;
  createdAt?: string;
};

const statusColors: Record<string, string> = {
  Aktif: "#22c55e",
  Kadaluarsa: "#facc15",
  Perpanjangan: "#3b82f6",
  "Tidak Aktif": "#f97316",
};

function documentType(item: LaporanItem) {
  const value = String(item.jenisDokumen ?? item.jenis ?? "").toUpperCase();
  if (value.includes("MOU")) return "MoU";
  if (value.includes("MOA")) return "MoA";
  if (value.includes("IA")) return "IA";
  return null;
}

function documentStatus(item: LaporanItem) {
  const value = String(item.statusDokumen ?? item.status ?? "").toLowerCase().replace(/\s+/g, "");
  if (value.includes("tidakaktif")) return "Tidak Aktif";
  if (value.includes("kadaluarsa")) return "Kadaluarsa";
  if (value.includes("perpanjangan")) return "Perpanjangan";
  if (value.includes("aktif")) return "Aktif";
  return "Aktif";
}

function documentYear(item: LaporanItem) {
  const rawDate = item.tanggalMulai ?? item.tglMulai ?? item.createdAt;
  const parsed = rawDate ? new Date(rawDate).getFullYear() : Number.NaN;
  return Number.isFinite(parsed) ? parsed : new Date().getFullYear();
}

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [laporanData, setLaporanData] = useState<LaporanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "SIKERMA - Dashboard";
    Promise.allSettled([apiFetch("/dashboard"), apiFetch("/laporan")])
      .then(([dashboardRes, laporanRes]) => {
        if (dashboardRes.status === "fulfilled") {
          setDashboard(dashboardRes.value ?? null);
        }

        if (laporanRes.status === "fulfilled") {
          setLaporanData(Array.isArray(laporanRes.value?.data) ? laporanRes.value.data : []);
        }

        if (dashboardRes.status === "rejected" || laporanRes.status === "rejected") {
          setError("Sebagian data dashboard gagal dimuat");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const statsData = laporanData.reduce(
    (acc, item) => {
      const type = documentType(item);
      const status = documentStatus(item);

      if (type === "MoU") {
        acc.mou += 1;
        if (status === "Aktif") acc.activeMou += 1;
      }
      if (type === "MoA") {
        acc.moa += 1;
        if (status === "Aktif") acc.activeMoa += 1;
      }
      if (type === "IA") {
        acc.ia += 1;
        if (status === "Aktif") acc.activeIa += 1;
      }

      return acc;
    },
    { mou: 0, moa: 0, ia: 0, activeMou: 0, activeMoa: 0, activeIa: 0 },
  );

  const donutData = ["Aktif", "Kadaluarsa", "Perpanjangan", "Tidak Aktif"].map((status) => {
    const items = laporanData.filter((item) => documentStatus(item) === status);
    const mou = items.filter((item) => documentType(item) === "MoU").length;
    const moa = items.filter((item) => documentType(item) === "MoA").length;
    const ia = items.filter((item) => documentType(item) === "IA").length;

    return {
      name: status,
      value: items.length,
      color: statusColors[status],
      detail: `MoU: ${mou} | MoA: ${moa} | IA: ${ia}`,
    };
  });

  const barData = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - 9 + i;
    const items = laporanData.filter((item) => documentYear(item) === year);

    return {
      year: String(year),
      MoU: items.filter((item) => documentType(item) === "MoU").length,
      MoA: items.filter((item) => documentType(item) === "MoA").length,
      IA: items.filter((item) => documentType(item) === "IA").length,
    };
  });

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
          sidebarExpanded ? "md:ml-64" : "md:ml-[72px]",
        )}
      >
        <div className="flex flex-col min-h-screen">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              <h1 className="text-2xl md:text-3xl font-bold">
                Informasi Kerjasama
              </h1>

              <p className="text-sm text-muted-foreground">
                Dashboard statistik dokumen kerjasama
              </p>

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Gagal memuat data dashboard dari Laravel API. Pastikan backend berjalan di port 8000.
                </div>
              )}

              <StatsCards data={statsData} />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-xs text-muted-foreground uppercase">Total Kerjasama</p>
                  <p className="mt-1 text-2xl font-bold">{dashboard?.totalKerjasama ?? laporanData.length}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-xs text-muted-foreground uppercase">Kerjasama Aktif</p>
                  <p className="mt-1 text-2xl font-bold">{dashboard?.kerjasamaAktif ?? statsData.activeMou + statsData.activeMoa + statsData.activeIa}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-xs text-muted-foreground uppercase">Menunggu Validasi</p>
                  <p className="mt-1 text-2xl font-bold">{dashboard?.menungguValidasi ?? 0}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-xs text-muted-foreground uppercase">Total Realisasi</p>
                  <p className="mt-1 text-2xl font-bold">{dashboard?.totalRealisasi ?? 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <DonutChart data={donutData} />
                <div className="lg:col-span-2">
                  <BarChart data={barData} loading={loading} />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
