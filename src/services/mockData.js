/**
 * Mock Data - Salinan statis dari webxr-be/data/* untuk Mode Mockup.
 * Sumber: ../webxr-be (sibling folder) → data/topics.js + data/basestories.js
 * Dipakai HANYA saat isMockMode = true, tidak mengganggu flow live API.
 */

export const MOCK_TOPICS = [
  {
    id: "diri",
    label: "Damai dengan Diri",
    description:
      "Ketenangan batin, penerimaan diri, keseimbangan emosi, dan kemampuan mengelola stres.",
  },
  {
    id: "sosial",
    label: "Damai dengan Sosial",
    description:
      "Kemampuan hidup rukun, menghargai perbedaan, dan berempati dalam interaksi sosial.",
  },
  {
    id: "alam",
    label: "Damai dengan Alam",
    description:
      "Hubungan harmonis dengan lingkungan hidup, kepedulian, dan perilaku ramah lingkungan.",
  },
];

export const MOCK_PROBLEMS = {
  diri: [
    {
      id: "tekanan_kecemasan_akademik",
      label: "Tekanan dan kecemasan akademik",
      description:
        "Merasa tertekan oleh tugas, nilai, dan persaingan sehingga muncul cemas, tidak percaya diri, dan stres.",
    },
    {
      id: "krisis_identitas_arah_hidup",
      label: "Krisis identitas dan arah hidup",
      description:
        "Bingung menemukan jati diri, minat, dan tujuan hidup sehingga merasa kosong atau tersesat.",
    },
    {
      id: "kesehatan_mental_belum_tertangani",
      label: "Kesehatan mental yang belum tertangani",
      description:
        "Belum terlalu peduli kesehatan mental dan masih ada rasa malu atau stigma untuk mencari bantuan.",
    },
    {
      id: "paparan_media_sosial",
      label: "Paparan media sosial",
      description:
        "Sering membandingkan diri dengan orang lain di media sosial dan merasa tidak cukup atau kurang berharga.",
    },
    {
      id: "kehilangan_spiritualitas",
      label: "Kehilangan spiritualitas",
      description:
        "Merasa ibadah menurun, jauh dari nilai-nilai spiritual, atau sulit merasakan kedekatan dengan Tuhan.",
    },
  ],
  sosial: [
    {
      id: "intoleransi_stereotip",
      label: "Intoleransi dan stereotip",
      description:
        "Ada gesekan atau jarak dengan teman yang berbeda suku, agama, atau latar belakang.",
    },
    {
      id: "bullying_perundungan_digital",
      label: "Bullying dan perundungan digital",
      description:
        "Pernah mengalami atau menyaksikan perundungan, baik secara langsung maupun di media sosial.",
    },
    {
      id: "kurang_empati_komunikasi",
      label: "Kurangnya empati dan komunikasi sehat",
      description:
        "Sering terjadi konflik kecil, salah paham, atau sulit menyampaikan perasaan dengan cara yang baik.",
    },
    {
      id: "kesenjangan_sosial_ekonomi",
      label: "Kesenjangan sosial dan ekonomi",
      description:
        "Merasa minder atau justru superior karena perbedaan kondisi ekonomi dengan teman sebaya.",
    },
    {
      id: "budaya_kompetitif_ego",
      label: "Budaya kompetitif dan egosentris",
      description:
        "Merasa lingkungan terlalu kompetitif sehingga nilai kebersamaan dan gotong royong berkurang.",
    },
  ],
  alam: [
    {
      id: "rendah_kesadaran_ekologis",
      label: "Menurunnya kesadaran ekologis",
      description:
        "Kurang peduli isu lingkungan seperti sampah, air, dan energi karena terasa jauh dari kehidupan sehari-hari.",
    },
    {
      id: "konsumtivisme_tidak_ramah_lingkungan",
      label: "Konsumtivisme dan perilaku tidak ramah lingkungan",
      description:
        "Sering memakai barang sekali pakai, plastik, atau membuang makanan tanpa banyak dipikir.",
    },
    {
      id: "minim_praktik_cinta_lingkungan",
      label: "Minimnya praktik cinta lingkungan di sekolah",
      description:
        "Program penghijauan, daur ulang, atau konservasi berjalan sesaat saja, belum jadi kebiasaan.",
    },
    {
      id: "urbanisasi_alienasi_alam",
      label: "Urbanisasi dan alienasi dari alam",
      description:
        "Jarang berinteraksi dengan alam sehingga merasa jauh dan kurang empati pada kerusakan lingkungan.",
    },
  ],
};

export const MOCK_BASE_STORIES = {
  diri: {
    id: "biola_ikhlas",
    title: "Biola Kiai Dahlan Memberi Jawaban (Ikhlas)",
  },
  sosial: {
    id: "budi_utomo",
    title: "Belajar dari Budi Utomo (Rendah Hati)",
  },
  alam: {
    id: "madrasah_welas_asih",
    title: "Mendirikan Madrasah Ibtidaiyah Diniyah (Welas Asih)",
  },
};

export const MOCK_GREETING =
  "Assalamualaikum, senang sekali kamu datang ke sini. Ini adalah ruang yang aman untuk berbagi apa pun yang sedang kamu rasakan, tanpa penilaian dan tanpa tekanan. Kita bisa menjelajahi tiga hal bersama: damai dengan diri sendiri, damai dengan orang-orang di sekitarmu, atau damai dengan alam. Dari ketiganya, mana yang paling dekat dengan perasaanmu saat ini?";

export const MOCK_PROBLEM_INTRO = {
  diri: 'Baik, kita akan fokus pada "Damai dengan Diri". Sekarang pilih satu hal yang paling menggambarkan kondisimu saat ini (langkah 1 dari 3).',
  sosial:
    'Baik, kita akan fokus pada "Damai dengan Sosial". Sekarang pilih satu hal yang paling menggambarkan kondisimu saat ini (langkah 1 dari 3).',
  alam: 'Baik, kita akan fokus pada "Damai dengan Alam". Sekarang pilih satu hal yang paling menggambarkan kondisimu saat ini (langkah 1 dari 3).',
};

export const MOCK_ROUND_MESSAGE = {
  2: "Terima kasih, aku sudah mencatat itu. Sekarang pilih satu lagi yang juga kamu rasakan (langkah 2 dari 3).",
  3: "Satu lagi ya, pilih hal ketiga yang paling relevan denganmu (langkah 3 dari 3). Setelah ini aku akan menyiapkan sebuah cerita untukmu.",
};

const MOCK_STORIES = {
  diri: (p1, p2, p3) =>
    `Baik, sekarang silakan duduk dengan nyaman. Tarik napas pelan... hembuskan perlahan... Rasakan bahumu melemas. Kamu sudah melakukan hal yang berani hari ini: mengakui bahwa ${p1}, ${p2}, dan ${p3} sedang kamu rasakan.\n\nDahulu, Kiai Ahmad Dahlan pernah ditanya muridnya tentang hakikat beragama. Beliau tidak langsung menjawab dengan kata-kata. Beliau mengambil biola, menggeseknya pelan, dan memainkan tembang Asmaradhana yang lembut. Para santri merasakan keindahan dan ketenangan, seolah beban mereka menghilang sesaat. Lalu beliau berkata, orang yang beragama dengan benar adalah orang yang merasakan kedamaian dan menyelimuti sekitarnya dengan ketenangan.\n\nKetika para santri mencoba menggesek biola sendiri, suaranya menderit dan tidak nyaman didengar. Kiai Dahlan tersenyum dan menjelaskan, seperti itulah hati yang lelah tanpa ilmu dan keikhlasan dalam merawat diri: bukan karena kamu kurang, tapi karena kamu belum sempat belajar merawat dirimu dengan lembut.\n\nJadi untuk ${p1} yang kamu rasakan, bayangkan dirimu seperti biola itu. Tidak perlu langsung merdu. Cukup mulai dengan satu gesekan kecil hari ini: istirahat yang cukup, satu tugas diselesaikan tanpa membandingkan diri, satu momen berhenti dari layar. Untuk ${p2} dan ${p3}, ingatlah bahwa bingung dan lelah itu manusiawi, bukan kegagalan.\n\nKamu berharga, apa adanya. Pelan-pelan saja, aku di sini menemanimu. [MOCKUP]`,
  sosial: (p1, p2, p3) =>
    `Baik, sekarang silakan duduk dengan nyaman. Tarik napas pelan... hembuskan perlahan... Biarkan tubuhmu tenang. Terima kasih sudah berani bercerita tentang ${p1}, ${p2}, dan ${p3}.\n\nSuatu sore di Kauman, Kiai Ahmad Dahlan mendatangi langgar kidul. Seorang santri bernama Sudja bercerita bahwa beberapa santri dilarang keluarganya mengaji, hanya karena Kiai Dahlan bergabung dengan Budi Utomo dan memakai jas serta sepatu seperti orang Belanda. Mereka menilai beliau terlalu dekat dengan budaya lain.\n\nKiai Dahlan tidak marah. Beliau menjelaskan dengan tenang bahwa ia bergabung untuk belajar cara membangun organisasi yang bermanfaat bagi umat. Sesuai makna wahyu pertama "Iqra" — bacalah, telitilah, pelajarilah — hati yang terbuka dan rendah hati untuk belajar dari perbedaan justru menguatkan, bukan melemahkan.\n\nBegitu pun dengan ${p1} yang kamu alami. Jarak dengan orang yang berbeda itu menyakitkan, tapi ia bisa dijembatani dengan satu langkah kecil: mendengarkan dulu sebelum menilai. Untuk ${p2} dan ${p3}, ingatlah bahwa empati itu seperti otot, semakin dilatih dengan komunikasi yang jujur dan lembut, semakin kuat.\n\nKamu tidak sendirian. Menjadi pendamai dimulai dari keberanian memahami. Pelan-pelan saja, aku di sini menemanimu. [MOCKUP]`,
  alam: (p1, p2, p3) =>
    `Baik, sekarang silakan duduk dengan nyaman. Tarik napas pelan... rasakan udara masuk... hembuskan perlahan... Terima kasih sudah peduli dan mengakui bahwa ${p1}, ${p2}, dan ${p3} sedang kamu rasakan.\n\nDahulu di rumahnya, Kiai Ahmad Dahlan menata tiga pasang meja dan kursi serta memasang papan tulis dari kayu suren. Ia ingin mendirikan Madrasah Ibtidaiyah Diniyah. Murid-muridnya heran, bukankah madrasah seharusnya seperti pesantren tradisional tanpa meja kursi? Bukankah meja kursi itu seperti sekolah Belanda?\n\nKiai Dahlan tidak berdebat panjang. Beliau justru mengajak murid-muridnya mencari anak-anak yang belum bersekolah untuk diajak belajar bersama. Tindakan kecil penuh welas asih itu menunjukkan bahwa merawat sesama dan merawat ilmu bisa dimulai dari hal sederhana di depan mata.\n\nBegitu pun dengan ${p1}. Kamu tidak perlu menyelamatkan bumi sendirian hari ini. Mulailah dari satu kebiasaan kecil: membawa botol minum sendiri, memilah satu sampah, atau menanam satu tanaman. Untuk ${p2} dan ${p3}, ingatlah bahwa kepedulian yang kecil tapi konsisten jauh lebih berarti daripada niat besar yang tidak dimulai.\n\nAlam selalu menyambut mereka yang kembali dengan kasih. Pelan-pelan saja, aku di sini menemanimu. [MOCKUP]`,
};

export function buildMockStory(topicId, problemLabels) {
  const [p1 = "hal pertama", p2 = "hal kedua", p3 = "hal ketiga"] =
    problemLabels;
  const builder = MOCK_STORIES[topicId] || MOCK_STORIES.diri;
  return builder(p1, p2, p3);
}

export const MOCK_TTS = {
  mode: "webspeech",
  webSpeechConfig: { lang: "id-ID", rate: 0.95, pitch: 1.0, volume: 1.0 },
};

export const MOCK_AUDIO_OFF = { enabled: false, mimeType: "audio/mpeg", base64: "" };
