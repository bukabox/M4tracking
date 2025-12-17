import React from "react";
import {
  Box,
  Lightbulb,
  Users,
  CheckCircle,
  XCircle,
  Rocket,
  ArrowLeft,
} from "lucide-react";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Navigation Bar */}
      <nav className="border-b border-green-200 dark:border-green-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 shadow-lg">
                <Box className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl text-slate-900 dark:text-white">
                M4 ROI
              </span>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/"
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 shadow-lg mb-6">
              <Box className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-5xl md:text-6xl text-slate-900 dark:text-white leading-tight mb-4">
              <span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                About BUKABOX
              </span>
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Platform dashboard dan tools finansial untuk
              memahami kinerja nyata dari apa yang Anda bangun
            </p>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-green-200/50 dark:border-green-800/30 rounded-2xl shadow-xl p-8 md:p-12"
          >
            <div className="prose prose-slate dark:prose-invert max-w-none">
              {/* Introduction */}
              <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong>BUKABOX</strong> M4 ROI Tracker
                (Selanjutnya disebut BUKABOX) adalah platform
                dashboard dan tools finansial yang dirancang
                untuk membantu individu, kreator, dan pelaku
                usaha memahami <strong>kinerja nyata</strong>{" "}
                dari apa yang mereka bangun.
              </p>

              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                Kami tidak berangkat dari asumsi bahwa semua
                orang membutuhkan sistem yang rumit. Sebaliknya,
                BUKABOX dibangun dari satu pertanyaan sederhana:
              </p>

              <div className="my-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-l-4 border-green-600">
                <p className="text-xl text-slate-900 dark:text-white font-medium italic mb-0">
                  "Apakah yang sedang saya kerjakan ini
                  benar-benar menghasilkan?"
                </p>
              </div>

              <hr className="my-8 border-slate-200 dark:border-slate-700" />

              {/* Filosofi Kami */}
              <div className="mb-8">
                <h2 className="text-3xl text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                  <Lightbulb className="w-7 h-7 text-green-600 dark:text-green-400" />
                  Filosofi Kami
                </h2>

                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  BUKABOX lahir dari pendekatan{" "}
                  <strong>outcome-oriented</strong> — hasil
                  adalah titik awal, bukan penutup.
                </p>

                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  Kami percaya bahwa:
                </p>

                <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300 mb-6">
                  <li>
                    Setiap aktivitas produktif pada akhirnya
                    harus bisa diukur
                  </li>
                  <li>
                    Produk, jasa, dan proyek adalah entitas yang
                    bisa dilacak performanya
                  </li>
                  <li>
                    Data bukan untuk dipamerkan, tapi untuk{" "}
                    <strong>
                      membantu mengambil keputusan
                    </strong>
                  </li>
                </ul>

                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-slate-900 dark:text-white mb-0">
                    BUKABOX tidak bertujuan menghibur,
                    memotivasi secara emosional, atau memoles
                    realitas. Platform ini dibuat untuk
                    menghadirkan gambaran apa adanya: untung,
                    rugi, stagnan, atau tumbuh.
                  </p>
                </div>
              </div>

              <hr className="my-8 border-slate-200 dark:border-slate-700" />

              {/* Apa yang BUKABOX Lakukan */}
              <div className="mb-8">
                <h2 className="text-3xl text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                  <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
                  Apa yang BUKABOX Lakukan
                </h2>

                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  BUKABOX membantu Anda:
                </p>

                <div className="grid gap-3 mb-6">
                  {[
                    "Mencatat pemasukan dan pengeluaran secara terstruktur",
                    "Melacak performa per produk, jasa, atau proyek",
                    "Memahami return, modal, dan arus kas",
                    "Memisahkan data aktual dari asumsi",
                    "Mengambil keputusan berbasis data, bukan intuisi semata",
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg"
                    >
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 dark:text-slate-300">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-slate-700 dark:text-slate-300 mb-3">
                  Pendekatan ini cocok untuk:
                </p>

                <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                  <li>Kreator dan freelancer</li>
                  <li>Pemilik bisnis kecil dan mikro</li>
                  <li>Builder independen</li>
                  <li>
                    Siapa pun yang ingin memahami bisnisnya
                    secara rasional
                  </li>
                </ul>
              </div>

              <hr className="my-8 border-slate-200 dark:border-slate-700" />

              {/* Apa yang Tidak Kami Lakukan */}
              <div className="mb-8">
                <h2 className="text-3xl text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                  <XCircle className="w-7 h-7 text-red-600 dark:text-red-400" />
                  Apa yang Tidak Kami Lakukan
                </h2>

                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  Agar jelas sejak awal, BUKABOX{" "}
                  <strong>bukan</strong>:
                </p>

                <div className="grid gap-3 mb-6">
                  {[
                    "Alat akuntansi formal",
                    "Konsultan keuangan",
                    'Aplikasi motivasi atau "janji kaya cepat"',
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg"
                    >
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 dark:text-slate-300">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-600 rounded">
                  <p className="text-slate-900 dark:text-white mb-0">
                    BUKABOX tidak menggantikan peran akuntan,
                    konsultan pajak, atau penasihat keuangan.
                    Platform ini adalah{" "}
                    <strong>alat bantu berpikir</strong>, bukan
                    pengambil keputusan.
                  </p>
                </div>
              </div>

              <hr className="my-8 border-slate-200 dark:border-slate-700" />

              {/* Pendekatan Produk */}
              <div className="mb-8">
                <h2 className="text-3xl text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                  <Rocket className="w-7 h-7 text-green-600 dark:text-green-400" />
                  Pendekatan Produk
                </h2>

                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  BUKABOX dikembangkan dengan prinsip:
                </p>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {[
                    {
                      title: "Fokus pada fungsi inti",
                      desc: "Tidak ada fitur yang tidak perlu",
                    },
                    {
                      title: "Minim distraksi",
                      desc: "Interface yang bersih dan jelas",
                    },
                    {
                      title: "Transparan terhadap keterbatasan",
                      desc: "Jujur tentang apa yang bisa dan tidak bisa",
                    },
                    {
                      title:
                        "Bertumbuh berdasarkan kebutuhan nyata",
                      desc: "Fitur baru dari feedback pengguna",
                    },
                  ].map((principle, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800"
                    >
                      <h3 className="text-slate-900 dark:text-white font-semibold mb-1">
                        {principle.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-0">
                        {principle.desc}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="text-slate-700 dark:text-slate-300">
                  Setiap fitur yang hadir harus menjawab masalah
                  riil, bukan sekadar mengikuti tren.
                </p>
              </div>

              <hr className="my-8 border-slate-200 dark:border-slate-700" />

              {/* Siapa di Balik BUKABOX */}
              <div className="mb-8">
                <h2 className="text-3xl text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                  <Users className="w-7 h-7 text-green-600 dark:text-green-400" />
                  Siapa di Balik BUKABOX
                </h2>

                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  BUKABOX dikembangkan oleh{" "}
                  <strong>BUKABOX Creative Studio</strong>,
                  sebuah studio independen yang berfokus pada
                  pengembangan produk digital berbasis kebutuhan
                  nyata dan pendekatan sistematis.
                </p>

                <p className="text-slate-700 dark:text-slate-300">
                  Platform ini lahir dari pengalaman langsung
                  membangun, mengelola, dan mengevaluasi
                  berbagai proyek kreatif dan bisnis — termasuk
                  kegagalan dan stagnasi.
                </p>
              </div>

              <hr className="my-8 border-slate-200 dark:border-slate-700" />

              {/* Penutup */}
              <div className="mb-8">
                <h2 className="text-3xl text-slate-900 dark:text-white mb-4">
                  Penutup
                </h2>

                <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                  BUKABOX dibuat untuk mereka yang ingin
                  berhenti menebak-nebak.
                </p>

                <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <p className="text-xl text-slate-900 dark:text-white font-semibold text-center mb-0">
                    Jika Anda ingin tahu apakah sesuatu{" "}
                    <strong>
                      layak dilanjutkan, diperbaiki, atau
                      dihentikan
                    </strong>
                    , BUKABOX ada untuk membantu Anda melihatnya
                    dengan lebih jernih.
                  </p>
                </div>
              </div>

              <hr className="my-8 border-slate-200 dark:border-slate-700" />

              {/* Contact CTA */}
              <div className="text-center">
                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  Jika Anda memiliki pertanyaan atau ingin
                  berdiskusi lebih lanjut, silakan hubungi kami
                  melalui halaman kontak resmi.
                </p>
                <a
                  href="mailto:support@bukabox.co.id"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Contact Us
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-green-200 dark:border-green-800 bg-white dark:bg-slate-900 py-12 mt-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Logo & Brand */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 shadow-lg">
              <Box className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl text-slate-900 dark:text-white">
              M4 ROI
            </span>
          </div>

          {/* Footer Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-6">
            <a
              href="/about"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              About
            </a>
            <a
              href="/#pricing"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              Pricing
            </a>
            <a
              href="/privacy-policy"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="/refund-policy"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              Refund Policy
            </a>
          </div>

          {/* Copyright */}
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
            &copy; 2025 M4 ROI . Powered by BUKABOX
          </p>
        </div>
      </footer>
    </div>
  );
}