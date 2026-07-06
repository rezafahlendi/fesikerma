"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";
import { Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  apiFetch,
  fetchManyReferences,
  fetchReferenceOptionItems,
  type ReferenceOption,
} from "@/lib/api";
import { ArrowLeft, Save, X, Eye, Loader2 } from "lucide-react";
import {
  Select as ShadcnSelect,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";

/* ================= PAGE ================= */
export default function EditRepositoryPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  useEffect(() => {
    document.title = "SIKERMA - Repository";
  }, []);
  /* ===== UI STATE ===== */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ===== FORM STATE (EDIT MODE) ===== */
  const [statusDokumen, setStatusDokumen] = useState("");
  const [jenisDokumen, setJenisDokumen] = useState("");
  const [skalaKerjasama, setSkalaKerjasama] = useState("");
  const [sumberPendanaan, setSumberPendanaan] = useState("");
  const [unitPenanggungJawab, setUnitPenanggungJawab] = useState("");
  const [showEditSuccess, setShowEditSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [referenceOptions, setReferenceOptions] = useState({
    statusDokumen: [] as string[],
    jenisDokumen: [] as string[],
    sumberPendanaan: [] as string[],
    unitKerja: [] as string[],
    mitra: [] as string[],
    klasifikasiMitra: [] as string[],
    bidangUsaha: [] as string[],
    negara: [] as string[],
    bentukKegiatan: [] as string[],
    sasaran: [] as string[],
    indikator: [] as string[],
  });
  const [bentukKegiatanOptions, setBentukKegiatanOptions] = useState<ReferenceOption[]>([]);

  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalBerakhir, setTanggalBerakhir] = useState("");
  const [nomorDokumen, setNomorDokumen] = useState("");
  const [judulKerjasama, setJudulKerjasama] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [anggaran, setAnggaran] = useState("");
  const [namaPenanggungJawab, setNamaPenanggungJawab] = useState("");

  //Penggiat
  const [openPenggiat, setOpenPenggiat] = useState(false);
  const [penggiat, setPenggiat] = useState({
    pihakKe: "",
    instansi: "",
    namaPenandatangan: "",
    jabatanPenandatangan: "",
    namaPenanggungJawab: "",
    jabatanPenanggungJawab: "",
    emailPenanggungJawab: "",
  });

  //Data Penggiat
  const [openDataPenggiat, setOpenDataPenggiat] = useState(false);
  const [dataPenggiat, setDataPenggiat] = useState({
    klasifikasiMitra: "",
    namaMitra: "",
    bidangUsaha: "",
    negara: "",
    provinsi: "",
    alamat: "",
    npwp: "",
    noTelp: "",
    noFax: "",
    email: "",
    website: "",
  });

  //Bentuk Kegiatan
  const [openBentukKegiatan, setOpenBentukKegiatan] = useState(false);
  const [bentukKegiatan, setBentukKegiatan] = useState({
    bentukKegiatanId: "",
    bentuk: "",
    penerimaan: "",
    volume: "",
    satuan: "",
    sasaran: "",
    indikator: "",
    keterangan: "",
  });

  /* ===== PENGGIAT LIST ===== */
  const [penggiatList, setPenggiatList] = useState([
    {
      id: 1,
      pihakKe: 1,
      instansi: "KPU Provinsi Lampung",
      namaPenandatangan: "Drs. Amrozie W. M.M",
      jabatanPenandatangan: "Sekretaris KPU Prov. Lampung",
      namaPenanggungJawab: "",
      jabatanPenanggungJawab: "",
      emailPenanggungJawab: "",
      open: false,
    },
    {
      id: 2,
      pihakKe: 2,
      instansi: "Universitas Lampung",
      namaPenandatangan: "Dr. Ing. Ardian Ulvan, S.T., M.Sc",
      jabatanPenandatangan: "Kepala UPT TIK Unila",
      namaPenanggungJawab: "",
      jabatanPenanggungJawab: "",
      emailPenanggungJawab: "",
      open: false,
    },
  ]);

  const [editingPenggiat, setEditingPenggiat] = useState<any | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<any | null>(null);

  /* ===== FETCH DATA BY ID ===== */
  useEffect(() => {
    if (!id) return;

    let active = true;

    const fetchRepository = async () => {
      try {
        setLoading(true);
        const item = await apiFetch(`/repository/${id}`);

        if (!active) return;

        setStatusDokumen(item.statusDokumen ?? item.status ?? "");
        setJenisDokumen(item.jenisDokumen ?? item.jenis ?? "");
        setSkalaKerjasama(item.skalaKerjasama ?? item.skala ?? "");
        setSumberPendanaan(item.sumberPendanaan ?? item.sumberDana ?? "");
        setUnitPenanggungJawab(item.unitPenanggungJawab ?? "");
        setNamaPenanggungJawab(
          item.namaPenanggungJawab ?? item.penanggungJawab ?? "",
        );

        setTanggalMulai(item.tanggalMulai ?? item.tglMulai ?? "");
        setTanggalBerakhir(item.tanggalBerakhir ?? item.tglBerakhir ?? "");
        setNomorDokumen(item.nomorDokumen ?? item.nomor ?? "");
        setJudulKerjasama(item.judulKerjasama ?? item.judul ?? "");
        setDeskripsi(item.deskripsi ?? "");
        setAnggaran(String(item.jumlahAnggaran ?? item.anggaran ?? ""));

        const dokumenUtama = Array.isArray(item.dokumen)
          ? item.dokumen.find((doc: any) => doc.linkUrl || doc.link_url)
          : null;
        setLinkDokumen(dokumenUtama?.linkUrl ?? dokumenUtama?.link_url ?? "");

        const bentukItems = await apiFetch(
          `/repository/${id}/bentuk-kegiatan`,
        );
        const bentukPertama = Array.isArray(bentukItems)
          ? bentukItems[0]
          : null;

        if (bentukPertama) {
          setBentukKegiatan({
            bentukKegiatanId: bentukPertama.bentukKegiatanId ?? bentukPertama.idBentukKegiatan ?? "",
            bentuk: bentukPertama.bentuk ?? "",
            penerimaan: String(bentukPertama.penerimaan ?? ""),
            volume: String(bentukPertama.volume ?? ""),
            satuan: bentukPertama.satuan ?? "",
            sasaran: bentukPertama.sasaran ?? "",
            indikator: bentukPertama.indikator ?? "",
            keterangan: bentukPertama.keterangan ?? "",
          });
        }
      } catch (error) {
        console.error("Gagal mengambil data repository", error);
        alert("Gagal mengambil data repository");
        router.push("/kerjasama/my-data");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchRepository();

    return () => {
      active = false;
    };
  }, [id, router]);

  useEffect(() => {
    let active = true;

    fetchReferenceOptionItems("bentuk-kegiatan")
      .then((items) => {
        if (active) setBentukKegiatanOptions(items);
      })
      .catch((error) => {
        console.error("Gagal mengambil referensi bentuk kegiatan", error);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    fetchManyReferences([
      "status-kerjasama",
      "jenis-dokumen",
      "sumber-dana",
      "unit-kerja",
      "mitra",
      "klasifikasi-mitra",
      "bidang-usaha",
      "countries",
      "bentuk-kegiatan",
      "sasaran-program",
      "indikator",
    ])
      .then((refs) => {
        if (!active) return;

        setReferenceOptions({
          statusDokumen: refs["status-kerjasama"] ?? [],
          jenisDokumen: refs["jenis-dokumen"] ?? [],
          sumberPendanaan: refs["sumber-dana"] ?? [],
          unitKerja: refs["unit-kerja"] ?? [],
          mitra: refs["mitra"] ?? [],
          klasifikasiMitra: refs["klasifikasi-mitra"] ?? [],
          bidangUsaha: refs["bidang-usaha"] ?? [],
          negara: refs["countries"] ?? [],
          bentukKegiatan: refs["bentuk-kegiatan"] ?? [],
          sasaran: refs["sasaran-program"] ?? [],
          indikator: refs["indikator"] ?? [],
        });
      })
      .catch((error) => {
        console.error("Gagal mengambil data referensi", error);
      });

    return () => {
      active = false;
    };
  }, []);

  /* ===== OPTIONS ===== */
  const BENTUK_KEGIATAN_OPTIONS = [
    "-Pilih-",
    "Pendidikan",
    "Penelitian",
    "Pengabdian Masyarakat",
    "Pelatihan",
  ];
  const SASARAN_OPTIONS = ["-Pilih-", "Mahasiswa", "Dosen", "Masyarakat"];
  const INDIKATOR_OPTIONS = ["-Pilih-", "Output", "Outcome", "Impact"];
  const statusDokumenOptions = [
    "-Pilih-",
    "Aktif",
    "Kadaluarsa",
    "Dalam Perpanjangan",
  ];
  const jenisDokumenOptions = [
    "-Pilih-",
    "MoU (Memorandum of Understanding)",
    "MoA (Memorandum of Aggreement) (PKS)",
    "IA (Implementation Arrangement) (PKS) ",
  ];
  const skalaKerjasamaOptions = ["-Pilih-", "Nasional", "Internasional"];
  const sumberPendanaanOptions = [
    "-Pilih-",
    "Direktorat PSD",
    "Direktorat PSMP",
    "Direktorat PSMA",
    "Direktorat PSMK",
    "Direktorat PKLK Dikdas",
    "Direktorat PKLK Dikmen",
    "Direktorat P2TK Dikdas",
    "Direktorat P2TK Dikmen",
    "Sekretariat Dikdas",
    "Sekretariat Dikmen",
    "Biro PKLN",
    "Pustekkom",
    "Puskurbuk",
    "Puspendik",
    "Balitbang",
    "Badan PSDMPK dan PMP",
    "Dikti",
    "Dinas Propinsi",
    "Dinas Kabupaten",
    "DIPA PTN",
    "DP2M Ristekdikti",
    "Insinas Ristekdikti",
    "Lembaga donor dalam negeri",
    "Lembaga donor luar negeri",
    "Dana mandiri",
    "Bantuan Swasta",
    "Bantuan Asing",
    "Lainnya",
  ];
  const unitPenanggungJawabOptions = [
    "-Pilih-",
    "Biro Akademik dan Kemahasiswaan",
    "Biro Umum dan Keuangan",
    "Biro Perencanaan dan Hubungan Masyarakat",
    "Fakultas Ekonomi dan Bisnis",
    "Fakultas Hukum",
    "Fakultas Keguruan dan Ilmu Pendidikan",
    "Fakultas Pertanian",
    "Fakultas Teknik",
    "Fakultas Ilmu Sosial dan Ilmu Politik",
    "Fakultas Matematika dan Ilmu Pengetahuan Alam",
    "Fakultas Kedokteran",
    "Pascasarjana",
    "Lembaga Penelitian dan Pengabdian kepada Masyarakat",
    "Lembaga Pengembangan Pembelajaran dan Penjaminan Mutu",
    "UPT Perpustakaan",
    "UPT Teknologi Informasi dan Komunikasi",
    "UPT Laboratorium Terpadu dan Sentra Inovasi Teknologi",
    "UPT Bahasa",
    "UPT Pengembangan Karir dan Kewirausahaan",
    "UPT Pengembangan Kerjasama dan Layanan Internasional",
    "Badan Pengelola Usaha",
    "UPT Kearsipan",
    "Satuan Pengendalian Internal",
    "Senat Unila",
  ];
  const namaInstansiOptions = [
    "-Pilih-",
    "Universitas Lampung",
    "Mahkamah Agung RI",
    "Kementerian",
  ];

  const BIDANG_USAHA_OPTIONS = [
    "-Pilih-",
    "Pertanian, Kehutanan, dan Perikanan",
    "Pertambangan dan Penggalian",
    "Industri Pengolahan",
    "Listrik, Gas, dan Listrik Air Bersih",
    "Pengelolaan Air Limbah dan Remediasi",
    "Konstruksi dan Perdagangan",
    "Pengangkutan dan Pergudangan",
    "Informasi dan Komunikasi",
    "Aktivitas Keuangan dan Asuransi",
    "Real Estat",
    "Pendidikan, Kesehatan, dan Sosial",
    "Kesenian dan Hiburan",
  ];
  const NEGARA_OPTIONS = [
    "-Pilih-",
    "Afghanistan",
    "Albania",
    "Aljazair",
    "Amerika Serikat",
    "Andorra",
    "Angola",
    "Antigua dan Barbuda",
    "Arab Saudi",
    "Argentina",
    "Armenia",
    "Australia",
    "Austria",
    "Azerbaijan",
    "Bahama",
    "Bahrain",
    "Bangladesh",
    "Barbados",
    "Belanda",
    "Belarus",
    "Belgia",
    "Belize",
    "Benin",
    "Bhutan",
    "Bolivia",
    "Bosnia dan Herzegovina",
    "Botswana",
    "Brasil",
    "Brunei Darussalam",
    "Bulgaria",
    "Burkina Faso",
    "Burundi",
    "Chad",
    "Chili",
    "China",
    "Denmark",
    "Dominika",
    "Ekuador",
    "El Salvador",
    "Eritrea",
    "Estonia",
    "Eswatini",
    "Ethiopia",
    "Fiji",
    "Filipina",
    "Finlandia",
    "Gabon",
    "Gambia",
    "Georgia",
    "Ghana",
    "Grenada",
    "Guatemala",
    "Guinea",
    "Guinea Khatulistiwa",
    "Guinea-Bissau",
    "Guyana",
    "Haiti",
    "Honduras",
    "Hongaria",
    "India",
    "Indonesia",
    "Inggris",
    "Irak",
    "Iran",
    "Irlandia",
    "Islandia",
    "Israel",
    "Italia",
    "Jamaika",
    "Jepang",
    "Jerman",
    "Kamboja",
    "Kamerun",
    "Kanada",
    "Kazakhstan",
    "Kenya",
    "Kirgizstan",
    "Kiribati",
    "Kolombia",
    "Komoro",
    "Kongo",
    "Korea Selatan",
    "Korea Utara",
    "Kosta Rika",
    "Kroasia",
    "Kuba",
    "Kuwait",
    "Laos",
    "Latvia",
    "Lebanon",
    "Lesotho",
    "Liberia",
    "Libya",
    "Liechtenstein",
    "Lituania",
    "Luksemburg",
    "Madagaskar",
    "Maladewa",
    "Malawi",
    "Malaysia",
    "Mali",
    "Malta",
    "Maroko",
    "Marshall Islands",
    "Mauritania",
    "Mauritius",
    "Meksiko",
    "Mesir",
    "Mikronesia",
    "Moldova",
    "Monako",
    "Mongolia",
    "Montenegro",
    "Mozambik",
    "Myanmar",
    "Namibia",
    "Nauru",
    "Nepal",
    "Niger",
    "Nigeria",
    "Norwegia",
    "Oman",
    "Pakistan",
    "Palau",
    "Panama",
    "Papua Nugini",
    "Paraguay",
    "Peru",
    "Polandia",
    "Portugal",
    "Qatar",
    "Republik Afrika Tengah",
    "Republik Ceko",
    "Republik Dominika",
    "Rumania",
    "Rusia",
    "Rwanda",
    "Saint Kitts dan Nevis",
    "Saint Lucia",
    "Saint Vincent dan Grenadines",
    "Samoa",
    "San Marino",
    "Sao Tome dan Principe",
    "Selandia Baru",
    "Senegal",
    "Serbia",
    "Seychelles",
    "Sierra Leone",
    "Singapura",
    "Siprus",
    "Slovakia",
    "Slovenia",
    "Solomon Islands",
    "Somalia",
    "Spanyol",
    "Sri Lanka",
    "Sudan",
    "Sudan Selatan",
    "Suriah",
    "Swedia",
    "Swiss",
    "Tajikistan",
    "Tanzania",
    "Thailand",
    "Timor Leste",
    "Togo",
    "Tonga",
    "Trinidad dan Tobago",
    "Tunisia",
    "Turki",
    "Turkmenistan",
    "Tuvalu",
    "Uganda",
    "Ukraina",
    "Uni Emirat Arab",
    "Uruguay",
    "Uzbekistan",
    "Vanuatu",
    "Vatikan",
    "Venezuela",
    "Vietnam",
    "Yaman",
    "Yordania",
    "Yunani",
    "Zambia",
    "Zimbabwe",
  ];
  const KLASIFIKASI_MITRA_OPTIONS = [
    "-Pilih-",
    "IKU - Perusahaan multinasional",
    "IKU - Perusahaan nasional berstandar tinggi",
    "IKU - Perusahaan teknologi global",
    "IKU - Perusahaan rintisan (startup company) teknologi",
    "IKU - Organisasi nirlaba kelas dunia",
    "IKU - Institusi/ Organisasi multilateral",
    "IKU - Instansi pemerintah, BUMN dan/atau BUMD",
    "IKU - Rumah Sakit",
    "IKU - UMKM",
    "IKU - Perguruan tinggi, fakultas, atau program studi dalam bidang yang relevan",
    "IKU - Institusi Pendidikan",
    "IKU - Organisasi",
    "NON IKU - Pemerintah Provinsi dan Kabupaten/Kota",
    "IKU - Perguruan tinggi yang masuk dalam daftar QS200",
    "IKU - Lembaga riset pemerintah, swasta, nasional maupun internasional",
    "IKU - Lembaga kebudayaan berskala nasional/bereputasi",
  ];

  const [termin1, setTermin1] = useState({ bulan: "", tahun: "", jumlah: "" });
  const [termin2, setTermin2] = useState({ bulan: "", tahun: "", jumlah: "" });
  const [termin3, setTermin3] = useState({ bulan: "", tahun: "", jumlah: "" });
  const TerminForm = ({ title, data, setData }: any) => (
    <div className="space-y-2">
      <h5 className="text-sm font-medium">
        {title} <span className="text-muted-foreground">(Opsional)</span>
      </h5>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          label="Bulan"
          value={data.bulan}
          onChange={(v) => setData({ ...data, bulan: v })}
          options={[
            "Januari",
            "Februari",
            "Maret",
            "April",
            "Mei",
            "Juni",
            "Juli",
            "Agustus",
            "September",
            "Oktober",
            "November",
            "Desember",
          ]}
        />

        <Input
          label="Tahun"
          type="number"
          value={data.tahun}
          onChange={(value: string) => setData({ ...data, tahun: value })}
        />

        <Input
          label="Jumlah (Rp)"
          value={data.jumlah}
          onChange={(value: string) => setData({ ...data, jumlah: value })}
        />
      </div>
    </div>
  );

  /* ===== FILE STATE ===== */
  const [fileDokumen, setFileDokumen] = useState<File | null>(null);
  const [fileKontrak, setFileKontrak] = useState<File | null>(null);
  const [fileKAK, setFileKAK] = useState<File | null>(null);
  const [fileRAB, setFileRAB] = useState<File | null>(null);
  const [linkDokumen, setLinkDokumen] = useState("");
  const [agree, setAgree] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  /* ===== UPDATE HANDLER ===== */
  const hasValue = (value: string) => value && value !== "-Pilih-";

  const filePayload = (jenisLampiran: string, file: File | null) =>
    file
      ? {
          jenisLampiran,
          fileName: file.name,
          filePath: file.name,
        }
      : null;

  const handleUpdate = async () => {
    if (!id || !isLinkValid) return;

    const dokumen = [
      filePayload("dokumen", fileDokumen),
      filePayload("kontrak", fileKontrak),
      filePayload("kak", fileKAK),
      filePayload("rab", fileRAB),
      linkDokumen
        ? {
            jenisLampiran: "link_dokumen",
            linkUrl: linkDokumen,
          }
        : null,
    ].filter(Boolean);

    const termin = [termin1, termin2, termin3].filter(
      (item) => item.bulan || item.tahun || item.jumlah,
    );

    const payload = {
      statusDokumen,
      jenisDokumen,
      skalaKerjasama,
      tanggalMulai,
      tanggalBerakhir,
      nomorDokumen,
      judulKerjasama,
      deskripsi,
      sumberPendanaan,
      unitPenanggungJawab,
      namaPenanggungJawab,
      jumlahAnggaran: anggaran,
      dokumen,
      termin,
      penggiat: hasValue(penggiat.instansi) ? penggiat : null,
      dataPenggiat: dataPenggiat.namaMitra ? dataPenggiat : null,
      bentukKegiatan: hasValue(bentukKegiatan.bentuk) ? bentukKegiatan : null,
    };

    try {
      setSaving(true);
      await apiFetch(`/repository/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      router.push("/kerjasama/my-data");
    } catch (error) {
      console.error("Gagal memperbarui repository", error);
      alert("Gagal memperbarui data repository");
    } finally {
      setSaving(false);
    }
  };

  /* ===== LOADING SPINNER (ELEGAN) ===== */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  /* ===== VALIDATION ===== */
  const isLinkValid = !linkDokumen || /^https?:\/\/.+/i.test(linkDokumen);

  const optionsWithFallback = (apiOptions: string[], fallbackOptions: string[]) =>
    apiOptions.length > 0 ? ["-Pilih-", ...apiOptions] : fallbackOptions;

  const optionItemsWithFallback = (
    apiOptions: ReferenceOption[],
    fallbackOptions: string[],
  ) => (apiOptions.length > 0 ? apiOptions : fallbackOptions);

  const findBentukKegiatanLabel = (value: string | number) =>
    bentukKegiatanOptions.find((item) => String(item.value) === String(value))?.label ??
    String(value);

  /* ===== RENDER ===== */
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
              <h1 className="text-xl md:text-2xl font-bold">Edit Repository</h1>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            </div>

            {/* FORM */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT */}
              <div className="space-y-6">
                <Section title="1. Masa Berlaku Dokumen">
                  <SearchableSelect
                    label="Status Dokumen"
                    value={statusDokumen}
                    onChange={(value) => setStatusDokumen(String(value))}
                    options={optionsWithFallback(
                      referenceOptions.statusDokumen,
                      statusDokumenOptions
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Tanggal Mulai"
                      type="date"
                      value={tanggalMulai}
                      onChange={setTanggalMulai}
                    />
                    <Input
                      label="Tanggal Berakhir"
                      type="date"
                      value={tanggalBerakhir}
                      onChange={setTanggalBerakhir}
                    />
                  </div>
                </Section>

                <Section title="2. Dokumen Kerjasama">
                  <SearchableSelect
                    label="Jenis Dokumen"
                    value={jenisDokumen}
                    onChange={(value) => setJenisDokumen(String(value))}
                    options={optionsWithFallback(
                      referenceOptions.jenisDokumen,
                      jenisDokumenOptions
                    )}
                  />
                  <Input
                    label="Nomor Dokumen"
                    value={nomorDokumen}
                    onChange={setNomorDokumen}
                  />
                  <Input
                    label="Judul Kerjasama"
                    value={judulKerjasama}
                    onChange={setJudulKerjasama}
                  />
                  <Textarea
                    label="Deskripsi Kegiatan"
                    value={deskripsi}
                    onChange={setDeskripsi}
                  />
                  <SearchableSelect
                    label="Skala Kerjasama"
                    value={skalaKerjasama}
                    onChange={(value) => setSkalaKerjasama(String(value))}
                    options={skalaKerjasamaOptions}
                  />
                </Section>

                <Section title="3. File Dokumen">
                  <div className="space-y-6">
                    {/* DOKUMEN UTAMA */}
                    <div className="rounded-md border p-4 bg-muted/20 space-y-4">
                      <h4 className="text-sm font-semibold text-foreground">
                        Dokumen Utama Kerjasama
                      </h4>

                      <FileInput
                        label="Upload Dokumen"
                        maxSizeMB={5}
                        file={fileDokumen}
                        setFile={setFileDokumen}
                        onView={setPreviewFile}
                      />

                      <div className="space-y-1">
                        <Input
                          label="Link Dokumen"
                          value={linkDokumen}
                          onChange={setLinkDokumen}
                          error={
                            !isLinkValid
                              ? "Link harus URL publik (http/https)"
                              : ""
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Gunakan link Google Drive / OneDrive (akses publik).
                          Kosongkan jika Anda mengunggah file.
                        </p>
                      </div>
                    </div>

                    {/* DOKUMEN PENDUKUNG */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-foreground">
                        Dokumen Pendukung
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FileInput
                          label="Upload Kontrak"
                          maxSizeMB={2}
                          file={fileKontrak}
                          setFile={setFileKontrak}
                          onView={setPreviewFile}
                        />

                        <FileInput
                          label="Upload KAK"
                          maxSizeMB={2}
                          file={fileKAK}
                          setFile={setFileKAK}
                          onView={setPreviewFile}
                        />

                        <FileInput
                          label="Upload RAB"
                          maxSizeMB={2}
                          file={fileRAB}
                          setFile={setFileRAB}
                          onView={setPreviewFile}
                        />
                      </div>
                    </div>
                  </div>
                </Section>
              </div>

              {/* RIGHT */}
              <div className="space-y-6">
                <Section title="4. Unit Pelaksana">
                  <p className="text-sm text-muted-foreground">
                    UPA Teknologi Informasi dan Komunikasi
                  </p>
                </Section>

                <Section title="5. Anggaran Kerjasama">
                  <SearchableSelect
                    label="Sumber Pendanaan"
                    value={sumberPendanaan}
                    onChange={(value) => setSumberPendanaan(String(value))}
                    options={optionsWithFallback(
                      referenceOptions.sumberPendanaan,
                      sumberPendanaanOptions
                    )}
                  />

                  <Input
                    label="Jumlah Anggaran (Rp)"
                    value={anggaran}
                    onChange={setAnggaran}
                  />

                  <Input
                    label="Nama Penanggung Jawab"
                    value={namaPenanggungJawab}
                    onChange={setNamaPenanggungJawab}
                  />

                  <SearchableSelect
                    label="Unit Penanggung Jawab"
                    value={unitPenanggungJawab}
                    onChange={(value) =>
                      setUnitPenanggungJawab(String(value))
                    }
                    options={optionsWithFallback(
                      referenceOptions.unitKerja,
                      unitPenanggungJawabOptions
                    )}
                  />

                  {/* ===== TERMIN PENCAIRAN ===== */}
                  <div className="mt-6 space-y-6">
                    <TerminForm
                      title="Rencana Pencairan Termin 1"
                      data={termin1}
                      setData={setTermin1}
                    />

                    <TerminForm
                      title="Rencana Pencairan Termin 2"
                      data={termin2}
                      setData={setTermin2}
                    />

                    <TerminForm
                      title="Rencana Pencairan Termin 3"
                      data={termin3}
                      setData={setTermin3}
                    />
                  </div>
                </Section>

                <Section title="6. Penggiat Kerjasama">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingPenggiat({
                            pihakKe: "",
                            instansi: "",
                            namaPenandatangan: "",
                            jabatanPenandatangan: "",
                            namaPenanggungJawab: "",
                            jabatanPenanggungJawab: "",
                            emailPenanggungJawab: "",
                          });
                          setOpenPenggiat(true);
                        }}
                      >
                        + Tambah Penggiat
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setOpenDataPenggiat(true)}
                      >
                        + Penggiat Baru
                      </Button>
                    </div>
                  </div>

                  {/* DataPenggiat */}
                  {openDataPenggiat && (
                    <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-4">
                      <div
                        className="
      bg-white rounded-xl shadow-xl
      w-full max-w-3xl
      max-h-[90vh]
      flex flex-col
    "
                      >
                        {/* HEADER */}
                        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
                          <h3 className="text-sm font-semibold">
                            Data Penggiat Kerjasama
                          </h3>
                          <button onClick={() => setOpenDataPenggiat(false)}>
                            <X className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>

                        {/* BODY */}
                        <div className="px-5 py-4 space-y-4 text-sm overflow-y-auto">
                          <SearchableSelect
                            label="Klasifikasi Mitra Kerjasama"
                            size="xs"
                            options={optionsWithFallback(
                              referenceOptions.klasifikasiMitra,
                              KLASIFIKASI_MITRA_OPTIONS
                            )}
                            value={dataPenggiat.klasifikasiMitra}
                            onChange={(v) =>
                              setDataPenggiat({
                                ...dataPenggiat,
                                klasifikasiMitra: String(v),
                              })
                            }
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ModalInput
                              label="Nama Mitra"
                              placeholder="nama mitra"
                              value={dataPenggiat.namaMitra}
                              onChange={(v) =>
                                setDataPenggiat({
                                  ...dataPenggiat,
                                  namaMitra: v,
                                })
                              }
                            />

                            <SearchableSelect
                              label="Bidang Usaha"
                              size="xs"
                              options={optionsWithFallback(
                                referenceOptions.bidangUsaha,
                                BIDANG_USAHA_OPTIONS
                              )}
                              value={dataPenggiat.bidangUsaha}
                              onChange={(v) =>
                                setDataPenggiat({
                                  ...dataPenggiat,
                                  bidangUsaha: String(v),
                                })
                              }
                            />

                            <SearchableSelect
                              label="Negara"
                              size="xs"
                              value={dataPenggiat.negara}
                              options={optionsWithFallback(
                                referenceOptions.negara,
                                NEGARA_OPTIONS
                              )}
                              onChange={(v) =>
                                setDataPenggiat({
                                  ...dataPenggiat,
                                  negara: String(v),
                                })
                              }
                            />

                            <ModalInput
                              label="Provinsi"
                              value={dataPenggiat.provinsi}
                              placeholder="Provinsi"
                              onChange={(v) =>
                                setDataPenggiat({
                                  ...dataPenggiat,
                                  provinsi: v,
                                })
                              }
                            />
                          </div>

                          <ModalInput
                            label="Alamat"
                            placeholder="alamat lengkap"
                            value={dataPenggiat.alamat}
                            onChange={(v) =>
                              setDataPenggiat({ ...dataPenggiat, alamat: v })
                            }
                          />

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <ModalInput
                              label="NPWP"
                              placeholder="npwp"
                              value={dataPenggiat.npwp}
                              onChange={(v) =>
                                setDataPenggiat({ ...dataPenggiat, npwp: v })
                              }
                            />

                            <ModalInput
                              label="No. Telp"
                              placeholder="nomor telepon"
                              value={dataPenggiat.noTelp}
                              onChange={(v) =>
                                setDataPenggiat({ ...dataPenggiat, noTelp: v })
                              }
                            />

                            <ModalInput
                              label="No. Fax"
                              placeholder="nomor fax"
                              value={dataPenggiat.noFax}
                              onChange={(v) =>
                                setDataPenggiat({ ...dataPenggiat, noFax: v })
                              }
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ModalInput
                              label="Email"
                              placeholder="email"
                              value={dataPenggiat.email}
                              onChange={(v) =>
                                setDataPenggiat({ ...dataPenggiat, email: v })
                              }
                            />

                            <ModalInput
                              label="URL Website"
                              placeholder="https://"
                              value={dataPenggiat.website}
                              onChange={(v) =>
                                setDataPenggiat({ ...dataPenggiat, website: v })
                              }
                            />
                          </div>
                        </div>

                        {/* FOOTER */}
                        <div className="flex justify-end gap-2 px-5 py-4 border-t shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOpenDataPenggiat(false)}
                          >
                            Close
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setOpenDataPenggiat(false)}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Bentuk Kegiatan */}
                  {openBentukKegiatan && (
                    <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-4">
                      <div
                        className="
      bg-white rounded-xl shadow-xl
      w-full max-w-3xl
      max-h-[90vh]
      flex flex-col
    "
                      >
                        {/* HEADER */}
                        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
                          <h3 className="text-sm font-semibold">
                            Bentuk Kegiatan
                          </h3>
                          <button onClick={() => setOpenBentukKegiatan(false)}>
                            <X className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>

                        {/* BODY */}
                        <div className="px-5 py-4 space-y-4 text-sm overflow-y-auto">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SearchableSelect
                              label="Bentuk Kegiatan"
                              size="xs"
                              value={bentukKegiatan.bentukKegiatanId || bentukKegiatan.bentuk}
                              options={optionItemsWithFallback(
                                bentukKegiatanOptions,
                                BENTUK_KEGIATAN_OPTIONS
                              )}
                              onChange={(v) =>
                                setBentukKegiatan({
                                  ...bentukKegiatan,
                                  bentukKegiatanId: bentukKegiatanOptions.length > 0 ? String(v) : "",
                                  bentuk: findBentukKegiatanLabel(v),
                                })
                              }
                            />

                            <ModalInput
                              label="Penerimaan Anggaran"
                              placeholder="Rp..."
                              value={bentukKegiatan.penerimaan}
                              onChange={(v) =>
                                setBentukKegiatan({
                                  ...bentukKegiatan,
                                  penerimaan: v,
                                })
                              }
                            />

                            <ModalInput
                              label="Volume Kegiatan"
                              placeholder="volume"
                              value={bentukKegiatan.volume}
                              onChange={(v) =>
                                setBentukKegiatan({
                                  ...bentukKegiatan,
                                  volume: v,
                                })
                              }
                            />

                            <ModalInput
                              label="Satuan"
                              placeholder="satuan kegiatan"
                              value={bentukKegiatan.satuan}
                              onChange={(v) =>
                                setBentukKegiatan({
                                  ...bentukKegiatan,
                                  satuan: v,
                                })
                              }
                            />

                            <SearchableSelect
                              label="Sasaran"
                              size="xs"
                              value={bentukKegiatan.sasaran}
                              options={optionsWithFallback(
                                referenceOptions.sasaran,
                                SASARAN_OPTIONS
                              )}
                              onChange={(v) =>
                                setBentukKegiatan({
                                  ...bentukKegiatan,
                                  sasaran: String(v),
                                })
                              }
                            />

                            <SearchableSelect
                              label="Indikator"
                              size="xs"
                              required={false}
                              value={bentukKegiatan.indikator}
                              options={optionsWithFallback(
                                referenceOptions.indikator,
                                INDIKATOR_OPTIONS
                              )}
                              onChange={(v) =>
                                setBentukKegiatan({
                                  ...bentukKegiatan,
                                  indikator: String(v),
                                })
                              }
                            />
                          </div>

                          <div>
                            <label className="text-xs font-medium">
                              Keterangan
                            </label>
                            <textarea
                              placeholder="keterangan"
                              value={bentukKegiatan.keterangan}
                              onChange={(e) =>
                                setBentukKegiatan({
                                  ...bentukKegiatan,
                                  keterangan: e.target.value,
                                })
                              }
                              className="w-full border rounded-md px-3 py-2 text-sm min-h-[90px]
            focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                          </div>
                        </div>

                        {/* FOOTER */}
                        <div className="flex justify-end gap-2 px-5 py-4 border-t shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOpenBentukKegiatan(false)}
                          >
                            Close
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setOpenBentukKegiatan(false)}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {openPenggiat && editingPenggiat && (
                    <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl w-full max-w-xl">
                        <div className="flex justify-between items-center px-5 py-4 border-b">
                          <h3 className="text-sm font-semibold">
                            Penggiat Kerjasama
                          </h3>
                          <button onClick={() => setOpenPenggiat(false)}>
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="p-5 space-y-4 text-sm">
                          <ModalInput
                            label="Pihak Ke"
                            placeholder="1, 2, 3, dst."
                            value={editingPenggiat.pihakKe}
                            onChange={(v: any) =>
                              setEditingPenggiat({
                                ...editingPenggiat,
                                pihakKe: v,
                              })
                            }
                          />
                          <SearchableSelect
                            label="Nama Instansi"
                            size="xs"
                            options={optionsWithFallback(
                              referenceOptions.mitra,
                              namaInstansiOptions
                            )}
                            value={editingPenggiat.instansi}
                            onChange={(v: any) =>
                              setEditingPenggiat({
                                ...editingPenggiat,
                                instansi: String(v),
                              })
                            }
                          />
                          <ModalInput
                            label="Nama Penandatangan"
                            placeholder="nama pejabat"
                            value={editingPenggiat.namaPenandatangan}
                            onChange={(v: any) =>
                              setEditingPenggiat({
                                ...editingPenggiat,
                                namaPenandatangan: v,
                              })
                            }
                          />
                          <ModalInput
                            label="Jabatan Penandatangan"
                            placeholder="jabatan"
                            value={editingPenggiat.jabatanPenandatangan}
                            onChange={(v: any) =>
                              setEditingPenggiat({
                                ...editingPenggiat,
                                jabatanPenandatangan: v,
                              })
                            }
                          />
                          <ModalInput
                            label="Email Penanggungjawab"
                            placeholder="nama penanggungjawab"
                            value={editingPenggiat.emailPenanggungJawab}
                            onChange={(v: any) =>
                              setEditingPenggiat({
                                ...editingPenggiat,
                                emailPenanggungJawab: v,
                              })
                            }
                          />

                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Note! Jika Nama Instansi penggiat tidak ada dalam
                            database, silahkan buat data baru di tombol{" "}
                            <b>"Penggiat Baru"</b>.
                          </p>
                        </div>

                        <div className="flex justify-end gap-2 px-5 py-4 border-t">
                          <Button
                            variant="outline"
                            onClick={() => setOpenPenggiat(false)}
                          >
                            Close
                          </Button>
                          <Button
                            onClick={() => {
                              setPenggiatList((prev) =>
                                prev.map((x) =>
                                  x.id === editingPenggiat.id
                                    ? editingPenggiat
                                    : x,
                                ),
                              );

                              setOpenPenggiat(false);
                              setShowEditSuccess(true);

                              // auto close notif (opsional)
                              setTimeout(() => {
                                setShowEditSuccess(false);
                              }, 2000);
                            }}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {showEditSuccess && (
                    <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center">
                      <div className="bg-white rounded-xl p-6 w-full max-w-sm text-center space-y-4 shadow-lg">
                        <div className="flex justify-center">
                          <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>

                        <p className="text-base font-medium text-green-600">
                          Berhasil
                        </p>

                        <p className="text-sm text-muted-foreground">
                          Data penggiat berhasil diperbarui
                        </p>

                        <div className="flex justify-center">
                          <Button
                            size="sm"
                            onClick={() => setShowEditSuccess(false)}
                          >
                            OK
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {showDeleteConfirm && (
                    <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center">
                      <div className="bg-white rounded-xl p-6 w-full max-w-sm text-center space-y-4 shadow-lg">
                        <div className="flex justify-center">
                          <Trash2 className="w-10 h-10 text-red-600" />
                        </div>

                        <p className="text-base font-medium text-red-600">
                          Hapus Data
                        </p>

                        <p className="text-sm text-muted-foreground">
                          Apakah kamu yakin ingin menghapus penggiat
                          <b className="mx-1">{showDeleteConfirm.instansi}</b>?
                        </p>

                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowDeleteConfirm(null)}
                          >
                            Batal
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => {
                              setPenggiatList((prev) =>
                                prev.filter(
                                  (x) => x.id !== showDeleteConfirm.id,
                                ),
                              );
                              setShowDeleteConfirm(null);
                            }}
                          >
                            Hapus
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {penggiatList.map((p) => (
                      <div key={p.id} className="border rounded-md bg-white">
                        {/* HEADER */}
                        <button
                          className="w-full flex justify-between items-center px-4 py-3 text-sm font-medium"
                          onClick={() =>
                            setPenggiatList((prev) =>
                              prev.map((x) =>
                                x.id === p.id ? { ...x, open: !x.open } : x,
                              ),
                            )
                          }
                        >
                          <span>
                            # Pihak Ke-{p.pihakKe} {p.instansi}
                          </span>
                          <span>{p.open ? "▲" : "▼"}</span>
                        </button>

                        {/* BODY */}
                        {p.open && (
                          <div className="px-4 pb-4 space-y-3 text-sm">
                            <div className="bg-purple-50 border rounded-md p-3">
                              <p className="text-xs text-muted-foreground">
                                Pejabat Penandatangan
                              </p>
                              <p className="font-medium">
                                {p.namaPenandatangan} ({p.jabatanPenandatangan})
                              </p>
                            </div>

                            <div className="bg-blue-50 border rounded-md p-3">
                              <p className="text-xs text-muted-foreground">
                                Penanggungjawab
                              </p>
                              <p>{p.namaPenanggungJawab || "-"}</p>
                            </div>

                            <div className="bg-green-50 border rounded-md p-3">
                              <p className="text-xs text-muted-foreground">
                                E-mail
                              </p>
                              <p>{p.emailPenanggungJawab || "-"}</p>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex items-center gap-1"
                                onClick={() => {
                                  setEditingPenggiat(p);
                                  setOpenPenggiat(true);
                                }}
                              >
                                <Pencil className="w-4 h-4" />
                                Edit
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowDeleteConfirm(p)}
                                className="
    flex items-center gap-1
    text-foreground
    border-border
    hover:bg-red-600
    hover:border-red-600
    hover:text-white
  "
                              >
                                <Trash2 className="w-4 h-4" />
                                Hapus
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="7. Bentuk Kegiatan">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setOpenBentukKegiatan(true)}
                  >
                    + Tambah Bentuk
                  </Button>
                </Section>
              </div>
            </div>

            {/* ACTION */}
            <div className="border-t pt-8 flex justify-center">
              <Button className="px-10" onClick={handleUpdate} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ================= REUSABLE UI ================= */

function Section({ title, children }: any) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="px-4 py-2 border-b bg-muted/40 font-medium text-sm">
        {title}
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

function Input({ label, type = "text", value, onChange }: any) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
    </div>
  );
}

function Textarea({ label, value, onChange }: any) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full border rounded-md px-3 py-2 text-sm min-h-[90px]"
      />
    </div>
  );
}

function Select({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>

      <ShadcnSelect value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="- Pilih -" />
        </SelectTrigger>

        <SelectContent className="max-h-[200px] overflow-y-auto">
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </ShadcnSelect>
    </div>
  );
}

function ModalInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium">
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border rounded-md px-3 py-2 text-sm
        focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
    </div>
  );
}

function FileInput({
  label,
  maxSizeMB,
  file,
  setFile,
  onView,
}: {
  label: string;
  maxSizeMB: number;
  file: File | null;
  setFile: (f: File | null) => void;
  onView: (file: File) => void;
}) {
  const fileInputId = label.replace(/\s+/g, "-").toLowerCase();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.type !== "application/pdf") {
      alert("File harus berformat PDF");
      return;
    }

    if (f.size > maxSizeMB * 1024 * 1024) {
      alert(`Ukuran file maksimal ${maxSizeMB} MB`);
      return;
    }

    setFile(f);
  };

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">
        {label} <span className="text-red-500">*</span>
      </label>

      <div className="flex items-center border rounded-md overflow-hidden bg-background">
        {/* INPUT FILE */}
        <label
          htmlFor={fileInputId}
          className="px-3 py-2 text-sm border-r bg-muted cursor-pointer hover:bg-muted/70"
        >
          Choose File
        </label>

        <input
          id={fileInputId}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleChange}
        />

        {/* FILE NAME */}
        <div className="flex-1 px-3 py-2 text-sm truncate text-muted-foreground">
          {file ? file.name : "No file chosen"}
        </div>

        {/* ACTIONS */}
        {file && (
          <div className="flex items-center gap-1 px-2">
            <button
              type="button"
              onClick={() => onView(file)}
              className="p-1 rounded hover:bg-muted"
              title="Lihat Dokumen"
            >
              <Eye className="w-4 h-4 text-primary" />
            </button>

            <button
              type="button"
              onClick={() => setFile(null)}
              className="p-1 rounded hover:bg-red-50"
              title="Hapus Dokumen"
            >
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        File type: <b>.pdf</b> | Max size: <b>{maxSizeMB}MB</b>
      </p>
    </div>
  );
}
