import React from "react";
import {
  Box,
  Shield,
  Lock,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { motion } from "framer-motion";

export default function PrivacyPolicyPage() {
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
              <Shield className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-5xl md:text-6xl text-slate-900 dark:text-white leading-tight mb-4">
              <span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Privacy Policy
              </span>
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-400">
              Last updated: 14 Desember 2025
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
              <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                Dokumen Kebijakan Privasi ini menjelaskan
                bagaimana <strong>BUKABOX</strong> (selanjutnya
                disebut "Kami") mengumpulkan, menggunakan,
                menyimpan, dan melindungi informasi pribadi
                pengguna ("Anda") yang menggunakan layanan,
                aplikasi, dan/atau website kami.
              </p>

              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                Dengan mengakses atau menggunakan layanan kami,
                Anda menyetujui praktik yang dijelaskan dalam
                Kebijakan Privasi ini.
              </p>

              <hr className="my-8 border-slate-200 dark:border-slate-700" />

              {/* Section 1 */}
              <div className="mb-8">
                <h2 className="text-3xl text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                  <FileText className="w-7 h-7 text-green-600 dark:text-green-400" />
                  1. Informasi yang Kami Kumpulkan
                </h2>

                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  Kami dapat mengumpulkan beberapa jenis
                  informasi, termasuk namun tidak terbatas pada:
                </p>

                <h3 className="text-xl text-slate-900 dark:text-white mb-3">
                  a. Informasi Pribadi
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300 mb-6">
                  <li>Nama</li>
                  <li>Alamat email</li>
                  <li>
                    Foto profil (jika login menggunakan pihak
                    ketiga seperti Google)
                  </li>
                  <li>
                    Informasi lain yang Anda berikan secara
                    sukarela
                  </li>
                </ul>

                <h3 className="text-xl text-slate-900 dark:text-white mb-3">
                  b. Informasi Teknis
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300 mb-6">
                  <li>Alamat IP</li>
                  <li>Jenis perangkat dan browser</li>
                  <li>Sistem operasi</li>
                  <li>
                    Data penggunaan aplikasi (log aktivitas,
                    waktu akses, fitur yang digunakan)
                  </li>
                </ul>

                <h3 className="text-xl text-slate-900 dark:text-white mb-3">
                  c. Informasi Transaksi (jika relevan)
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                  <li>Status langganan (free / premium)</li>
                  <li>
                    Riwayat pembayaran (tanpa menyimpan detail
                    kartu atau metode pembayaran sensitif)
                  </li>
                </ul>
              </div>

              <hr className="my-8 border-slate-200 dark:border-slate-700" />

              {/* Section 2 */}
              <div className="mb-8">
                <h2 className="text-3xl text-slate-900 dark:text-white mb-4">
                  2. Cara Kami Menggunakan Informasi
                </h2>

                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  Informasi yang kami kumpulkan digunakan untuk:
                </p>

                <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                  <li>
                    Menyediakan dan mengoperasikan layanan
                  </li>
                  <li>Mengelola akun pengguna</li>
                  <li>Autentikasi dan keamanan</li>
                  <li>Memproses transaksi dan langganan</li>
                  <li>
                    Meningkatkan kualitas produk dan pengalaman
                    pengguna
                  </li>
                  <li>Keperluan analitik internal</li>
                  <li>Mematuhi kewajiban hukum dan regulasi</li>
                </ul>

                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-600 rounded">
                  <p className="text-slate-900 dark:text-white font-semibold">
                    Kami <strong>tidak menjual</strong> atau
                    memperdagangkan data pribadi pengguna kepada
                    pihak ketiga.
                  </p>
                </div>
              </div>

              <hr className="my-8 border-slate-200 dark:border-slate-700" />

              {/* Section 3 */}
              <div className="mb-8">
                <h2 className="text-3xl text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                  <Lock className="w-7 h-7 text-green-600 dark:text-green-400" />
                  3. Penyimpanan dan Keamanan Data
                </h2>

                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  Kami menerapkan langkah-langkah teknis dan
                  organisasi yang wajar untuk melindungi data
                  Anda dari:
                </p>

                <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300 mb-4">
                  <li>Akses tidak sah</li>
                  <li>Perubahan</li>
                  <li>Pengungkapan</li>
                  <li>Penghancuran data</li>
                </ul>

                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  Data disimpan pada infrastruktur yang aman dan
                  hanya dapat diakses oleh pihak yang berwenang.
                </p>

                <p className="text-slate-700 dark:text-slate-300 italic">
                  Namun, perlu dipahami bahwa tidak ada sistem
                  elektronik yang sepenuhnya aman. Kami tidak
                  dapat menjamin keamanan absolut.
                </p>
              </div>

              <hr className="my-8 border-slate-200 dark:border-slate-700" />

              {/* Section 4 */}
              <div className="mb-8">
                <h2 className="text-3xl text-slate-900 dark:text-white mb-4">
                  4. Penggunaan Pihak Ketiga
                </h2>

                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  Kami dapat menggunakan layanan pihak ketiga
                  untuk mendukung operasional, seperti:
                </p>

                <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300 mb-4">
                  <li>Autentikasi (contoh: Google OAuth)</li>
                  <li>Payment gateway</li>
                  <li>Layanan analitik</li>
                </ul>

                <p className="text-slate-700 dark:text-slate-300">
                  Pihak ketiga tersebut hanya memiliki akses
                  terbatas sesuai kebutuhan fungsional dan
                  terikat oleh kebijakan privasi masing-masing.
                </p>
              </div>

              <hr className="my-8 border-slate-200 dark:border-slate-700" />

              {/* Section 5 */}
              <div className="mb-8">
                <h2 className="text-3xl text-slate-900 dark:text-white mb-4">
                  5. Cookies dan Teknologi Serupa
                </h2>

                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  Kami dapat menggunakan cookies atau teknologi
                  serupa untuk:
                </p>

                <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300 mb-4">
                  <li>Menjaga sesi login</li>
                  <li>Menyimpan preferensi pengguna</li>
                  <li>Analisis penggunaan layanan</li>
                </ul>

                <p className="text-slate-700 dark:text-slate-300">
                  Anda dapat mengatur browser untuk menolak
                  cookies, namun beberapa fitur layanan mungkin
                  tidak berfungsi dengan optimal.
                </p>
              </div>

              <hr className="my-8 border-slate-200 dark:border-slate-700" />

              {/* Section 6 */}
              <div className="mb-8">
                <h2 className="text-3xl text-slate-900 dark:text-white mb-4">
                  6. Hak Pengguna
                </h2>

                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  Anda memiliki hak untuk:
                </p>

                <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300 mb-4">
                  <li>Mengakses data pribadi Anda</li>
                  <li>Memperbarui atau mengoreksi data</li>
                  <li>Menghapus akun dan data terkait</li>
                  <li>
                    Menarik persetujuan penggunaan data tertentu
                  </li>
                </ul>

                <p className="text-slate-700 dark:text-slate-300">
                  Permintaan terkait hak data dapat diajukan
                  melalui kontak resmi kami.
                </p>
              </div>

              <hr className="my-8 border-slate-200 dark:border-slate-700" />

              {/* Section 7 */}
              <div className="mb-8">
                <h2 className="text-3xl text-slate-900 dark:text-white mb-4">
                  7. Retensi Data
                </h2>

                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  Kami menyimpan data pribadi selama akun Anda
                  aktif atau selama diperlukan untuk tujuan
                  layanan dan kewajiban hukum.
                </p>

                <p className="text-slate-700 dark:text-slate-300">
                  Jika akun dihapus, data akan dihapus atau
                  dianonimkan sesuai kebijakan internal dan
                  ketentuan hukum yang berlaku.
                </p>
              </div>

              <hr className="my-8 border-slate-200 dark:border-slate-700" />

              {/* Section 8 */}
              <div className="mb-8">
                <h2 className="text-3xl text-slate-900 dark:text-white mb-4">
                  8. Perubahan Kebijakan Privasi
                </h2>

                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  Kami dapat memperbarui Kebijakan Privasi ini
                  dari waktu ke waktu. Perubahan akan diumumkan
                  melalui aplikasi atau website kami.
                </p>

                <p className="text-slate-700 dark:text-slate-300">
                  Tanggal pembaruan terakhir akan selalu
                  dicantumkan di bagian atas dokumen ini.
                </p>
              </div>

              <hr className="my-8 border-slate-200 dark:border-slate-700" />

              {/* Section 9 */}
              <div className="mb-8">
                <h2 className="text-3xl text-slate-900 dark:text-white mb-4">
                  9. Kontak
                </h2>

                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  Jika Anda memiliki pertanyaan atau permintaan
                  terkait Kebijakan Privasi ini, silakan hubungi
                  kami melalui:
                </p>

                <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <p className="text-lg text-slate-900 dark:text-white font-semibold mb-2">
                    Email Support
                  </p>
                  <a
                    href="mailto:support@bukabox.co.id"
                    className="text-green-600 dark:text-green-400 hover:underline text-lg"
                  >
                    support@bukabox.co.id
                  </a>
                </div>
              </div>

              <hr className="my-8 border-slate-200 dark:border-slate-700" />

              {/* Final Note */}
              <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-slate-900 dark:text-white font-semibold text-center">
                  Dengan menggunakan layanan kami, Anda
                  menyatakan telah membaca, memahami, dan
                  menyetujui Kebijakan Privasi ini.
                </p>
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