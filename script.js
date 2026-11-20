/**
 * KetikCepat — Engine Pengetikan 10 Jari Modern (Vanilla JavaScript ES6+)
 * 100% Client-Side murni, tanpa dependensi eksternal, kompatibel langsung via file:///
 */

(function () {
  'use strict';

  // Pastikan dataset TYPING_DATA telah dimuat dari data.js
  const data = window.TYPING_DATA || {
    categories: [],
    texts: {},
    fingerInfo: {},
    keyToFinger: {},
    keyboardRows: [],
  };

  // ==========================================
  // STATE APLIKASI
  // ==========================================
  const state = {
    category: localStorage.getItem('ketikcepat_cat') || 'akademik',
    duration: localStorage.getItem('ketikcepat_dur') || '30',
    soundEnabled: localStorage.getItem('ketikcepat_sound') !== 'false',
    showKeyboard: localStorage.getItem('ketikcepat_kb') !== 'false',
    history: JSON.parse(localStorage.getItem('ketikcepat_history') || '[]'),

    textList: [],
    textIndex: 0,
    targetText: '',
    textTitle: '',

    currentIndex: 0,
    charStatus: [], // 'pending' | 'correct' | 'incorrect'
    isActive: false,
    isFinished: false,
    timerInterval: null,
    timeElapsed: 0,
    timeLeft: 30,
    lastActiveTime: 0,
    isIdlePaused: false,

    wpmHistory: [],
    missedChars: {}, // { 'a': 3, 'k': 1 }
    activeKey: null,
    tabPressed: false,
  };

  // ==========================================
  // ELEMEN DOM
  // ==========================================
  const dom = {
    // Controls & Tabs
    categoryTabs: document.getElementById('categoryTabs'),
    categoryGlider: document.getElementById('categoryGlider'),
    durationTabs: document.getElementById('durationTabs'),
    durationGlider: document.getElementById('durationGlider'),

    // Live Metrics
    liveTimer: document.getElementById('liveTimer'),
    liveTimerLabel: document.getElementById('liveTimerLabel'),
    liveWpm: document.getElementById('liveWpm'),
    liveAccuracy: document.getElementById('liveAccuracy'),
    textTitleDisplay: document.getElementById('textTitleDisplay'),
    btnRestart: document.getElementById('btnRestart'),

    // Typing Area
    typingCard: document.getElementById('typingCard'),
    hiddenInput: document.getElementById('hiddenInput'),
    textViewport: document.getElementById('textViewport'),
    caret: document.getElementById('caret'),
    unfocusedOverlay: document.getElementById('unfocusedOverlay'),
    progressBarFill: document.getElementById('progressBarFill'),
    progressPercent: document.getElementById('progressPercent'),

    // Keyboard
    keyboardSection: document.getElementById('keyboardSection'),
    keyboardRowsWrap: document.getElementById('keyboardRowsWrap'),
    fingerHintBadge: document.getElementById('fingerHintBadge'),
    btnToggleKeyboard: document.getElementById('btnToggleKeyboard'),

    // Results View
    typingSessionView: document.getElementById('typingSessionView'),
    resultsView: document.getElementById('resultsView'),
    afkNotice: document.getElementById('afkNotice'),
    resultsTagText: document.getElementById('resultsTagText'),
    resultNetWpm: document.getElementById('resultNetWpm'),
    resultRawWpm: document.getElementById('resultRawWpm'),
    resultAccuracy: document.getElementById('resultAccuracy'),
    resultConsistency: document.getElementById('resultConsistency'),
    resultCorrectChars: document.getElementById('resultCorrectChars'),
    resultIncorrectChars: document.getElementById('resultIncorrectChars'),
    resultTotalChars: document.getElementById('resultTotalChars'),
    resultTime: document.getElementById('resultTime'),
    resultCpm: document.getElementById('resultCpm'),
    resultSpeedTier: document.getElementById('resultSpeedTier'),
    resultTextInfo: document.getElementById('resultTextInfo'),
    typoBadgesContainer: document.getElementById('typoBadgesContainer'),
    btnRepeatTest: document.getElementById('btnRepeatTest'),
    btnNextText: document.getElementById('btnNextText'),
    btnExportCsv: document.getElementById('btnExportCsv'),
    btnCopySummary: document.getElementById('btnCopySummary'),

    // Header Controls & Modals
    btnToggleSound: document.getElementById('btnToggleSound'),
    soundIconWrap: document.getElementById('soundIconWrap'),
    btnOpenHistory: document.getElementById('btnOpenHistory'),
    historyCountBadge: document.getElementById('historyCountBadge'),
    historyModal: document.getElementById('historyModal'),
    btnCloseHistory: document.getElementById('btnCloseHistory'),
    chartBarsWrap: document.getElementById('chartBarsWrap'),
    historyTableBody: document.getElementById('historyTableBody'),
    btnClearHistory: document.getElementById('btnClearHistory'),
    btnOpenInfo: document.getElementById('btnOpenInfo'),
    infoModal: document.getElementById('infoModal'),
    btnCloseInfo: document.getElementById('btnCloseInfo'),
  };

  // Array referensi span elemen karakter DOM untuk pelacakan caret cepat
  let charSpanElements = [];

  // ==========================================
  // WEB AUDIO API (Suara Ketik Sintetis)
  // ==========================================
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) audioCtx = new AudioCtxClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playKeySound(isError = false) {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (isError) {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else {
        const baseFreq = 520 + Math.random() * 80;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(190, now + 0.035);
        gain.gain.setValueAtTime(0.055, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.035);
      }
    } catch (e) {
      // Abaikan jika browser membatasi audio autoplay
    }
  }

  function playSuccessSound() {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.08;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.32);
      });
    } catch (e) {}
  }

  // ==========================================
  // INISIALISASI & TAB GLIDER
  // ==========================================
  function init() {
    setupPillGliders();
    renderVirtualKeyboard();
    loadCategoryTexts(state.category);
    updateSoundUI();
    updateHistoryBadge();
    setupEventListeners();
    setupSpotlightCards();
    focusTypingArea();
  }

  function setupPillGliders() {
    // Glider Kategori
    const catBtns = dom.categoryTabs.querySelectorAll('.pill-btn');
    catBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        catBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.category = btn.dataset.category;
        localStorage.setItem('ketikcepat_cat', state.category);
        updateGlider(dom.categoryGlider, btn);
        loadCategoryTexts(state.category);
        restartSession(true);
      });
      if (btn.dataset.category === state.category) {
        btn.classList.add('active');
        setTimeout(() => updateGlider(dom.categoryGlider, btn), 50);
      }
    });

    // Glider Durasi
    const durBtns = dom.durationTabs.querySelectorAll('.pill-btn');
    durBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        durBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.duration = btn.dataset.duration;
        localStorage.setItem('ketikcepat_dur', state.duration);
        updateGlider(dom.durationGlider, btn);
        restartSession(true);
      });
      if (btn.dataset.duration === state.duration) {
        btn.classList.add('active');
        setTimeout(() => updateGlider(dom.durationGlider, btn), 50);
      }
    });

    window.addEventListener('resize', () => {
      const activeCat = dom.categoryTabs.querySelector('.pill-btn.active');
      const activeDur = dom.durationTabs.querySelector('.pill-btn.active');
      if (activeCat) updateGlider(dom.categoryGlider, activeCat);
      if (activeDur) updateGlider(dom.durationGlider, activeDur);
      updateCaretPosition();
    });
  }

  function updateGlider(gliderEl, targetBtn) {
    if (!gliderEl || !targetBtn) return;
    gliderEl.style.transform = `translateX(${targetBtn.offsetLeft}px)`;
    gliderEl.style.width = `${targetBtn.offsetWidth}px`;
  }

  // ==========================================
  // BANK DATA & PENGACAK TEKS / SUSUNAN KATA
  // ==========================================
  function loadCategoryTexts(categoryKey) {
    state.textList = data.texts[categoryKey] || data.texts.akademik || [];
    pickAndRandomizeText();
  }

  /**
   * Mengambil teks dari bank kata dan mengacak susunan kalimat/kata
   * Memastikan setiap tombol "Ulangi" dipencet, teks dan susunannya selalu baru!
   */
  function pickAndRandomizeText() {
    const list = state.textList;
    if (!list || list.length === 0) return;

    // 1. Pilih indeks teks yang berbeda dari teks yang sedang aktif
    let newIdx = 0;
    if (list.length > 1) {
      do {
        newIdx = Math.floor(Math.random() * list.length);
      } while (newIdx === state.textIndex);
    }
    state.textIndex = newIdx;
    const baseTextObj = list[newIdx];

    // 2. Acak susunan kalimat dari teks menggunakan algoritma Fisher-Yates
    const rawSentences = baseTextObj.text
      .split(/(?<=[.?!])\s+/)
      .filter((s) => s.trim().length > 0);

    const shuffledSentences = [...rawSentences];
    for (let i = shuffledSentences.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledSentences[i], shuffledSentences[j]] = [shuffledSentences[j], shuffledSentences[i]];
    }

    // 3. Jika mode berdurasi waktu (15s, 30s, 60s) dan kalimat kurang panjang,
    // sisipkan kalimat acak dari teks lain dalam kategori yang sama agar variasi kata maksimal
    if (state.duration !== 'paragraph') {
      const otherTexts = list.filter((_, idx) => idx !== newIdx);
      if (otherTexts.length > 0) {
        const extraText = otherTexts[Math.floor(Math.random() * otherTexts.length)];
        const extraSentences = extraText.text
          .split(/(?<=[.?!])\s+/)
          .filter((s) => s.trim().length > 0);
        if (extraSentences.length > 0) {
          shuffledSentences.push(extraSentences[Math.floor(Math.random() * extraSentences.length)]);
        }
      }
    }

    state.targetText = shuffledSentences.join(' ');
    state.textTitle = baseTextObj.title;

    if (dom.textTitleDisplay) {
      dom.textTitleDisplay.textContent = baseTextObj.title;
    }

    renderTextToViewport();
  }

  function renderTextToViewport() {
    dom.textViewport.innerHTML = '';

    // Pastikan elemen #caret selalu berada di dalam dom.textViewport
    if (!dom.caret) {
      dom.caret = document.createElement('div');
      dom.caret.id = 'caret';
    }
    dom.textViewport.appendChild(dom.caret);

    charSpanElements = [];
    state.charStatus = new Array(state.targetText.length).fill('pending');

    const words = state.targetText.split(' ');
    let charIndexGlobal = 0;

    words.forEach((wordStr, wIdx) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'word';

      // Karakter dalam kata
      for (let i = 0; i < wordStr.length; i++) {
        const char = wordStr[i];
        const charSpan = document.createElement('span');
        charSpan.className = 'char';
        charSpan.textContent = char;
        charSpan.dataset.index = charIndexGlobal;
        charSpanElements.push(charSpan);
        wordSpan.appendChild(charSpan);
        charIndexGlobal++;
      }

      // Spasi setelah kata (kecuali kata paling akhir)
      if (wIdx < words.length - 1) {
        const spaceSpan = document.createElement('span');
        spaceSpan.className = 'char space-char';
        spaceSpan.textContent = ' ';
        spaceSpan.dataset.index = charIndexGlobal;
        charSpanElements.push(spaceSpan);
        wordSpan.appendChild(spaceSpan);
        charIndexGlobal++;
      }

      dom.textViewport.appendChild(wordSpan);
    });

    // Posisikan caret presisi di karakter pertama
    setTimeout(updateCaretPosition, 20);
    updateProgress(0);
    updateNextKeyGuide();
  }

  // ==========================================
  // SMOOTH CARET & AUTO SCROLL (Presisi 100%)
  // ==========================================
  function updateCaretPosition() {
    if (!dom.caret || charSpanElements.length === 0) return;

    const viewportRect = dom.textViewport.getBoundingClientRect();

    if (state.currentIndex < charSpanElements.length) {
      const targetSpan = charSpanElements[state.currentIndex];
      const spanRect = targetSpan.getBoundingClientRect();

      // Karena #caret sekarang berada tepat di dalam #textViewport (position: relative),
      // koordinat leftPos & topPos dihitung presisi langsung terhadap textViewport
      const leftPos = Math.round(spanRect.left - viewportRect.left + dom.textViewport.scrollLeft);
      const topPos = Math.round(spanRect.top - viewportRect.top + dom.textViewport.scrollTop);
      const caretHeight = Math.round(spanRect.height);

      dom.caret.style.left = `${leftPos}px`;
      dom.caret.style.top = `${topPos}px`;
      dom.caret.style.height = `${caretHeight}px`;

      // Auto-scroll nyaman saat baris berganti
      const scrollThreshold = dom.textViewport.clientHeight * 0.65;
      const relativeTop = spanRect.top - viewportRect.top;
      if (relativeTop > scrollThreshold) {
        dom.textViewport.scrollTop += 36;
      } else if (relativeTop < 20 && dom.textViewport.scrollTop > 0) {
        dom.textViewport.scrollTop = Math.max(0, dom.textViewport.scrollTop - 36);
      }
    } else if (charSpanElements.length > 0) {
      // Akhir teks
      const lastSpan = charSpanElements[charSpanElements.length - 1];
      const spanRect = lastSpan.getBoundingClientRect();

      const leftPos = Math.round(spanRect.right - viewportRect.left + dom.textViewport.scrollLeft);
      const topPos = Math.round(spanRect.top - viewportRect.top + dom.textViewport.scrollTop);

      dom.caret.style.left = `${leftPos}px`;
      dom.caret.style.top = `${topPos}px`;
      dom.caret.style.height = `${Math.round(spanRect.height)}px`;
    }
  }

  // ==========================================
  // SESI PENGETIKAN, TIMER & DETEKSI AFK
  // ==========================================
  function startSession() {
    state.isActive = true;
    state.isFinished = false;
    state.timeElapsed = 0;
    state.wpmHistory = [];
    state.lastActiveTime = Date.now();
    state.isIdlePaused = false;

    const durationInt = parseInt(state.duration, 10);
    state.timeLeft = isNaN(durationInt) ? 0 : durationInt;

    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      // DETEKSI AFK (Away From Keyboard):
      // Jika pengguna tidak menekan tombol selama lebih dari 4 detik saat sesi aktif,
      // waktu dijeda ("tidak berjalan") agar statistik tidak rusak karena ditinggal.
      if (state.isActive && !state.isFinished) {
        const idleDuration = Date.now() - state.lastActiveTime;
        if (idleDuration > 4000) {
          state.isIdlePaused = true;
          if (dom.liveTimerLabel) dom.liveTimerLabel.textContent = 'dijeda (AFK)';
          return; // Lewati interval detik ini (timer tidak berjalan)
        } else {
          state.isIdlePaused = false;
          if (dom.liveTimerLabel) {
            dom.liveTimerLabel.textContent = state.duration === 'paragraph' ? 'berjalan' : 'tersisa';
          }
        }
      }

      state.timeElapsed++;

      // Hitung live WPM
      const correctChars = state.charStatus.filter((s) => s === 'correct').length;
      const currentLiveWpm = Math.round((correctChars / 5) / (state.timeElapsed / 60)) || 0;
      state.wpmHistory.push(currentLiveWpm);
      if (dom.liveWpm) dom.liveWpm.textContent = currentLiveWpm;

      // Mode Durasi vs Mode 1 Paragraf
      if (state.duration !== 'paragraph') {
        state.timeLeft--;
        if (dom.liveTimer) dom.liveTimer.textContent = `${state.timeLeft}s`;
        if (state.timeLeft <= 0) {
          finishSession();
        }
      } else {
        const mins = Math.floor(state.timeElapsed / 60);
        const secs = (state.timeElapsed % 60).toString().padStart(2, '0');
        if (dom.liveTimer) dom.liveTimer.textContent = `${mins}:${secs}`;
      }
    }, 1000);
  }

  /**
   * Reset sesi latihan.
   * Parameter randomizeText = true memastikan bank kata diganti dan susunan kata diacak!
   */
  function restartSession(randomizeText = true) {
    clearInterval(state.timerInterval);
    state.isActive = false;
    state.isFinished = false;
    state.currentIndex = 0;
    state.timeElapsed = 0;
    state.wpmHistory = [];
    state.missedChars = {};
    state.isIdlePaused = false;

    const durationInt = parseInt(state.duration, 10);
    state.timeLeft = isNaN(durationInt) ? 0 : durationInt;

    if (dom.liveTimer) {
      dom.liveTimer.textContent = state.duration === 'paragraph' ? '0:00' : `${state.timeLeft}s`;
    }
    if (dom.liveTimerLabel) {
      dom.liveTimerLabel.textContent = state.duration === 'paragraph' ? 'berjalan' : 'tersisa';
    }
    if (dom.liveWpm) dom.liveWpm.textContent = '0';
    if (dom.liveAccuracy) dom.liveAccuracy.textContent = '100%';

    // Sembunyikan layar hasil & tampilkan area pengetikan
    dom.typingSessionView.style.display = 'block';
    dom.resultsView.classList.remove('active');
    dom.textViewport.scrollTop = 0;

    // Ganti kata & acak susunan kalimat
    if (randomizeText) {
      pickAndRandomizeText();
    } else {
      renderTextToViewport();
    }

    focusTypingArea();
  }

  function finishSession() {
    clearInterval(state.timerInterval);
    state.isActive = false;
    state.isFinished = true;

    const correctChars = state.charStatus.filter((s) => s === 'correct').length;
    const incorrectChars = state.charStatus.filter((s) => s === 'incorrect').length;
    const totalChars = state.currentIndex;
    const durationSec = Math.max(1, state.timeElapsed);
    const durationMin = durationSec / 60;

    // ==========================================
    // VALIDASI STATUS AFK / AWAY FROM KEYBOARD:
    // Jika pengguna tidak mengetik sama sekali (totalChars < 5 atau 0 karakter benar),
    // seluruh statistik disetel ke NOL dan TIDAK dimasukkan ke dalam riwayat localStorage.
    // ==========================================
    const isAfkOrInvalid = totalChars < 5 || correctChars === 0;

    if (isAfkOrInvalid) {
      showResultsScreen({
        isAfk: true,
        netWpm: 0,
        rawWpm: 0,
        accuracy: 0,
        consistency: 0,
        correctChars: 0,
        incorrectChars: 0,
        totalChars: 0,
        durationSec: 0,
        cpm: 0,
        topMissed: [],
      });
      return;
    }

    playSuccessSound();

    const rawWpm = Math.round((totalChars / 5) / durationMin) || 0;
    const netWpm = Math.max(0, Math.round(((correctChars - incorrectChars) / 5) / durationMin)) || 0;
    const accuracy = totalChars > 0 ? Math.max(0, Math.min(100, Math.round((correctChars / totalChars) * 100))) : 0;
    const cpm = Math.round(totalChars / durationMin) || 0;

    // Hitung konsistensi
    const consistency = calculateConsistency(state.wpmHistory);

    // Ambil huruf bermasalah terbanyak
    const topMissed = Object.entries(state.missedChars)
      .map(([char, count]) => ({ char, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Simpan ke localStorage (hanya jika bukan sesi AFK)
    const sessionRecord = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      category: state.category,
      textTitle: state.textTitle,
      duration: durationSec,
      netWpm,
      rawWpm,
      accuracy,
      consistency,
      correctChars,
      incorrectChars,
      totalChars,
      topMissed,
    };
    state.history.unshift(sessionRecord);
    if (state.history.length > 10) state.history = state.history.slice(0, 10);
    localStorage.setItem('ketikcepat_history', JSON.stringify(state.history));
    updateHistoryBadge();

    // Tampilkan Layar Hasil
    showResultsScreen({
      isAfk: false,
      netWpm,
      rawWpm,
      accuracy,
      consistency,
      correctChars,
      incorrectChars,
      totalChars,
      durationSec,
      cpm,
      topMissed,
    });
  }

  function calculateConsistency(wpmArr) {
    if (!wpmArr || wpmArr.length < 3) return 0;
    const valid = wpmArr.filter((w) => w > 0);
    if (valid.length < 2) return 0;
    const mean = valid.reduce((acc, curr) => acc + curr, 0) / valid.length;
    if (mean === 0) return 0;
    const variance = valid.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / valid.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean;
    return Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));
  }

  // ==========================================
  // NUMBER TICKER ANIMATED COUNTER
  // ==========================================
  function animateCounter(element, targetVal, suffix = '', duration = 1000) {
    if (!element) return;
    const startVal = 0;
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (targetVal - startVal) * easeOut);
      element.textContent = `${current}${suffix}`;
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = `${targetVal}${suffix}`;
      }
    }
    requestAnimationFrame(update);
  }

  // ==========================================
  // LAYAR HASIL EVALUASI
  // ==========================================
  function showResultsScreen(res) {
    dom.typingSessionView.style.display = 'none';
    dom.resultsView.classList.add('active');

    // Tampilkan / Sembunyikan banner AFK Notice
    if (dom.afkNotice) {
      dom.afkNotice.style.display = res.isAfk ? 'block' : 'none';
    }
    if (dom.resultsTagText) {
      dom.resultsTagText.textContent = res.isAfk ? 'Sesi AFK (Tidak Disimpan)' : 'Sesi Latihan Selesai';
    }

    // Number ticker counters
    animateCounter(dom.resultNetWpm, res.netWpm, '', 1000);
    animateCounter(dom.resultAccuracy, res.accuracy, '%', 1000);
    animateCounter(dom.resultConsistency, res.consistency, '%', 1000);

    dom.resultRawWpm.textContent = `Raw WPM: ${res.rawWpm}`;
    dom.resultCorrectChars.textContent = res.correctChars;
    dom.resultIncorrectChars.textContent = res.incorrectChars;
    dom.resultTotalChars.textContent = res.totalChars;
    dom.resultTime.textContent = `${res.durationSec}s`;
    dom.resultCpm.textContent = res.cpm;

    // Evaluasi Speed Tier
    let tierText = 'Pemula (Developing)';
    let tierColor = '#71717a';

    if (res.isAfk) {
      tierText = 'Tidak Berjalan (AFK)';
      tierColor = '#ef4444';
    } else if (res.netWpm >= 80) {
      tierText = 'Master Typist (Ahli)';
      tierColor = '#a855f7';
    } else if (res.netWpm >= 65) {
      tierText = 'Sangat Cepat (Pro)';
      tierColor = '#10b981';
    } else if (res.netWpm >= 45) {
      tierText = 'Mahir (Fluent)';
      tierColor = '#06b6d4';
    } else if (res.netWpm >= 30) {
      tierText = 'Menengah (Intermediate)';
      tierColor = '#f59e0b';
    }

    dom.resultSpeedTier.textContent = tierText;
    dom.resultSpeedTier.style.color = tierColor;
    dom.resultTextInfo.textContent = `Kategori: ${state.category.toUpperCase()} • "${state.textTitle}"`;

    // Render Typo Problem Keys
    dom.typoBadgesContainer.innerHTML = '';
    if (res.topMissed && res.topMissed.length > 0) {
      res.topMissed.forEach((item) => {
        const fingerKey = data.keyToFinger[item.char] || data.keyToFinger[item.char.toLowerCase()];
        const finger = fingerKey ? data.fingerInfo[fingerKey] : null;

        const chip = document.createElement('div');
        chip.className = 'typo-chip';
        chip.innerHTML = `
          <span class="typo-key">${item.char === ' ' ? 'Spasi' : item.char}</span>
          <div class="typo-info">
            <span class="typo-count">${item.count}x salah</span>
            <span class="typo-finger">${finger ? finger.name : 'Jari Standard'}</span>
          </div>
        `;
        dom.typoBadgesContainer.appendChild(chip);
      });
    } else {
      dom.typoBadgesContainer.innerHTML = res.isAfk
        ? `<div style="font-size: 0.75rem; color: #71717a; padding: 0.5rem 0;">Tidak ada pengetikan yang dapat dievaluasi.</div>`
        : `<div style="font-size: 0.75rem; color: #10b981; padding: 0.5rem 0;">✨ Sempurna! Tidak ada kesalahan ketik yang tercatat pada sesi ini.</div>`;
    }
  }

  // ==========================================
  // SPOTLIGHT BENTO CARDS (Mouse Follower)
  // ==========================================
  function setupSpotlightCards() {
    const cards = document.querySelectorAll('.spotlight-card');
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    });
  }

  // ==========================================
  // KEYBOARD VIRTUAL & FINGER GUIDE
  // ==========================================
  function renderVirtualKeyboard() {
    dom.keyboardRowsWrap.innerHTML = '';

    data.keyboardRows.forEach((row) => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'kb-row';

      row.forEach((k) => {
        const keyDiv = document.createElement('div');
        keyDiv.className = `key ${k.width || 'key-sm'}`;
        keyDiv.dataset.key = k.key.toLowerCase();
        if (k.shift) keyDiv.dataset.shift = k.shift;
        if (k.space) keyDiv.dataset.space = 'true';

        const finger = data.fingerInfo[k.finger] || data.fingerInfo.thumbs;
        keyDiv.style.borderBottomColor = finger.color + '50';
        keyDiv.style.borderBottomWidth = '2.5px';

        keyDiv.innerHTML = `<span>${k.label || k.key.toUpperCase()}</span>`;
        if (k.tactile) {
          const bump = document.createElement('div');
          bump.className = 'tactile-bump';
          keyDiv.appendChild(bump);
        }
        rowDiv.appendChild(keyDiv);
      });

      dom.keyboardRowsWrap.appendChild(rowDiv);
    });
  }

  function updateNextKeyGuide() {
    const prevTargets = dom.keyboardRowsWrap.querySelectorAll('.key.target');
    prevTargets.forEach((k) => k.classList.remove('target'));

    if (state.currentIndex >= state.targetText.length) {
      if (dom.fingerHintBadge) dom.fingerHintBadge.innerHTML = '<span>Selesai!</span>';
      return;
    }

    const nextChar = state.targetText[state.currentIndex];
    const fingerKey = data.keyToFinger[nextChar] || data.keyToFinger[nextChar.toLowerCase()];
    const finger = fingerKey ? data.fingerInfo[fingerKey] : null;

    if (finger && dom.fingerHintBadge) {
      dom.fingerHintBadge.innerHTML = `
        <span class="finger-dot" style="background: ${finger.color}"></span>
        <span>Gunakan: <strong>${finger.name}</strong></span>
        <span style="font-family: var(--font-mono); background: #27272a; padding: 0.1rem 0.35rem; border-radius: 4px; color: #fff;">
          ${nextChar === ' ' ? 'Spasi' : nextChar}
        </span>
      `;
    }

    const keys = dom.keyboardRowsWrap.querySelectorAll('.key');
    keys.forEach((keyEl) => {
      const isSpace = nextChar === ' ' && keyEl.dataset.space === 'true';
      const isCharMatch =
        keyEl.dataset.key === nextChar.toLowerCase() ||
        keyEl.dataset.shift === nextChar;
      if (isSpace || isCharMatch) {
        keyEl.classList.add('target');
      }
    });
  }

  function setKeyPressedVisual(key, isPressed) {
    if (!dom.keyboardRowsWrap) return;
    const lower = key.toLowerCase();
    const keys = dom.keyboardRowsWrap.querySelectorAll('.key');

    keys.forEach((keyEl) => {
      const match =
        (key === ' ' && keyEl.dataset.space === 'true') ||
        keyEl.dataset.key === lower ||
        keyEl.dataset.shift === key ||
        keyEl.dataset.key === key;
      if (match) {
        if (isPressed) {
          keyEl.classList.add('pressed');
        } else {
          keyEl.classList.remove('pressed');
        }
      }
    });
  }

  // ==========================================
  // PENANGANAN INPUT & EVENT KEYDOWN
  // ==========================================
  function handleKeyDown(e) {
    // Pintasan Cepat: Tab + Enter untuk instant restart & ubah kata
    if (e.key === 'Tab') {
      e.preventDefault();
      state.tabPressed = true;
      return;
    }
    if (e.key === 'Enter' && state.tabPressed) {
      e.preventDefault();
      state.tabPressed = false;
      restartSession(true);
      return;
    }
    state.tabPressed = false;

    // Abaikan jika latihan sudah selesai
    if (state.isFinished) return;

    // Filter tombol modifier non-karakter
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      return;
    }

    // Cegah scroll halaman saat menekan spasi
    if (e.key === ' ') {
      e.preventDefault();
    }

    // Perbarui waktu aktivitas terakhir untuk deteksi AFK
    state.lastActiveTime = Date.now();
    if (state.isIdlePaused) {
      state.isIdlePaused = false;
      if (dom.liveTimerLabel) {
        dom.liveTimerLabel.textContent = state.duration === 'paragraph' ? 'berjalan' : 'tersisa';
      }
    }

    // Visual efek tekan tombol
    setKeyPressedVisual(e.key, true);

    // Mulai sesi jika belum aktif
    if (!state.isActive) {
      startSession();
    }

    // Penanganan Backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (state.currentIndex > 0) {
        if (e.ctrlKey) {
          // Hapus seluruh kata sebelumnya
          let prevIdx = state.currentIndex - 1;
          while (prevIdx > 0 && state.targetText[prevIdx] === ' ') prevIdx--;
          while (prevIdx > 0 && state.targetText[prevIdx - 1] !== ' ') prevIdx--;

          for (let i = prevIdx; i < state.currentIndex; i++) {
            state.charStatus[i] = 'pending';
            if (charSpanElements[i]) {
              charSpanElements[i].className = 'char';
            }
          }
          state.currentIndex = prevIdx;
        } else {
          // Hapus 1 karakter
          state.currentIndex--;
          state.charStatus[state.currentIndex] = 'pending';
          if (charSpanElements[state.currentIndex]) {
            charSpanElements[state.currentIndex].className = 'char';
          }
        }
        playKeySound(false);
        updateCaretPosition();
        updateNextKeyGuide();
        updateProgress();
      }
      return;
    }

    // Penanganan Karakter Tunggal
    if (e.key.length === 1 && state.currentIndex < state.targetText.length) {
      const expected = state.targetText[state.currentIndex];
      const isMatch = e.key === expected;

      playKeySound(!isMatch);

      const targetSpan = charSpanElements[state.currentIndex];
      if (isMatch) {
        state.charStatus[state.currentIndex] = 'correct';
        if (targetSpan) targetSpan.className = 'char correct';
      } else {
        state.charStatus[state.currentIndex] = 'incorrect';
        if (targetSpan) {
          targetSpan.className = targetSpan.classList.contains('space-char')
            ? 'char space-char space-error'
            : 'char incorrect';
        }
        state.missedChars[expected] = (state.missedChars[expected] || 0) + 1;
      }

      state.currentIndex++;
      updateCaretPosition();
      updateNextKeyGuide();
      updateProgress();

      // Update live accuracy
      const correctChars = state.charStatus.filter((s) => s === 'correct').length;
      const acc = Math.round((correctChars / state.currentIndex) * 100);
      if (dom.liveAccuracy) dom.liveAccuracy.textContent = `${acc}%`;

      // Jika seluruh teks telah selesai pada mode paragraf
      if (state.currentIndex >= state.targetText.length) {
        finishSession();
      }
    }
  }

  function handleKeyUp(e) {
    setKeyPressedVisual(e.key, false);
  }

  function updateProgress() {
    if (!state.targetText || state.targetText.length === 0) return;
    const percent = Math.min(100, Math.round((state.currentIndex / state.targetText.length) * 100));
    if (dom.progressBarFill) dom.progressBarFill.style.width = `${percent}%`;
    if (dom.progressPercent) dom.progressPercent.textContent = `${percent}%`;
  }

  function focusTypingArea() {
    if (dom.hiddenInput) {
      dom.hiddenInput.focus();
    }
    if (dom.unfocusedOverlay) {
      dom.unfocusedOverlay.classList.remove('visible');
    }
  }

  // ==========================================
  // EVENT LISTENERS & MODALS
  // ==========================================
  function setupEventListeners() {
    // Window input & click handling
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Klik di area card memastikan input selalu terfokus
    dom.typingCard.addEventListener('click', focusTypingArea);
    dom.unfocusedOverlay.addEventListener('click', focusTypingArea);

    dom.hiddenInput.addEventListener('blur', () => {
      if (!state.isFinished && !document.querySelector('.modal-backdrop.open')) {
        dom.unfocusedOverlay.classList.add('visible');
      }
    });
    dom.hiddenInput.addEventListener('focus', () => {
      dom.unfocusedOverlay.classList.remove('visible');
    });

    // Tombol Restart (Ganti kata & acak susunan kata)
    dom.btnRestart.addEventListener('click', () => restartSession(true));
    dom.btnRepeatTest.addEventListener('click', () => restartSession(true));

    // Tombol Teks Berikutnya
    dom.btnNextText.addEventListener('click', () => {
      state.textIndex++;
      pickAndRandomizeText();
      restartSession(false);
    });

    // Toggle Suara
    dom.btnToggleSound.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      localStorage.setItem('ketikcepat_sound', state.soundEnabled);
      updateSoundUI();
    });

    // Toggle Keyboard
    dom.btnToggleKeyboard.addEventListener('click', () => {
      state.showKeyboard = !state.showKeyboard;
      localStorage.setItem('ketikcepat_kb', state.showKeyboard);
      dom.keyboardSection.style.display = state.showKeyboard ? 'block' : 'none';
      dom.btnToggleKeyboard.textContent = state.showKeyboard ? 'Sembunyikan' : 'Tampilkan';
    });
    if (!state.showKeyboard) {
      dom.keyboardSection.style.display = 'none';
      dom.btnToggleKeyboard.textContent = 'Tampilkan';
    }

    // Modal Riwayat
    dom.btnOpenHistory.addEventListener('click', openHistoryModal);
    dom.btnCloseHistory.addEventListener('click', () => dom.historyModal.classList.remove('open'));
    dom.historyModal.addEventListener('click', (e) => {
      if (e.target === dom.historyModal) dom.historyModal.classList.remove('open');
    });

    // Bersihkan Riwayat
    dom.btnClearHistory.addEventListener('click', () => {
      if (confirm('Apakah Anda yakin ingin menghapus seluruh riwayat latihan?')) {
        state.history = [];
        localStorage.removeItem('ketikcepat_history');
        updateHistoryBadge();
        renderHistoryContent();
      }
    });

    // Modal Panduan 10 Jari
    dom.btnOpenInfo.addEventListener('click', () => dom.infoModal.classList.add('open'));
    dom.btnCloseInfo.addEventListener('click', () => dom.infoModal.classList.remove('open'));
    dom.infoModal.addEventListener('click', (e) => {
      if (e.target === dom.infoModal) dom.infoModal.classList.remove('open');
    });

    // Ekspor Data CSV
    dom.btnExportCsv.addEventListener('click', exportHistoryToCSV);

    // Salin Ringkasan
    dom.btnCopySummary.addEventListener('click', copySummaryToClipboard);
  }

  function updateSoundUI() {
    if (state.soundEnabled) {
      dom.btnToggleSound.classList.add('active');
      dom.soundIconWrap.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
        <span>Suara Aktif</span>
      `;
    } else {
      dom.btnToggleSound.classList.remove('active');
      dom.soundIconWrap.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <line x1="23" y1="9" x2="17" y2="15"></line>
          <line x1="17" y1="9" x2="23" y2="15"></line>
        </svg>
        <span>Muted</span>
      `;
    }
  }

  function updateHistoryBadge() {
    if (dom.historyCountBadge) {
      dom.historyCountBadge.textContent = state.history.length;
    }
  }

  // ==========================================
  // RIWAYAT & GRAFIK TREN BATANG (CSS FLEX)
  // ==========================================
  function openHistoryModal() {
    dom.historyModal.classList.add('open');
    renderHistoryContent();
  }

  function renderHistoryContent() {
    dom.chartBarsWrap.innerHTML = '';
    if (state.history.length === 0) {
      dom.chartBarsWrap.innerHTML = `
        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: #52525b;">
          Belum ada data latihan yang tersimpan. Selesaikan latihan pertama Anda!
        </div>
      `;
    } else {
      const chronological = [...state.history].reverse();
      const maxWpm = Math.max(70, ...chronological.map((h) => h.netWpm || 0));

      chronological.forEach((item, idx) => {
        const heightPercent = Math.max(8, Math.round((item.netWpm / maxWpm) * 100));
        const col = document.createElement('div');
        col.className = 'chart-col';
        col.innerHTML = `
          <span class="chart-val-hint">${item.netWpm}</span>
          <div class="chart-bar" style="height: ${heightPercent}%" title="${item.textTitle} (${item.netWpm} WPM - ${item.accuracy}%)"></div>
          <span class="chart-label-hint">S${idx + 1}</span>
        `;
        dom.chartBarsWrap.appendChild(col);
      });
    }

    // Render Tabel Riwayat
    dom.historyTableBody.innerHTML = '';
    if (state.history.length === 0) {
      dom.historyTableBody.innerHTML = `
        <tr><td colspan="4" style="text-align: center; color: #71717a; padding: 1.5rem;">Tidak ada catatan.</td></tr>
      `;
    } else {
      state.history.forEach((row) => {
        const dateObj = new Date(row.timestamp);
        const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${timeStr}</td>
          <td style="max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${row.textTitle}</td>
          <td style="color: #10b981; font-weight: 700;">${row.netWpm} WPM</td>
          <td style="color: #06b6d4;">${row.accuracy}%</td>
        `;
        dom.historyTableBody.appendChild(tr);
      });
    }
  }

  // ==========================================
  // EKSPOR CSV & SALIN RINGKASAN
  // ==========================================
  function exportHistoryToCSV() {
    if (state.history.length === 0) {
      alert('Belum ada data riwayat untuk diekspor.');
      return;
    }

    const headers = ['Tanggal', 'Kategori', 'Judul Teks', 'Durasi (detik)', 'Net WPM', 'Raw WPM', 'Akurasi (%)', 'Konsistensi (%)', 'Karakter Benar', 'Karakter Salah'];
    const rows = state.history.map((item) => {
      const dateStr = new Date(item.timestamp).toLocaleString('id-ID');
      return [
        `"${dateStr}"`,
        `"${item.category}"`,
        `"${item.textTitle.replace(/"/g, '""')}"`,
        item.duration,
        item.netWpm,
        item.rawWpm,
        item.accuracy,
        item.consistency || 0,
        item.correctChars,
        item.incorrectChars,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `KetikCepat_Latihan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function copySummaryToClipboard() {
    if (state.history.length === 0) return;
    const latest = state.history[0];
    const text = `🚀 Hasil Latihan Mengetik 10 Jari "KetikCepat"\n` +
      `Judul Teks: ${latest.textTitle}\n` +
      `Kecepatan: ${latest.netWpm} WPM (Raw: ${latest.rawWpm} WPM)\n` +
      `Akurasi: ${latest.accuracy}%\n` +
      `Konsistensi: ${latest.consistency}%\n` +
      `Durasi: ${latest.duration} detik\n` +
      `Tgl: ${new Date(latest.timestamp).toLocaleString('id-ID')}`;

    navigator.clipboard.writeText(text).then(() => {
      const originalText = dom.btnCopySummary.textContent;
      dom.btnCopySummary.textContent = 'Tersalin!';
      setTimeout(() => (dom.btnCopySummary.textContent = originalText), 2000);
    });
  }

  // Mulai aplikasi
  document.addEventListener('DOMContentLoaded', init);
})();
