import React from "react";
import { Box, ShieldCheck, ArrowLeft, AlertCircle, CheckCircle, XCircle, Clock, Mail } from "lucide-react";
import { motion } from "framer-motion";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Navigation Bar */}
      <nav className="border-b border-orange-200 dark:border-orange-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
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
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors flex items-center gap-2"
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
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg mb-6"
              style={{
                background: 'linear-gradient(to bottom right, #ea580c, #f59e0b)'
              }}
            >
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>

            <h1 
              className="text-5xl md:text-6xl leading-tight mb-4"
              style={{
                background: 'linear-gradient(to right, #ea580c, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: 700
              }}
            >
              Refund Policy
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
            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-orange-200/50 dark:border-orange-800/30 rounded-2xl shadow-xl p-8 md:p-12"
          >
            <div className="prose prose-slate dark:prose-invert max-w-none">
              
              {/* Introduction */}
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                Dokumen Kebijakan Pengembalian Dana (Refund Policy) ini menjelaskan ketentuan, batasan, dan mekanisme pengembalian dana untuk layanan berbayar yang disediakan oleh <strong>BUKABOX</strong>.
              </p>

              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-8">
                Dengan melakukan pembelian atau berlangganan layanan kami, Anda dianggap telah membaca, memahami, dan menyetujui kebijakan ini.
              </p>

              <hr className="my-8 border-slate-200 dark:border-slate-700" />

              {/* 1. Sifat Layanan */}
              <div className="mb-8">
                <h2 className="text-3xl text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                    1
                  </span>
                  Sifat Layanan
                </h2>
                
                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  BUKABOX menyediakan layanan <strong>produk digital berbasis langganan</strong> (subscription) dan/atau akses fitur premium.
                </p>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-600 rounded">
                  <p className="text-slate-900 dark:text-white mb-0">
                    Karena sifat layanan ini bersifat <strong>non-fisik</strong>, <strong>akses langsung</strong>, dan <strong>dikonsumsi secara real-time</strong>, maka pengembalian dana memiliki batasan tertentu sebagaimana dijelaskan di bawah.
                  </p>
                </div>
              </div>

              <hr className="my-8 border-slate-200 dark:border-slate-700" />

              {/* 2. Kebijakan Umum Refund */}
              <div className="mb-8">
                <h2 className="text-3xl text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                    2
                  </span>
                  Kebijakan Umum Refund
                </h2>
                
                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  Secara umum:
                </p>

                <div className="grid gap-3 mb-4">
                  {[
                    "Biaya langganan yang telah dibayarkan tidak dapat dikembalikan (non-refundable)",
                    "Tidak ada refund untuk periode langganan yang sudah berjalan, baik sebagian maupun seluruhnya",
                    "Tidak ada refund karena alasan perubahan kebutuhan, ketidaksesuaian ekspektasi, atau tidak digunakan"
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 dark:text-slate-300">{item}</span>
                    </div>
                  ))}
                </div>

                <p className="text-slate-700 dark:text-slate-300">
                  Keputusan ini dibuat untuk menjaga keadilan operasional dan konsistensi layanan bagi seluruh pengguna.
                </p>
              </div>

              <hr className="my-8 border-slate-200 dark:border-slate-700" />

              {/* 3. Pengecualian Refund */}
              <div className="mb-8">
                <h2 className="text-3xl text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                    3
                  </span>
                  Pengecualian Refund
                </h2>
                
                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  Refund <strong>dapat dipertimbangkan secara terbatas</strong> hanya dalam kondisi berikut:
                </p>

                <div className="grid gap-3 mb-4">
                  {[
                    "Terjadi kesalahan sistem yang menyebabkan pengguna tidak dapat mengakses layanan sama sekali",
                    "Terjadi duplikasi penagihan akibat kesalahan teknis",
                    "Transaksi terverifikasi gagal namun dana tetap terpotong"
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 dark:text-slate-300">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 rounded">
                  <p className="text-slate-900 dark:text-white mb-0">
                    Dalam kasus di atas, refund dapat diberikan <strong>sebagian atau penuh</strong> setelah dilakukan verifikasi internal.
                  </p>
                </div>
              </div>

              <hr className="my-8 border-slate-200 dark:border-slate-700" />

              {/* 4. Proses Pengajuan Refund */}
              <div className="mb-8">
                <h2 className="text-3xl text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                    4
                  </span>
                  Proses Pengajuan Refund
                </h2>
                
                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  Untuk mengajukan permintaan refund, pengguna wajib:
                </p>

                <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300 mb-6">
                  <li>Menghubungi kami melalui email resmi</li>
                  <li>Menyertakan alamat email akun</li>
                  <li>Menyertakan bukti transaksi yang relevan</li>
                  <li>Menjelaskan kronologi masalah secara jelas</li>
                </ul>

                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 mb-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-slate-900 dark:text-white font-semibold mb-1">
                        Batas Waktu Pengajuan
                      </p>
                      <p className="text-slate-700 dark:text-slate-300 mb-0">
                        Permintaan refund harus diajukan <strong>maksimal 7 (tujuh) hari kalender</strong> sejak tanggal transaksi.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-900 dark:text-white mb-0">
                      Permintaan yang diajukan melewati batas waktu tersebut <strong>tidak akan diproses</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <hr className="my-8 border-slate-200 dark:border-slate-700" />

              {/* 5. Proses dan Waktu Pengembalian Dana */}
              <div className="mb-8">
                <h2 className="text-3xl text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                    5
                  </span>
                  Proses dan Waktu Pengembalian Dana
                </h2>
                
                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  Jika permintaan disetujui:
                </p>

                <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300 mb-4">
                  <li>Pengembalian dana akan diproses melalui metode pembayaran yang sama</li>
                  <li>Waktu proses bergantung pada pihak payment gateway dan bank terkait</li>
                  <li>BUKABOX tidak bertanggung jawab atas keterlambatan yang disebabkan oleh pihak ketiga</li>
                </ul>
              </div>

              <hr className="my-8 border-slate-200 dark:border-slate-700" />

              {/* 6. Pembatalan Langganan */}
              <div className="mb-8">
                <h2 className="text-3xl text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                    6
                  </span>
                  Pembatalan Langganan
                </h2>
                
                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  Pengguna dapat membatalkan langganan kapan saja melalui pengaturan akun.
                </p>

                <p className="text-slate-700 dark:text-slate-300 mb-3">
                  Pembatalan:
                </p>

                <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
                  <li>Menghentikan perpanjangan otomatis pada periode berikutnya</li>
                  <li><strong>Tidak</strong> mengakibatkan pengembalian dana untuk periode berjalan</li>
                  <li>Akses layanan tetap aktif hingga akhir masa langganan</li>
                </ul>
              </div>

              <hr className="my-8 border-slate-200 dark:border-slate-700" />

              {/* 7. Perubahan Kebijakan Refund */}
              <div className="mb-8">
                <h2 className="text-3xl text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                    7
                  </span>
                  Perubahan Kebijakan Refund
                </h2>
                
                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  BUKABOX berhak mengubah Kebijakan Refund ini sewaktu-waktu.
                </p>

                <p className="text-slate-700 dark:text-slate-300">
                  Perubahan akan diumumkan melalui aplikasi atau website resmi, dan versi terbaru akan selalu ditampilkan di halaman ini.
                </p>
              </div>

              <hr className="my-8 border-slate-200 dark:border-slate-700" />

              {/* 8. Kontak */}
              <div className="mb-8">
                <h2 className="text-3xl text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                    8
                  </span>
                  Kontak
                </h2>
                
                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  Jika Anda memiliki pertanyaan terkait Kebijakan Refund ini, silakan hubungi kami melalui:
                </p>

                <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Email:</p>
                      <a 
                        href="mailto:support@bukabox.co.id"
                        className="text-orange-600 dark:text-orange-400 hover:underline font-medium"
                      >
                        support@bukabox.co.id
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="my-8 border-slate-200 dark:border-slate-700" />

              {/* Final Statement */}
              <div className="p-6 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                <p className="text-center text-slate-900 dark:text-white font-semibold mb-0">
                  Dengan menggunakan layanan berbayar kami, Anda menyatakan telah memahami dan menyetujui Kebijakan Refund ini.
                </p>
              </div>

            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-orange-200 dark:border-orange-800 bg-white dark:bg-slate-900 py-12 mt-12">
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
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              About
            </a>
            <a
              href="/#pricing"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              Pricing
            </a>
            <a
              href="/privacy-policy"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="/refund-policy"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
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