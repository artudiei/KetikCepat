# KetikCepat 🚀 (v1.1)
### Aplikasi Simulasi Latihan Mengetik 10 Jari dengan Teks Akademik & Konten Lokal Bahasa Indonesia

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web%20(Pure%20Vanilla)-blue.svg)](#)
[![Zero Backend](https://img.shields.io/badge/Backend-100%25%20Client--Side-10b981.svg)](#)
[![Offline Ready](https://img.shields.io/badge/Offline-Ready-cyan.svg)](#)

**KetikCepat** adalah platform simulasi pengetikan 10 jari modern berbasis **Vanilla HTML5, CSS3, dan JavaScript (ES6+) murni**. Dirancang khusus untuk mengasah memori otot dan kecepatan pengetikan menggunakan korpus bahasa Indonesia baku tingkat lanjut.

Aplikasi ini berjalan **100% di sisi klien (client-side)** tanpa server, tanpa database eksternal, dan dapat langsung digunakan cukup dengan membuka berkas `index.html`.

---

## ✨ Fitur Unggulan (Pembaruan v1.1)

1. **Bank Kata Masif & Pengacak Dinamis**:
   - Berisi **48 teks berbobot** (12 teks untuk masing-masing 4 kategori: Akademik & Skripsi, Teknologi & Informatika, Hukum & Ekonomi, serta Sastra & Budaya).
   - Setiap kali tombol **"Ulangi"** atau pintasan **Tab + Enter** ditekan, teks baru dipilih dan susunan kalimatnya diacak secara dinamis (*Fisher-Yates Shuffle*).
2. **Proteksi AFK (Away From Keyboard) & Zero Metrics**:
   - Jika pengguna berhenti mengetik selama 4 detik saat sesi aktif, timer akan dijeda otomatis (*idle pause*).
   - Jika sesi berakhir tanpa pengetikan yang valid ($< 5$ karakter), metrik bernilai **NOL (0 WPM, 0% Akurasi, 0% Konsistensi)** dan **TIDAK dimasukkan ke riwayat `localStorage`**.
3. **Smooth Caret Presisi 100%**:
   - Kursor pengetikan diposisikan langsung di dalam kontainer teks viewport, sejajar presisi dengan tinggi huruf aktif tanpa offset vertikal yang melorot.
4. **Latar Belakang Side-Rays Dinamis (ReactBits.dev)**:
   - Efek pendaran berkas sinar volumetrik WebGL yang bergelombang halus di latar belakang, merespons pergerakan kursor mouse (*mouse tilt*) dengan gradasi warna Emerald & Cyan.
5. **Komponen Visual ReactBits.dev**:
   - Spotlight Bento Cards dengan pelacak kursor mouse, Blur-Text Reveal, Sliding Pill Glider, dan Animated Number Ticker.
6. **Panduan 10 Jari Interaktif**:
   - Keyboard virtual QWERTY dengan 9 zona warna jari dan indikator tombol target.
7. **Audio Taktil Sintetis (Web Audio API)**:
   - Suara klik sakelar mekanikal (*thocky click*) dan nada error sintetis tanpa berkas audio eksternal.

---

## 🚀 Cara Menjalankan

Cukup buka folder proyek dan **klik dua kali (*double click*) file `index.html`** di browser Anda.

---

## ⌨️ Pintasan Keyboard

| Pintasan | Fungsi |
| :--- | :--- |
| **Tab + Enter** | Mengulang sesi latihan seketika & mengacak kata/teks baru |
| **Ctrl + Backspace** | Menghapus satu kata penuh sekaligus |
| **Spasi** | Melanjutkan ke kata berikutnya tanpa scroll halaman |
