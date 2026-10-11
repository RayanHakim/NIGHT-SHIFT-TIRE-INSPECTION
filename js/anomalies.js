
/* =========================================================
   NIGHT SHIFT: TIRE INSPECTION
   ANOMALY DATABASE

   File: js/anomalies.js

   Isi:
   1. Delapan kategori proses fiktif
   2. Anomali proses produksi
   3. Anomali operator dan identitas
   4. Anomali dokumen dan laporan
   5. Anomali visual ban
   6. Anomali supernatural
   7. Dua puluh skenario ronde awal
   8. Fungsi pencarian data untuk file JavaScript lain

   CATATAN:
   Semua perusahaan, orang, nomor, kasus, dan aturan teknis
   di file ini merupakan fiksi untuk kebutuhan permainan.

   Tidak menggunakan data inspeksi atau prosedur internal
   perusahaan sungguhan.
   ========================================================= */


/* =========================================================
   01. HELPER UNTUK MEMBUAT DATA ANOMALI
   ========================================================= */

function createNightShiftAnomaly(
    id,
    title,
    expected,
    observed,
    clue,
    area,
    severity
) {
    return {
        id: id,
        title: title,
        expected: expected,
        observed: observed,
        clue: clue,
        area: area,
        severity: severity || "medium",
        decisionEffect: "NG"
    };
}


/* =========================================================
   02. DELAPAN KATEGORI PROSES

   Area:
   production = catatan produksi
   tread      = tapak ban
   sidewall   = dinding samping ban
   bead       = area bead
   report     = dokumen laporan
   person     = data orang/operator

   Keempat aturan anomali pada setiap proses dibuat berbeda.
   ========================================================= */

var ANOMALY_PROCESS_CATALOG = [

    /* -----------------------------------------------------
       PROCESS 01 — BANBURY
       ----------------------------------------------------- */

    {
        id: "banbury",
        name: "BANBURY",
        reference: "AI-01",

        description:
            "Catatan pencampuran material pada dunia fiktif BLACKRIDGE.",

        normalRule:
            "Waktu mulai dan selesai harus berurutan. Nomor batch, resep fiktif, dan catatan siklus harus konsisten.",

        anomalies: [

            createNightShiftAnomaly(
                "BAN-01",
                "The Impossible Cycle",
                "Start 22:05, finish 22:21",
                "Start 22:05, finish 21:57",
                "Waktu proses selesai tercatat lebih awal daripada waktu mulai.",
                "production",
                "high"
            ),

            createNightShiftAnomaly(
                "BAN-02",
                "The Other Formula",
                "Formula MIX-A17 sesuai dengan batch CMP-2201",
                "Kartu batch CMP-2201 merujuk ke formula MIX-X09",
                "Kode formula berbeda antara kartu proses dan referensi batch.",
                "production",
                "high"
            ),

            createNightShiftAnomaly(
                "BAN-03",
                "One Cycle, Two Batches",
                "Satu ID siklus terhubung ke satu batch",
                "Siklus CY-118 tercatat menghasilkan CMP-2203 dan CMP-2208",
                "ID siklus yang sama digunakan untuk dua batch berbeda.",
                "production",
                "high"
            ),

            createNightShiftAnomaly(
                "BAN-04",
                "The Missing Minutes",
                "Durasi catatan dan log sistem sama",
                "Kartu mencatat 18 menit, log mencatat 47 menit",
                "Dua sumber waktu untuk siklus yang sama tidak cocok.",
                "production",
                "medium"
            )
        ]
    },


    /* -----------------------------------------------------
       PROCESS 02 — EXTRUDING
       ----------------------------------------------------- */

    {
        id: "extruding",
        name: "EXTRUDING",
        reference: "AI-02",

        description:
            "Catatan pembentukan material menjadi profil dalam simulasi.",

        normalRule:
            "Kode profil, batch material, panjang hasil fiktif, dan urutan waktu harus sesuai dengan kartu produksi.",

        anomalies: [

            createNightShiftAnomaly(
                "EXT-01",
                "The Wrong Profile",
                "Profile P-04 sesuai dengan kartu kerja",
                "Gambar profil menunjukkan P-07, kartu kerja menunjukkan P-04",
                "Bentuk profil pada ilustrasi tidak cocok dengan kode pada kartu.",
                "production",
                "high"
            ),

            createNightShiftAnomaly(
                "EXT-02",
                "The Endless Strip",
                "Panjang hasil 980 unit fiktif",
                "Panjang hasil tercatat 9.800 unit fiktif pada order pendek",
                "Nilai produksi berada di luar batas aturan yang ditetapkan game.",
                "production",
                "high"
            ),

            createNightShiftAnomaly(
                "EXT-03",
                "Duplicate Roll",
                "Satu ID gulungan digunakan satu kali",
                "Roll RL-044 tercatat pada dua hasil yang dibuat pada waktu bersamaan",
                "Referensi gulungan yang sama dipakai untuk dua catatan simultan.",
                "production",
                "high"
            ),

            createNightShiftAnomaly(
                "EXT-04",
                "Before Material Release",
                "Waktu extruding dimulai setelah material dirilis",
                "Extruding dimulai 22:16, material dirilis 22:24",
                "Pencatatan proses mendahului waktu material dinyatakan tersedia.",
                "production",
                "high"
            )
        ]
    },


    /* -----------------------------------------------------
       PROCESS 03 — BEAD
       ----------------------------------------------------- */

    {
        id: "bead",
        name: "BEAD",
        reference: "AI-03",

        description:
            "Catatan komponen bead dan pasangan komponennya pada game.",

        normalRule:
            "Jumlah, label pasangan, ukuran fiktif, dan referensi batch harus cocok dengan kartu kasus.",

        anomalies: [

            createNightShiftAnomaly(
                "BEA-01",
                "The Extra Component",
                "Kartu material menyebut 2 komponen",
                "Catatan penerimaan mencatat 3 komponen",
                "Jumlah yang ditulis pada dua catatan tidak sama.",
                "production",
                "high"
            ),

            createNightShiftAnomaly(
                "BEA-02",
                "The Wrong Size Code",
                "Kode komponen B-16",
                "Label material menunjukkan B-19",
                "Kode ukuran fiktif pada label berbeda dari perintah kerja.",
                "production",
                "high"
            ),

            createNightShiftAnomaly(
                "BEA-03",
                "Material From Tomorrow",
                "Material diterima pukul 23:10 sebelum dipakai",
                "Catatan pemakaian pukul 23:02, penerimaan pukul 23:10",
                "Komponen tercatat telah dipakai sebelum penerimaannya.",
                "production",
                "high"
            ),

            createNightShiftAnomaly(
                "BEA-04",
                "Swapped Pair",
                "Label pasangan kiri L-31 dan kanan R-31",
                "Kartu kerja memasangkan L-31 dengan R-38",
                "Referensi pasangan komponen tidak sama dengan kartu kerja.",
                "production",
                "medium"
            )
        ]
    },


    /* -----------------------------------------------------
       PROCESS 04 — CUTTING
       ----------------------------------------------------- */

    {
        id: "cutting",
        name: "CUTTING",
        reference: "AI-04",

        description:
            "Catatan pemotongan material untuk skenario produk fiktif.",

        normalRule:
            "Dimensi fiktif, identitas potongan, label pasangan, dan sumber material harus sesuai dengan order game.",

        anomalies: [

            createNightShiftAnomaly(
                "CUT-01",
                "The Impossible Length",
                "Panjang nominal game 980 dengan toleransi ±5",
                "Hasil tercatat 1.040",
                "Nilai panjang melebihi rentang spesifikasi yang hanya berlaku dalam game ini.",
                "production",
                "high"
            ),

            createNightShiftAnomaly(
                "CUT-02",
                "Reversed Labels",
                "Label potongan kiri L-204, kanan R-204",
                "Label kiri menunjukkan R-204 dan label kanan menunjukkan L-204",
                "Label pasangan kiri dan kanan tertukar.",
                "production",
                "high"
            ),

            createNightShiftAnomaly(
                "CUT-03",
                "One Piece, Two Identities",
                "Satu ID potongan hanya memiliki satu tujuan",
                "Potongan CP-882 dipakai pada dua nomor serial berbeda",
                "ID potongan yang sama muncul pada dua produk.",
                "production",
                "high"
            ),

            createNightShiftAnomaly(
                "CUT-04",
                "The Unrelated Roll",
                "Roll material sesuai dengan batch order",
                "Order menggunakan RL-031, hasil mencantumkan RL-013",
                "Referensi material berbeda dari catatan order.",
                "production",
                "high"
            )
        ]
    },


    /* -----------------------------------------------------
       PROCESS 05 — BUILDING
       ----------------------------------------------------- */

    {
        id: "building",
        name: "BUILDING",
        reference: "AI-05",

        description:
            "Catatan perakitan komponen dalam alur produksi fiktif.",

        normalRule:
            "Komponen harus punya riwayat yang tersedia, serial tujuan yang cocok, dan urutan proses yang konsisten.",

        anomalies: [

            createNightShiftAnomaly(
                "BLD-01",
                "The Unborn Component",
                "Komponen tersedia pukul 00:41",
                "Perakitan mencatat komponen dipakai pukul 00:35",
                "Komponen dipakai sebelum catatan menyatakan komponen tersedia.",
                "production",
                "high"
            ),

            createNightShiftAnomaly(
                "BLD-02",
                "The Other Tire",
                "Komponen ditujukan ke serial BT-000117",
                "Riwayat komponen menunjukkan BT-000171",
                "Komponen tercatat milik serial produk yang berbeda.",
                "production",
                "high"
            ),

            createNightShiftAnomaly(
                "BLD-03",
                "Two Places at Once",
                "Satu mesin atau meja kerja hanya memiliki satu siklus aktif",
                "Meja B-02 mencatat dua siklus berbeda pada waktu yang sama",
                "Dua perintah tercatat berlangsung bersamaan di satu lokasi fiktif.",
                "production",
                "high"
            ),

            createNightShiftAnomaly(
                "BLD-04",
                "The Skipped Step",
                "Semua langkah wajib pada kartu game memiliki rekaman",
                "Produk berstatus selesai tetapi langkah B-03 kosong",
                "Kartu menyebut proses selesai meskipun catatan langkahnya hilang.",
                "production",
                "high"
            )
        ]
    },


    /* -----------------------------------------------------
       PROCESS 06 — CURING
       ----------------------------------------------------- */

    {
        id: "curing",
        name: "CURING",
        reference: "AI-06",

        description:
            "Catatan siklus curing pada skenario pabrik fiktif.",

        normalRule:
            "Waktu mulai dan selesai, nomor press, serta referensi profil curing harus konsisten.",

        anomalies: [

            createNightShiftAnomaly(
                "CUR-01",
                "The Reversed Cycle",
                "Start 01:14, finish 01:36",
                "Start 01:14, finish 01:09",
                "Waktu selesai lebih awal daripada waktu mulai.",
                "production",
                "high"
            ),

            createNightShiftAnomaly(
                "CUR-02",
                "The Wrong Press",
                "Kartu kerja mencatat press PR-08",
                "Log sistem mencatat press PR-03",
                "Nomor press berbeda di dua catatan.",
                "production",
                "high"
            ),

            createNightShiftAnomaly(
                "CUR-03",
                "Profile Not Found",
                "Kartu memiliki referensi profil CV-12",
                "Catatan mencantumkan profil CV-00 yang tidak ada dalam data fiktif",
                "Kode profil tidak terdaftar dalam referensi game.",
                "production",
                "medium"
            ),

            createNightShiftAnomaly(
                "CUR-04",
                "The Double Press",
                "Satu serial berada pada satu siklus press pada satu waktu",
                "Serial BT-000245 muncul di PR-02 dan PR-05 pada waktu bersamaan",
                "Satu serial dicatat dalam dua siklus yang saling bertabrakan.",
                "production",
                "high"
            )
        ]
    },


    /* -----------------------------------------------------
       PROCESS 07 — FINAL INSPECTION
       ----------------------------------------------------- */

    {
        id: "final-inspection",
        name: "FINAL INSPECTION",
        reference: "AI-07",

        description:
            "Catatan evaluasi terakhir untuk produk dalam game.",

        normalRule:
            "Serial produk, hasil pengamatan, waktu pemeriksaan, dan keputusan akhir harus saling mendukung.",

        anomalies: [

            createNightShiftAnomaly(
                "FIN-01",
                "Approved Before Inspection",
                "Stempel keputusan dibuat sesudah pemeriksaan",
                "Stempel OK menunjukkan waktu 02:14, inspeksi baru dimulai 02:21",
                "Keputusan persetujuan tercatat sebelum waktu pemeriksaan.",
                "report",
                "high"
            ),

            createNightShiftAnomaly(
                "FIN-02",
                "The Wrong Serial",
                "Serial pada report BT-000302",
                "Serial pada ban BT-000320",
                "Nomor serial produk tidak sama dengan laporan.",
                "report",
                "high"
            ),

            createNightShiftAnomaly(
                "FIN-03",
                "The Contradictory Verdict",
                "Hasil akhir harus sesuai dengan observasi",
                "Observasi menyebut kerusakan kritis, tetapi stempel menunjukkan OK",
                "Isi laporan bertentangan dengan keputusan yang ditulis.",
                "report",
                "high"
            ),

            createNightShiftAnomaly(
                "FIN-04",
                "The Repeated Report",
                "Satu nomor laporan untuk satu pemeriksaan",
                "IR-0317 dipakai untuk dua serial berbeda",
                "Nomor laporan yang sama ditemukan pada dua kasus.",
                "report",
                "high"
            )
        ]
    },


    /* -----------------------------------------------------
       PROCESS 08 — TUBE
       Tube adalah jalur produk terpisah dalam dunia game.
       ----------------------------------------------------- */

    {
        id: "tube",
        name: "TUBE",
        reference: "AI-08",

        description:
            "Catatan material dan identitas produk tube dalam game.",

        normalRule:
            "Batch label, kode ukuran fiktif, waktu penerimaan, dan nomor serial harus saling sesuai.",

        anomalies: [

            createNightShiftAnomaly(
                "TUB-01",
                "The Unrelated Batch",
                "Kartu tube memakai batch TB-441",
                "Label material menunjukkan batch TB-414",
                "Nomor batch pada material berbeda dari kartu.",
                "production",
                "high"
            ),

            createNightShiftAnomaly(
                "TUB-02",
                "The Wrong Size",
                "Kode ukuran game T-18",
                "Label menunjukkan T-81",
                "Kode ukuran tidak sama dengan order fiktif.",
                "production",
                "high"
            ),

            createNightShiftAnomaly(
                "TUB-03",
                "The Premature Record",
                "Material diterima sebelum dicatat sebagai terpakai",
                "Catatan pemakaian 03:02, penerimaan 03:19",
                "Pemakaian tercatat mendahului penerimaan material.",
                "production",
                "high"
            ),

            createNightShiftAnomaly(
                "TUB-04",
                "The Duplicate Tube",
                "Satu serial tube untuk satu catatan produk",
                "Serial TU-0091 muncul pada dua kartu produk",
                "Satu serial digunakan lebih dari sekali.",
                "production",
                "high"
            )
        ]
    }

];


/* =========================================================
   03. ANOMALI OPERATOR DAN IDENTITAS

   Jangan menolak seseorang hanya karena nama atau penampilannya
   tampak aneh. Petunjuk harus berasal dari catatan yang dapat
   dibandingkan: ID, roster, shift, waktu, lokasi, atau tanda tangan.
   ========================================================= */

var ANOMALY_PEOPLE_CATALOG = [

    createNightShiftAnomaly(
        "PER-01",
        "One Operator, Two Stations",
        "Operator hanya tercatat di satu lokasi dalam waktu yang sama",
        "ID OP-014 tercatat di Banbury dan Building pukul 22:34",
        "ID operator yang sama memiliki dua catatan lokasi simultan.",
        "person",
        "high"
    ),

    createNightShiftAnomaly(
        "PER-02",
        "Name and ID Do Not Match",
        "ID EMP-024 terhubung dengan nama Nara Wijaya",
        "Kartu menunjukkan EMP-024, nama operator Dimas Aruna",
        "Nama dan ID tidak cocok pada daftar identitas fiktif.",
        "person",
        "high"
    ),

    createNightShiftAnomaly(
        "PER-03",
        "The Unlisted Employee",
        "ID operator ditemukan pada roster karyawan game",
        "ID EMP-999 tidak ditemukan pada daftar fiktif",
        "ID pada catatan tidak mempunyai pasangan di roster game.",
        "person",
        "high"
    ),

    createNightShiftAnomaly(
        "PER-04",
        "The Wrong Shift",
        "Operator dijadwalkan pada shift 22:00–06:00",
        "Catatan menunjukkan operator sedang bertugas pada shift 14:00–22:00 dan tidak dijadwalkan ulang",
        "Jadwal pada catatan tidak cocok dengan penugasan shift.",
        "person",
        "medium"
    ),

    createNightShiftAnomaly(
        "PER-05",
        "The Unmatched Signature",
        "Tanda tangan sesuai dengan contoh pada formulir pembanding",
        "Tanda tangan laporan berbeda dari referensi identitas yang tersedia",
        "Tanda tangan tidak cocok dengan referensi yang disediakan game.",
        "report",
        "high"
    ),

    createNightShiftAnomaly(
        "PER-06",
        "Still on Break",
        "Operator kembali bekerja setelah waktu istirahat berakhir",
        "Log menunjukkan status BREAK sampai 00:48, tetapi operasi dimulai 00:39",
        "Status istirahat bertabrakan dengan catatan aktivitas.",
        "person",
        "high"
    ),

    createNightShiftAnomaly(
        "PER-07",
        "Duplicate Badge",
        "Satu ID lencana terhubung ke satu identitas",
        "Badge BG-041 terdaftar untuk dua identitas berbeda",
        "Satu lencana mempunyai dua pemilik di data fiktif.",
        "person",
        "high"
    ),

    createNightShiftAnomaly(
        "PER-08",
        "The Absent Operator",
        "Aktivitas memiliki operator yang tercatat hadir",
        "Catatan kehadiran menunjukkan tidak hadir, tetapi kartu proses memiliki tanda tangan operator itu",
        "Status kehadiran bertentangan dengan catatan aktivitas.",
        "person",
        "high"
    )

];


/* =========================================================
   04. ANOMALI KERTAS DAN DOKUMEN

   Dokumen bisa bermasalah meskipun visual ban terlihat normal.
   Periksa waktu, serial, nomor laporan, isi, dan versi formulir.
   ========================================================= */

var ANOMALY_PAPER_CATALOG = [

    createNightShiftAnomaly(
        "DOC-01",
        "The Premature Stamp",
        "Keputusan baru dibuat setelah pemeriksaan",
        "Waktu stempel mendahului waktu mulai inspeksi",
        "Stempel tercatat lebih awal daripada aktivitas yang mendasarinya.",
        "report",
        "high"
    ),

    createNightShiftAnomaly(
        "DOC-02",
        "Duplicate Report Number",
        "Nomor laporan unik untuk setiap pemeriksaan",
        "IR-0441 digunakan di dua dokumen kasus berbeda",
        "Nomor laporan muncul dua kali pada catatan terpisah.",
        "report",
        "high"
    ),

    createNightShiftAnomaly(
        "DOC-03",
        "The Overwritten Time",
        "Waktu formulir sesuai dengan log sistem",
        "Waktu tulisan tangan 23:18, log sistem 23:48",
        "Waktu di atas kertas tidak sesuai dengan log pembanding.",
        "report",
        "high"
    ),

    createNightShiftAnomaly(
        "DOC-04",
        "Two Different Copies",
        "Salinan produksi dan salinan inspeksi memiliki batch sama",
        "Salinan A mencatat CMP-2210, salinan B mencatat CMP-2120",
        "Dua salinan dokumen untuk kasus yang sama memiliki nilai berbeda.",
        "report",
        "high"
    ),

    createNightShiftAnomaly(
        "DOC-05",
        "The Missing Field",
        "Kolom serial dan inspector harus diisi sebelum laporan selesai",
        "Kolom serial kosong, tetapi status dokumen FINAL",
        "Dokumen dinyatakan final ketika data penting belum diisi.",
        "report",
        "medium"
    ),

    createNightShiftAnomaly(
        "DOC-06",
        "The Contradictory Paper",
        "Observasi dan keputusan harus konsisten",
        "Catatan bertuliskan 'reject recommended', stempel menunjukkan OK",
        "Hasil pengamatan pada kertas bertentangan dengan stempel.",
        "report",
        "high"
    ),

    createNightShiftAnomaly(
        "DOC-07",
        "A Date From Tomorrow",
        "Tanggal laporan tidak boleh melampaui waktu saat ini dalam game",
        "Jam shift 03:17, tetapi tanggal dokumen mencatat hari berikutnya",
        "Tanggal pada kertas tidak cocok dengan kalender shift fiktif.",
        "report",
        "high"
    ),

    createNightShiftAnomaly(
        "DOC-08",
        "The Obsolete Form",
        "Versi formulir sama dengan versi yang digunakan dalam shift",
        "Header formulir menunjukkan REV-02, register shift memakai REV-04",
        "Versi dokumen tidak sesuai dengan register game.",
        "report",
        "medium"
    ),

    createNightShiftAnomaly(
        "DOC-09",
        "The Early Signature",
        "Tanda tangan dibuat pada atau setelah waktu inspeksi",
        "Waktu tanda tangan 01:12, inspector baru ditugaskan 01:26",
        "Tanda tangan tercatat sebelum penugasan inspector.",
        "report",
        "high"
    ),

    createNightShiftAnomaly(
        "DOC-10",
        "The Borrowed Report",
        "Nomor serial dan nomor laporan berasal dari kasus yang sama",
        "Laporan kasus ini merujuk ke serial dari kasus sebelumnya",
        "Isi dokumen tampaknya mengambil identitas kasus yang berbeda.",
        "report",
        "high"
    )

];


/* =========================================================
   05. ANOMALI VISUAL PADA BAN

   Sebagian petunjuk bersifat fisik di dunia game.
   Sebagian lainnya adalah kejadian supernatural.
   ========================================================= */

var ANOMALY_VISUAL_CATALOG = [

    createNightShiftAnomaly(
        "VIS-01",
        "The Changing Tread",
        "Pola tapak tetap sama pada pemeriksaan berulang",
        "Pola tapak memiliki susunan berbeda ketika dipindai lagi",
        "Ulangi pemeriksaan dan bandingkan bentuk tapak. Jangan langsung mengambil keputusan dari kesan pertama.",
        "tread",
        "high"
    ),

    createNightShiftAnomaly(
        "VIS-02",
        "The Unlisted Serial",
        "Nomor pada sidewall sama dengan serial laporan",
        "Sidewall menunjukkan BT-000171, laporan menunjukkan BT-000117",
        "Nomor seri yang terlihat tidak cocok dengan dokumen.",
        "sidewall",
        "high"
    ),

    createNightShiftAnomaly(
        "VIS-03",
        "Visible Surface Damage",
        "Permukaan pada kasus ini tidak menunjukkan sobekan yang dicatat sebagai cacat",
        "Ilustrasi memperlihatkan sobekan yang jelas pada area tapak",
        "Terdapat kerusakan visual yang harus dibandingkan dengan aturan kasus.",
        "tread",
        "high"
    ),

    createNightShiftAnomaly(
        "VIS-04",
        "The Separated Edge",
        "Area bead digambarkan utuh dalam kasus normal",
        "Ilustrasi memperlihatkan bagian tepi yang terpisah",
        "Kondisi visual tidak sesuai dengan kondisi normal yang ditentukan game.",
        "bead",
        "high"
    ),

    createNightShiftAnomaly(
        "VIS-05",
        "The Impossible Pattern",
        "Pola pada gambar produk cocok dengan kartu referensi",
        "Jumlah blok pola berbeda dari gambar referensi pada kasus",
        "Perbedaan terlihat setelah membandingkan dua gambar.",
        "tread",
        "medium"
    ),

    createNightShiftAnomaly(
        "VIS-06",
        "The Moving Shadow",
        "Bayangan tetap konsisten dengan pencahayaan ruang",
        "Bayangan bergerak ke arah berlawanan meski posisi sumber cahaya tidak berubah",
        "Perubahan bayangan baru terlihat ketika produk diperiksa kembali.",
        "sidewall",
        "high"
    )

];


/* =========================================================
   06. GABUNGKAN SEMUA DEFINISI ANOMALI

   Fungsi ini membuat pencarian berdasarkan ID lebih mudah.
   Setiap ID anomali harus unik.
   ========================================================= */

var ANOMALY_DEFINITIONS = [];

ANOMALY_PROCESS_CATALOG.forEach(function (process) {

    process.anomalies.forEach(function (anomaly) {

        ANOMALY_DEFINITIONS.push(
            Object.assign({}, anomaly, {
                category: "process",
                processId: process.id,
                processName: process.name,
                processReference: process.reference
            })
        );

    });

});


ANOMALY_PEOPLE_CATALOG.forEach(function (anomaly) {

    ANOMALY_DEFINITIONS.push(
        Object.assign({}, anomaly, {
            category: "person",
            processId: null,
            processName: "PERSONNEL RECORD",
            processReference: "REF-PERSON"
        })
    );

});


ANOMALY_PAPER_CATALOG.forEach(function (anomaly) {

    ANOMALY_DEFINITIONS.push(
        Object.assign({}, anomaly, {
            category: "paper",
            processId: null,
            processName: "DOCUMENT CONTROL",
            processReference: "REF-DOC"
        })
    );

});


ANOMALY_VISUAL_CATALOG.forEach(function (anomaly) {

    ANOMALY_DEFINITIONS.push(
        Object.assign({}, anomaly, {
            category: "visual",
            processId: null,
            processName: "VISUAL INSPECTION",
            processReference: "REF-VIS"
        })
    );

});


/* =========================================================
   07. DUA PULUH SKENARIO RONDE AWAL

   expectedDecision:
   OK = bukti konsisten, produk boleh diloloskan dalam game.
   NG = terdapat anomali yang cukup untuk menolak produk.

   anomalyIds harus sesuai dengan ID di katalog di atas.

   Kasus OK juga penting. Jangan menolak produk hanya karena
   nama operator terasa aneh atau suasana terasa menyeramkan.
   ========================================================= */

var ANOMALY_CASES = [

    /* ROUND 01 — NORMAL BANBURY */

    {
        id: "CASE-001",
        processId: "banbury",
        title: "The First Batch",
        expectedDecision: "OK",
        anomalyIds: [],
        storyEvent: null,

        caseNote:
            "Catatan pertama terlihat biasa. Periksa data sebelum memutuskan."
    },


    /* ROUND 02 — BANBURY TIMESTAMP */

    {
        id: "CASE-002",
        processId: "banbury",
        title: "The Reversed Clock",
        expectedDecision: "NG",
        anomalyIds: ["BAN-01"],
        storyEvent: null,

        caseNote:
            "Waktu mulai dan selesai merupakan bukti utama kasus ini."
    },


    /* ROUND 03 — NORMAL EXTRUDING */

    {
        id: "CASE-003",
        processId: "extruding",
        title: "Profile P-04",
        expectedDecision: "OK",
        anomalyIds: [],
        storyEvent: null,

        caseNote:
            "Bandingkan profil dengan kartu kerja. Kode yang berbeda belum tentu ada."
    },


    /* ROUND 04 — EXTRUDING + PAPER */

    {
        id: "CASE-004",
        processId: "extruding",
        title: "The Wrong Shape",
        expectedDecision: "NG",
        anomalyIds: ["EXT-01", "DOC-03"],
        storyEvent: {
            title: "A SECOND TIME",
            category: "RECORD DISCREPANCY",
            message:
                "Waktu pada lembar laporan berubah ketika kamu melihatnya lagi.\n\nLog sistem tidak berubah."
        },

        caseNote:
            "Periksa gambar profil dan cocokkan waktu kertas dengan log."
    },


    /* ROUND 05 — BEAD */

    {
        id: "CASE-005",
        processId: "bead",
        title: "The Extra Component",
        expectedDecision: "NG",
        anomalyIds: ["BEA-01"],
        storyEvent: null,

        caseNote:
            "Jumlah komponen tidak sama pada dua catatan."
    },


    /* ROUND 06 — NORMAL CUTTING */

    {
        id: "CASE-006",
        processId: "cutting",
        title: "A Clean Cut",
        expectedDecision: "OK",
        anomalyIds: [],
        storyEvent: null,

        caseNote:
            "Nilai dimensi dan label cocok dengan aturan skenario."
    },


    /* ROUND 07 — CUTTING + OPERATOR */

    {
        id: "CASE-007",
        processId: "cutting",
        title: "The Reversed Labels",
        expectedDecision: "NG",
        anomalyIds: ["CUT-02", "PER-02"],
        storyEvent: null,

        caseNote:
            "Periksa label komponen dan hubungan nama dengan ID operator."
    },


    /* ROUND 08 — BUILDING */

    {
        id: "CASE-008",
        processId: "building",
        title: "The Unborn Component",
        expectedDecision: "NG",
        anomalyIds: ["BLD-01"],
        storyEvent: null,

        caseNote:
            "Perhatikan urutan waktu material tersedia dan waktu perakitan."
    },


    /* ROUND 09 — NORMAL CURING */

    {
        id: "CASE-009",
        processId: "curing",
        title: "Routine Cycle",
        expectedDecision: "OK",
        anomalyIds: [],
        storyEvent: null,

        caseNote:
            "Nomor press dan urutan waktu cocok dengan kartu skenario."
    },


    /* ROUND 10 — CURING */

    {
        id: "CASE-010",
        processId: "curing",
        title: "The Reversed Cycle",
        expectedDecision: "NG",
        anomalyIds: ["CUR-01"],
        storyEvent: null,

        caseNote:
            "Selesai lebih awal daripada mulai adalah konflik waktu."
    },


    /* ROUND 11 — FINAL INSPECTION + PAPER */

    {
        id: "CASE-011",
        processId: "final-inspection",
        title: "Already Approved",
        expectedDecision: "NG",
        anomalyIds: ["FIN-01", "DOC-01"],
        storyEvent: {
            title: "WHO STAMPED IT?",
            category: "UNAUTHORIZED RECORD",
            message:
                "Stempel pada laporan menunjukkan keputusan sudah dibuat.\n\nNamun, catatan sistem mengatakan pemeriksaanmu belum dimulai."
        },

        caseNote:
            "Bandingkan waktu stempel dengan waktu dimulainya pemeriksaan."
    },


    /* ROUND 12 — NORMAL TUBE */

    {
        id: "CASE-012",
        processId: "tube",
        title: "Tube Record",
        expectedDecision: "OK",
        anomalyIds: [],
        storyEvent: null,

        caseNote:
            "Jalur Tube adalah jalur tersendiri. Periksa batch dan label yang relevan."
    },


    /* ROUND 13 — BANBURY + PERSONNEL */

    {
        id: "CASE-013",
        processId: "banbury",
        title: "Two Places at Once",
        expectedDecision: "NG",
        anomalyIds: ["BAN-02", "PER-01"],
        storyEvent: {
            title: "THE OPERATOR IS BUSY",
            category: "PERSONNEL CONFLICT",
            message:
                "Log mencatat operator yang sama sedang bekerja di dua lokasi.\n\nKedua catatan memiliki waktu yang persis sama."
        },

        caseNote:
            "Periksa formula batch dan jadwal lokasi operator."
    },


    /* ROUND 14 — NORMAL EXTRUDING */

    {
        id: "CASE-014",
        processId: "extruding",
        title: "Another Normal Profile",
        expectedDecision: "OK",
        anomalyIds: [],
        storyEvent: null,

        caseNote:
            "Kasus normal dapat muncul setelah kasus bermasalah."
    },


    /* ROUND 15 — NORMAL BEAD */

    {
        id: "CASE-015",
        processId: "bead",
        title: "Paired Components",
        expectedDecision: "OK",
        anomalyIds: [],
        storyEvent: null,

        caseNote:
            "Kedua label dan jumlah komponen cocok dengan data kasus."
    },


    /* ROUND 16 — CUTTING + VISUAL */

    {
        id: "CASE-016",
        processId: "cutting",
        title: "The Damaged Surface",
        expectedDecision: "NG",
        anomalyIds: ["CUT-01", "VIS-03"],
        storyEvent: null,

        caseNote:
            "Periksa batas ukuran fiktif serta kondisi visual pada produk."
    },


    /* ROUND 17 — BUILDING + SERIAL VISUAL */

    {
        id: "CASE-017",
        processId: "building",
        title: "The Other Tire",
        expectedDecision: "NG",
        anomalyIds: ["BLD-02", "VIS-02"],
        storyEvent: {
            title: "IT IS NOT THE SAME TIRE",
            category: "IDENTITY MISMATCH",
            message:
                "Nomor serial pada dokumen berbeda dari nomor pada ban.\n\nSaat dilihat lagi, kamu yakin tadi angkanya tidak seperti itu."
        },

        caseNote:
            "Bandingkan serial pada ban, kartu produksi, dan laporan."
    },


    /* ROUND 18 — CURING + OPERATOR */

    {
        id: "CASE-018",
        processId: "curing",
        title: "The Double Press",
        expectedDecision: "NG",
        anomalyIds: ["CUR-04", "PER-04"],
        storyEvent: null,

        caseNote:
            "Periksa catatan press simultan dan jadwal operator."
    },


    /* ROUND 19 — NORMAL FINAL INSPECTION */

    {
        id: "CASE-019",
        processId: "final-inspection",
        title: "The Final Check",
        expectedDecision: "OK",
        anomalyIds: [],
        storyEvent: null,

        caseNote:
            "Jangan menganggap setiap laporan sebagai jebakan. Periksa bukti."
    },


    /* ROUND 20 — TUBE + PAPER */

    {
        id: "CASE-020",
        processId: "tube",
        title: "The Duplicate Tube",
        expectedDecision: "NG",
        anomalyIds: ["TUB-04", "DOC-06"],
        storyEvent: {
            title: "THE SAME NUMBER",
            category: "DUPLICATE RECORD",
            message:
                "Serial tube ini sudah muncul pada laporan lain.\n\nSalah satu dokumen mencatat bahwa kedua produk telah disetujui."
        },

        caseNote:
            "Periksa serial duplikat dan konflik antara observasi dengan keputusan."
    }

];


/* =========================================================
   08. FUNGSI PENCARIAN ANOMALI
   Dipakai oleh inspection.js, game.js, dan anomaly-index.js.
   ========================================================= */


/**
 * Mengambil definisi anomali berdasarkan ID.
 *
 * Contoh:
 * getAnomalyDefinition("BAN-01")
 */
function getAnomalyDefinition(anomalyId) {

    if (!anomalyId) {
        return null;
    }

    for (var i = 0; i < ANOMALY_DEFINITIONS.length; i++) {

        if (ANOMALY_DEFINITIONS[i].id === anomalyId) {
            return ANOMALY_DEFINITIONS[i];
        }

    }

    return null;
}


/**
 * Mengambil skenario berdasarkan nomor ID kasus.
 *
 * Contoh:
 * getAnomalyCaseById("CASE-004")
 */
function getAnomalyCaseById(caseId) {

    for (var i = 0; i < ANOMALY_CASES.length; i++) {

        if (ANOMALY_CASES[i].id === caseId) {
            return ANOMALY_CASES[i];
        }

    }

    return null;
}


/**
 * Mengambil daftar skenario untuk satu sesi permainan.
 *
 * Mengembalikan salinan array agar array utama tidak
 * berubah ketika game.js mengacak urutan ronde.
 */
function getAnomalyCasesForShift() {
    return ANOMALY_CASES.slice();
}


/**
 * Mengambil seluruh definisi anomali yang dirujuk suatu kasus.
 *
 * Parameter boleh berupa:
 * - ID kasus, misalnya "CASE-004"
 * - Objek kasus dari ANOMALY_CASES
 */
function getAnomaliesForCase(caseOrId) {

    var caseData =
        typeof caseOrId === "string"
            ? getAnomalyCaseById(caseOrId)
            : caseOrId;

    if (!caseData || !Array.isArray(caseData.anomalyIds)) {
        return [];
    }

    return caseData.anomalyIds
        .map(function (id) {
            return getAnomalyDefinition(id);
        })
        .filter(function (anomaly) {
            return anomaly !== null;
        });
}


/**
 * Mengambil anomali dalam kasus berdasarkan area inspeksi.
 *
 * Contoh area:
 * "production", "person", "report", "tread",
 * "sidewall", "bead"
 */
function getAnomaliesByArea(caseOrId, area) {

    return getAnomaliesForCase(caseOrId).filter(function (anomaly) {
        return anomaly.area === area;
    });
}


/**
 * Mengambil seluruh anomali milik suatu kategori proses.
 *
 * Contoh:
 * getProcessAnomalyCatalog("banbury")
 */
function getProcessAnomalyCatalog(processId) {

    for (var i = 0; i < ANOMALY_PROCESS_CATALOG.length; i++) {

        if (ANOMALY_PROCESS_CATALOG[i].id === processId) {
            return ANOMALY_PROCESS_CATALOG[i];
        }

    }

    return null;
}


/**
 * Mengembalikan keputusan yang diharapkan untuk sebuah kasus.
 *
 * Jangan menampilkan nilai ini kepada pemain sebelum
 * keputusan dikirimkan karena ini adalah kunci jawaban.
 */
function getExpectedAnomalyDecision(caseOrId) {

    var caseData =
        typeof caseOrId === "string"
            ? getAnomalyCaseById(caseOrId)
            : caseOrId;

    if (!caseData) {
        return null;
    }

    return caseData.expectedDecision;
}


/**
 * Mengembalikan true bila kasus sengaja diberi anomali.
 */
function caseContainsAnomalies(caseOrId) {

    var caseData =
        typeof caseOrId === "string"
            ? getAnomalyCaseById(caseOrId)
            : caseOrId;

    if (!caseData || !Array.isArray(caseData.anomalyIds)) {
        return false;
    }

    return caseData.anomalyIds.length > 0;
}


/* =========================================================
   09. DATA UNTUK ANOMALY INDEX

   Delapan kategori utama tetap ditampilkan terpisah.
   Data orang, dokumen, dan visual tersedia sebagai referensi
   pendukung untuk inspeksi lintas kategori.
   ========================================================= */

function getAnomalyIndexData() {

    return {

        processes: ANOMALY_PROCESS_CATALOG.map(function (process) {

            return {
                id: process.id,
                name: process.name,
                reference: process.reference,
                description: process.description,
                normalRule: process.normalRule,

                anomalies: process.anomalies.map(function (anomaly) {
                    return {
                        id: anomaly.id,
                        title: anomaly.title,
                        clue: anomaly.clue,
                        severity: anomaly.severity
                    };
                })
            };

        }),

        supportingReferences: [

            {
                id: "personnel",
                name: "PERSONNEL RECORDS",
                description:
                    "Identitas, roster, shift, kehadiran, dan tanda tangan.",
                count: ANOMALY_PEOPLE_CATALOG.length
            },

            {
                id: "documents",
                name: "DOCUMENT CONTROL",
                description:
                    "Waktu, nomor formulir, versi, isi, dan stempel laporan.",
                count: ANOMALY_PAPER_CATALOG.length
            },

            {
                id: "visual",
                name: "VISUAL / SUPERNATURAL",
                description:
                    "Kondisi fisik serta perubahan visual yang ditemukan dalam game.",
                count: ANOMALY_VISUAL_CATALOG.length
            }

        ]

    };

}


/* =========================================================
   10. VALIDASI DATABASE

   Fungsi diagnostik untuk membantu menemukan kesalahan ID
   atau kasus yang keputusan dan daftar anomalinya tidak sesuai.
   ========================================================= */

function validateAnomalyDatabase() {

    var errors = [];
    var warnings = [];
    var seenIds = {};

    /* Periksa ID definisi anomali. */

    ANOMALY_DEFINITIONS.forEach(function (anomaly) {

        if (seenIds[anomaly.id]) {
            errors.push("Duplicate anomaly ID: " + anomaly.id);
        }

        seenIds[anomaly.id] = true;

    });


    /* Periksa ID kasus dan referensi anomali. */

    var seenCaseIds = {};

    ANOMALY_CASES.forEach(function (caseData) {

        if (seenCaseIds[caseData.id]) {
            errors.push("Duplicate case ID: " + caseData.id);
        }

        seenCaseIds[caseData.id] = true;


        var processExists = ANOMALY_PROCESS_CATALOG.some(function (process) {
            return process.id === caseData.processId;
        });

        if (!processExists) {
            errors.push(
                caseData.id + " references an unknown process: " +
                caseData.processId
            );
        }


        var unresolvedIds = caseData.anomalyIds.filter(function (id) {
            return getAnomalyDefinition(id) === null;
        });

        unresolvedIds.forEach(function (id) {
            errors.push(
                caseData.id + " references an unknown anomaly: " + id
            );
        });


        if (
            caseData.expectedDecision === "OK" &&
            caseData.anomalyIds.length > 0
        ) {
            warnings.push(
                caseData.id +
                " is marked OK but includes anomaly IDs."
            );
        }


        if (
            caseData.expectedDecision === "NG" &&
            caseData.anomalyIds.length === 0
        ) {
            warnings.push(
                caseData.id +
                " is marked NG but has no anomaly IDs."
            );
        }


        if (
            caseData.expectedDecision !== "OK" &&
            caseData.expectedDecision !== "NG"
        ) {
            errors.push(
                caseData.id +
                " has an invalid expectedDecision."
            );
        }

    });


    return {
        valid: errors.length === 0,
        totalAnomalies: ANOMALY_DEFINITIONS.length,
        totalProcesses: ANOMALY_PROCESS_CATALOG.length,
        totalCases: ANOMALY_CASES.length,
        totalPersonAnomalies: ANOMALY_PEOPLE_CATALOG.length,
        totalPaperAnomalies: ANOMALY_PAPER_CATALOG.length,
        totalVisualAnomalies: ANOMALY_VISUAL_CATALOG.length,
        errors: errors,
        warnings: warnings
    };

}


/* =========================================================
   11. RINGKASAN KONTEN

   Perkiraan total dari katalog:
   - 8 proses x 4 pola      = 32 anomali proses
   - Anomali personel       =  8
   - Anomali dokumen        = 10
   - Anomali visual/horor   =  6
   - Total definisi         = 56

   Selain katalog, terdapat 20 skenario ronde awal.
   ========================================================= */
