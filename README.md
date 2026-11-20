# KetikCepat 🚀
### Aplikasi Simulasi Latihan Mengetik 10 Jari dengan Teks Akademik & Konten Lokal Bahasa Indonesia

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web%20(Pure%20Vanilla)-blue.svg)](#)
[![Zero Backend](https://img.shields.io/badge/Backend-100%25%20Client--Side-10b981.svg)](#)
[![Offline Ready](https://img.shields.io/badge/Offline-Ready-cyan.svg)](#)

**KetikCepat** adalah platform simulasi pengetikan 10 jari modern berbasis **Vanilla HTML5, CSS3, dan JavaScript (ES6+) murni**. Dirancang khusus untuk mengasah memori otot dan kecepatan pengetikan menggunakan korpus bahasa Indonesia baku tingkat lanjut (akademik, teknologi, hukum & ekonomi, serta sastra Nusantara).

Aplikasi ini berjalan **100% di sisi klien (client-side)** tanpa server, tanpa database eksternal, dan dapat langsung digunakan cukup dengan membuka berkas `index.html`.

---

## ✨ Fitur Unggulan

### 1. Komponen & Estetika Mikro-Interaksi (ReactBits.dev Style)
- **Smooth Caret (Kursor Meluncur Presisi)**: Kursor meluncur mulus dengan transisi fisik elastis (`cubic-bezier(0.22, 1, 0.36, 1)`) yang sejajar presisi dengan tinggi huruf (*cap-height*).
- **Spotlight Bento Cards**: Kartu hasil evaluasi memiliki pendaran cahaya radial (*radial-gradient*) yang melacak posisi kursor mouse secara *real-time*.
- **Blur-Text Reveal**: Animasi judul aplikasi dan layar evaluasi muncul secara halus dari kondisi *blur* ke tajam.
- **Sliding Pill Tab Switcher**: Pemilih kategori dan durasi dilengkapi kapsul latar belakang aktif (*glider*) yang meluncur mulus menggunakan fisika pegas (`cubic-bezier(0.34, 1.56, 0.64, 1)`).
- **Number Ticker (Counter Animatif)**: Angka WPM, akurasi, dan konsistensi berputar naik secara halus menggunakan `requestAnimationFrame`.
- **Keyboard Virtual Interaktif**: Visualisasi keyboard QWERTY dengan 9 zona warna 10 jari standar dan pemandu dinamis jari mana yang harus menekan tombol berikutnya.

### 2. Bank Data Teks Akademik & Lokal Indonesia
Tersedia **28 paragraf realistis berbobot** yang terbagi dalam 4 kategori:
- 🎓 **Akademik & Skripsi**: Metodologi penelitian kuantitatif, analisis regresi, hipotesis, triangulasi data kualitatif, APA style, dan implikasi manajerial.
- 💻 **Teknologi & Informatika**: Kompleksitas algoritma Big O, model AI transformator, komputasi awan Docker & Kubernetes, keamanan siber zero trust, dan IoT.
- ⚖️ **Hukum & Ekonomi**: Kebijakan fiskal ekspansif, bauran moneter & inflasi, asas legalitas hukum pidana, tata kelola korporasi, dan arbitrase komersial.
- 📖 **Sastra & Budaya**: Sumpah Pemuda, sastra tutur lisan, puitika kota metropolitan, filosofi tenun ikat, dan arsitektur vernakular Nusantara.

### 3. Analitik Mendalam & Typo Tracker
- **Kalkulasi Metrik Baku**: Net WPM, Raw WPM, Akurasi (%), Konsistensi (%), dan Karakter Per Menit (CPM).
- **Typo Tracker**: Mendeteksi huruf yang paling sering keliru ditekan dan memberikan rekomendasi jari yang bertugas.
- **Grafik Tren Batang**: Diagram visual CSS Flex untuk memantau perkembangan kecepatan dari sesi ke sesi.
- **Ekspor CSV & Salin Ringkasan**: Bukti hasil pengujian dapat diunduh dalam format `.csv` atau disalin langsung ke *clipboard*.

### 4. Audio Taktil Sintetis (Web Audio API)
- Suara sakelar mekanikal (*thocky click*) dan nada *error* dihasilkan murni lewat osilator peramban tanpa file audio eksternal.

---

## 🚀 Cara Menjalankan

Tidak memerlukan Node.js, npm, ataupun web server. Cukup:

1. Unduh atau clone repositori:
   ```bash
   git clone https://github.com/artudiei/KetikCepat.git
   ```
2. Buka folder proyek dan **klik dua kali (*double click*) file `index.html`**.
3. Aplikasi langsung terbuka di browser Anda dan siap digunakan!

---

## ⌨️ Pintasan Keyboard (Shortcuts)

| Pintasan | Fungsi |
| :--- | :--- |
| **Tab + Enter** | Mengulang sesi latihan seketika (*quick restart*) |
| **Ctrl + Backspace** | Menghapus satu kata penuh sekaligus |
| **Spasi** | Melanjutkan ke kata berikutnya (tanpa scroll halaman) |

---

## 📁 Struktur Berkas

```
├── index.html           # Struktur semantik HTML5, SVG inline, Google Fonts, & modal
├── style.css            # Desain Dark Mode (#09090b), variabel CSS, kursor meluncur, spotlight
├── data.js              # Bank korpus teks 4 kategori & pemetaan layout 10 jari standar
├── script.js            # Typing engine, audio sintetis, smooth caret, ticker, & localStorage
├── DOKUMENTASI_PRODUK.md# Dokumentasi lengkap arsitektur dan spesifikasi produk
└── README.md            # Dokumentasi repositori
```

---

## 📄 Lisensi

Proyek ini dirilis di bawah lisensi [MIT](LICENSE).
