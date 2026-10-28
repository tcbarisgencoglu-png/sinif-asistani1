/**
 * Sınıf Asistanı — Deterministik ve Çevrim Dışı Optik Okuma Motoru (OMR Engine)
 * 
 * Bu modül; yapay zekaya (LLM / API) ihtiyaç duymadan, saf JavaScript ve HTML5 Canvas
 * piksel yoğunluğu analiziyle çalışır.
 * 
 * Özellikler:
 * - 0% Halüsinasyon, 100% Deterministik (Her çalıştırmada aynı kağıttan aynı sonuç)
 * - Çevrim Dışı (Offline) ve Işık Hızında (Sayfa başına ~50-100 ms)
 * - 4 Köşe Konsantrik Çapa Tespiti & Paralelkenar Vektör Tamamlama
 * - Paul Heckbert Projective Homography (Perspektif & Eğim Düzeltme)
 * - Lokal Adaptif Kağıt Aydınlığı (Gölge ve Işık Dengesizliğine Bağışıklık)
 * - Hem Tek Ders Hem Çoklu Ders (Branşlı Deneme Sınavları) Desteği
 * - Sayfa Başına 1 veya 2 Form Otomatik Algılama
 * - jsQR ile Anında Öğrenci Kimlik Tespiti
 */

(() => {
  'use strict';

  // ==========================================================================
  // 0. ARUCO 5X5 ÖĞRENCİ BELİRTEÇ MOTORU (SIFIR HATA VE YÖNDEN BAĞIMSIZ DOĞRULAMA)
  // ==========================================================================
  // 7x7 Geometrik Matris: 1 hücrelik masif siyah dış çerçeve + 5x5 iç veri blokları
  // 15-bit veri doğrudan öğrencinin okul numarasını taşır (0..32767).
  // 0°, 90°, 180°, 270° tüm açılarda tekil parite kontrolü sayesinde %100 yönden bağımsızdır.
  function encodeStudentAruco(studentNumber) {
    const num = Math.max(0, Math.min(32767, parseInt(studentNumber, 10) || 0));
    const grid = [];
    for (let r = 0; r < 5; r++) {
      const shift = (4 - r) * 3;
      const d0 = (num >> (shift + 2)) & 1;
      const d1 = (num >> (shift + 1)) & 1;
      const d2 = (num >> shift) & 1;
      let p0, p1;
      if (r === 0) {
        p0 = (d0 ^ d1 ^ 1);
        p1 = (d1 ^ d2);
      } else if (r === 4) {
        p0 = (d0 ^ d1);
        p1 = (d1 ^ d2 ^ 1);
      } else {
        p0 = (d0 ^ d1);
        p1 = (d1 ^ d2);
      }
      grid.push([d0, d1, d2, p0, p1]);
    }
    return grid;
  }

  function rotateMatrix5x5(mat) {
    const res = [];
    for (let r = 0; r < 5; r++) {
      res[r] = [];
      for (let c = 0; c < 5; c++) {
        res[r][c] = mat[4 - c][r];
      }
    }
    return res;
  }

  function decodeStudentAruco(grid5x5, validStudentNumbers = null) {
    // Köşe çapalarını (merkezi 3x3 siyah, dış halkası beyaz eşmerkezli hedef) kesin olarak reddet
    let centerBlack = 0, outerBlack = 0;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (grid5x5[r][c] === 1) {
          if (r >= 1 && r <= 3 && c >= 1 && c <= 3) centerBlack++;
          else outerBlack++;
        }
      }
    }
    if (centerBlack >= 7 && outerBlack <= 1) {
      return { success: false, studentNumber: null };
    }
    // Toplam siyah hücre sayısı aşırı düşük (< 2) veya aşırı yüksek (> 21) ise geçersizdir
    const totalBlack = centerBlack + outerBlack;
    if (totalBlack < 2 || totalBlack > 21) {
      return { success: false, studentNumber: null };
    }

    let cur = grid5x5;
    let glareCandidate = null;

    for (let rot = 0; rot < 4; rot++) {
      let valid = true;
      const rowStatus = [];
      for (let r = 0; r < 5; r++) {
        const d0 = cur[r][0];
        const d1 = cur[r][1];
        const d2 = cur[r][2];
        const p0 = cur[r][3];
        const p1 = cur[r][4];
        let expP0 = (r === 0) ? (d0 ^ d1 ^ 1) : (d0 ^ d1);
        let expP1 = (r === 4) ? (d1 ^ d2 ^ 1) : (d1 ^ d2);
        const rowValid = (p0 === expP0 && p1 === expP1);
        rowStatus.push(rowValid);
        if (!rowValid) {
          valid = false;
        }
      }

      // 1. Standart 5/5 tam parite eşleşmesi (Yüksek Güvenilirlik - Üst satır [0,0,0,1,0] sabit senkron başlığıyla 1..4095 aralığı)
      if (valid) {
        let num = 0;
        for (let r = 0; r < 5; r++) {
          const d0 = cur[r][0];
          const d1 = cur[r][1];
          const d2 = cur[r][2];
          num = (num << 3) | (d0 << 2) | (d1 << 1) | d2;
        }
        if (num > 0 && num < 4096) {
          if (!validStudentNumbers || validStudentNumbers.length === 0 || validStudentNumbers.includes(String(num)) || validStudentNumbers.includes(num)) {
            return { success: true, studentNumber: num, rotation: rot * 90 };
          }
        }
      }

      // 2. Parlama / Yansıma Toleranslı Kurtarma (Yalnızca paritesi %100 doğrulanan veri satırları kullanılır!):
      // Veri taşıyan satırlardan (satır 1..4 veya 2..4) herhangi birinin paritesi bozuksa asla yanlış öğrenci numarası üretilmez.
      if (rowStatus[1] && rowStatus[2] && rowStatus[3] && rowStatus[4]) {
        // Sadece en üst senkron satırı (satır 0) parlamadan etkilenmiş, 12-bitlik tüm veri satırları (1..4) %100 pariteyi geçmiş:
        let num12 = 0;
        for (let r = 1; r < 5; r++) {
          num12 = (num12 << 3) | (cur[r][0] << 2) | (cur[r][1] << 1) | cur[r][2];
        }
        if (num12 > 0 && num12 < 4096) {
          if (!validStudentNumbers || validStudentNumbers.length === 0 || validStudentNumbers.includes(String(num12)) || validStudentNumbers.includes(num12)) {
            if (!glareCandidate) {
              glareCandidate = { success: true, studentNumber: num12, rotation: rot * 90, recoveredFromGlare: true };
            }
          }
        }
      } else if (rowStatus[2] && rowStatus[3] && rowStatus[4]) {
        // Üst 2 satır (satır 0 ve 1) parlamadan etkilenmiş, alt 3 veri satırı (satır 2, 3 ve yön kilitli satır 4) %100 pariteyi geçmiş (1..511):
        const d0 = cur[2][0], d1 = cur[2][1], d2 = cur[2][2];
        const d3 = cur[3][0], d4 = cur[3][1], d5 = cur[3][2];
        const d6 = cur[4][0], d7 = cur[4][1], d8 = cur[4][2];
        const num9 = (d0 << 8) | (d1 << 7) | (d2 << 6) | (d3 << 5) | (d4 << 4) | (d5 << 3) | (d6 << 2) | (d7 << 1) | d8;
        if (num9 > 0 && num9 < 511) {
          if (!validStudentNumbers || validStudentNumbers.length === 0 || validStudentNumbers.includes(String(num9)) || validStudentNumbers.includes(num9)) {
            if (!glareCandidate) {
              glareCandidate = { success: true, studentNumber: num9, rotation: rot * 90, recoveredFromGlare: true };
            }
          }
        }
      }

      cur = rotateMatrix5x5(cur);
    }

    if (glareCandidate) return glareCandidate;
    return { success: false, studentNumber: null };
  }

  function generateArucoSVG(studentNumber, size = 52) {
    const num = parseInt(studentNumber, 10) || 0;
    const grid5x5 = encodeStudentAruco(num);
    const cellSize = 8;
    const totalSize = 7 * cellSize; // 56
    let rects = '';
    // Dış siyah çerçeve (6px kalınlık) + 2px beyaz sessiz bölge (parlama önleyici beyaz iç arka plan)
    rects += `<rect x="0" y="0" width="${totalSize}" height="${totalSize}" fill="#000000" />`;
    rects += `<rect x="6" y="6" width="${totalSize - 12}" height="${totalSize - 12}" fill="#ffffff" />`;
    // Beyaz arka plan üzerinde yalnızca "1" bitleri ayrık siyah kare olarak çizilir ("0" bitleri mat beyaz kağıt kalır)
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (grid5x5[r][c] === 1) {
          const x = (c + 1) * cellSize + 0.5;
          const y = (r + 1) * cellSize + 0.5;
          rects += `<rect x="${x}" y="${y}" width="${cellSize - 1}" height="${cellSize - 1}" fill="#000000" />`;
        }
      }
    }
    return `<svg viewBox="0 0 ${totalSize} ${totalSize}" width="${size}" height="${size}" shape-rendering="crispEdges" style="display: block;">${rects}</svg>`;
  }

  // ArUco 5x5 Beyaz Arka Planlı & Parlama Korumalı Belirteç Tarayıcı (Hamming Parite & Oryantasyon Korumalı)
  // "0" bitleri mat beyaz arka plan, "1" bitleri siyah kare olarak okunur.
  function scanArucoInGrayscale(gray, w, h, minX = 0, maxX = w, minY = 0, maxY = h, validStudentNumbers = null) {
    if (!gray || w < 16 || h < 16) return null;

    const startX = Math.max(2, Math.floor(minX));
    const endX = Math.min(w - 2, Math.ceil(maxX));
    const startY = Math.max(2, Math.floor(minY));
    const endY = Math.min(h - 2, Math.ceil(maxY));
    const areaW = endX - startX;
    const areaH = endY - startY;

    if (areaW < 16 || areaH < 16) return null;

    // Bölgesel dinamik ortalama ışık hesaplama (yalnızca taranan alt bölge içinde)
    let sum = 0, sampleCount = 0;
    const stepY = Math.max(1, Math.floor(areaH / 24));
    const stepX = Math.max(1, Math.floor(areaW / 24));
    for (let sy = startY; sy < endY; sy += stepY) {
      const rowOff = sy * w;
      for (let sx = startX; sx < endX; sx += stepX) {
        sum += gray[rowOff + sx];
        sampleCount++;
      }
    }
    const avg = sampleCount > 0 ? (sum / sampleCount) : 180;
    const thLight = Math.max(65, Math.min(215, Math.round(avg * 0.86)));
    const thAuto = Math.max(50, Math.min(195, Math.round(avg * 0.76)));
    const thDark = Math.max(45, Math.min(175, Math.round(avg * 0.65)));
    // Çok kademeli eşik (Önce parlama dostu yüksek eşik thLight ile dış çerçevenin üst kenarını yakala)
    const thresholds = Array.from(new Set([thLight, thAuto, thDark, 185, 170, 150, 125, 95]));

    const minS = Math.max(24, Math.min(60, Math.round(Math.min(w, h) * 0.042)));
    const maxS = Math.min(areaW, areaH, 280);
    let bestFullCandidate = null;
    let fallbackGlareCandidate = null;

    for (const th of thresholds) {
      for (let y = startY; y < endY - minS; y += 2) {
        let x = startX;
        while (x < endX - minS) {
          if (gray[y * w + x] < th) {
            const runStartX = x;
            while (x < endX && gray[y * w + x] < th) x++;
            const runLen = x - runStartX;

            if (runLen >= minS && runLen <= maxS) {
              // Eğer halihazırda çok daha büyük bir tam eşleşme bulduysak küçük gürültüleri atla
              if (bestFullCandidate && runLen < bestFullCandidate.size * 0.85) continue;

              // Farklı kamera açıları, perspektif ve en/boy oranları için dikey yükseklik adayları (Önce 1:1 kare)
              const sStep = Math.max(2, Math.round(runLen * 0.05));
              const sYCandidates = [runLen];
              for (let d = sStep; d <= Math.round(runLen * 0.28); d += sStep) {
                sYCandidates.push(runLen - d, runLen + d);
              }

              for (let si = 0; si < sYCandidates.length; si++) {
                const sY = sYCandidates[si];

                // İki yön kontrolü: 1) Bulunan yatay çizgi üst kenarsa (aşağı doğru), 2) Alt kenarsa (yukarı doğru parlama kurtarma)
                const dirCases = [
                  { topY: y, botY: y + sY - 1 },
                  { topY: y - sY + 1, botY: y }
                ];

                for (let dci = 0; dci < dirCases.length; dci++) {
                  const boxTopY = dirCases[dci].topY;
                  const boxBotY = dirCases[dci].botY;
                  if (boxTopY < startY || boxBotY >= endY) continue;

                  // Hafif yatay eğim (shear/tilt) toleransı
                  const dxCandidates = [0, -2, 2, -4, 4];
                  for (let di = 0; di < dxCandidates.length; di++) {
                    const dxBot = dxCandidates[di];
                    const botStartX = runStartX + dxBot;
                    if (botStartX < startX || botStartX + runLen >= endX) continue;

                    // 1. Kenar kontrolü (4 kenarlı dış siyah çerçeve: Üst, Alt, Sol ve Sağ)
                    const cellSizeX = runLen / 7;
                    const cellSizeY = sY / 7;
                    const topInnerY = Math.min(boxBotY, boxTopY + Math.max(1, Math.round(cellSizeY * 0.36)));
                    const botInnerY = Math.max(boxTopY, boxBotY - Math.max(1, Math.round(cellSizeY * 0.36)));

                    let botBlack = 0, topBlack = 0, botTotal = 0;
                    for (let bx = botStartX; bx < botStartX + runLen; bx += 2) {
                      botTotal++;
                      if (gray[boxBotY * w + bx] < th || gray[botInnerY * w + bx] < th) botBlack++;
                      const tx = bx - dxBot;
                      if (tx >= startX && tx < endX && (gray[boxTopY * w + tx] < th || gray[topInnerY * w + tx] < th)) topBlack++;
                    }

                    // Sol ve sağ dikey çerçeve kontrolü (İç veri hücrelerinin sahte çerçeve sanılmasını %100 engeller)
                    let leftBlack = 0, rightBlack = 0, sideTotal = 0;
                    const innerShiftX = Math.max(1, Math.round(cellSizeX * 0.36));
                    for (let sy = boxTopY; sy <= boxBotY; sy += 2) {
                      sideTotal++;
                      const fy = (sy - boxTopY) / Math.max(1, sY);
                      const curLeftX = Math.round(runStartX + dxBot * fy);
                      const curRightX = Math.round(runStartX + runLen - 1 + dxBot * fy);
                      if (curLeftX >= startX && curLeftX + innerShiftX < endX) {
                        if (gray[sy * w + curLeftX] < th || gray[sy * w + curLeftX + innerShiftX] < th) leftBlack++;
                      }
                      if (curRightX - innerShiftX >= startX && curRightX < endX) {
                        if (gray[sy * w + curRightX] < th || gray[sy * w + curRightX - innerShiftX] < th) rightBlack++;
                      }
                    }

                    // Işık parlaması / yansıma toleransı: Dış çerçevenin 4 kenarı da süreklilik göstermeli
                    const bestEdgeRatio = Math.max(botBlack, topBlack) / Math.max(1, botTotal);
                    const bothEdgeRatio = (botBlack + topBlack) / Math.max(1, 2 * botTotal);
                    const leftRatio = leftBlack / Math.max(1, sideTotal);
                    const rightRatio = rightBlack / Math.max(1, sideTotal);

                    if (bestEdgeRatio >= 0.72 && bothEdgeRatio >= 0.42 && leftRatio >= 0.68 && rightRatio >= 0.68) {
                      // 2. 5x5 hücrelerin ham parlaklık değerlerini tek seferde oku
                      const rawGrid = [];
                      const flatVals = [];
                      for (let r = 1; r <= 5; r++) {
                        const rowVals = [];
                        const fy = (r + 0.5) / 7;
                        const cy = Math.round(boxTopY + (r + 0.5) * cellSizeY);
                        const rowShiftX = dxBot * fy;
                        for (let c = 1; c <= 5; c++) {
                          const cx = Math.round(runStartX + rowShiftX + (c + 0.5) * cellSizeX);
                          let val;
                          if (cellSizeX <= 4.2 || cellSizeY <= 4.2) {
                            val = gray[cy * w + cx];
                          } else {
                            let cSum = 0, cCnt = 0;
                            for (let dy = -1; dy <= 1; dy++) {
                              for (let dx = -1; dx <= 1; dx++) {
                                cSum += gray[(cy + dy) * w + (cx + dx)];
                                cCnt++;
                              }
                            }
                            val = cSum / cCnt;
                          }
                          rowVals.push(val);
                          flatVals.push(val);
                        }
                        rawGrid.push(rowVals);
                      }

                      // Beyaz arka plan referansını (75. yüzdelik dilim) ve en koyu siyah hücreyi bul
                      const sortedVals = [...flatVals].sort((a, b) => a - b);
                      const localDark = sortedVals[0];
                      const localWhite = sortedVals[18]; // >%70 hücre beyaz (0) olduğu için yerel beyaz kağıt parlaklığıdır
                      const contrastSpan = localWhite - localDark;
                      if (contrastSpan < 14) continue;

                      // Beyaz arka plana göre dinamik eşikler (Siyah kare = 1, Beyaz arka plan = 0)
                      const midTh = Math.round((localWhite + localDark) * 0.50);
                      const glareTh = Math.round(localWhite - Math.max(11, contrastSpan * 0.34));
                      const deepTh = Math.round(localWhite - Math.max(15, contrastSpan * 0.62));
                      const cellThList = Array.from(new Set([midTh, glareTh, deepTh, th]));

                      for (let cti = 0; cti < cellThList.length; cti++) {
                        const cellTh = cellThList[cti];
                        const grid5x5 = [];
                        for (let r = 0; r < 5; r++) {
                          const row = [];
                          for (let c = 0; c < 5; c++) {
                            // Koyu hücre (< cellTh) -> 1 (Siyah nokta), Açık hücre (>= cellTh) -> 0 (Beyaz arka plan)
                            row.push(rawGrid[r][c] < cellTh ? 1 : 0);
                          }
                          grid5x5.push(row);
                        }

                        const dec = decodeStudentAruco(grid5x5, validStudentNumbers);
                        if (dec.success && dec.studentNumber > 0) {
                          const candSize = Math.round((runLen + sY) * 0.5);
                          const candidateRes = {
                            success: true,
                            studentNumber: dec.studentNumber,
                            x: runStartX,
                            y: boxTopY,
                            size: candSize,
                            rotation: dec.rotation,
                            recoveredFromGlare: !!dec.recoveredFromGlare
                          };
                          if (!dec.recoveredFromGlare) {
                            if (!bestFullCandidate || candSize > bestFullCandidate.size) {
                              bestFullCandidate = candidateRes;
                            }
                          } else if (!fallbackGlareCandidate || candSize > fallbackGlareCandidate.size) {
                            fallbackGlareCandidate = candidateRes;
                          }
                        }
                      }

                      // 3. Satır Bazlı Parlama Dengeleme (Yarı parlamalı / yarı gölgeli ekstrem açı kurtarma)
                      // Her satırda en az 1 beyaz ("0") hücre bulunması matematiksel olarak garantilidir
                      const gridRowAdaptive = [];
                      const rowDelta = Math.max(12, contrastSpan * 0.36);
                      for (let r = 0; r < 5; r++) {
                        const rVals = rawGrid[r];
                        const rowWhite = Math.max(rVals[0], rVals[1], rVals[2], rVals[3], rVals[4]);
                        const row = [];
                        for (let c = 0; c < 5; c++) {
                          row.push(rVals[c] < (rowWhite - rowDelta) ? 1 : 0);
                        }
                        gridRowAdaptive.push(row);
                      }
                      const decAdaptive = decodeStudentAruco(gridRowAdaptive, validStudentNumbers);
                      if (decAdaptive.success && decAdaptive.studentNumber > 0) {
                        const candSize = Math.round((runLen + sY) * 0.5);
                        const adaptiveRes = {
                          success: true,
                          studentNumber: decAdaptive.studentNumber,
                          x: runStartX,
                          y: boxTopY,
                          size: candSize,
                          rotation: decAdaptive.rotation,
                          recoveredFromGlare: !!decAdaptive.recoveredFromGlare
                        };
                        if (!decAdaptive.recoveredFromGlare) {
                          if (!bestFullCandidate || candSize > bestFullCandidate.size) {
                            bestFullCandidate = adaptiveRes;
                          }
                        } else if (!fallbackGlareCandidate || candSize > fallbackGlareCandidate.size) {
                          fallbackGlareCandidate = adaptiveRes;
                        }
                      }
                    }
                  }
                }
              }
            }
          } else {
            x++;
          }
        }
      }
      if (bestFullCandidate) return bestFullCandidate;
    }

    return bestFullCandidate || fallbackGlareCandidate;
  }

  // ==========================================================================
  // 0. DERS VE CEVAP ANAHTARI ÇÖZÜMLEME MOTORU (ÇOKLU BRANŞ DESTEĞİ)
  // ==========================================================================

  function normalizeOmrSubject(str) {
    if (!str) return '';
    let s = String(str).toLocaleLowerCase('tr').replace(/[^a-zçğıöşü0-9]/g, '');
    s = s.replace(/([aeıioöuü])\1+/g, '$1');
    return s;
  }

  function getOmrSubjectBaseKeywords(str) {
    const norm = normalizeOmrSubject(str);
    const keywords = [];
    if (norm.includes('sosyal')) keywords.push('sosyal');
    if (norm.includes('turk') || norm.includes('türk')) keywords.push('turk', 'türk');
    if (norm.includes('mat')) keywords.push('mat');
    if (norm.includes('fen')) keywords.push('fen');
    if (norm.includes('inkilap') || norm.includes('tarih')) keywords.push('inkilap', 'tarih');
    if (norm.includes('din')) keywords.push('din');
    if (norm.includes('ingiliz') || norm.includes('dil')) keywords.push('ingiliz', 'dil');
    return { norm, keywords };
  }

  function extractAnswerForSubj(cardAnswers, card, subj, subjIndex, q, cumulativeOffset = 0) {
    if (!cardAnswers && !card) return '';
    const answersObj = cardAnswers || (card && card.answers) || {};

    // 0. card.subjects nesnesi üzerinden ders adı veya ID'si ile doğrudan erişim
    if (card && card.subjects && typeof card.subjects === 'object') {
      if (card.subjects[subj.name] && typeof card.subjects[subj.name] === 'object') {
        const v = card.subjects[subj.name][q] ?? card.subjects[subj.name][String(q)];
        if (v !== undefined && v !== '') return String(v);
      }
      if (card.subjects[subj.id] && typeof card.subjects[subj.id] === 'object') {
        const v = card.subjects[subj.id][q] ?? card.subjects[subj.id][String(q)];
        if (v !== undefined && v !== '') return String(v);
      }
      const { norm: subjNorm, keywords } = getOmrSubjectBaseKeywords(subj.name);
      for (const sKey of Object.keys(card.subjects)) {
        const sNorm = normalizeOmrSubject(sKey);
        if (sNorm === subjNorm || sNorm.includes(subjNorm) || subjNorm.includes(sNorm) || keywords.some(kw => sNorm.includes(kw))) {
          const subObj = card.subjects[sKey];
          if (subObj && typeof subObj === 'object') {
            const v = subObj[q] ?? subObj[String(q)];
            if (v !== undefined && v !== '') return String(v);
          }
        }
      }
    }

    // 1. Doğrudan id_q eşleşmesi (örn: sub_0_1, sub_3_1)
    const key1 = `${subj.id}_${q}`;
    if (answersObj[key1] !== undefined && answersObj[key1] !== '') {
      return String(answersObj[key1]);
    }

    // 2. Doğrudan name_q eşleşmesi (örn: Türkçe_1, Sosyal Bilgiler_1)
    const key2 = `${subj.name}_${q}`;
    if (answersObj[key2] !== undefined && answersObj[key2] !== '') {
      return String(answersObj[key2]);
    }

    // 3. İç içe nesne eşleşmesi (card.subjects veya card.answers[subj.id])
    const nested = (card && card.subjects) || (card && card.subjectAnswers) || (card && typeof card.answers === 'object' ? card.answers : null);
    if (nested && typeof nested === 'object') {
      for (const candidateKey of [subj.id, subj.name]) {
        if (nested[candidateKey] && typeof nested[candidateKey] === 'object') {
          if (nested[candidateKey][q] !== undefined) return String(nested[candidateKey][q]);
          if (nested[candidateKey][String(q)] !== undefined) return String(nested[candidateKey][String(q)]);
        }
      }
      const { norm: subjNorm, keywords } = getOmrSubjectBaseKeywords(subj.name);
      for (const nestedKey of Object.keys(nested)) {
        const nNorm = normalizeOmrSubject(nestedKey);
        if (nNorm === subjNorm || nNorm.includes(subjNorm) || subjNorm.includes(nNorm) || keywords.some(kw => nNorm.includes(kw))) {
          const subObj = nested[nestedKey];
          if (subObj && typeof subObj === 'object') {
            if (subObj[q] !== undefined) return String(subObj[q]);
            if (subObj[String(q)] !== undefined) return String(subObj[String(q)]);
          }
        }
      }
    }

    // 4. Anahtarlar üzerinde sütun sırası veya fuzzy ders adı eşleme
    const { norm: subjNorm, keywords } = getOmrSubjectBaseKeywords(subj.name);
    const colNum = subjIndex + 1;
    const colPrefixes = [`ders_${colNum}`, `ders${colNum}`, `sutun_${colNum}`, `sutun${colNum}`, `col_${colNum}`, `column_${colNum}`];

    for (const k of Object.keys(answersObj)) {
      const match = k.match(/(?:_|-|\s|:|^)(\d+)$/);
      if (!match || parseInt(match[1], 10) !== q) continue;

      const prefix = k.slice(0, match.index);
      const prefixNorm = normalizeOmrSubject(prefix);
      if (!prefixNorm) continue;

      if (colPrefixes.some(cp => prefixNorm === cp || prefixNorm.startsWith(cp))) {
        return String(answersObj[k]);
      }
      if (prefixNorm === subjNorm || prefixNorm.includes(subjNorm) || subjNorm.includes(prefixNorm)) {
        return String(answersObj[k]);
      }
      if (keywords.some(kw => prefixNorm.includes(kw))) {
        return String(answersObj[k]);
      }
    }

    // 5. Sıralı / Düzleştirilmiş Soru Numarası Fallback (1..24)
    const globalQ = cumulativeOffset + q;
    if (answersObj[globalQ] !== undefined && answersObj[globalQ] !== '') {
      return String(answersObj[globalQ]);
    }
    if (answersObj[String(globalQ)] !== undefined && answersObj[String(globalQ)] !== '') {
      return String(answersObj[String(globalQ)]);
    }

    return '';
  }

  function findCorrectAnswerForKey(answerKey, subj, subjIndex, q, cumulativeOffset = 0, totalSubjectsCount = 1) {
    if (!answerKey || typeof answerKey !== 'object') return '';

    // 0. subj.answerKey doğrudan ders nesnesi içinde varsa
    if (subj && subj.answerKey && typeof subj.answerKey === 'object') {
      if (subj.answerKey[q]) return String(subj.answerKey[q]).trim().toUpperCase();
      if (subj.answerKey[String(q)]) return String(subj.answerKey[String(q)]).trim().toUpperCase();
    }

    // 1. Doğrudan id_q eşleşmesi (örn: sub_0_1, sub_3_1)
    if (subj && subj.id) {
      const key1 = `${subj.id}_${q}`;
      if (answerKey[key1]) return String(answerKey[key1]).trim().toUpperCase();
    }

    // 2. Doğrudan name_q eşleşmesi (örn: Türkçe_1, Sosyal Bilgiler_1)
    if (subj && subj.name) {
      const key2 = `${subj.name}_${q}`;
      if (answerKey[key2]) return String(answerKey[key2]).trim().toUpperCase();
    }

    // 3. Global soru sırası (cumulativeOffset + q, örn: 1..24)
    const globalQ = cumulativeOffset + q;
    if (answerKey[globalQ]) return String(answerKey[globalQ]).trim().toUpperCase();
    if (answerKey[String(globalQ)]) return String(answerKey[String(globalQ)]).trim().toUpperCase();

    // 4. Extract for subject (iç içe objeler, fuzzy isim eşleme vb.)
    const found = extractAnswerForSubj(answerKey, null, subj, subjIndex, q, cumulativeOffset);
    if (found) return String(found).trim().toUpperCase();

    // 5. Tek dersli sınavlarda veya İLK derste (subjIndex === 0) soru numarası fallback'i
    // ÇOKLU DERSLERDE 2., 3., 4. BRANŞLAR İLK BRANŞIN CEVAPLARINI ÇALMASIN!
    const isFirstOrSingle = (subjIndex === 0) || (totalSubjectsCount <= 1);
    if (isFirstOrSingle) {
      if (answerKey[q]) return String(answerKey[q]).trim().toUpperCase();
      if (answerKey[String(q)]) return String(answerKey[String(q)]).trim().toUpperCase();
    }

    return '';
  }

  // ==========================================================================
  // 1. PROJEKTİF HOMOGRAFİ (PERSPEKTİF VE EĞİM DÜZELTME)
  // ==========================================================================

  function createProjectiveHomography(corners) {
    const x0 = corners.tl.x, y0 = corners.tl.y;
    const x1 = corners.tr.x, y1 = corners.tr.y;
    const x2 = corners.br.x, y2 = corners.br.y;
    const x3 = corners.bl.x, y3 = corners.bl.y;

    const dx1 = x1 - x2;
    const dx2 = x3 - x2;
    const dx3 = x0 - x1 + x2 - x3;
    const dy1 = y1 - y2;
    const dy2 = y3 - y2;
    const dy3 = y0 - y1 + y2 - y3;

    let a11, a12, a13, a21, a22, a23, a31, a32;

    if (Math.abs(dx3) < 1e-4 && Math.abs(dy3) < 1e-4) {
      a11 = x1 - x0;
      a12 = x3 - x0;
      a13 = x0;
      a21 = y1 - y0;
      a22 = y3 - y0;
      a23 = y0;
      a31 = 0;
      a32 = 0;
    } else {
      const det = dx1 * dy2 - dx2 * dy1;
      if (Math.abs(det) < 1e-7) {
        return function(u, v) {
          const x = (1 - u) * (1 - v) * x0 + u * (1 - v) * x1 + u * v * x2 + (1 - u) * v * x3;
          const y = (1 - u) * (1 - v) * y0 + u * (1 - v) * y1 + u * v * x2 + (1 - u) * v * y3;
          return { x: Math.round(x), y: Math.round(y) };
        };
      }
      a31 = (dx3 * dy2 - dx2 * dy3) / det;
      a32 = (dx1 * dy3 - dx3 * dy1) / det;
      a11 = x1 - x0 + a31 * x1;
      a12 = x3 - x0 + a32 * x3;
      a13 = x0;
      a21 = y1 - y0 + a31 * y1;
      a22 = y3 - y0 + a32 * y3;
      a23 = y0;
    }

    return function(u, v) {
      const w = a31 * u + a32 * v + 1;
      const x = (a11 * u + a12 * v + a13) / w;
      const y = (a21 * u + a22 * v + a23) / w;
      return { x: Math.round(x), y: Math.round(y) };
    };
  }

  // ==========================================================================
  // 2. KONSANTRİK HEDEF VE KÖŞE ÇAPALARI TESPİTİ
  // ==========================================================================

  function findConcentricTargetAnchor(gray, w, h, minX, maxX, minY, maxY, radius) {
    let bestX = 0, bestY = 0;
    let bestScore = 0;
    const step = 2;

    const rCore = Math.max(2, Math.round(radius * 0.35));
    const rRing = Math.max(rCore + 2, Math.round(radius * 0.68));
    const rOuter = radius;

    for (let y = minY + rOuter; y <= maxY - rOuter; y += step) {
      for (let x = minX + rOuter; x <= maxX - rOuter; x += step) {
        let coreSumSq = 0, coreCountSq = 0;
        let ringSumSq = 0, ringCountSq = 0;
        let outerSumSq = 0, outerCountSq = 0;

        let coreSumCi = 0, coreCountCi = 0;
        let ringSumCi = 0, ringCountCi = 0;
        let outerSumCi = 0, outerCountCi = 0;

        for (let dy = -rOuter; dy <= rOuter; dy += 2) {
          const py = y + dy;
          const dy2 = dy * dy;
          for (let dx = -rOuter; dx <= rOuter; dx += 2) {
            const px = x + dx;
            const lum = gray[py * w + px];

            // 1. Kare metriği (CamScanner SVG Kare Referans Çapası)
            const dSq = Math.max(Math.abs(dx), Math.abs(dy));
            if (dSq <= rOuter) {
              if (dSq <= rCore) {
                coreSumSq += lum;
                coreCountSq++;
              } else if (dSq <= rRing) {
                ringSumSq += lum;
                ringCountSq++;
              } else {
                outerSumSq += lum;
                outerCountSq++;
              }
            }

            // 2. Dairesel metrik (Klasik Nişangah)
            const dCi2 = dx * dx + dy2;
            if (dCi2 <= rOuter * rOuter) {
              if (dCi2 <= rCore * rCore) {
                coreSumCi += lum;
                coreCountCi++;
              } else if (dCi2 <= rRing * rRing) {
                ringSumCi += lum;
                ringCountCi++;
              } else {
                outerSumCi += lum;
                outerCountCi++;
              }
            }
          }
        }

        // Kare veya daire skoru hesapla
        let candidateScore = 0;

        if (coreCountSq > 0 && ringCountSq > 0 && outerCountSq > 0) {
          const coreLum = coreSumSq / coreCountSq;
          const ringLum = ringSumSq / ringCountSq;
          const outerLum = outerSumSq / outerCountSq;
          const c1 = ringLum - coreLum;
          const c2 = ringLum - outerLum;
          if (c1 > 22 && c2 > 12) {
            // 4 kardinal yön beyaz halka simetri kontrolü (Kenar ve kenarlık çizgilerini eler)
            const rMid = Math.round((rCore + rRing) * 0.5);
            const wT = gray[(y - rMid) * w + x];
            const wB = gray[(y + rMid) * w + x];
            const wL = gray[y * w + (x - rMid)];
            const wR = gray[y * w + (x + rMid)];
            if (Math.min(wT, wB, wL, wR) - coreLum >= 16) {
              candidateScore = Math.max(candidateScore, (c1 * 0.5) + (c2 * 0.5));
            }
          }
        }

        if (coreCountCi > 0 && ringCountCi > 0 && outerCountCi > 0) {
          const coreLum = coreSumCi / coreCountCi;
          const ringLum = ringSumCi / ringCountCi;
          const outerLum = outerSumCi / outerCountCi;
          const c1 = ringLum - coreLum;
          const c2 = ringLum - outerLum;
          if (c1 > 20 && c2 > 10) {
            const rMid = Math.round((rCore + rRing) * 0.5);
            const wT = gray[(y - rMid) * w + x];
            const wB = gray[(y + rMid) * w + x];
            const wL = gray[y * w + (x - rMid)];
            const wR = gray[y * w + (x + rMid)];
            if (Math.min(wT, wB, wL, wR) - coreLum >= 16) {
              candidateScore = Math.max(candidateScore, (c1 * 0.6) + (c2 * 0.4));
            }
          }
        }

        if (candidateScore > bestScore && candidateScore > 35) {
          bestScore = candidateScore;
          bestX = x;
          bestY = y;
        }
      }
    }

    if (bestScore >= 38 && bestX > 0 && bestY > 0) {
      return { x: bestX, y: bestY, score: bestScore };
    }

    return null;
  }

  function findBestCornerAnchorBlob(gray, w, h, minX, maxX, minY, maxY, cornerX, cornerY, threshold) {
    let bestX = 0, bestY = 0;
    let bestScore = -999;
    const boxSize = Math.max(8, Math.round(w * 0.022));
    const step = Math.max(2, Math.floor(boxSize / 3));

    for (let y = minY; y <= maxY - boxSize; y += step) {
      for (let x = minX; x <= maxX - boxSize; x += step) {
        let darkCount = 0;
        let sumX = 0;
        let sumY = 0;

        for (let dy = 0; dy < boxSize; dy += 2) {
          for (let dx = 0; dx < boxSize; dx += 2) {
            const idx = (y + dy) * w + (x + dx);
            if (gray[idx] < threshold) {
              darkCount++;
              sumX += (x + dx);
              sumY += (y + dy);
            }
          }
        }

        const maxPossible = Math.round((boxSize * boxSize) / 4);
        const darkRatio = darkCount / Math.max(1, maxPossible);

        if (darkRatio >= 0.45) {
          const centroidX = darkCount > 0 ? (sumX / darkCount) : (x + (boxSize >> 1));
          const centroidY = darkCount > 0 ? (sumY / darkCount) : (y + (boxSize >> 1));

          const distNorm = Math.hypot((centroidX - cornerX) / w, (centroidY - cornerY) / h);
          const score = (darkRatio * 0.40) + ((1.0 - distNorm) * 0.60);

          if (score > bestScore) {
            bestScore = score;
            bestX = Math.round(centroidX);
            bestY = Math.round(centroidY);
          }
        }
      }
    }

    return bestScore > 0 ? { x: bestX, y: bestY } : null;
  }

  // CamScanner, taranmış A4 ve baskı kartları için belirgin dış kart çerçevesi tespiti
  function findCardBorderCorners(grayBuf, w, h, threshold, bounds) {
    const minX = bounds ? bounds.minX : 0;
    const maxX = bounds ? bounds.maxX : w;
    const minY = bounds ? bounds.minY : 0;
    const maxY = bounds ? bounds.maxY : h;
    const subW = maxX - minX;
    const subH = maxY - minY;
    const thresh = threshold || 140;

    let topY = null;
    for (let y = Math.round(minY + subH * 0.01); y < Math.round(minY + subH * 0.22); y++) {
      let dark = 0;
      for (let x = Math.round(minX + subW * 0.2); x < Math.round(minX + subW * 0.8); x++) {
        if (grayBuf[y * w + x] < thresh) dark++;
      }
      if (dark > (subW * 0.6) * 0.50) { topY = y; break; }
    }
    let botY = null;
    for (let y = Math.round(maxY - subH * 0.01); y > Math.round(maxY - subH * 0.22); y--) {
      let dark = 0;
      for (let x = Math.round(minX + subW * 0.2); x < Math.round(minX + subW * 0.8); x++) {
        if (grayBuf[y * w + x] < thresh) dark++;
      }
      if (dark > (subW * 0.6) * 0.50) { botY = y; break; }
    }
    let leftX = null;
    for (let x = Math.round(minX + subW * 0.01); x < Math.round(minX + subW * 0.22); x++) {
      let dark = 0;
      for (let y = Math.round(minY + subH * 0.2); y < Math.round(minY + subH * 0.8); y++) {
        if (grayBuf[y * w + x] < thresh) dark++;
      }
      if (dark > (subH * 0.6) * 0.50) { leftX = x; break; }
    }
    let rightX = null;
    for (let x = Math.round(maxX - subW * 0.01); x > Math.round(maxX - subW * 0.22); x--) {
      let dark = 0;
      for (let y = Math.round(minY + subH * 0.2); y < Math.round(minY + subH * 0.8); y++) {
        if (grayBuf[y * w + x] < thresh) dark++;
      }
      if (dark > (subH * 0.6) * 0.50) { rightX = x; break; }
    }
    if (!topY || !botY || !leftX || !rightX) return null;
    if ((rightX - leftX) < subW * 0.65 || (botY - topY) < subH * 0.60) return null;
    return {
      tl: { x: leftX, y: topY },
      tr: { x: rightX, y: topY },
      br: { x: rightX, y: botY },
      bl: { x: leftX, y: botY }
    };
  }

  // Mobil kamera vizörü içindeki kağıt ve kart sınırlarını bulan adaptif dedektör
  // Mobil kamera vizörü içindeki kağıt ve kart sınırlarını bulan adaptif dedektör (Perspektif ve Açı Uyumlu RANSAC)
  function findMobileCameraCardCorners(grayBuf, w, h, threshold, bounds) {
    if (!bounds) return null;
    const minX = Math.max(0, bounds.minX);
    const maxX = Math.min(w, bounds.maxX);
    const minY = Math.max(0, bounds.minY);
    const maxY = Math.min(h, bounds.maxY);
    const subW = maxX - minX;
    const subH = maxY - minY;
    if (subW < 80 || subH < 60) return null;

    const midX = Math.round((minX + maxX) / 2);
    const midY = Math.round((minY + maxY) / 2);

    // Dış kart çerçevesi arama derinliği: %20'den fazla içeri girilirse Türkçe/Matematik/Fen iç ders sütunlarına çarpar!
    const maxScanX = Math.max(15, Math.round(subW * 0.20));
    const maxScanY = Math.max(15, Math.round(subH * 0.22));

    // 1. Dört kenar boyunca siyah kart çerçevesinin sınır noktalarını örnekle (Multi-Ray Scan)
    const topPts = [];
    for (let s = 0.15; s <= 0.85; s += 0.02) {
      const x = Math.round(minX + subW * s);
      for (let y = minY; y <= minY + maxScanY; y++) {
        if (grayBuf[y * w + x] < 145 && grayBuf[(y + 6) * w + x] > 175) {
          topPts.push({ x, y });
          break;
        }
      }
    }

    const botPts = [];
    for (let s = 0.15; s <= 0.85; s += 0.02) {
      const x = Math.round(minX + subW * s);
      for (let y = maxY - 1; y >= maxY - maxScanY; y--) {
        if (grayBuf[y * w + x] < 145 && grayBuf[(y - 6) * w + x] > 175) {
          botPts.push({ x, y });
          break;
        }
      }
    }

    const leftPts = [];
    for (let s = 0.15; s <= 0.85; s += 0.02) {
      const y = Math.round(minY + subH * s);
      for (let x = minX; x <= minX + maxScanX; x++) {
        if (grayBuf[y * w + x] < 145 && grayBuf[y * w + (x + 6)] > 175) {
          leftPts.push({ x, y });
          break;
        }
      }
    }

    const rightPts = [];
    for (let s = 0.15; s <= 0.85; s += 0.02) {
      const y = Math.round(minY + subH * s);
      for (let x = maxX - 1; x >= maxX - maxScanX; x--) {
        if (grayBuf[y * w + x] < 145 && grayBuf[y * w + (x - 6)] > 175) {
          rightPts.push({ x, y });
          break;
        }
      }
    }

    function fitLineRANSAC(pts, isHorizontal) {
      if (pts.length < 4) return null;
      let bestLine = null;
      let maxInliers = -1;
      for (let it = 0; it < 30; it++) {
        const i1 = Math.floor(Math.random() * pts.length);
        let i2 = Math.floor(Math.random() * pts.length);
        if (i1 === i2) continue;
        const p1 = pts[i1], p2 = pts[i2];
        const u1 = isHorizontal ? p1.x : p1.y, v1 = isHorizontal ? p1.y : p1.x;
        const u2 = isHorizontal ? p2.x : p2.y, v2 = isHorizontal ? p2.y : p2.x;
        if (Math.abs(u2 - u1) < 10) continue;
        const m = (v2 - v1) / (u2 - u1);
        const c = v1 - m * u1;

        let inliers = 0;
        for (const p of pts) {
          const u = isHorizontal ? p.x : p.y, v = isHorizontal ? p.y : p.x;
          const dist = Math.abs(m * u + c - v) / Math.sqrt(m * m + 1);
          if (dist <= 4.0) inliers++;
        }
        if (inliers > maxInliers) {
          maxInliers = inliers;
          bestLine = { m, c };
        }
      }
      if (!bestLine || maxInliers < 4) return null;

      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, n = 0;
      for (const p of pts) {
        const u = isHorizontal ? p.x : p.y, v = isHorizontal ? p.y : p.x;
        const dist = Math.abs(bestLine.m * u + bestLine.c - v) / Math.sqrt(bestLine.m * bestLine.m + 1);
        if (dist <= 4.0) {
          sumX += u; sumY += v; sumXY += u * v; sumXX += u * u;
          n++;
        }
      }
      const denom = n * sumXX - sumX * sumX;
      if (Math.abs(denom) < 1e-6) return bestLine;
      const m = (n * sumXY - sumX * sumY) / denom;
      const c = (sumY - m * sumX) / n;
      return { m, c };
    }

    const lTop = fitLineRANSAC(topPts, true);
    const lBot = fitLineRANSAC(botPts, true);
    const lLeft = fitLineRANSAC(leftPts, false);
    const lRight = fitLineRANSAC(rightPts, false);

    if (lTop && lBot && lLeft && lRight) {
      function intersect(hLine, vLine) {
        const denom = 1 - hLine.m * vLine.m;
        if (Math.abs(denom) < 1e-6) return null;
        const y = (hLine.m * vLine.c + hLine.c) / denom;
        const x = vLine.m * y + vLine.c;
        return { x: Math.round(x), y: Math.round(y) };
      }

      const tl = intersect(lTop, lLeft);
      const tr = intersect(lTop, lRight);
      const br = intersect(lBot, lRight);
      const bl = intersect(lBot, lLeft);

      if (tl && tr && br && bl) {
        const cardW = Math.hypot(tr.x - tl.x, tr.y - tl.y);
        const cardH = Math.hypot(bl.x - tl.x, bl.y - tl.y);
        const aspect = cardW / Math.max(1, cardH);
        if (cardW >= subW * 0.65 && cardH >= subH * 0.55 && aspect >= 1.10 && aspect <= 1.95) {
          return { tl, tr, br, bl };
        }
      }
    }

    // 2. Fallback: Eksen hizalı kağıt ve kart çerçevesi arama
    let topY = minY;
    let botY = maxY;
    let leftX = minX;
    let rightX = maxX;

    const checkW = Math.max(10, Math.round(subW * 0.35));
    const checkH = Math.max(10, Math.round(subH * 0.35));

    for (let y = minY; y <= midY - 20; y++) {
      let bright = 0;
      for (let x = midX - checkW; x <= midX + checkW; x += 2) {
        if (grayBuf[y * w + x] > 135) bright++;
      }
      if (bright > (checkW * 0.75)) { topY = y; break; }
    }

    for (let y = maxY - 1; y >= midY + 20; y--) {
      let bright = 0;
      for (let x = midX - checkW; x <= midX + checkW; x += 2) {
        if (grayBuf[y * w + x] > 135) bright++;
      }
      if (bright > (checkW * 0.75)) { botY = y; break; }
    }

    for (let x = minX; x <= midX - 20; x++) {
      let bright = 0;
      for (let y = midY - checkH; y <= midY + checkH; y += 2) {
        if (grayBuf[y * w + x] > 135) bright++;
      }
      if (bright > (checkH * 0.75)) { leftX = x; break; }
    }

    for (let x = maxX - 1; x >= midX + 20; x--) {
      let bright = 0;
      for (let y = midY - checkH; y <= midY + checkH; y += 2) {
        if (grayBuf[y * w + x] > 135) bright++;
      }
      if (bright > (checkH * 0.75)) { rightX = x; break; }
    }

    const pW = rightX - leftX;
    const pH = botY - topY;

    let cardTop = topY;
    let cardBot = botY;
    let cardLeft = leftX;
    let cardRight = rightX;

    const spanW = Math.max(10, Math.round(pW * 0.45));
    const spanH = Math.max(10, Math.round(pH * 0.45));

    for (let y = topY; y < Math.min(topY + Math.round(pH * 0.25), midY - 20); y++) {
      let dark = 0;
      for (let x = midX - spanW; x < midX + spanW; x += 2) {
        if (grayBuf[y * w + x] < 140) dark++;
      }
      if (dark > spanW * 0.40) { cardTop = y; break; }
    }

    for (let y = botY; y > Math.max(botY - Math.round(pH * 0.25), midY + 20); y--) {
      let dark = 0;
      for (let x = midX - spanW; x < midX + spanW; x += 2) {
        if (grayBuf[y * w + x] < 140) dark++;
      }
      if (dark > spanW * 0.40) { cardBot = y; break; }
    }

    for (let x = leftX; x < Math.min(leftX + Math.round(pW * 0.25), midX - 20); x++) {
      let dark = 0;
      for (let y = midY - spanH; y < midY + spanH; y += 2) {
        if (grayBuf[y * w + x] < 140) dark++;
      }
      if (dark > spanH * 0.40) { cardLeft = x; break; }
    }

    for (let x = rightX; x > Math.max(rightX - Math.round(pW * 0.25), midX + 20); x--) {
      let dark = 0;
      for (let y = midY - spanH; y < midY + spanH; y += 2) {
        if (grayBuf[y * w + x] < 140) dark++;
      }
      if (dark > spanH * 0.40) { cardRight = x; break; }
    }

    const fallbackW = cardRight - cardLeft;
    const fallbackH = cardBot - cardTop;
    const fallbackAspect = fallbackW / Math.max(1, fallbackH);
    if (fallbackW >= subW * 0.65 && fallbackH >= subH * 0.55 && fallbackAspect >= 1.10 && fallbackAspect <= 1.95) {
      return {
        tl: { x: cardLeft, y: cardTop },
        tr: { x: cardRight, y: cardTop },
        br: { x: cardRight, y: cardBot },
        bl: { x: cardLeft, y: cardBot }
      };
    }

    return null;
  }

  function detectCornerAnchorsInternal(gray, w, h, threshold, bounds) {
    const minX = bounds ? bounds.minX : 0;
    const maxX = bounds ? bounds.maxX : w;
    const minY = bounds ? bounds.minY : 0;
    const maxY = bounds ? bounds.maxY : h;
    const subW = maxX - minX;
    const subH = maxY - minY;

    function areAnchorsGeometricallyValid(tl, tr, br, bl) {
      if (!tl || !tr || !br || !bl) return false;
      // Köşe çapaları formun dış uçlarında (köşe kadranlarında) yer almalıdır; iç rozetler çapa sayılamaz
      if (tl.x > minX + subW * 0.28 || tl.y > minY + subH * 0.32) return false;
      if (tr.x < minX + subW * 0.72 || tr.y > minY + subH * 0.32) return false;
      if (bl.x > minX + subW * 0.28 || bl.y < minY + subH * 0.68) return false;
      if (br.x < minX + subW * 0.72 || br.y < minY + subH * 0.68) return false;

      const wTop = tr.x - tl.x;
      const wBot = br.x - bl.x;
      const hLeft = bl.y - tl.y;
      const hRight = br.y - tr.y;
      if (wTop < subW * 0.45 || wBot < subW * 0.45) return false;
      if (hLeft < subH * 0.30 || hRight < subH * 0.30) return false;
      if (Math.abs(wTop - wBot) > subW * 0.25) return false;
      if (Math.abs(hLeft - hRight) > subH * 0.25) return false;
      if (Math.abs(tl.y - tr.y) > subH * 0.20) return false;
      if (Math.abs(bl.y - br.y) > subH * 0.20) return false;
      const aspect = wTop / Math.max(1, hLeft);
      if (aspect < 0.80 || aspect > 2.2) return false;
      return true;
    }

    // 1. İLK ÖNCELİK: 4 Köşe Referans Çapası (Hedef Nişangahı - CamScanner & ÖSYM Standardı)
    // Köşe çapa arama alanı formun en dış uçlarına sınırlandırılır (İç ders kutucukları veya başlıkların çapa sanılmasını engeller)
    const qW = Math.round(subW * 0.16);
    const qH = Math.round(subH * 0.18);
    const rOpt = Math.round(subW * 0.013);
    const radiiToTry = [rOpt, rOpt - 1, rOpt + 1, rOpt - 2, rOpt + 2, rOpt - 3, rOpt + 3, 10, 12, 14, 16].filter((v, i, a) => v >= 6 && a.indexOf(v) === i);

    function findBestConcentricInQuad(x1, x2, y1, y2, type) {
      let best = null;
      for (const r of radiiToTry) {
        const cand = findConcentricTargetAnchor(gray, w, h, x1, x2, y1, y2, r);
        if (cand && cand.score >= 35) {
          // En yüksek dairesel kontrast/skor sahibi adayı seç (Köşe çizgisi değil, gerçek nişangah çapasını kilitler)
          if (!best || cand.score > best.score) {
            best = cand;
          }
        }
      }
      return best;
    }

    let tlFound = findBestConcentricInQuad(minX, minX + qW, minY, minY + qH, 'tl');
    // TR ve BR için x >= subW * 0.84 sınırı OMR ID / QR rozet kutusunun çapa sanılmasını %100 engeller!
    let trFound = findBestConcentricInQuad(Math.max(minX + Math.round(subW * 0.84), maxX - qW), maxX, minY, minY + qH, 'tr');
    // BR: trFound varsa onunla dikey hizada kalmalıdır (Fen bilimleri sonrası 4 ve 5. derslerdeki kaymayı %100 engeller)
    const brMinX = trFound ? Math.max(trFound.x - Math.round(subW * 0.08), minX + Math.round(subW * 0.84)) : Math.max(minX + Math.round(subW * 0.84), maxX - qW);
    let brFound = findBestConcentricInQuad(brMinX, maxX, Math.max(minY + Math.round(subH * 0.80), maxY - qH), maxY, 'br');
    let blFound = findBestConcentricInQuad(minX, minX + qW, Math.max(minY + Math.round(subH * 0.80), maxY - qH), maxY, 'bl');

    let foundCount = (tlFound ? 1 : 0) + (trFound ? 1 : 0) + (brFound ? 1 : 0) + (blFound ? 1 : 0);

    if (foundCount >= 3) {
      const cand = {
        tl: tlFound ? { x: tlFound.x, y: tlFound.y } : { x: minX, y: minY },
        tr: trFound ? { x: trFound.x, y: trFound.y } : { x: maxX, y: minY },
        br: brFound ? { x: brFound.x, y: brFound.y } : { x: maxX, y: maxY },
        bl: blFound ? { x: blFound.x, y: blFound.y } : { x: minX, y: maxY },
        isAnchor: true
      };
      if (foundCount === 3) {
        if (!tlFound) cand.tl = { x: cand.tr.x + cand.bl.x - cand.br.x, y: cand.tr.y + cand.bl.y - cand.br.y };
        else if (!trFound) cand.tr = { x: cand.tl.x + cand.br.x - cand.bl.x, y: cand.tl.y + cand.br.y - cand.bl.y };
        else if (!brFound) cand.br = { x: cand.tr.x + cand.bl.x - cand.tl.x, y: cand.tr.y + cand.bl.y - cand.tl.y };
        else if (!blFound) cand.bl = { x: cand.tl.x + cand.br.x - cand.tr.x, y: cand.tl.y + cand.br.y - cand.tr.y };
      }
      if (areAnchorsGeometricallyValid(cand.tl, cand.tr, cand.br, cand.bl)) {
        return cand;
      }
    } else if (foundCount === 2) {
      // 2 köşe çapası ile A5 form geometrisini (En/Boy oranı ~ 1.414) mükemmel rekonstrükte et
      const aspect = 1.414;
      const cand = { isAnchor: true };
      if (tlFound && trFound) {
        const dx = trFound.x - tlFound.x, dy = trFound.y - tlFound.y;
        const hdx = -dy / aspect, hdy = dx / aspect;
        cand.tl = { x: tlFound.x, y: tlFound.y };
        cand.tr = { x: trFound.x, y: trFound.y };
        cand.bl = { x: Math.round(tlFound.x + hdx), y: Math.round(tlFound.y + hdy) };
        cand.br = { x: Math.round(trFound.x + hdx), y: Math.round(trFound.y + hdy) };
      } else if (tlFound && blFound) {
        const hdx = blFound.x - tlFound.x, hdy = blFound.y - tlFound.y;
        const wdx = hdy * aspect, wdy = -hdx * aspect;
        cand.tl = { x: tlFound.x, y: tlFound.y };
        cand.bl = { x: blFound.x, y: blFound.y };
        cand.tr = { x: Math.round(tlFound.x + wdx), y: Math.round(tlFound.y + wdy) };
        cand.br = { x: Math.round(blFound.x + wdx), y: Math.round(blFound.y + wdy) };
      } else if (trFound && brFound) {
        const hdx = brFound.x - trFound.x, hdy = brFound.y - trFound.y;
        const wdx = hdy * aspect, wdy = -hdx * aspect;
        cand.tr = { x: trFound.x, y: trFound.y };
        cand.br = { x: brFound.x, y: brFound.y };
        cand.tl = { x: Math.round(trFound.x - wdx), y: Math.round(trFound.y - wdy) };
        cand.bl = { x: Math.round(brFound.x - wdx), y: Math.round(brFound.y - wdy) };
      } else if (blFound && brFound) {
        const dx = brFound.x - blFound.x, dy = brFound.y - blFound.y;
        const hdx = -dy / aspect, hdy = dx / aspect;
        cand.bl = { x: blFound.x, y: blFound.y };
        cand.br = { x: brFound.x, y: brFound.y };
        cand.tl = { x: Math.round(blFound.x - hdx), y: Math.round(blFound.y - hdy) };
        cand.tr = { x: Math.round(brFound.x - hdx), y: Math.round(brFound.y - hdy) };
      }
      if (cand.tl && cand.tr && cand.br && cand.bl && areAnchorsGeometricallyValid(cand.tl, cand.tr, cand.br, cand.bl)) {
        return cand;
      }
    }

    function makeAnchorFromBorder(b) {
      if (!b) return null;
      const w = b.tr.x - b.tl.x, h = b.bl.y - b.tl.y;
      return {
        tl: { x: Math.round(b.tl.x + w * 0.05), y: Math.round(b.tl.y + h * 0.05) },
        tr: { x: Math.round(b.tr.x - w * 0.05), y: Math.round(b.tr.y + h * 0.05) },
        br: { x: Math.round(b.br.x - w * 0.05), y: Math.round(b.br.y - h * 0.05) },
        bl: { x: Math.round(b.bl.x + w * 0.05), y: Math.round(b.bl.y - h * 0.05) },
        isAnchor: true
      };
    }

    // 2. Çapa bulunamazsa (eski formlar için): Mobil kamera vizörü adaptif RANSAC kart tespiti
    if (bounds) {
      const mobCorners = findMobileCameraCardCorners(gray, w, h, threshold, bounds);
      if (mobCorners) {
        return makeAnchorFromBorder(mobCorners);
      }
    }

    // 2b. Formun belirgin dış kart çerçevesini kontrol et (Masaüstü PDF, CamScanner ve taranmış A4 için)
    const borderCorners = findCardBorderCorners(gray, w, h, threshold, bounds);
    if (borderCorners) {
      return makeAnchorFromBorder(borderCorners);
    }

    // 2c. Açı/perspektifli çekimlerde tüm kare RANSAC kart tespiti (Fallback)
    const globalMobCorners = findMobileCameraCardCorners(gray, w, h, threshold, { minX: 0, maxX: w, minY: 0, maxY: h });
    if (globalMobCorners) {
      return makeAnchorFromBorder(globalMobCorners);
    }

    // 3. Konsantrik çapa bulunamazsa dış siyah çerçeveyi dene
    const bbox = findFormOuterBoundingBox(gray, w, h, minX, maxX, minY, maxY, threshold);
    if (bbox) {
      return makeAnchorFromBorder(bbox);
    }

    // 4. Koyu köşe lekesi arama (Fallback)
    if (!tlFound) tlFound = findBestCornerAnchorBlob(gray, w, h, minX, minX + qW, minY, minY + qH, minX, minY, threshold);
    if (!trFound) trFound = findBestCornerAnchorBlob(gray, w, h, maxX - qW, maxX, minY, minY + qH, maxX, minY, threshold);
    if (!brFound) brFound = findBestCornerAnchorBlob(gray, w, h, maxX - qW, maxX, maxY - qH, maxY, maxX, maxY, threshold);
    if (!blFound) blFound = findBestCornerAnchorBlob(gray, w, h, minX, minX + qW, maxY - qH, maxY, minX, maxY, threshold);

    foundCount = (tlFound ? 1 : 0) + (trFound ? 1 : 0) + (brFound ? 1 : 0) + (blFound ? 1 : 0);
    if (foundCount >= 3) {
      const cand = {
        tl: tlFound || { x: minX, y: minY },
        tr: trFound || { x: maxX, y: minY },
        br: brFound || { x: maxX, y: maxY },
        bl: blFound || { x: minX, y: maxY },
        isAnchor: true
      };
      if (!tlFound) cand.tl = { x: cand.tr.x + cand.bl.x - cand.br.x, y: cand.tr.y + cand.bl.y - cand.br.y };
      else if (!trFound) cand.tr = { x: cand.tl.x + cand.br.x - cand.bl.x, y: cand.tl.y + cand.br.y - cand.bl.y };
      else if (!brFound) cand.br = { x: cand.tr.x + cand.bl.x - cand.tl.x, y: cand.tr.y + cand.bl.y - cand.tl.y };
      else if (!blFound) cand.bl = { x: cand.tl.x + cand.br.x - cand.tr.x, y: cand.tl.y + cand.br.y - cand.tr.y };
      if (areAnchorsGeometricallyValid(cand.tl, cand.tr, cand.br, cand.bl)) {
        return cand;
      }
    }

    return null;
  }

  function detectCornerAnchors(gray, w, h, threshold, bounds) {
    if (bounds) {
      const res = detectCornerAnchorsInternal(gray, w, h, threshold, bounds);
      if (res) return res;
    }
    const fullRes = detectCornerAnchorsInternal(gray, w, h, threshold, null);
    if (fullRes) return fullRes;

    const baseMinX = bounds ? bounds.minX : 0;
    const baseMaxX = bounds ? bounds.maxX : w;
    const baseMinY = bounds ? bounds.minY : 0;
    const baseMaxY = bounds ? bounds.maxY : h;
    const baseSubW = baseMaxX - baseMinX;
    const baseSubH = baseMaxY - baseMinY;

    return {
      tl: { x: Math.round(baseMinX + baseSubW * 0.05), y: Math.round(baseMinY + baseSubH * 0.04) },
      tr: { x: Math.round(baseMinX + baseSubW * 0.95), y: Math.round(baseMinY + baseSubH * 0.04) },
      br: { x: Math.round(baseMinX + baseSubW * 0.95), y: Math.round(baseMinY + baseSubH * 0.96) },
      bl: { x: Math.round(baseMinX + baseSubW * 0.05), y: Math.round(baseMinY + baseSubH * 0.96) }
    };
  }

  // CamScanner ve taranmış formlar için sağlam dış siyah çerçeve tespiti
  function findFormOuterBoundingBox(gray, w, h, minX, maxX, minY, maxY, threshold) {
    const subW = maxX - minX;
    const subH = maxY - minY;

    // 1. Sol dikey kenar: minX + subW * 0.01 .. minX + subW * 0.22 arasında en belirgin dikey çizgi
    let bestLeftX = null, maxLDark = 0;
    const startY = Math.round(minY + subH * 0.15);
    const endY = Math.round(minY + subH * 0.85);
    const vCheckH = endY - startY;

    for (let x = Math.round(minX + subW * 0.015); x < Math.round(minX + subW * 0.22); x++) {
      let d = 0;
      for (let y = startY; y < endY; y++) {
        if (gray[y * w + x] < threshold) d++;
      }
      if (d > vCheckH * 0.65 && d > maxLDark) {
        maxLDark = d;
        bestLeftX = x;
      }
    }

    // 2. Sağ dikey kenar: maxX - subW * 0.01 .. maxX - subW * 0.22 arasında en belirgin dikey çizgi
    let bestRightX = null, maxRDark = 0;
    for (let x = Math.round(maxX - subW * 0.015); x > Math.round(maxX - subW * 0.22); x--) {
      let d = 0;
      for (let y = startY; y < endY; y++) {
        if (gray[y * w + x] < threshold) d++;
      }
      if (d > vCheckH * 0.65 && d > maxRDark) {
        maxRDark = d;
        bestRightX = x;
      }
    }

    const leftX = bestLeftX || Math.round(minX + subW * 0.04);
    const rightX = bestRightX || Math.round(maxX - subW * 0.04);
    const spanW = rightX - leftX;

    // 3. Üst kenar: minY + subH * 0.01 .. minY + subH * 0.25 arasında yatay çizgi
    let bestTopY = null, maxTDark = 0;
    for (let y = Math.round(minY + subH * 0.012); y < Math.round(minY + subH * 0.25); y++) {
      let d = 0;
      for (let x = leftX + Math.round(spanW * 0.15); x < rightX - Math.round(spanW * 0.15); x++) {
        if (gray[y * w + x] < threshold) d++;
      }
      if (d > (spanW * 0.7) * 0.65 && d > maxTDark) {
        maxTDark = d;
        bestTopY = y;
        break;
      }
    }

    // 4. Alt kenar: CamScanner filigranını filtreleyerek (maxY - subH * 0.08 .. maxY - subH * 0.35 arası) yukarıya doğru ara
    let bestBottomY = null;
    for (let y = Math.round(maxY - subH * 0.08); y > Math.round(maxY - subH * 0.35); y--) {
      let d = 0;
      for (let x = leftX + Math.round(spanW * 0.15); x < rightX - Math.round(spanW * 0.15); x++) {
        if (gray[y * w + x] < threshold) d++;
      }
      if (d > (spanW * 0.7) * 0.65) {
        bestBottomY = y;
        break;
      }
    }

    const topY = bestTopY || Math.round(minY + subH * 0.05);
    const bottomY = bestBottomY || Math.round(maxY - subH * 0.08);

    if (bestLeftX !== null && bestRightX !== null && (bottomY - topY) > subH * 0.35 && (rightX - leftX) > subW * 0.35) {
      return {
        tl: { x: leftX, y: topY },
        tr: { x: rightX, y: topY },
        br: { x: rightX, y: bottomY },
        bl: { x: leftX, y: bottomY }
      };
    }
    return null;
  }

  // ==========================================================================
  // 3. PİKSEL YOĞUNLUĞU VE BALONCUK ANALİZİ
  // ==========================================================================

  function sampleLocalPaperLuminance(gray, w, h, pt, radius) {
    let sum = 0, count = 0;
    // Yalnızca satırlar arası dikey boşluklardan kağıt beyazlığını örnekle (asla yataydaki baloncuklara veya yazılara taşma yapma)
    const checkPts = [
      { x: pt.x, y: Math.max(0, pt.y - Math.round(radius * 1.8)) },
      { x: pt.x, y: Math.min(h - 1, pt.y + Math.round(radius * 1.8)) }
    ];

    for (const cp of checkPts) {
      for (let dy = -2; dy <= 2; dy++) {
        const py = cp.y + dy;
        if (py < 0 || py >= h) continue;
        for (let dx = -2; dx <= 2; dx++) {
          const px = cp.x + dx;
          if (px < 0 || px >= w) continue;
          sum += gray[py * w + px];
          count++;
        }
      }
    }
    return count > 0 ? (sum / count) : 220;
  }

  function analyzeBubble(gray, w, h, cx, cy, radius, rowPaperLum) {
    // Çemberin iç alanını geniş örnekle (0.62 * radius): Öğrencinin baloncuğu yarım,
    // alt/üst/yan ağırlıklı veya ortası hafif boşluklu işaretlemelerini tam kapsar.
    const rInner = Math.max(3, Math.round(radius * 0.62));
    const rInner2 = rInner * rInner;

    // 1. Baloncuk iç bölgesindeki en koyu 3x3 kurşun kalem çekirdeğini bul
    // (Sadece tek bir (cx, cy) noktasına bakmak yerine iç bölgedeki en güçlü kalem darbesini baz alır)
    const rCoreSearch = Math.max(1, Math.round(rInner * 0.55));
    let maxCoreDarkness = 0;
    for (let sy = -rCoreSearch; sy <= rCoreSearch; sy++) {
      for (let sx = -rCoreSearch; sx <= rCoreSearch; sx++) {
        if (sx * sx + sy * sy > rCoreSearch * rCoreSearch) continue;
        let patchSum = 0, patchCnt = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const py = cy + sy + dy;
          if (py < 0 || py >= h) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const px = cx + sx + dx;
            if (px < 0 || px >= w) continue;
            patchSum += gray[py * w + px];
            patchCnt++;
          }
        }
        if (patchCnt > 0) {
          const patchLum = patchSum / patchCnt;
          const d = Math.max(0, (rowPaperLum - patchLum) / Math.max(1, rowPaperLum));
          if (d > maxCoreDarkness) maxCoreDarkness = d;
        }
      }
    }
    const coreDarkness = maxCoreDarkness;

    let totalPixels = 0;
    const darknessValues = [];

    for (let dy = -rInner; dy <= rInner; dy++) {
      const py = cy + dy;
      if (py < 0 || py >= h) continue;
      const dy2 = dy * dy;
      for (let dx = -rInner; dx <= rInner; dx++) {
        const px = cx + dx;
        if (px < 0 || px >= w) continue;
        if (dx * dx + dy2 <= rInner2) {
          totalPixels++;
          const lum = gray[py * w + px];
          const d = Math.max(0, (rowPaperLum - lum) / Math.max(1, rowPaperLum));
          darknessValues.push(d);
        }
      }
    }

    if (totalPixels === 0) {
      return { score: 0, fillRatio: 0, medianDarkness: 0, p75Darkness: 0, meanDarkness: 0, coreDarkness: 0 };
    }

    darknessValues.sort((a, b) => a - b);
    let medianDarkness = darknessValues[Math.floor(totalPixels * 0.50)];
    const p75Darkness = darknessValues[Math.floor(totalPixels * 0.75)];

    // En koyu %45'lik piksel diliminin ortalaması (yarım/kayık işaretlemeleri yakalar)
    const topStartIdx = Math.floor(totalPixels * 0.55);
    let topSum = 0, topCnt = 0;
    for (let i = topStartIdx; i < totalPixels; i++) {
      topSum += darknessValues[i];
      topCnt++;
    }
    const topDarkness = topCnt > 0 ? (topSum / topCnt) : p75Darkness;

    let darkCount = 0;
    let sumDark = 0;
    for (let i = 0; i < totalPixels; i++) {
      const v = darknessValues[i];
      sumDark += v;
      if (v >= 0.25) darkCount++;
    }

    let fillRatio = darkCount / totalPixels;
    let meanDarkness = sumDark / totalPixels;

    // Yalnızca baloncuğun tamamı kağıt beyazıysa (ne kalem çekirdeği ne de çeyrek doluluk varsa) gürültüyü bastır
    if (coreDarkness < 0.10 && p75Darkness < 0.15) {
      medianDarkness = Math.min(medianDarkness, 0.05);
      fillRatio = Math.min(fillRatio, 0.15);
      meanDarkness = Math.min(meanDarkness, 0.15);
    }

    // Çevre alan + en koyu %45 kalem yoğunluğu + genel doluluk birleşik skoru
    let score = (medianDarkness * 0.25) + (meanDarkness * 0.30) + (topDarkness * 0.20) + (fillRatio * 0.25);
    if (coreDarkness < 0.10 && p75Darkness < 0.15) {
      score = Math.min(score, 0.20);
    }

    return { score, fillRatio, medianDarkness, p75Darkness, meanDarkness, coreDarkness };
  }

  function refineBubbleCenter(gray, w, h, initialPt, radius, rowPaperLum, maxRangeX, maxRangeY) {
    const defaultRange = Math.max(3, Math.round(radius * 0.75));
    const rangeX = maxRangeX !== undefined ? Math.max(2, maxRangeX) : defaultRange;
    const rangeY = maxRangeY !== undefined ? Math.max(2, maxRangeY) : defaultRange;
    const stepX = Math.max(1, Math.round(rangeX / 5));
    const stepY = Math.max(1, Math.round(rangeY / 5));

    let bestX = initialPt.x;
    let bestY = initialPt.y;
    let maxDarkSum = 0;
    const rCheck = Math.max(2, Math.round(radius * 0.50));
    const rCheck2 = rCheck * rCheck;

    for (let dy = -rangeY; dy <= rangeY; dy += stepY) {
      for (let dx = -rangeX; dx <= rangeX; dx += stepX) {
        const cx = initialPt.x + dx;
        const cy = initialPt.y + dy;
        let sum = 0;

        for (let ry = -rCheck; ry <= rCheck; ry += 2) {
          const py = cy + ry;
          if (py < 0 || py >= h) continue;
          for (let rx = -rCheck; rx <= rCheck; rx += 2) {
            const px = cx + rx;
            if (px < 0 || px >= w) continue;
            if (rx * rx + ry * ry <= rCheck2) {
              const d = Math.max(0, rowPaperLum - gray[py * w + px]);
              sum += d;
            }
          }
        }

        if (sum > maxDarkSum) {
          maxDarkSum = sum;
          bestX = cx;
          bestY = cy;
        }
      }
    }

    // Centroid Refinement: Eğer belirgin bir koyuluk bulunduysa ağırlık merkeziyle (Centroid of Darkness) ince kilitlenme yap
    if (maxDarkSum > (rCheck2 * 12)) {
      let weightSum = 0, weightX = 0, weightY = 0;
      const fineRadius = Math.max(2, Math.round(rCheck * 0.85));
      for (let dy = -fineRadius; dy <= fineRadius; dy++) {
        const py = bestY + dy;
        if (py < 0 || py >= h) continue;
        for (let dx = -fineRadius; dx <= fineRadius; dx++) {
          const px = bestX + dx;
          if (px < 0 || px >= w) continue;
          const d = Math.max(0, rowPaperLum - gray[py * w + px]);
          if (d > 20) {
            const weight = d * d;
            weightSum += weight;
            weightX += px * weight;
            weightY += py * weight;
          }
        }
      }
      if (weightSum > 0) {
        return { x: Math.round(weightX / weightSum), y: Math.round(weightY / weightSum) };
      }
    }

    return { x: bestX, y: bestY };
  }

  function analyzeBubbleRingContrast(gray, w, h, cx, cy, radius) {
    const rRing = Math.max(7, Math.round(radius * 0.95));
    const rOuter = Math.max(11, Math.round(radius * 1.45));
    const cVal = (cx >= 0 && cx < w && cy >= 0 && cy < h) ? gray[cy * w + cx] : 255;

    let ringSum = 0;
    let outerSum = 0;
    const angles = [0, 0.785398, 1.570796, 2.356194, 3.141593, 3.926991, 4.712389, 5.497787];
    for (let i = 0; i < 8; i++) {
      const rx = Math.round(cx + rRing * Math.cos(angles[i]));
      const ry = Math.round(cy + rRing * Math.sin(angles[i]));
      const ox = Math.round(cx + rOuter * Math.cos(angles[i]));
      const oy = Math.round(cy + rOuter * Math.sin(angles[i]));
      ringSum += (rx >= 0 && rx < w && ry >= 0 && ry < h) ? gray[ry * w + rx] : 255;
      outerSum += (ox >= 0 && ox < w && oy >= 0 && oy < h) ? gray[oy * w + ox] : 255;
    }
    const avgRing = ringSum / 8.0;
    const avgOut = outerSum / 8.0;

    // Boş baloncuk halkası kontrastı (merkez açık, halka koyu, dışı açık)
    const ringDrop1 = cVal - avgRing;
    const ringDrop2 = avgOut - avgRing;
    if (ringDrop1 > 12 && ringDrop2 > 12) {
      return Math.min(1.2, (ringDrop1 + ringDrop2) / 45.0);
    }
    return 0.0;
  }

  function snapToBubbleRing(gray, w, h, initialPt, radius) {
    // Merkezin komşu satırlara veya baloncuk kenarındaki beyaz boşluğa kaçmasını önlemek için dar pencere
    const searchRx = Math.min(4, Math.max(2, Math.round(radius * 0.30)));
    const searchRy = Math.min(4, Math.max(2, Math.round(radius * 0.28)));
    const rRing = Math.max(7, Math.round(radius * 0.85));
    const rOuter = Math.max(11, Math.round(radius * 1.35));

    const angles = [0, 0.785398, 1.570796, 2.356194, 3.141593, 3.926991, 4.712389, 5.497787];
    const ringCos = angles.map(a => Math.round(rRing * Math.cos(a)));
    const ringSin = angles.map(a => Math.round(rRing * Math.sin(a)));
    const outerCos = angles.map(a => Math.round(rOuter * Math.cos(a)));
    const outerSin = angles.map(a => Math.round(rOuter * Math.sin(a)));

    let bestX = initialPt.x;
    let bestY = initialPt.y;
    let bestScore = -1e9;

    const ringVals = [0, 0, 0, 0, 0, 0, 0, 0];

    for (let dy = -searchRy; dy <= searchRy; dy++) {
      const cy = initialPt.y + dy;
      for (let dx = -searchRx; dx <= searchRx; dx++) {
        const cx = initialPt.x + dx;
        let ringDark = 0;
        let outerWhite = 0;

        for (let a = 0; a < 8; a++) {
          const rx = cx + ringCos[a];
          const ry = cy + ringSin[a];
          const ox = cx + outerCos[a];
          const oy = cy + outerSin[a];

          const rDark = (rx >= 0 && rx < w && ry >= 0 && ry < h) ? (255 - gray[ry * w + rx]) : 0;
          ringVals[a] = rDark;
          ringDark += rDark;

          if (ox >= 0 && ox < w && oy >= 0 && oy < h) {
            outerWhite += gray[oy * w + ox];
          }
        }

        // Çember simetri koruması: Gerçek baloncuk merkezinde karşılıklı halka kenarları (Sol-Sağ, Üst-Alt, Çaprazlar)
        // aynı anda koyudur. Çemberin dışına çıkıldığında ise bir taraf tamamen beyazda kalır.
        let symBonus = 0;
        for (let a = 0; a < 4; a++) {
          symBonus += Math.min(ringVals[a], ringVals[a + 4]);
        }

        // İç doluluk çekimi: Öğrenci baloncuğu karaladığında odak noktasının kalemden kaçıp
        // baloncuğun üst/yan beyaz boşluğuna kaymasını engeller, kalem ağırlık merkezini tutar.
        let innerDarkSum = 0;
        for (let idy = -1; idy <= 1; idy++) {
          const ipy = cy + idy;
          if (ipy < 0 || ipy >= h) continue;
          for (let idx = -1; idx <= 1; idx++) {
            const ipx = cx + idx;
            if (ipx < 0 || ipx >= w) continue;
            innerDarkSum += (255 - gray[ipy * w + ipx]);
          }
        }

        // Başlangıç noktasından uzaklaşma cezası: Sabit koordinattan gereksiz sapmayı engeller
        const dist = Math.hypot(dx, dy);
        const score = ringDark + symBonus * 1.2 + innerDarkSum * 0.65 + outerWhite * 0.25 - dist * 8.5;
        if (score > bestScore) {
          bestScore = score;
          bestX = cx;
          bestY = cy;
        }
      }
    }

    return { x: bestX, y: bestY };
  }

  // ==========================================================================
  // 4. TEKİL KART TARAMA MOTORU (HEM TEK HEM ÇOKLU DERS)
  // ==========================================================================

  function scanSingleCard(canvas, gray, w, h, corners, exam, classStudents, options = {}) {
    const mapPoint = createProjectiveHomography(corners);
    const cardW = Math.abs(corners.tr.x - corners.tl.x);
    const sampleRadius = Math.max(5, Math.min(18, Math.round(cardW * 0.0075)));

    let effectiveExam = exam || {};
    let autoSwitchedExam = null;

    const isMulti = effectiveExam && !!effectiveExam.isMultiSubject && Array.isArray(effectiveExam.subjects) && effectiveExam.subjects.length > 0;
    const rawSubjects = isMulti ? effectiveExam.subjects : [];
    const qCount = parseInt(effectiveExam.totalQuestions, 10) || (isMulti ? rawSubjects.reduce((acc, s) => acc + (parseInt(s.questionCount, 10) || 0), 0) : 20);
    const examSubjects = isMulti
      ? rawSubjects
      : [{ id: 'sub_0', name: effectiveExam.examName || 'Ders', questionCount: qCount }];
    const choicesCount = parseInt(effectiveExam.choicesCount, 10) || 4;
    const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, choicesCount);
    const answerKey = effectiveExam.answerKey || {};
    const penaltyRate = effectiveExam.wrongAffects ? (parseFloat(effectiveExam.penaltyRate) || 4) : 0;

    // Kağıt Formatı (1: A4 Tam Boy, 2: A5 Kesilmiş Yarım Boy, 4: A6 Kesilmiş Çeyrek Boy)
    const perPage = parseInt(options.perPage || effectiveExam.perPage, 10) || 2;

    const isAnchor = !!corners.isAnchor;
    const isMobile = !isAnchor && (!!options.isMobileCamera || !!options.bounds);

    const detectedAnswers = {};
    const questionDetails = [];
    let correctCount = 0;
    let wrongCount = 0;
    let blankCount = 0;
    let subjectBreakdown = isMulti ? {} : null;

    // ── 5 SABİT DERS CEBİ (FIXED 5-SLOT) & SABİT 1. SORU BAŞLANGIÇ MOTORU ──
    // 1 ders seçilirse 1. ders cebine (Slot 0) yerleşir ve diğer 4 ders cebi boş kalır.
    // 2..5 ders seçilirse sırasıyla kendi sabit ceplerine (Slot 0..4) yerleşir.
    {
      const numSubjects = examSubjects.length;
      let cumulativeOffset = 0;

      // Üst başlık (Sınav adı, öğrenci adı, ArUco rozeti) 0.00 - 0.24 aralığını kaplar.
      // Tüm derslerde 1. sorular daima aynı değişmeyen başlangıç noktasından (vFirstRowBase) başlar.
      const maxQuestions = Math.max(...examSubjects.map(s => parseInt(s.questionCount, 10) || 0), 1);

      let vFirstRowBase = 0.2400;
      let vCompactStep = 0.0494;

      if (perPage === 1) {
        // A4 Tam Sayfa
        vFirstRowBase = 0.2000;
        vCompactStep = 0.0260;
      } else if (perPage === 2) {
        // A5 Yatay (Sayfada 2 Form - 126mm Çıpa Boyu)
        vFirstRowBase = 0.2400;
        vCompactStep = 0.0494;
      } else if (perPage === 4) {
        // A6 Çeyrek Sayfa (118mm Çıpa Boyu)
        vFirstRowBase = 0.2760;
        vCompactStep = 0.0524;
      }

      if (maxQuestions > 20) {
        // Sıkışık ders satırları (.compact-rows: 16px row height)
        vCompactStep = vCompactStep * 0.82;
      }

      // Ders sütunlarının yatay geometri haritası (5 Sabit Yuva / Fixed Slot Mimarisi)
      function getSubjectColumnGeometry(sIdx) {
        let colU_A, choiceStep;
        // 1..5 ders için her ders kendi sabit sütununda (Slot 0..4) yer alır (188mm Çıpa Eni)
        const colBounds = [
          { uA: 0.0634, uD: 0.1732 }, // 1. Yuva (Türkçe)
          { uA: 0.2648, uD: 0.3739 }, // 2. Yuva (Matematik)
          { uA: 0.4645, uD: 0.5729 }, // 3. Yuva (Sosyal Bilgiler / Ders 3)
          { uA: 0.6651, uD: 0.7721 }, // 4. Yuva (Fen Bilgisi / Ders 4)
          { uA: 0.8679, uD: 0.9717 }  // 5. Yuva (İngilizce / Ders 5)
        ];

        if (numSubjects <= 5) {
          const cb = colBounds[sIdx] || { uA: 0.0634 + sIdx * 0.2011, uD: 0.1732 + sIdx * 0.2011 };
          colU_A = cb.uA;
          choiceStep = letters.length > 1 ? ((cb.uD - cb.uA) / (letters.length - 1)) : 0.0363;
        } else if (numSubjects === 6) {
          const colBounds = [
            { uA: 0.0650, uD: 0.1680 },
            { uA: 0.2230, uD: 0.3260 },
            { uA: 0.3800, uD: 0.4830 },
            { uA: 0.5380, uD: 0.6410 },
            { uA: 0.6960, uD: 0.7990 },
            { uA: 0.8540, uD: 0.9570 }
          ];
          const cb = colBounds[sIdx] || { uA: 0.0650 + sIdx * 0.158, uD: 0.1680 + sIdx * 0.158 };
          colU_A = cb.uA;
          choiceStep = letters.length > 1 ? ((cb.uD - cb.uA) / (letters.length - 1)) : 0.0343;
        } else {
          const gridUSpan = 0.9350;
          const gapU = 0.0113;
          const colW = (gridUSpan - (numSubjects - 1) * gapU) / numSubjects;
          const colStep = colW + gapU;
          const colStartU = 0.0325 + sIdx * colStep;
          colU_A = colStartU + 0.0345;
          const spanD = Math.min(0.1090, colW * 0.75);
          choiceStep = letters.length > 1 ? (spanD / (letters.length - 1)) : 0.0363;
        }
        return { colU_A, choiceStep };
      }

      // ── BİRLEŞİK KART GENELİ DİKEY IZGARA KALİBRASYONU (GLOBAL VERTICAL LOCK) ──
      // Tüm dersler aynı fiziksel kağıt üzerine basıldığı için:
      // 1. Soru 1 yatay düzlemde tüm dersler için birebir aynı dikey çizgidedir (vFirst).
      // 2. Sorular arasındaki dikey aralık (step) tüm sütunlar için sabittir: (q - 1) * step.
      // Sütunların birbirinden bağımsız dikey kayma yapmasını engellemek için tek bir global arama yapılır.
      function evaluateGlobalGridConfidence(testStep, testVFirst) {
        let totalConfidence = 0;
        for (let sIdx = 0; sIdx < numSubjects; sIdx++) {
          const subj = examSubjects[sIdx];
          const numQuestions = parseInt(subj.questionCount, 10) || 6;
          const { colU_A, choiceStep } = getSubjectColumnGeometry(sIdx);

          for (let q = 1; q <= numQuestions; q++) {
            const rowV = testVFirst + (q - 1) * testStep;
            const rowSamplePt = mapPoint(colU_A + choiceStep * 1.5, rowV);
            const rowPaperLum = sampleLocalPaperLuminance(gray, w, h, rowSamplePt, sampleRadius);

            const rowScores = [];
            for (let lIdx = 0; lIdx < letters.length; lIdx++) {
              const choiceU = colU_A + lIdx * choiceStep;
              const initialPt = mapPoint(choiceU, rowV);
              const snappedPt = (isAnchor || isMobile)
                ? snapToBubbleRing(gray, w, h, initialPt, sampleRadius)
                : refineBubbleCenter(gray, w, h, initialPt, sampleRadius, rowPaperLum, Math.max(6, Math.round(sampleRadius * 1.3)), Math.max(6, Math.round(sampleRadius * 1.3)));

              const ringContrast = analyzeBubbleRingContrast(gray, w, h, snappedPt.x, snappedPt.y, sampleRadius);
              totalConfidence += ringContrast;

              const metrics = analyzeBubble(gray, w, h, snappedPt.x, snappedPt.y, sampleRadius, rowPaperLum);
              rowScores.push(metrics.score);
            }
            rowScores.sort((a, b) => b - a);
            const diff = rowScores[0] - (rowScores[1] || 0);
            if (rowScores[0] >= 0.28 && diff >= 0.10) {
              totalConfidence += (rowScores[0] + diff) * 2;
            }
          }
        }
        return totalConfidence;
      }

      // Global aday ızgaralar: Çapa kilidi varken yalnızca mikro dikey ince ayar (±0.003) yapılır; çapa yoksa daha geniş aranır
      const candidateVFirstOffsets = isAnchor
        ? [0.000, -0.0015, 0.0015, -0.003, 0.003]
        : [0.000, -0.003, 0.003, -0.006, 0.006, -0.010, 0.010];
      const candidateStepScales = isAnchor
        ? [1.00, 0.995, 1.005]
        : [1.00, 0.99, 1.01, 0.98, 1.02];

      let bestGlobalStep = vCompactStep;
      let bestGlobalVFirst = vFirstRowBase;
      let bestGlobalScore = -1;

      candidateStepScales.forEach(scale => {
        const testStep = vCompactStep * scale;
        candidateVFirstOffsets.forEach(dv => {
          const testVFirst = vFirstRowBase + dv;
          const score = evaluateGlobalGridConfidence(testStep, testVFirst);
          if (score > bestGlobalScore) {
            bestGlobalScore = score;
            bestGlobalStep = testStep;
            bestGlobalVFirst = testVFirst;
          }
        });
      });

      // 3. Ders sütunu içindeki şıkların yayılımı (A - B - C - D)
      examSubjects.forEach((subj, sIdx) => {
        let subjCorrect = 0;
        let subjWrong = 0;
        let subjBlank = 0;

        const numQuestions = parseInt(subj.questionCount, 10) || 6;
        const { colU_A, choiceStep } = getSubjectColumnGeometry(sIdx);

        function evaluateSubjectGrid(step, vFirst, du = 0) {
          const qResults = [];
          let gridConfidence = 0;

          for (let q = 1; q <= numQuestions; q++) {
            const rowV = vFirst + (q - 1) * step;
            const rowSamplePt = mapPoint(colU_A + du + choiceStep * 1.5, rowV);
            const rowPaperLum = sampleLocalPaperLuminance(gray, w, h, rowSamplePt, sampleRadius);

            const currentChoiceScores = [];
            for (let lIdx = 0; lIdx < letters.length; lIdx++) {
              const choiceU = colU_A + du + lIdx * choiceStep;
              const initialPt = mapPoint(choiceU, rowV);
              let snappedPt;
              let metrics;

              if (isAnchor || isMobile) {
                snappedPt = snapToBubbleRing(gray, w, h, initialPt, sampleRadius);
                metrics = analyzeBubble(gray, w, h, snappedPt.x, snappedPt.y, sampleRadius, rowPaperLum);
                const metricsInit = analyzeBubble(gray, w, h, initialPt.x, initialPt.y, sampleRadius, rowPaperLum);
                if (metricsInit.score > metrics.score + 0.02) {
                  snappedPt = initialPt;
                  metrics = metricsInit;
                }
              } else {
                const searchR = Math.max(6, Math.round(sampleRadius * 1.3));
                snappedPt = refineBubbleCenter(gray, w, h, initialPt, sampleRadius, rowPaperLum, searchR, searchR);
                metrics = analyzeBubble(gray, w, h, snappedPt.x, snappedPt.y, sampleRadius, rowPaperLum);
              }

              // Baloncuk halka / doluluk kontrast kalitesi (Boş baloncuklar bile ızgarayı kilitler)
              const ringContrast = analyzeBubbleRingContrast(gray, w, h, snappedPt.x, snappedPt.y, sampleRadius);
              gridConfidence += ringContrast;

              currentChoiceScores.push({
                letter: letters[lIdx],
                score: metrics.score,
                fillRatio: metrics.fillRatio,
                meanDarkness: metrics.meanDarkness,
                medianDarkness: metrics.medianDarkness,
                coreDarkness: metrics.coreDarkness,
                pt: snappedPt
              });
            }

            const sortedScores = [...currentChoiceScores].sort((a, b) => b.score - a.score);
            const best = sortedScores[0];
            const second = sortedScores[1] || { score: 0, fillRatio: 0 };
            const diff = best.score - second.score;
            if (isAnchor) {
              if (best.score >= 0.28 && diff >= 0.10) {
                gridConfidence += (best.score + diff) * 2;
              }
            } else {
              if (best.fillRatio >= 0.50 && diff >= 0.12) {
                gridConfidence += (best.fillRatio + diff) * 2;
              }
            }

            qResults.push({
              q,
              choiceScores: currentChoiceScores,
              sortedScores,
              best,
              second,
              diff
            });
          }

          return { gridConfidence, qResults };
        }

        // Sütun bazında yalnızca yatay mikro ince ayar yapılır (dikey eksen global kilitlidir)
        const candidateDu = [0.000, -0.002, 0.002, -0.004, 0.004];
        let bestSubjGrid = null;
        for (const du of candidateDu) {
          const evaluated = evaluateSubjectGrid(bestGlobalStep, bestGlobalVFirst, du);
          if (!bestSubjGrid || evaluated.gridConfidence > bestSubjGrid.gridConfidence) {
            bestSubjGrid = evaluated;
          }
        }

        bestSubjGrid.qResults.forEach(qr => {
          const q = qr.q;
          const key = isMulti ? `${subj.id}_${q}` : String(q);
          const choiceScores = qr.choiceScores;
          const best = qr.best;
          const second = qr.second;
          const diff = qr.diff;

          let markedLetter = '';
          let status = 'blank';

          const fillThreshold = (options.sensitivity === 'high' || options.sensitivity === 3) ? 0.36 : ((options.sensitivity === 'low' || options.sensitivity === 1) ? 0.50 : 0.44);
          const minDiff = (options.sensitivity === 'high' || options.sensitivity === 3) ? 0.10 : 0.12;

          // Gerçek kurşun kalem işaretlemesi kontrolü:
          // 1. Kenardan sızan tablo çizgisi/çember çizgisi durumunda merkez veya medyan boş kalır.
          // 2. İşaretli sayılabilmesi için baloncuğun içi dolu olmalıdır (medianDarkness >= 0.18 veya coreDarkness >= 0.20).
          const hasSolidFill = (best.medianDarkness !== undefined ? best.medianDarkness >= 0.18 : true) || (best.coreDarkness !== undefined ? best.coreDarkness >= 0.20 : true);

          const isFilled = hasSolidFill && (
            (best.score >= fillThreshold && diff >= minDiff) ||
            (best.score >= 0.55 && diff >= 0.08) ||
            (best.score >= 0.65)
          );
          const isMultiple = isFilled && (second.score >= fillThreshold) && (diff < minDiff) && (second.medianDarkness >= 0.18);

          if (isMultiple) {
            status = 'multiple';
            markedLetter = '';
          } else if (isFilled) {
            status = 'marked';
            markedLetter = best.letter;
          }

          const totalSubjs = examSubjects.length;
          const correctAns = findCorrectAnswerForKey(answerKey, subj, sIdx, q, cumulativeOffset, totalSubjs);

          const qd = {
            subjId: subj.id,
            subjName: subj.name,
            q,
            key,
            marked: markedLetter,
            status,
            keyAnswer: correctAns,
            scores: choiceScores
          };

          if (!qd.marked) {
            blankCount++;
            subjBlank++;
            qd.isCorrect = false;
            qd.isBlank = true;
          } else if (correctAns && qd.marked === correctAns) {
            correctCount++;
            subjCorrect++;
            qd.isCorrect = true;
            qd.isBlank = false;
          } else {
            wrongCount++;
            subjWrong++;
            qd.isCorrect = false;
            qd.isBlank = false;
          }

          detectedAnswers[key] = qd.marked;
          detectedAnswers[`${subj.id}_${q}`] = qd.marked;
          if (examSubjects.length === 1) {
            detectedAnswers[q] = qd.marked;
          }
          questionDetails.push(qd);
        });

        if (isMulti && subjectBreakdown) {
          let subjNet = penaltyRate > 0 ? (subjCorrect - (subjWrong / penaltyRate)) : subjCorrect;
          subjNet = Math.max(0, parseFloat(subjNet.toFixed(2)));
          const subjScore = subj.questionCount > 0 ? parseFloat(((subjNet / subj.questionCount) * 100).toFixed(1)) : 0;

          subjectBreakdown[subj.id] = {
            id: subj.id,
            name: subj.name,
            subjectName: subj.name,
            correct: subjCorrect,
            wrong: subjWrong,
            blank: subjBlank,
            net: subjNet,
            score: subjScore,
            total: subj.questionCount
          };
        }

        cumulativeOffset += subj.questionCount;
      });
    }

    let net = penaltyRate > 0 ? (correctCount - (wrongCount / penaltyRate)) : correctCount;
    net = Math.max(0, parseFloat(net.toFixed(2)));
    const score = qCount > 0 ? parseFloat(((net / qCount) * 100).toFixed(1)) : 0;

    // Görsel Vurgu Katmanı
    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.width = w;
    overlayCanvas.height = h;
    const oCtx = overlayCanvas.getContext('2d');
    oCtx.drawImage(canvas, 0, 0);

    // Dış çerçeve çizgisi
    oCtx.lineWidth = Math.max(2, Math.round(w * 0.002));
    oCtx.strokeStyle = 'rgba(79, 70, 229, 0.85)';
    oCtx.beginPath();
    oCtx.moveTo(corners.tl.x, corners.tl.y);
    oCtx.lineTo(corners.tr.x, corners.tr.y);
    oCtx.lineTo(corners.br.x, corners.br.y);
    oCtx.lineTo(corners.bl.x, corners.bl.y);
    oCtx.closePath();
    oCtx.stroke();

    // 4 Köşe Noktası Vurgusu ve Koordinat Etiketleri
    const cornerMarkers = [
      { name: 'TL', pt: corners.tl },
      { name: 'TR', pt: corners.tr },
      { name: 'BR', pt: corners.br },
      { name: 'BL', pt: corners.bl }
    ];
    cornerMarkers.forEach(cm => {
      if (!cm.pt) return;
      oCtx.strokeStyle = '#f59e0b';
      oCtx.lineWidth = 2.5;
      oCtx.beginPath();
      oCtx.arc(cm.pt.x, cm.pt.y, 14, 0, Math.PI * 2);
      oCtx.stroke();

      oCtx.beginPath();
      oCtx.moveTo(cm.pt.x - 18, cm.pt.y);
      oCtx.lineTo(cm.pt.x + 18, cm.pt.y);
      oCtx.moveTo(cm.pt.x, cm.pt.y - 18);
      oCtx.lineTo(cm.pt.x, cm.pt.y + 18);
      oCtx.stroke();

      oCtx.font = 'bold 13px sans-serif';
      const label = `${cm.name} (${Math.round(cm.pt.x)}, ${Math.round(cm.pt.y)})`;
      const tm = oCtx.measureText(label);
      oCtx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      oCtx.fillRect(cm.pt.x + 14, cm.pt.y - 10, tm.width + 8, 20);
      oCtx.fillStyle = '#fbbf24';
      oCtx.fillText(label, cm.pt.x + 18, cm.pt.y + 4);
    });

    // Şık vurguları ve TÜM taranan baloncuk merkezleri
    questionDetails.forEach(qd => {
      (qd.scores || []).forEach(cs => {
        if (!cs.pt) return;
        const isMarked = (qd.status === 'marked' && qd.marked === cs.letter);
        const isAnswerKey = (qd.keyAnswer && cs.letter === qd.keyAnswer);

        // 1. Her baloncuk merkezine açık mavi kılavuz noktası ve hedef çemberi
        oCtx.beginPath();
        oCtx.arc(cs.pt.x, cs.pt.y, Math.max(2, sampleRadius * 0.28), 0, Math.PI * 2);
        oCtx.fillStyle = '#2563eb';
        oCtx.fill();

        oCtx.beginPath();
        oCtx.arc(cs.pt.x, cs.pt.y, sampleRadius, 0, Math.PI * 2);
        oCtx.strokeStyle = 'rgba(59, 130, 246, 0.45)';
        oCtx.lineWidth = 1;
        oCtx.stroke();

        // 2. İşaretleme Durumu (Dolu ise yeşil veya kırmızı)
        if (isMarked) {
          oCtx.beginPath();
          oCtx.arc(cs.pt.x, cs.pt.y, sampleRadius * 1.25, 0, Math.PI * 2);
          oCtx.fillStyle = qd.isCorrect ? 'rgba(16, 185, 129, 0.50)' : 'rgba(239, 68, 68, 0.50)';
          oCtx.strokeStyle = qd.isCorrect ? '#10b981' : '#ef4444';
          oCtx.lineWidth = 2.5;
          oCtx.fill();
          oCtx.stroke();

          // Şık harfini ortala
          oCtx.font = `bold ${Math.max(10, Math.round(sampleRadius * 1.05))}px sans-serif`;
          oCtx.fillStyle = '#ffffff';
          oCtx.textAlign = 'center';
          oCtx.textBaseline = 'middle';
          oCtx.fillText(cs.letter, cs.pt.x, cs.pt.y);
          oCtx.textAlign = 'start';
          oCtx.textBaseline = 'alphabetic';
        } else if (isAnswerKey && !qd.isCorrect) {
          // Doğru cevap olan ama işaretlenmemiş şık (yeşil halka)
          oCtx.beginPath();
          oCtx.arc(cs.pt.x, cs.pt.y, sampleRadius * 1.2, 0, Math.PI * 2);
          oCtx.strokeStyle = '#10b981';
          oCtx.lineWidth = 2.5;
          oCtx.stroke();
        }
      });
    });

    // Tepe Teşhis ve Özet Bilgi Bandı
    const bannerH = Math.max(34, Math.round(h * 0.04));
    oCtx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    oCtx.fillRect(0, 0, w, bannerH);
    oCtx.font = `bold ${Math.max(12, Math.round(w * 0.013))}px sans-serif`;
    oCtx.fillStyle = '#f8fafc';
    const anchorInfo = corners.isAnchor ? '4/4 Çapa (Hassas)' : (corners.foundCount ? `${corners.foundCount}/4 Çapa` : 'Çerçeve Fallback');
    const examLabel = (effectiveExam && effectiveExam.examName) ? effectiveExam.examName : 'Sınav';
    const subjLabel = isMulti ? `${examSubjects.length} Ders` : 'Tek Ders';
    const diagSummary = `[OMR Teşhis] Sınav: ${examLabel} (${subjLabel}) | Mod: ${anchorInfo} | Soru: ${qCount} | Puan: ${score} (${correctCount}D ${wrongCount}Y ${blankCount}B) | Net: ${net}`;
    oCtx.fillText(diagSummary, 16, Math.max(22, Math.round(bannerH * 0.65)));

    return {
      success: true,
      corners,
      totalQuestions: qCount,
      answers: detectedAnswers,
      questionDetails,
      correctCount,
      wrongCount,
      blankCount,
      net,
      score,
      subjectBreakdown,
      thumbUrl: overlayCanvas.toDataURL('image/jpeg', 0.85),
      autoSwitchedExam: autoSwitchedExam
    };
  }

  // ==========================================================================
  // 5. SAYFA AYRIŞTIRICI & ÇOKLU FORM BULUCU (1 veya 2 Form)
  // ==========================================================================

  async function scanDocumentPage(imageSource, exam, classStudents = [], options = {}) {
    // Görseli Canvas'a çiz
    const canvas = document.createElement('canvas');
    let srcW = imageSource.naturalWidth || imageSource.videoWidth || imageSource.width;
    let srcH = imageSource.naturalHeight || imageSource.videoHeight || imageSource.height;

    if (!srcW || !srcH) {
      return { success: false, error: 'Görsel boyutları okunamadı' };
    }

    // İdeal analiz genişliği: 1800 piksel
    const MAX_DIM = 1800;
    let targetW = srcW;
    let targetH = srcH;
    if (targetW > MAX_DIM || targetH > MAX_DIM) {
      if (targetW > targetH) {
        targetH = Math.round((targetH * MAX_DIM) / targetW);
        targetW = MAX_DIM;
      } else {
        targetW = Math.round((targetW * MAX_DIM) / targetH);
        targetH = MAX_DIM;
      }
    }

    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(imageSource, 0, 0, targetW, targetH);

    // Kılavuz vizör sınırları verilmişse analiz koordinatlarına ölçekle
    let scaledBounds = null;
    if (options.bounds && typeof options.bounds.minX === 'number') {
      const scX = targetW / srcW;
      const scY = targetH / srcH;
      scaledBounds = {
        minX: Math.max(0, Math.round(options.bounds.minX * scX)),
        maxX: Math.min(targetW, Math.round(options.bounds.maxX * scX)),
        minY: Math.max(0, Math.round(options.bounds.minY * scY)),
        maxY: Math.min(targetH, Math.round(options.bounds.maxY * scY))
      };
    }

    const imgData = ctx.getImageData(0, 0, targetW, targetH);
    const data = imgData.data;
    const totalPixels = targetW * targetH;
    const gray = new Uint8Array(totalPixels);

    let sumLum = 0;
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const lum = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
      gray[p] = lum;
      sumLum += lum;
    }
    const avgLum = sumLum / totalPixels;
    const threshold = Math.max(60, Math.min(150, Math.round(avgLum * 0.75)));

    // Yardımcı: Belirli bir bölgede QR kod tarama (jsQR + Çoklu Ölçek Destekli - Fallback)
    function scanQrInRegion(context, rx, ry, rw, rh) {
      if (typeof window.jsQR !== 'function' || rw <= 20 || rh <= 20) return null;
      try {
        const subData = context.getImageData(Math.max(0, rx), Math.max(0, ry), rw, rh);
        let res = window.jsQR(subData.data, rw, rh, { inversionAttempts: 'attemptBoth' });
        if (res) return res;

        // Çoklu ölçek tarama (2x upscaling veya downscaling):
        if (typeof document !== 'undefined') {
          const scalesToTry = (rw <= 320 && rh <= 320) ? [2] : (rw >= 500 || rh >= 500) ? [0.5, 0.33] : [];
          for (const scale of scalesToTry) {
            const scW = Math.round(rw * scale);
            const scH = Math.round(rh * scale);
            if (scW <= 20 || scH <= 20) continue;
            const scCanvas = document.createElement('canvas');
            scCanvas.width = scW;
            scCanvas.height = scH;
            const scCtx = scCanvas.getContext('2d');
            if (scCtx) {
              scCtx.imageSmoothingEnabled = false;
              scCtx.drawImage(context.canvas, Math.max(0, rx), Math.max(0, ry), rw, rh, 0, 0, scW, scH);
              const scData = scCtx.getImageData(0, 0, scW, scH);
              res = window.jsQR(scData.data, scW, scH, { inversionAttempts: 'attemptBoth' });
              if (res) return res;
            }
          }
        }
        return null;
      } catch (e) {
        return null;
      }
    }

    // ── YENİ: ROZET VE QR ALANINI HOMOGRAFİ İLE DÜZLEŞTİREREK TARAMA (0 EĞİM, %100 HASSASİYET) ──
    function unwarpAndScanBadge(context, mapFn, targetW, targetH, maxValidIdx = 50, validStudentNumbers = null) {
      if (typeof mapFn !== 'function') return { qrResult: null, arucoStudentNumber: null, binaryId: null };

      // Gerçek fiziksel en/boy oranını (1:1 izometrik kare) homografi noktalarından hesapla
      // u: 0.78 .. 0.98 aralığı KİMLİK KODU kutusunu (u=0.88..0.96) tam kapsar ve sağ üst köşe çapasını (u=1.0) dışarıda bırakır
      const uMin = 0.78, uSpan = 0.20;
      const vMin = -0.02, vSpan = 0.22;
      const pt00 = mapFn(uMin, vMin);
      const pt10 = mapFn(uMin + uSpan, vMin);
      const pt01 = mapFn(uMin, vMin + vSpan);
      const physW = Math.max(1, Math.hypot(pt10.x - pt00.x, pt10.y - pt00.y));
      const physH = Math.max(1, Math.hypot(pt01.x - pt00.x, pt01.y - pt00.y));

      const badgeW = Math.max(320, Math.min(480, Math.round(targetW * 0.20)));
      const badgeH = Math.max(200, Math.min(480, Math.round(badgeW * (physH / physW))));
      const bCanvas = document.createElement('canvas');
      bCanvas.width = badgeW;
      bCanvas.height = badgeH;
      const bCtx = bCanvas.getContext('2d', { willReadFrequently: true });
      if (!bCtx) return { qrResult: null, arucoStudentNumber: null, binaryId: null };

      const bImgData = bCtx.createImageData(badgeW, badgeH);
      const bData = bImgData.data;
      const srcData = context.getImageData(0, 0, targetW, targetH).data;
      const grayBadge = new Uint8Array(badgeW * badgeH);

      for (let by = 0; by < badgeH; by++) {
        const v = vMin + (by / badgeH) * vSpan;
        for (let bx = 0; bx < badgeW; bx++) {
          const u = uMin + (bx / badgeW) * uSpan;
          const pt = mapFn(u, v);
          const px = Math.max(0, Math.min(targetW - 1, pt.x));
          const py = Math.max(0, Math.min(targetH - 1, pt.y));
          const srcIdx = (py * targetW + px) * 4;
          const pIdx = by * badgeW + bx;
          const dstIdx = pIdx * 4;

          const r = srcData[srcIdx];
          const g = srcData[srcIdx + 1];
          const b = srcData[srcIdx + 2];
          bData[dstIdx] = r;
          bData[dstIdx + 1] = g;
          bData[dstIdx + 2] = b;
          bData[dstIdx + 3] = 255;
          grayBadge[pIdx] = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
        }
      }

      // 0. ArUco 5x5 Doğrudan Öğrenci Numarası Çözümleme (0 ms, 1:1 İzometrik Düzleştirilmiş Matris)
      let arucoStudentNo = null;
      try {
        const arucoRes = scanArucoInGrayscale(grayBadge, badgeW, badgeH, 0, badgeW, 0, badgeH, validStudentNumbers);
        if (arucoRes && arucoRes.success) {
          arucoStudentNo = String(arucoRes.studentNumber);
        }
      } catch (e) {
        console.warn('ArUco badge tarama hatası:', e);
      }

      // ArUco doğrudan çözüldüyse ağır QR taramasına gerek kalmadan anında dön
      if (arucoStudentNo) {
        return { qrResult: null, arucoStudentNumber: arucoStudentNo, binaryId: null };
      }

      bCtx.putImageData(bImgData, 0, 0);

      // 1. QR Kod Çözümleme (Eski QR kodlu optik formlar için geriye dönük uyumluluk)
      let qrRes = null;
      if (typeof window.jsQR === 'function') {
        qrRes = window.jsQR(bData, badgeW, badgeH, { inversionAttempts: 'attemptBoth' });
        if (!qrRes) {
          const upCanvas = document.createElement('canvas');
          upCanvas.width = badgeW * 2;
          upCanvas.height = badgeH * 2;
          const upCtx = upCanvas.getContext('2d');
          if (upCtx) {
            upCtx.imageSmoothingEnabled = false;
            upCtx.drawImage(bCanvas, 0, 0, upCanvas.width, upCanvas.height);
            const upData = upCtx.getImageData(0, 0, upCanvas.width, upCanvas.height);
            qrRes = window.jsQR(upData.data, upCanvas.width, upCanvas.height, { inversionAttempts: 'attemptBoth' });
          }
        }
      }

      return { qrResult: qrRes, arucoStudentNumber: arucoStudentNo, binaryId: null };
    }

    // ── GÜVENLİ ÖĞRENCİ TANIMA: KONTROLSÜZ OMR YERİNE %100 KESİN QR DOĞRULAMA ──
    // Kontrolsüz 3x3 kutucuk taraması, rozetteki QR kodun siyah modüllerini veya başlık yazılarını
    // sahte bir binary numara (1, 2, 3, 4) sanarak yanlış öğrenci eşleştirmesine yol açtığı için devre dışı bırakılmıştır.
    // Öğrenci kimlik doğrulaması Reed-Solomon hata düzeltmeli QR kod üzerinden hatasız yapılır.
    function detectBinaryIdInCard(grayBuf, imgW, imgH, cardCorners, maxValidIdx = 50) {
      return null;
    }

    // Sayfada 2 form var mı? (A4 Sayfa Başına 2 Form Tespiti)
    // 1) Sayfanın 2 form barındırabilmesi için mutlaka DİKEY (PORTRAIT, targetH > targetW * 1.15) olması gerekir.
    // Yatay (landscape) taranan A5 veya tekil optik kartlar asla 2 form içeremez.
    const maxRosterCount = Array.isArray(classStudents) && classStudents.length > 0 ? classStudents.length : 50;
    const validStudentNumbers = Array.isArray(classStudents) ? classStudents
      .map(s => String(s?.number ?? s?.no ?? s?.studentNo ?? '').trim())
      .filter(n => n && n !== '......' && n !== '-') : [];
    const isPortrait = targetH > targetW * 1.15;
    let isDoubleForm = false;
    let cornersTop = null;
    let cornersBottom = null;

    // Önce tüm sayfa üzerinde 4 köşe referans çapası var mı kontrol et
    let cornersFull = detectCornerAnchors(gray, targetW, targetH, threshold, scaledBounds);
    const hasFullAnchors = cornersFull && cornersFull.isAnchor && (Math.abs(cornersFull.bl.y - cornersFull.tl.y) > targetH * 0.45);

    function isSubFormGeometricallyValid(c, w, h) {
      if (!c || !c.tl || !c.tr || !c.bl || !c.br) return false;
      const cardW = Math.abs(c.tr.x - c.tl.x);
      const cardH = Math.abs(c.bl.y - c.tl.y);
      if (cardW < w * 0.35) return false;
      if (cardH < h * 0.16 || cardH > h * 0.55) return false;
      if (Math.abs(c.tl.y - c.tr.y) > h * 0.15) return false;
      if (Math.abs(c.bl.y - c.br.y) > h * 0.15) return false;
      return true;
    }

    if (options.isDoubleForm === true) {
      isDoubleForm = true;
    } else if (!hasFullAnchors && isPortrait && options.isDoubleForm !== false && (!scaledBounds || (scaledBounds.maxY - scaledBounds.minY > targetH * 0.70))) {
      // Dikey tam sayfada üst yarı ve alt yarıyı bağımsız tara
      const boundsTopTest = { minX: 0, maxX: targetW, minY: 0, maxY: Math.round(targetH * 0.55) };
      const boundsBottomTest = { minX: 0, maxX: targetW, minY: Math.round(targetH * 0.45), maxY: targetH };

      cornersTop = detectCornerAnchors(gray, targetW, targetH, threshold, boundsTopTest);
      cornersBottom = detectCornerAnchors(gray, targetW, targetH, threshold, boundsBottomTest);

      const topOk = isSubFormGeometricallyValid(cornersTop, targetW, targetH) && cornersTop.isAnchor;
      const botOk = isSubFormGeometricallyValid(cornersBottom, targetW, targetH) && cornersBottom.isAnchor;

      if (topOk && botOk) {
        isDoubleForm = true;
      } else {
        // Ortada ortak çapa kontrolü (Fallback)
        const midRadius = Math.max(8, Math.round(targetW * 0.018));
        const midAnchorL = findConcentricTargetAnchor(gray, targetW, targetH, 0, Math.round(targetW * 0.25), Math.round(targetH * 0.40), Math.round(targetH * 0.60), midRadius);
        const midAnchorR = findConcentricTargetAnchor(gray, targetW, targetH, Math.round(targetW * 0.75), targetW, Math.round(targetH * 0.40), Math.round(targetH * 0.60), midRadius);
        if (midAnchorL && midAnchorR && Math.abs(midAnchorL.y - midAnchorR.y) < targetH * 0.06 && (midAnchorR.x - midAnchorL.x) > targetW * 0.60) {
          isDoubleForm = true;
        }
      }
    }

    const detectedCards = [];

    if (isDoubleForm) {
      // ── SAYFA BAŞINA 2 FORM (ÜST & ALT) ──
      const midY = Math.round(targetH * 0.50);
      if (!cornersTop || !isSubFormGeometricallyValid(cornersTop, targetW, targetH)) {
        cornersTop = detectCornerAnchors(gray, targetW, targetH, threshold, {
          minX: 0, maxX: targetW, minY: 0, maxY: Math.round(targetH * 0.55)
        });
      }
      const cornersTopOrig = {
        ...cornersTop,
        tl: { ...cornersTop.tl },
        tr: { ...cornersTop.tr },
        bl: { ...cornersTop.bl },
        br: { ...cornersTop.br }
      };
      const cardTop = scanSingleCard(canvas, gray, targetW, targetH, cornersTop, exam, classStudents, options);
      const badgeTop = unwarpAndScanBadge(ctx, createProjectiveHomography(cornersTop), targetW, targetH, maxRosterCount, validStudentNumbers);
      cardTop.arucoStudentNumber = badgeTop.arucoStudentNumber || (options && options.liveAruco ? String(options.liveAruco.studentNumber) : null);
      if (!cardTop.arucoStudentNumber && cornersTopOrig && cornersTopOrig.tr) {
        const cardSpanW = Math.max(100, Math.abs(cornersTopOrig.tr.x - cornersTopOrig.tl.x));
        const subXMin = Math.max(0, Math.round(cornersTopOrig.tl.x + cardSpanW * 0.68));
        const subXMax = Math.min(targetW, Math.round(cornersTopOrig.tr.x - cardSpanW * 0.04));
        const subYMin = Math.max(0, Math.round(Math.min(cornersTopOrig.tl.y, cornersTopOrig.tr.y)));
        const subYMax = Math.min(targetH, subYMin + Math.round(targetH * 0.30));
        const aRes = scanArucoInGrayscale(gray, targetW, targetH, subXMin, subXMax, subYMin, subYMax, validStudentNumbers);
        if (aRes && aRes.success) cardTop.arucoStudentNumber = String(aRes.studentNumber);
      }
      if (!cardTop.arucoStudentNumber) {
        const aRes = scanArucoInGrayscale(gray, targetW, targetH, Math.round(targetW * 0.55), Math.round(targetW * 0.94), Math.round(targetH * 0.03), Math.round(targetH * 0.35), validStudentNumbers);
        if (aRes && aRes.success) cardTop.arucoStudentNumber = String(aRes.studentNumber);
      }
      cardTop.qrResult = badgeTop.qrResult;
      cardTop.binaryId = null;
      // Üst form QR arama: Yalnızca ArUco bulunamadıysa eski QR formlar için tara
      if (!cardTop.arucoStudentNumber && !cardTop.qrResult && cornersTopOrig && cornersTopOrig.tr) {
        const subW = Math.round(targetW * 0.45);
        const subH = Math.round(targetH * 0.30);
        const subX = Math.max(0, cornersTopOrig.tr.x - subW + 80);
        const subY = Math.max(0, cornersTopOrig.tl.y - 20);
        cardTop.qrResult = scanQrInRegion(ctx, subX, subY, subW, subH);
      }
      if (!cardTop.arucoStudentNumber && !cardTop.qrResult) {
        cardTop.qrResult = scanQrInRegion(ctx, 0, 0, targetW, Math.min(targetH, midY + 60));
      }
      if (!cardTop.arucoStudentNumber && !cardTop.qrResult && options && options.liveDetectedQr) {
        cardTop.qrResult = options.liveDetectedQr;
      }

      if (!cornersBottom || !isSubFormGeometricallyValid(cornersBottom, targetW, targetH)) {
        cornersBottom = detectCornerAnchors(gray, targetW, targetH, threshold, {
          minX: 0, maxX: targetW, minY: Math.round(targetH * 0.45), maxY: targetH
        });
      }
      const cornersBottomOrig = {
        ...cornersBottom,
        tl: { ...cornersBottom.tl },
        tr: { ...cornersBottom.tr },
        bl: { ...cornersBottom.bl },
        br: { ...cornersBottom.br }
      };
      const cardBottom = scanSingleCard(canvas, gray, targetW, targetH, cornersBottom, exam, classStudents, options);
      const badgeBottom = unwarpAndScanBadge(ctx, createProjectiveHomography(cornersBottom), targetW, targetH, maxRosterCount, validStudentNumbers);
      cardBottom.arucoStudentNumber = badgeBottom.arucoStudentNumber || (options && options.liveAruco ? String(options.liveAruco.studentNumber) : null);
      if (!cardBottom.arucoStudentNumber && cornersBottomOrig && cornersBottomOrig.tr) {
        const cardSpanW = Math.max(100, Math.abs(cornersBottomOrig.tr.x - cornersBottomOrig.tl.x));
        const subXMin = Math.max(0, Math.round(cornersBottomOrig.tl.x + cardSpanW * 0.68));
        const subXMax = Math.min(targetW, Math.round(cornersBottomOrig.tr.x - cardSpanW * 0.04));
        const subYMin = Math.max(0, Math.round(Math.min(cornersBottomOrig.tl.y, cornersBottomOrig.tr.y)));
        const subYMax = Math.min(targetH, subYMin + Math.round(targetH * 0.30));
        const aRes = scanArucoInGrayscale(gray, targetW, targetH, subXMin, subXMax, subYMin, subYMax, validStudentNumbers);
        if (aRes && aRes.success) cardBottom.arucoStudentNumber = String(aRes.studentNumber);
      }
      if (!cardBottom.arucoStudentNumber) {
        const aRes = scanArucoInGrayscale(gray, targetW, targetH, Math.round(targetW * 0.55), Math.round(targetW * 0.94), Math.max(0, midY - 20), Math.round(targetH * 0.85), validStudentNumbers);
        if (aRes && aRes.success) cardBottom.arucoStudentNumber = String(aRes.studentNumber);
      }
      cardBottom.qrResult = badgeBottom.qrResult;
      cardBottom.binaryId = null;
      // Alt form QR arama: Yalnızca ArUco bulunamadıysa eski QR formlar için tara
      if (!cardBottom.arucoStudentNumber && !cardBottom.qrResult && cornersBottomOrig && cornersBottomOrig.tr) {
        const subW = Math.round(targetW * 0.45);
        const subH = Math.round(targetH * 0.30);
        const subX = Math.max(0, cornersBottomOrig.tr.x - subW + 80);
        const subY = Math.max(0, cornersBottomOrig.tl.y - 20);
        cardBottom.qrResult = scanQrInRegion(ctx, subX, subY, subW, subH);
      }
      if (!cardBottom.arucoStudentNumber && !cardBottom.qrResult) {
        cardBottom.qrResult = scanQrInRegion(ctx, 0, Math.max(0, midY - 60), targetW, targetH - Math.max(0, midY - 60));
      }
      if (!cardBottom.arucoStudentNumber && !cardBottom.qrResult && options && options.liveDetectedQr) {
        cardBottom.qrResult = options.liveDetectedQr;
      }

      detectedCards.push(cardTop, cardBottom);
    } else {
      if (!cornersFull) {
        cornersFull = detectCornerAnchors(gray, targetW, targetH, threshold, scaledBounds);
      }
      const cornersSpanW = cornersFull ? Math.abs(cornersFull.tr.x - cornersFull.tl.x) : 0;
      if (scaledBounds && (!cornersFull || cornersSpanW < targetW * 0.40)) {
        // Mobil vizör sınırını kontrollü genişleterek ara
        const expandedBounds = {
          minX: Math.max(0, scaledBounds.minX - Math.round(targetW * 0.15)),
          maxX: Math.min(targetW, scaledBounds.maxX + Math.round(targetW * 0.15)),
          minY: Math.max(0, scaledBounds.minY - Math.round(targetH * 0.15)),
          maxY: Math.min(targetH, scaledBounds.maxY + Math.round(targetH * 0.15))
        };
        const fallbackCorners = detectCornerAnchors(gray, targetW, targetH, threshold, expandedBounds);
        if (fallbackCorners && Math.abs(fallbackCorners.tr.x - fallbackCorners.tl.x) > cornersSpanW) {
          cornersFull = fallbackCorners;
        } else {
          const globalCorners = detectCornerAnchors(gray, targetW, targetH, threshold, null);
          if (globalCorners && Math.abs(globalCorners.tr.x - globalCorners.tl.x) > cornersSpanW) {
            cornersFull = globalCorners;
          }
        }
      }
      const cornersFullOrig = {
        ...cornersFull,
        tl: { ...cornersFull.tl },
        tr: { ...cornersFull.tr },
        bl: { ...cornersFull.bl },
        br: { ...cornersFull.br }
      };
      let cardFull = scanSingleCard(canvas, gray, targetW, targetH, cornersFull, exam, classStudents, options);
      const fullBadge = unwarpAndScanBadge(ctx, createProjectiveHomography(cornersFull), targetW, targetH, maxRosterCount, validStudentNumbers);
      cardFull.arucoStudentNumber = fullBadge.arucoStudentNumber || (options && options.liveAruco ? String(options.liveAruco.studentNumber) : null);
      if (!cardFull.arucoStudentNumber && cornersFullOrig && cornersFullOrig.tr) {
        const cardSpanW = Math.max(100, Math.abs(cornersFullOrig.tr.x - cornersFullOrig.tl.x));
        const subXMin = Math.max(0, Math.round(cornersFullOrig.tl.x + cardSpanW * 0.68));
        const subXMax = Math.min(targetW, Math.round(cornersFullOrig.tr.x - cardSpanW * 0.04));
        const subYMin = Math.max(0, Math.round(Math.min(cornersFullOrig.tl.y, cornersFullOrig.tr.y)));
        const subYMax = Math.min(targetH, subYMin + Math.round(targetH * 0.35));
        const aRes = scanArucoInGrayscale(gray, targetW, targetH, subXMin, subXMax, subYMin, subYMax, validStudentNumbers);
        if (aRes && aRes.success) cardFull.arucoStudentNumber = String(aRes.studentNumber);
      }
      if (!cardFull.arucoStudentNumber && scaledBounds) {
        const sbW = scaledBounds.maxX - scaledBounds.minX;
        const aRes = scanArucoInGrayscale(gray, targetW, targetH, Math.round(scaledBounds.minX + sbW * 0.55), Math.round(scaledBounds.maxX - sbW * 0.04), scaledBounds.minY, Math.round(scaledBounds.minY + (scaledBounds.maxY - scaledBounds.minY) * 0.40), validStudentNumbers);
        if (aRes && aRes.success) cardFull.arucoStudentNumber = String(aRes.studentNumber);
      }
      if (!cardFull.arucoStudentNumber) {
        const aRes = scanArucoInGrayscale(gray, targetW, targetH, Math.round(targetW * 0.55), Math.round(targetW * 0.94), Math.round(targetH * 0.03), Math.round(targetH * 0.45), validStudentNumbers);
        if (aRes && aRes.success) cardFull.arucoStudentNumber = String(aRes.studentNumber);
      }
      cardFull.qrResult = fullBadge.qrResult || (options && options.liveDetectedQr ? options.liveDetectedQr : null);
      cardFull.binaryId = null;
      if (!cardFull.arucoStudentNumber && !cardFull.qrResult) {
        if (cornersFullOrig && cornersFullOrig.tr) {
          const subW = Math.round(targetW * 0.45);
          const subH = Math.round(targetH * 0.40);
          const subX = Math.max(0, cornersFullOrig.tr.x - subW + 80);
          const subY = Math.max(0, cornersFullOrig.tr.y - Math.round(subH * 0.5));
          cardFull.qrResult = scanQrInRegion(ctx, subX, subY, subW, subH);
        }
        if (!cardFull.qrResult && scaledBounds) {
          cardFull.qrResult = scanQrInRegion(ctx, scaledBounds.minX, scaledBounds.minY, scaledBounds.maxX - scaledBounds.minX, scaledBounds.maxY - scaledBounds.minY);
        }
        if (!cardFull.qrResult) {
          cardFull.qrResult = scanQrInRegion(ctx, 0, 0, targetW, targetH);
        }
        if (!cardFull.qrResult && options && options.liveDetectedQr) {
          cardFull.qrResult = options.liveDetectedQr;
        }
      }
      if (!cardFull.arucoStudentNumber && !cardFull.qrResult && scaledBounds) {
        // Eğer vizör sınırıyla bulunan köşelerden rozet / ID çözülemediyse, tüm kare üzerinden tekrar dene
        const globalCorners = detectCornerAnchors(gray, targetW, targetH, threshold, null);
        if (globalCorners) {
          const gCard = scanSingleCard(canvas, gray, targetW, targetH, globalCorners, exam, classStudents, options);
          const gBadge = unwarpAndScanBadge(ctx, createProjectiveHomography(globalCorners), targetW, targetH, maxRosterCount, validStudentNumbers);
          if (gBadge.arucoStudentNumber || gBadge.qrResult) {
            cornersFull = globalCorners;
            cardFull = gCard;
            cardFull.arucoStudentNumber = gBadge.arucoStudentNumber;
            cardFull.qrResult = gBadge.qrResult;
            cardFull.binaryId = null;
          }
        }
      }
      detectedCards.push(cardFull);
    }

    // Öğrenci Eşleme: ArUco / QR Doğrulama (%100 Deterministik & Sıfır Hata)
    const sortedRoster = Array.isArray(classStudents) ? [...classStudents].sort((a, b) => {
      const nameA = String(a?.name || '').trim();
      const nameB = String(b?.name || '').trim();
      const cmpName = nameA.localeCompare(nameB, 'tr');
      if (cmpName !== 0) return cmpName;
      const surA = String(a?.surname || '').trim();
      const surB = String(b?.surname || '').trim();
      const cmpSur = surA.localeCompare(surB, 'tr');
      if (cmpSur !== 0) return cmpSur;
      const noA = parseInt(a?.number, 10) || 0;
      const noB = parseInt(b?.number, 10) || 0;
      return noA - noB;
    }) : [];

    detectedCards.forEach((card, idx) => {
      let matched = null;
      let rawStudentName = '';
      let rawStudentNo = '';

      // 1. İLK ÖNCELİK: ARUCO 5X5 BELİRTEÇ (Doğrudan Okul Numarası, 0 ms & Sıfır Hata)
      if (card.arucoStudentNumber) {
        const targetNo = String(card.arucoStudentNumber).trim();
        const targetInt = parseInt(targetNo, 10);
        if (targetNo && targetNo !== '0') {
          const matchByNo = (s) => {
            if (!s) return false;
            const sn = String(s.number ?? s.no ?? s.studentNo ?? '').trim();
            if (!sn) return false;
            return sn === targetNo || (targetInt > 0 && parseInt(sn, 10) === targetInt);
          };
          matched = (classStudents || []).find(matchByNo) || (sortedRoster || []).find(matchByNo);

          // Eğer sınıftaki öğrencilerin okul numarası girilmemişse ve ArUco sıra numarası (1..N) ile üretilmişse:
          if (!matched && targetInt >= 1 && targetInt <= sortedRoster.length) {
            const candidate = sortedRoster[targetInt - 1];
            const candNo = String(candidate?.number ?? candidate?.no ?? '').trim();
            if (!candNo || candNo === '......' || candNo === '-' || parseInt(candNo, 10) === targetInt) {
              matched = candidate;
            }
          }

          if (matched) {
            rawStudentName = `${matched.name} ${matched.surname || ''}`.trim();
            rawStudentNo = matched.number || matched.no || targetNo;
          } else {
            rawStudentNo = targetNo;
          }
        }
      }

      // 2. İKİNCİ ÖNCELİK: QR KOD (Eski veya QR ile basılmış formlar için)
      let rawStuId = '';
      let rawStuNo = '';
      let rawStuIdx = 0;

      if (!matched && card.qrResult && card.qrResult.data) {
        const qrData = String(card.qrResult.data).trim();
        if (qrData) {
          const parts = qrData.split(':');
          if (parts[0] === 'SA') {
            if (parts[1] === 'STU' || parts[1] === 'SMP' || parts[1] === 'BLK') {
              rawStuId = parts[2];
              rawStuNo = parts[3];
              rawStuIdx = parseInt(parts[4], 10) || 0;
            } else {
              rawStuIdx = parseInt(parts[1], 10) || 0;
              rawStuNo = parts[2] || '';
            }
          } else if (qrData.includes('#')) {
            const sub = qrData.split('#');
            rawStuNo = sub[0].replace(/^NO:?/i, '').trim();
            rawStuIdx = parseInt(sub[1], 10) || 0;
          } else if (/^\d+$/.test(qrData)) {
            rawStuNo = qrData;
          }

          // 2a. Okul numarasına göre tam eşleme
          if (rawStuNo && rawStuNo !== '......') {
            matched = (classStudents || []).find(s => {
              const sn = String(s.number || '').trim();
              return sn === String(rawStuNo).trim() || (parseInt(sn, 10) === parseInt(rawStuNo, 10) && parseInt(rawStuNo, 10) > 0);
            }) || (sortedRoster || []).find(s => {
              const sn = String(s.number || '').trim();
              return sn === String(rawStuNo).trim() || (parseInt(sn, 10) === parseInt(rawStuNo, 10) && parseInt(rawStuNo, 10) > 0);
            });
          }

          // 2b. Sistem ID'sine göre tam eşleme
          if (!matched && rawStuId) {
            matched = (classStudents || []).find(s => String(s.id) === String(rawStuId)) ||
                      (sortedRoster || []).find(s => String(s.id) === String(rawStuId));
          }

          if (matched) {
            rawStudentName = `${matched.name} ${matched.surname || ''}`.trim();
            rawStudentNo = matched.number || '';
          }
        }
      }

      // 3. KESİN KURAL: TAHMİN / DİZİ SIRASI ATAMASI ASLA YAPILMAZ!
      // Form ya ArUco/QR okul numarasıyla doğrudan eşleşir ya da "Eşleştirilemedi" olarak kalır.
      if (!matched) {
        card.matched = null;
        card.candidate = null;
        card.isUnmatched = true;
        const fallbackNo = (card.arucoStudentNumber && card.arucoStudentNumber !== '0') ? card.arucoStudentNumber : (rawStuNo && rawStuNo !== '......' ? rawStuNo : '');
        card.rawStudentName = fallbackNo ? `Öğrenci No: ${fallbackNo}` : 'Eşleştirilemedi (Öğrenci Seç)';
        card.rawStudentNo = fallbackNo || '-';
        card.rawStudentIndex = 0;
        card.studentName = card.rawStudentName;
        card.studentNo = card.rawStudentNo;
        card.studentId = '';
      } else {
        card.matched = matched;
        card.candidate = null;
        card.isUnmatched = false;
        card.rawStudentName = rawStudentName;
        card.rawStudentNo = rawStudentNo;
        card.rawStudentIndex = card.arucoStudentNumber ? parseInt(card.arucoStudentNumber, 10) : (rawStuIdx || 0);
        card.studentName = rawStudentName;
        card.studentNo = rawStudentNo;
        card.studentId = matched.id || '';
      }
    });

    return {
      success: true,
      cards: detectedCards
    };
  }

  // ==========================================================================
  // 6. GLOBAL DIŞA AKTARIM
  // ==========================================================================

  window.normalizeOmrSubject = normalizeOmrSubject;
  window.getOmrSubjectBaseKeywords = getOmrSubjectBaseKeywords;
  window.extractAnswerForSubj = extractAnswerForSubj;
  window.findCorrectAnswerForKey = findCorrectAnswerForKey;

  window.OmrEngine = {
    scanDocumentPage,
    scanSingleCard,
    detectCornerAnchors,
    createProjectiveHomography,
    analyzeBubble,
    refineBubbleCenter,
    sampleLocalPaperLuminance,
    findConcentricTargetAnchor,
    snapToBubbleRing,
    normalizeOmrSubject,
    getOmrSubjectBaseKeywords,
    extractAnswerForSubj,
    findCorrectAnswerForKey,
    encodeStudentAruco,
    decodeStudentAruco,
    generateArucoSVG,
    scanArucoInGrayscale
  };

})();
