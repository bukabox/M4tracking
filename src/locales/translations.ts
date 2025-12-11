export type SupportedLanguage = 'id' | 'en';

export const translations = {
  id: {
    // Header
    header: {
      title: 'FinanceHub',
      search: 'Cari transaksi...',
      settings: 'Pengaturan',
      export: 'Export',
    },

    // Metric Cards
    metrics: {
      totalRevenue: 'Total Pendapatan',
      totalExpense: 'Total Pengeluaran',
      netProfit: 'Keuntungan Bersih',
      roi: 'ROI',
      revenueChange: 'dari bulan lalu',
      expenseChange: 'dari bulan lalu',
      profitChange: 'dari bulan lalu',
      target: 'Target',
    },

    // Charts
    charts: {
      portfolioPerformance: 'Performa Portfolio',
      assetAllocation: 'Alokasi Aset',
      netProfitTrend: 'Tren Keuntungan Bersih',
      month: 'Bulan',
      profit: 'Keuntungan',
    },

    // Months
    months: {
      jan: 'Jan',
      feb: 'Feb',
      mar: 'Mar',
      apr: 'Apr',
      may: 'Mei',
      jun: 'Jun',
      jul: 'Jul',
      aug: 'Agu',
      sep: 'Sep',
      oct: 'Okt',
      nov: 'Nov',
      dec: 'Des',
      january: 'Januari',
      february: 'Februari',
      march: 'Maret',
      april: 'April',
      june: 'Juni',
      july: 'Juli',
      august: 'Agustus',
      september: 'September',
      october: 'Oktober',
      november: 'November',
      december: 'Desember',
    },

    // Transaction Categories
    categories: {
      income: 'Pemasukan',
      expense: 'Pengeluaran',
      investment: 'Investasi',
    },

    // Transaction Form
    form: {
      addTransaction: 'Tambah Transaksi',
      editTransaction: 'Edit Transaksi',
      category: 'Kategori',
      date: 'Tanggal',
      productName: 'Nama Produk',
      amount: 'Jumlah',
      notes: 'Catatan',
      cancel: 'Batal',
      save: 'Simpan',
      add: 'Tambah',
      selectCategory: 'Pilih kategori',
      enterProductName: 'Masukkan nama produk',
      enterAmount: 'Masukkan jumlah',
      enterNotes: 'Masukkan catatan (opsional)',
    },

    // Transaction Table
    table: {
      recentTransactions: 'Transaksi Terbaru',
      showAll: 'Tampilkan Semua',
      showLess: 'Tampilkan Lebih Sedikit',
      noTransactions: 'Belum ada transaksi',
      startAdding: 'Mulai tambahkan transaksi pertama Anda',
      date: 'Tanggal',
      product: 'Produk',
      category: 'Kategori',
      amount: 'Jumlah',
      notes: 'Catatan',
      actions: 'Aksi',
      edit: 'Edit',
      delete: 'Hapus',
    },

    // Report/Export
    report: {
      title: 'Laporan & Export',
      exportPDF: 'Export PDF',
      exportAnnual: 'Laporan Tahunan',
      exportMonthly: 'Laporan Bulanan',
      annualReport: 'Laporan Tahunan',
      monthlyReport: 'Laporan Bulanan',
      period: 'Periode',
      summary: 'Ringkasan',
      breakdown: 'Rincian',
      generatedOn: 'Dibuat pada',
      confidential: 'Rahasia',
    },

    // Export
    export: {
      exportPDF: 'Export PDF',
      exportJSON: 'Export Data (JSON)',
      pdfDescription: 'Laporan lengkap format PDF',
      jsonDescription: 'Data mentah format JSON',
    },

    // Settings
    settings: {
      title: 'Pengaturan',
      subtitle: 'Kelola preferensi aplikasi Anda',
      financial: 'Pengaturan Keuangan',
      appearance: 'Tampilan',
      system: 'Sistem & Privasi',
      
      // Financial Settings
      projectName: 'Nama Proyek',
      projectNameDesc: 'Nama ini akan muncul di header dan ekspor PDF',
      initialCapital: 'Modal Awal',
      roiTarget: 'Target ROI',
      currency: 'Mata Uang',
      current: 'Saat ini',
      
      // Appearance
      themeMode: 'Mode Tema',
      auto: 'Otomatis',
      light: 'Terang',
      dark: 'Gelap',
      system: 'Sistem',
      bright: 'Cerah',
      dim: 'Redup',
      autoModeDesc: 'Mode otomatis mengikuti preferensi sistem Anda',
      lightModeDesc: 'Mode terang selalu aktif',
      darkModeDesc: 'Mode gelap selalu aktif',
      currentlyLight: 'saat ini terang',
      currentlyDark: 'saat ini gelap',
      language: 'Bahasa',
      
      // System & Privacy
      notifications: 'Notifikasi',
      notificationsDesc: 'Terima notifikasi transaksi',
      autoBackup: 'Backup Otomatis',
      autoBackupDesc: 'Backup data ke localStorage',
      
      // Actions
      save: 'Simpan',
      saveAll: 'Simpan Semua & Tutup',
      cancel: 'Batal',
      reset: 'Reset',
      
      // Info
      tipTitle: '💡 Tips',
      tipMessage: 'Semua pengaturan disimpan di localStorage browser Anda. Data Anda tersimpan secara lokal dan tidak pernah dikirim ke server manapun.',
    },

    // Backend Status
    backend: {
      usingMockData: 'Menggunakan Data Mock',
      mockDataDesc: 'Data sementara untuk demo. Koneksikan ke backend untuk data real-time.',
      connectBackend: 'Hubungkan Backend',
      backendConnected: 'Backend Terhubung',
      backendUrl: 'URL Backend',
      disconnect: 'Putuskan',
    },

    // Common
    common: {
      loading: 'Memuat...',
      error: 'Terjadi kesalahan',
      success: 'Berhasil',
      confirm: 'Konfirmasi',
      close: 'Tutup',
      yes: 'Ya',
      no: 'Tidak',
      total: 'Total',
      search: 'Cari',
      filter: 'Filter',
      sort: 'Urutkan',
      from: 'dari',
      to: 'ke',
    },

    // Currency
    currencyOptions: {
      idr: 'IDR - Rupiah Indonesia',
      usd: 'USD - Dolar AS',
      eur: 'EUR - Euro',
      sgd: 'SGD - Dolar Singapura',
    },

    // Language Options
    languageOptions: {
      id: 'Bahasa Indonesia',
      en: 'English',
    },
  },

  en: {
    // Header
    header: {
      title: 'FinanceHub',
      search: 'Search transactions...',
      settings: 'Settings',
      export: 'Export',
    },

    // Metric Cards
    metrics: {
      totalRevenue: 'Total Revenue',
      totalExpense: 'Total Expense',
      netProfit: 'Net Profit',
      roi: 'ROI',
      revenueChange: 'from last month',
      expenseChange: 'from last month',
      profitChange: 'from last month',
      target: 'Target',
    },

    // Charts
    charts: {
      portfolioPerformance: 'Portfolio Performance',
      assetAllocation: 'Asset Allocation',
      netProfitTrend: 'Net Profit Trend',
      month: 'Month',
      profit: 'Profit',
    },

    // Months
    months: {
      jan: 'Jan',
      feb: 'Feb',
      mar: 'Mar',
      apr: 'Apr',
      may: 'May',
      jun: 'Jun',
      jul: 'Jul',
      aug: 'Aug',
      sep: 'Sep',
      oct: 'Oct',
      nov: 'Nov',
      dec: 'Dec',
      january: 'January',
      february: 'February',
      march: 'March',
      april: 'April',
      june: 'June',
      july: 'July',
      august: 'August',
      september: 'September',
      october: 'October',
      november: 'November',
      december: 'December',
    },

    // Transaction Categories
    categories: {
      income: 'Income',
      expense: 'Expense',
      investment: 'Investment',
    },

    // Transaction Form
    form: {
      addTransaction: 'Add Transaction',
      editTransaction: 'Edit Transaction',
      category: 'Category',
      date: 'Date',
      productName: 'Product Name',
      amount: 'Amount',
      notes: 'Notes',
      cancel: 'Cancel',
      save: 'Save',
      add: 'Add',
      selectCategory: 'Select category',
      enterProductName: 'Enter product name',
      enterAmount: 'Enter amount',
      enterNotes: 'Enter notes (optional)',
    },

    // Transaction Table
    table: {
      recentTransactions: 'Recent Transactions',
      showAll: 'Show All',
      showLess: 'Show Less',
      noTransactions: 'No transactions yet',
      startAdding: 'Start adding your first transaction',
      date: 'Date',
      product: 'Product',
      category: 'Category',
      amount: 'Amount',
      notes: 'Notes',
      actions: 'Actions',
      edit: 'Edit',
      delete: 'Delete',
    },

    // Report/Export
    report: {
      title: 'Reports & Export',
      exportPDF: 'Export PDF',
      exportAnnual: 'Annual Report',
      exportMonthly: 'Monthly Report',
      annualReport: 'Annual Report',
      monthlyReport: 'Monthly Report',
      period: 'Period',
      summary: 'Summary',
      breakdown: 'Breakdown',
      generatedOn: 'Generated on',
      confidential: 'Confidential',
    },

    // Export
    export: {
      exportPDF: 'Export PDF',
      exportJSON: 'Export Data (JSON)',
      pdfDescription: 'Complete report in PDF format',
      jsonDescription: 'Raw data in JSON format',
    },

    // Settings
    settings: {
      title: 'Settings',
      subtitle: 'Manage your app preferences',
      financial: 'Financial Settings',
      appearance: 'Appearance',
      system: 'System & Privacy',
      
      // Financial Settings
      projectName: 'Project Name',
      projectNameDesc: 'This name will appear in the header and PDF exports',
      initialCapital: 'Initial Capital',
      roiTarget: 'ROI Target',
      currency: 'Currency',
      current: 'Current',
      
      // Appearance
      themeMode: 'Theme Mode',
      auto: 'Auto',
      light: 'Light',
      dark: 'Dark',
      system: 'System',
      bright: 'Bright',
      dim: 'Dim',
      autoModeDesc: 'Auto mode follows your system preference',
      lightModeDesc: 'Light mode is always enabled',
      darkModeDesc: 'Dark mode is always enabled',
      currentlyLight: 'currently light',
      currentlyDark: 'currently dark',
      language: 'Language',
      
      // System & Privacy
      notifications: 'Notifications',
      notificationsDesc: 'Receive transaction alerts',
      autoBackup: 'Auto Backup',
      autoBackupDesc: 'Backup data to localStorage',
      
      // Actions
      save: 'Save',
      saveAll: 'Save All & Close',
      cancel: 'Cancel',
      reset: 'Reset',
      
      // Info
      tipTitle: '💡 Tip',
      tipMessage: 'All settings are saved to your browser\'s localStorage. Your data is stored locally and never sent to any server.',
    },

    // Backend Status
    backend: {
      usingMockData: 'Using Mock Data',
      mockDataDesc: 'Temporary data for demo. Connect to backend for real-time data.',
      connectBackend: 'Connect Backend',
      backendConnected: 'Backend Connected',
      backendUrl: 'Backend URL',
      disconnect: 'Disconnect',
    },

    // Common
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      success: 'Success',
      confirm: 'Confirm',
      close: 'Close',
      yes: 'Yes',
      no: 'No',
      total: 'Total',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      from: 'from',
      to: 'to',
    },

    // Currency
    currencyOptions: {
      idr: 'IDR - Indonesian Rupiah',
      usd: 'USD - US Dollar',
      eur: 'EUR - Euro',
      sgd: 'SGD - Singapore Dollar',
    },

    // Language Options
    languageOptions: {
      id: 'Bahasa Indonesia',
      en: 'English',
    },
  },
};
