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
            candidateScore = Math.max(candidateScore, (c1 * 0.5) + (c2 * 0.5));
          }
        }

        if (coreCountCi > 0 && ringCountCi > 0 && outerCountCi > 0) {
          const coreLum = coreSumCi / coreCountCi;
          const ringLum = ringSumCi / ringCountCi;
          const outerLum = outerSumCi / outerCountCi;
          const c1 = ringLum - coreLum;
          const c2 = ringLum - outerLum;
          if (c1 > 20 && c2 > 10) {
            candidateScore = Math.max(candidateScore, (c1 * 0.6) + (c2 * 0.4));
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
    const qW = Math.round(subW * 0.24);
    const qH = Math.round(subH * 0.28);
    const rOpt = Math.round(subW * 0.013);
    const scalesToTry = [8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, rOpt].filter((v, i, a) => v >= 7 && a.indexOf(v) === i);

    function findBestConcentricInQuad(x1, x2, y1, y2, type) {
      let best = null;
      let bestMetric = (type === 'tl' || type === 'bl') ? 999999 : -999999;
      for (const r of scalesToTry) {
        const cand = findConcentricTargetAnchor(gray, w, h, x1, x2, y1, y2, r);
        if (cand && cand.score >= 28) {
          let metric = 0;
          if (type === 'tl') metric = cand.x + cand.y;
          else if (type === 'tr') metric = cand.x - cand.y;
          else if (type === 'bl') metric = cand.x - cand.y;
          else if (type === 'br') metric = cand.x + cand.y;

          if (type === 'tl' || type === 'bl') {
            if (metric < bestMetric) {
              bestMetric = metric;
              best = cand;
            }
          } else {
            if (metric > bestMetric) {
              bestMetric = metric;
              best = cand;
            }
          }
        }
      }
      return best;
    }

    let tlFound = findBestConcentricInQuad(minX, minX + qW, minY, minY + qH, 'tl');
    // TR ve BR için x >= subW * 0.86 sınırı OMR ID / QR rozet kutusunun (x <= 0.84) çapa sanılmasını %100 engeller!
    let trFound = findBestConcentricInQuad(Math.max(minX + Math.round(subW * 0.86), maxX - qW), maxX, minY, minY + qH, 'tr');
    let brFound = findBestConcentricInQuad(Math.max(minX + Math.round(subW * 0.86), maxX - qW), maxX, Math.max(minY + Math.round(subH * 0.70), maxY - qH), maxY, 'br');
    let blFound = findBestConcentricInQuad(minX, minX + qW, Math.max(minY + Math.round(subH * 0.70), maxY - qH), maxY, 'bl');

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
    // Çember kenar çizgilerini değil, sadece baloncuğun iç kurşun kalem çekirdeğini örnekle
    const rInner = Math.max(2, Math.round(radius * 0.45));
    const rInner2 = rInner * rInner;

    // 1. Baloncuğun tam geometrik merkez çekirdeği (3x3 piksel)
    // Gerçek bir kurşun kalem işaretlemesinde merkez doludur.
    // Eğer merkez çekirdeği bembeyaz ise, rInner kenarındaki koyuluk sadece tablo çizgisi veya çember çizgisidir!
    let coreSumLum = 0;
    let corePixels = 0;
    for (let cdy = -1; cdy <= 1; cdy++) {
      const cpy = cy + cdy;
      if (cpy < 0 || cpy >= h) continue;
      for (let cdx = -1; cdx <= 1; cdx++) {
        const cpx = cx + cdx;
        if (cpx < 0 || cpx >= w) continue;
        coreSumLum += gray[cpy * w + cpx];
        corePixels++;
      }
    }
    const meanCoreLum = corePixels > 0 ? (coreSumLum / corePixels) : rowPaperLum;
    const coreDarkness = Math.max(0, (rowPaperLum - meanCoreLum) / Math.max(1, rowPaperLum));

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

    let darkCount = 0;
    let sumDark = 0;
    for (let i = 0; i < totalPixels; i++) {
      const v = darknessValues[i];
      sumDark += v;
      if (v >= 0.28) darkCount++;
    }

    let fillRatio = darkCount / totalPixels;
    let meanDarkness = sumDark / totalPixels;

    // Merkez çekirdek beyazlık koruması:
    // Eğer baloncuğun merkezi kağıt beyazı ise (coreDarkness < 0.12), kenardan sızan çizgiye rağmen bu baloncuk boştur!
    if (coreDarkness < 0.12) {
      medianDarkness = Math.min(medianDarkness, 0.05);
      fillRatio = Math.min(fillRatio, 0.15);
      meanDarkness = Math.min(meanDarkness, 0.15);
    }

    let score = (medianDarkness * 0.35) + (meanDarkness * 0.35) + (fillRatio * 0.30);
    if (coreDarkness < 0.12) {
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

    // Dolu baloncuk ise (merkez koyu, dışı açık)
    if (cVal < 140 && avgOut > cVal + 25) {
      return 1.5;
    }
    // Boş baloncuk halkası ise (merkez açık, halka koyu, dışı açık)
    const ringDrop1 = cVal - avgRing;
    const ringDrop2 = avgOut - avgRing;
    if (ringDrop1 > 12 && ringDrop2 > 12) {
      return Math.min(1.2, (ringDrop1 + ringDrop2) / 45.0);
    }
    return 0.0;
  }

  function snapToBubbleRing(gray, w, h, initialPt, radius) {
    // Merkezin komşu dikey tablo çizgilerine taşmasını önlemek için dengeli arama penceresi
    const searchRx = Math.max(5, Math.min(10, Math.round(radius * 0.75)));
    const searchRy = Math.max(6, Math.min(14, Math.round(radius * 1.05)));
    const rRing = Math.max(8, Math.round(radius * 0.95));
    const rOuter = Math.max(12, Math.round(radius * 1.45));

    const angles = [0, 0.785398, 1.570796, 2.356194, 3.141593, 3.926991, 4.712389, 5.497787];
    const ringCos = angles.map(a => Math.round(rRing * Math.cos(a)));
    const ringSin = angles.map(a => Math.round(rRing * Math.sin(a)));
    const outerCos = angles.map(a => Math.round(rOuter * Math.cos(a)));
    const outerSin = angles.map(a => Math.round(rOuter * Math.sin(a)));

    let bestX = initialPt.x;
    let bestY = initialPt.y;
    let bestScore = -1e9;

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

          if (rx >= 0 && rx < w && ry >= 0 && ry < h) {
            ringDark += (255 - gray[ry * w + rx]);
          }
          if (ox >= 0 && ox < w && oy >= 0 && oy < h) {
            outerWhite += gray[oy * w + ox];
          }
        }

        // Başlangıç noktasından uzaklaşma cezası: Komşu çizgilere sıçramayı engelle
        const dist = Math.hypot(dx, dy);
        const score = ringDark + outerWhite * 0.4 - dist * 4;
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
    const allExams = Array.isArray(options.allExams) ? options.allExams : [];

    // Fiziksel Form Geometrisi ve Kolon Düzeni Tespiti:
    // Çoklu dersli (4 veya 5 sütunlu) formlarda u ≈ 0.2835 (2. Ders / Matematik) ve u ≈ 0.4745 (3. Ders)
    // dikey şeritlerinde soru kutusu, tablo çizgisi ve baloncuk daireleri yer alır.
    // Tek dersli 20 soruluk formlarda ise u = 0.0881 ile u = 0.5626 arasında u ≈ 0.28 bölgesi tamamen BOŞ BEYAZ KAĞITTIR.
    if (allExams.length > 0) {
      let darkCol2 = 0;
      let totalSamplesCol2 = 0;
      for (let v = 0.45; v <= 0.75; v += 0.02) {
        for (let du = -0.012; du <= 0.012; du += 0.004) {
          const pt = mapPoint(0.2835 + du, v);
          if (pt.x >= 0 && pt.x < w && pt.y >= 0 && pt.y < h) {
            totalSamplesCol2++;
            if (gray[pt.y * w + pt.x] < 165) darkCol2++;
          }
        }
      }
      const ratioCol2 = totalSamplesCol2 > 0 ? (darkCol2 / totalSamplesCol2) : 0;
      const isPhysicalMulti = ratioCol2 >= 0.045;

      if (!effectiveExam.isMultiSubject && isPhysicalMulti) {
        // Fiziksel kağıt çoklu ders ama seçili sınav tek ders: allExams içinden çoklu dersli sınavı bul
        const candidate = allExams.find(e => e.isMultiSubject && Array.isArray(e.subjects) && e.subjects.length > 0);
        if (candidate) {
          console.log(`[OMR Engine] Fiziksel form çoklu ders olarak algılandı. '${effectiveExam.examName}' -> '${candidate.examName}' sınavına otomatik geçildi.`);
          effectiveExam = candidate;
          autoSwitchedExam = candidate;
        }
      } else if (effectiveExam.isMultiSubject && !isPhysicalMulti && ratioCol2 < 0.015) {
        // Fiziksel kağıt tek ders ama seçili sınav çoklu ders: tek dersli sınava geç
        const candidate = allExams.find(e => !e.isMultiSubject);
        if (candidate) {
          console.log(`[OMR Engine] Fiziksel form tek ders olarak algılandı. '${effectiveExam.examName}' -> '${candidate.examName}' sınavına otomatik geçildi.`);
          effectiveExam = candidate;
          autoSwitchedExam = candidate;
        }
      }
    }

    const isMulti = effectiveExam && !!effectiveExam.isMultiSubject && Array.isArray(effectiveExam.subjects) && effectiveExam.subjects.length > 0;
    const examSubjects = isMulti ? effectiveExam.subjects : [];
    const qCount = parseInt(effectiveExam.totalQuestions, 10) || (isMulti ? examSubjects.reduce((acc, s) => acc + (parseInt(s.questionCount, 10) || 0), 0) : 20);
    const choicesCount = parseInt(effectiveExam.choicesCount, 10) || 4;
    const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, choicesCount);
    const answerKey = effectiveExam.answerKey || {};
    const penaltyRate = effectiveExam.wrongAffects ? (parseFloat(effectiveExam.penaltyRate) || 4) : 0;

    // Kağıt Formatı (1: A4 Tam Boy, 2: A5 Kesilmiş Yarım Boy, 4: A6 Kesilmiş Çeyrek Boy)
    const perPage = parseInt(options.perPage || effectiveExam.perPage, 10) || 2;

    const isAnchor = !!corners.isAnchor;
    const isMobile = !isAnchor && (!!options.isMobileCamera || !!options.bounds);
    const minScore = options.minScore || 0.17;
    const minFill = options.minFill || 0.25;

    const detectedAnswers = {};
    const questionDetails = [];
    let correctCount = 0;
    let wrongCount = 0;
    let blankCount = 0;
    let subjectBreakdown = null;

    if (isMulti) {
      // ── ÇOKLU DERS (BRANŞLI DENEME) MOTORU ──
      // Projeksiyon Homografisi (Paul Heckbert) ile Perspektif & Eğim Bağışıklığı
      subjectBreakdown = {};
      const numSubjects = examSubjects.length;
      let cumulativeOffset = 0;

      // Kartın geometrik koordinatları (0.0 - 1.0 aralığı, 4 referans çapa merkezli)
      const gridUStart = 0.025;
      const gridUEnd = 0.975;
      const totalGridW = gridUEnd - gridUStart;
      const slotW = totalGridW / numSubjects;

      // 2. Çoklu ders gövde dikey aralığı (0.0 - 1.0 aralığı, 4 referans çapa merkezli)
      // Üst başlık (Sınav adı, öğrenci adı, QR rozeti) 0.00 - 0.28 aralığını kaplar.
      // Soru satırları 1. satırdan başlayarak flex-start düzeninde aşağıya doğru yerleşir.
      const maxQuestions = Math.max(...examSubjects.map(s => parseInt(s.questionCount, 10) || 0), 1);

      let vFirstRowBase = 0.2400;
      let vLastRow = 0.8430;
      let vStandardStep = (0.8430 - 0.2400) / (Math.max(8, maxQuestions) - 1); // 8 sorulu A5 formda ~0.0861, 10 soruluda ~0.0670

      if (perPage === 1) {
        // A4 Tam Sayfa
        vFirstRowBase = 0.2000;
        vLastRow = 0.9400;
        vStandardStep = (0.9400 - 0.2000) / (Math.max(12, maxQuestions) - 1);
      } else if (perPage === 4) {
        // A6 Çeyrek Sayfa
        vFirstRowBase = 0.2600;
        vLastRow = 0.8800;
        vStandardStep = (0.8800 - 0.2600) / (Math.max(6, maxQuestions) - 1);
      }

      const availH = vLastRow - vFirstRowBase;
      const vCompactStep = maxQuestions > 1
        ? (availH / (Math.max(8, maxQuestions) - 1))
        : vStandardStep;

      // 3. Ders sütunu içindeki şıkların yayılımı (A - B - C - D)
      examSubjects.forEach((subj, sIdx) => {
        let subjCorrect = 0;
        let subjWrong = 0;
        let subjBlank = 0;

        const numQuestions = parseInt(subj.questionCount, 10) || 6;

        // Sütun yatay hizalaması (Ders sayısına göre deterministik matris - tüm modlarda birleşik)
        let colU_A, choiceStep;
        if (numSubjects === 5) {
          const colBounds = [
            { uA: 0.0740, uD: 0.1700 }, // 1. Ders (Türkçe)
            { uA: 0.2660, uD: 0.3620 }, // 2. Ders (Matematik)
            { uA: 0.4580, uD: 0.5540 }, // 3. Ders (Sosyal Bilgiler)
            { uA: 0.6500, uD: 0.7460 }, // 4. Ders (Fen Bilgisi)
            { uA: 0.8420, uD: 0.9380 }  // 5. Ders (İngilizce)
          ];
          const cb = colBounds[sIdx] || { uA: 0.0740 + sIdx * 0.192, uD: 0.1700 + sIdx * 0.192 };
          colU_A = cb.uA;
          choiceStep = letters.length > 1 ? ((cb.uD - cb.uA) / (letters.length - 1)) : 0.0320;
        } else if (numSubjects === 4) {
          const colBounds = [
            { uA: 0.0820, uD: 0.1780 },
            { uA: 0.3220, uD: 0.4180 },
            { uA: 0.5620, uD: 0.6580 },
            { uA: 0.8020, uD: 0.8980 }
          ];
          const cb = colBounds[sIdx] || { uA: 0.0820 + sIdx * 0.240, uD: 0.1780 + sIdx * 0.240 };
          colU_A = cb.uA;
          choiceStep = letters.length > 1 ? ((cb.uD - cb.uA) / (letters.length - 1)) : 0.0320;
        } else if (numSubjects === 3) {
          const colBounds = [
            { uA: 0.0950, uD: 0.1910 },
            { uA: 0.4100, uD: 0.5060 },
            { uA: 0.7250, uD: 0.8210 }
          ];
          const cb = colBounds[sIdx] || { uA: 0.0950 + sIdx * 0.315, uD: 0.1910 + sIdx * 0.315 };
          colU_A = cb.uA;
          choiceStep = letters.length > 1 ? ((cb.uD - cb.uA) / (letters.length - 1)) : 0.0320;
        } else if (numSubjects === 2) {
          const colBounds = [
            { uA: 0.1200, uD: 0.2160 },
            { uA: 0.5900, uD: 0.6860 }
          ];
          const cb = colBounds[sIdx] || { uA: 0.1200 + sIdx * 0.470, uD: 0.2160 + sIdx * 0.470 };
          colU_A = cb.uA;
          choiceStep = letters.length > 1 ? ((cb.uD - cb.uA) / (letters.length - 1)) : 0.0320;
        } else if (numSubjects === 6) {
          const colBounds = [
            { uA: 0.0620, uD: 0.1580 },
            { uA: 0.2200, uD: 0.3160 },
            { uA: 0.3780, uD: 0.4740 },
            { uA: 0.5360, uD: 0.6320 },
            { uA: 0.6940, uD: 0.7900 },
            { uA: 0.8520, uD: 0.9480 }
          ];
          const cb = colBounds[sIdx] || { uA: 0.0620 + sIdx * 0.158, uD: 0.1580 + sIdx * 0.158 };
          colU_A = cb.uA;
          choiceStep = letters.length > 1 ? ((cb.uD - cb.uA) / (letters.length - 1)) : 0.0320;
        } else {
          const colW = (0.955 - (numSubjects - 1) * 0.012) / numSubjects;
          const colStep = colW + 0.012;
          const colStartU = 0.020 + sIdx * colStep;
          colU_A = colStartU + 0.050;
          choiceStep = 0.0307;
        }

        function evaluateSubjectGrid(step, vFirst, du = 0) {
          const qResults = [];
          let gridConfidence = 0;

          for (let q = 1; q <= numQuestions; q++) {
            const rowV = numQuestions > 1 ? (vFirst + (q - 1) * step) : ((vFirst + vLastRow) * 0.5);
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

        // Farklı yazıcı marjları, ölçekleme ve flex-start / space-between formlar için adaptif arama
        const candidateGrids = [];

        // 1. Ana flex-start ızgarası, mikro dikey/yatay kaydırmalar (dv, du) ve adımlama ölçekleri (scale)
        const candidateVFirstOffsets = [0.000, -0.006, 0.006, -0.012, 0.012];
        const candidateStepScales = [1.00, 0.97, 1.03, 0.94, 1.06];
        const candidateDu = [0.000, -0.004, 0.004];

        candidateStepScales.forEach(scale => {
          const testStep = vCompactStep * scale;
          candidateVFirstOffsets.forEach(dv => {
            candidateDu.forEach(du => {
              candidateGrids.push({ step: testStep, vFirst: vFirstRowBase + dv, du });
            });
          });
        });

        // 2. 1.0.69 geriye dönük uyumluluk (space-between) adayı (Sadece kartı dolduran 10+ soru varsa)
        if (numQuestions >= 10) {
          const legacyStep = availH / (numQuestions - 1);
          if (Math.abs(legacyStep - vCompactStep) > 0.008) {
            candidateGrids.push({ step: legacyStep, vFirst: vFirstRowBase, du: 0 });
            candidateGrids.push({ step: legacyStep, vFirst: vFirstRowBase - 0.008, du: 0 });
            candidateGrids.push({ step: legacyStep, vFirst: vFirstRowBase + 0.008, du: 0 });
          }
        }

        let bestSubjGrid = null;
        for (const cand of candidateGrids) {
          const evaluated = evaluateSubjectGrid(cand.step, cand.vFirst, cand.du || 0);
          if (!bestSubjGrid || evaluated.gridConfidence > bestSubjGrid.gridConfidence) {
            bestSubjGrid = evaluated;
          }
        }

        bestSubjGrid.qResults.forEach(qr => {
          const q = qr.q;
          const key = `${subj.id}_${q}`;
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

          const totalSubjs = (exam && Array.isArray(exam.subjects)) ? exam.subjects.length : 1;
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
          questionDetails.push(qd);
        });

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

        cumulativeOffset += subj.questionCount;
      });

    } else {
      // ── TEK DERS MOTORU ──
      const cols = qCount <= 15 ? 1 : (qCount <= 30 ? 2 : 3);
      const questionsPerCol = Math.ceil(qCount / cols);

      for (let c = 0; c < cols; c++) {
        const startQ = c * questionsPerCol + 1;
        const endQ = Math.min((c + 1) * questionsPerCol, qCount);

        let colChoiceStartU, uChoiceStep;
        if (cols === 2) {
          colChoiceStartU = c === 0 ? 0.0881 : 0.5626;
          uChoiceStep = 0.0304;
        } else if (cols === 1) {
          colChoiceStartU = 0.3550;
          uChoiceStep = 0.0304;
        } else {
          colChoiceStartU = 0.055 + c * 0.330;
          uChoiceStep = 0.0240;
        }

        let actualRowStep = 0.0453;
        let vMid = 0.569;

        if (perPage === 1) {
          vMid = 0.550;
          actualRowStep = 0.0240;
        } else if (perPage === 4) {
          vMid = 0.575;
          actualRowStep = 0.0453;
        }

        // Çok fazla soru varsa (örn. 30 soru) dikey taşmayı önle
        const maxColH = 0.74;
        if ((questionsPerCol - 1) * actualRowStep > maxColH) {
          actualRowStep = maxColH / Math.max(1, questionsPerCol - 1);
        }

        const firstRowCenter = vMid - ((questionsPerCol - 1) / 2) * actualRowStep;

        for (let q = startQ; q <= endQ; q++) {
          const rowIdx = q - startQ;
          const rowV = firstRowCenter + rowIdx * actualRowStep;

          const rowSamplePt = mapPoint(colChoiceStartU, rowV);
          const rowPaperLum = sampleLocalPaperLuminance(gray, w, h, rowSamplePt, sampleRadius);
          const darkThresh = Math.min(145, Math.round(rowPaperLum * 0.65));

          const choiceScores = [];
          for (let lIdx = 0; lIdx < letters.length; lIdx++) {
            const choiceU = colChoiceStartU + lIdx * uChoiceStep;
            const initialPt = mapPoint(choiceU, rowV);

            let snappedPt;
            if (isAnchor || isMobile) {
              snappedPt = snapToBubbleRing(gray, w, h, initialPt, sampleRadius);
            } else {
              const searchR = Math.max(5, Math.round(sampleRadius * 1.1));
              snappedPt = refineBubbleCenter(gray, w, h, initialPt, sampleRadius, rowPaperLum, searchR, searchR);
            }

            // Halka merkezine oturduktan sonra doluluk oranını ölç
            let maxDarkPix = 0;
            let bestTotalPix = 0;
            let bestPt = snappedPt;

            for (let sOffY = -1; sOffY <= 1; sOffY += 1) {
              for (let sOffX = -1; sOffX <= 1; sOffX += 1) {
                let dCount = 0, tCount = 0;
                for (let dy = -sampleRadius; dy <= sampleRadius; dy++) {
                  for (let dx = -sampleRadius; dx <= sampleRadius; dx++) {
                    if (dx * dx + dy * dy <= sampleRadius * sampleRadius) {
                      tCount++;
                      const px = snappedPt.x + sOffX + dx;
                      const py = snappedPt.y + sOffY + dy;
                      if (px >= 0 && px < w && py >= 0 && py < h) {
                        if (gray[py * w + px] < darkThresh) dCount++;
                      }
                    }
                  }
                }
                if (dCount > maxDarkPix) {
                  maxDarkPix = dCount;
                  bestTotalPix = tCount;
                  bestPt = { x: snappedPt.x + sOffX, y: snappedPt.y + sOffY };
                }
              }
            }

            const fillRatio = bestTotalPix > 0 ? (maxDarkPix / bestTotalPix) : 0;
            choiceScores.push({
              letter: letters[lIdx],
              score: fillRatio,
              fillRatio: fillRatio,
              pt: bestPt
            });
          }

          choiceScores.sort((a, b) => b.score - a.score);
          const best = choiceScores[0];
          const second = choiceScores[1] || { score: 0, fillRatio: 0 };
          const diff = best.score - second.score;

          let markedLetter = '';
          let status = 'blank';

          const isFilled = (best.score >= 0.42 && diff >= 0.15) || (best.score >= 0.55);
          const isMultiple = isFilled && (second.score >= 0.42) && (diff < 0.12);

          if (isMultiple) {
            status = 'multiple';
            markedLetter = '';
          } else if (isFilled) {
            status = 'marked';
            markedLetter = best.letter;
          }

          const correctAns = String(answerKey[q] || answerKey[String(q)] || '').trim().toUpperCase();
          const qd = {
            q,
            marked: markedLetter,
            status,
            keyAnswer: correctAns,
            scores: choiceScores
          };

          if (!qd.marked) {
            blankCount++;
            qd.isCorrect = false;
            qd.isBlank = true;
          } else if (correctAns && qd.marked === correctAns) {
            correctCount++;
            qd.isCorrect = true;
            qd.isBlank = false;
          } else {
            wrongCount++;
            qd.isCorrect = false;
            qd.isBlank = false;
          }

          detectedAnswers[q] = markedLetter;
          questionDetails.push(qd);
        }
      }
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
    function unwarpAndScanBadge(context, mapFn, targetW, targetH, maxValidIdx = 50) {
      if (typeof mapFn !== 'function') return { qrResult: null, binaryId: null };

      const badgeW = 360;
      const badgeH = 200;
      const bCanvas = document.createElement('canvas');
      bCanvas.width = badgeW;
      bCanvas.height = badgeH;
      const bCtx = bCanvas.getContext('2d', { willReadFrequently: true });
      if (!bCtx) return { qrResult: null, binaryId: null };

      const bImgData = bCtx.createImageData(badgeW, badgeH);
      const bData = bImgData.data;
      const srcData = context.getImageData(0, 0, targetW, targetH).data;

      for (let by = 0; by < badgeH; by++) {
        const v = 0.03 + (by / badgeH) * 0.32;
        for (let bx = 0; bx < badgeW; bx++) {
          const u = 0.70 + (bx / badgeW) * 0.28;
          const pt = mapFn(u, v);
          const px = Math.max(0, Math.min(targetW - 1, pt.x));
          const py = Math.max(0, Math.min(targetH - 1, pt.y));
          const srcIdx = (py * targetW + px) * 4;
          const dstIdx = (by * badgeW + bx) * 4;

          bData[dstIdx] = srcData[srcIdx];
          bData[dstIdx + 1] = srcData[srcIdx + 1];
          bData[dstIdx + 2] = srcData[srcIdx + 2];
          bData[dstIdx + 3] = 255;
        }
      }

      bCtx.putImageData(bImgData, 0, 0);

      // 1. QR Kod Çözümleme (Düzeltilmiş, Eğimden Arındırılmış Rozet)
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

        // Sağ yarıdaki Micro-QR kodunu ayrıca odaklanarak tara
        if (!qrRes) {
          const qrW = Math.round(badgeW * 0.55);
          const qrH = badgeH;
          const qrCanvas = document.createElement('canvas');
          qrCanvas.width = qrW;
          qrCanvas.height = qrH;
          const qrCtx = qrCanvas.getContext('2d');
          if (qrCtx) {
            qrCtx.drawImage(bCanvas, badgeW - qrW, 0, qrW, qrH, 0, 0, qrW, qrH);
            const qrData = qrCtx.getImageData(0, 0, qrW, qrH);
            qrRes = window.jsQR(qrData.data, qrW, qrH, { inversionAttempts: 'attemptBoth' });
            if (!qrRes) {
              const upQr = document.createElement('canvas');
              upQr.width = qrW * 2;
              upQr.height = qrH * 2;
              const upCtx = upQr.getContext('2d');
              if (upCtx) {
                upCtx.imageSmoothingEnabled = false;
                upCtx.drawImage(qrCanvas, 0, 0, upQr.width, upQr.height);
                const upData = upCtx.getImageData(0, 0, upQr.width, upQr.height);
                qrRes = window.jsQR(upData.data, upQr.width, upQr.height, { inversionAttempts: 'attemptBoth' });
              }
            }
          }
        }

        // 4 Köşe Çapalı kart formatında sağ üst köşe QR arama (u: 0.78-0.99, v: 0.01-0.20)
        if (!qrRes) {
          const trW = 200;
          const trH = 150;
          const trCanvas = document.createElement('canvas');
          trCanvas.width = trW;
          trCanvas.height = trH;
          const trCtx = trCanvas.getContext('2d', { willReadFrequently: true });
          if (trCtx) {
            const trImgData = trCtx.createImageData(trW, trH);
            const trData = trImgData.data;
            for (let ty = 0; ty < trH; ty++) {
              const v = 0.01 + (ty / trH) * 0.19;
              for (let tx = 0; tx < trW; tx++) {
                const u = 0.78 + (tx / trW) * 0.21;
                const pt = mapFn(u, v);
                const px = Math.max(0, Math.min(targetW - 1, pt.x));
                const py = Math.max(0, Math.min(targetH - 1, pt.y));
                const srcIdx = (py * targetW + px) * 4;
                const dstIdx = (ty * trW + tx) * 4;
                trData[dstIdx] = srcData[srcIdx];
                trData[dstIdx + 1] = srcData[srcIdx + 1];
                trData[dstIdx + 2] = srcData[srcIdx + 2];
                trData[dstIdx + 3] = 255;
              }
            }
            qrRes = window.jsQR(trData, trW, trH, { inversionAttempts: 'attemptBoth' });
            if (!qrRes) {
              const upCanvas = document.createElement('canvas');
              upCanvas.width = trW * 2;
              upCanvas.height = trH * 2;
              const upCtx = upCanvas.getContext('2d');
              if (upCtx) {
                upCtx.imageSmoothingEnabled = false;
                trCtx.putImageData(trImgData, 0, 0);
                upCtx.drawImage(trCanvas, 0, 0, upCanvas.width, upCanvas.height);
                const upData = upCtx.getImageData(0, 0, upCanvas.width, upCanvas.height);
                qrRes = window.jsQR(upData.data, upCanvas.width, upCanvas.height, { inversionAttempts: 'attemptBoth' });
              }
            }
          }
        }
      }

      // 2. 9-Bit Binary OMR Matrisi (3x3 kutucuk)
      let binaryId = null;
      let bestContrast = 0;
      const effectiveMaxIdx = (maxValidIdx && maxValidIdx > 0) ? maxValidIdx : 50;
      const bGray = new Uint8Array(badgeW * badgeH);
      for (let i = 0, p = 0; i < bData.length; i += 4, p++) {
        bGray[p] = (bData[i] * 77 + bData[i + 1] * 150 + bData[i + 2] * 29) >> 8;
      }

      for (let side = 40; side <= 120; side += 4) {
        for (let y = 10; y <= badgeH - side - 5; y += 4) {
          for (let x = 5; x <= Math.round(badgeW * 0.60) - side; x += 4) {
            const cw = side / 3.0;
            const ch = side / 3.0;
            const sR = Math.max(1, Math.round(cw * 0.18));
            const cells = [];

            for (let r = 0; r < 3; r++) {
              for (let c = 0; c < 3; c++) {
                const cx = Math.round(x + (c + 0.5) * cw);
                const cy = Math.round(y + (r + 0.5) * ch);
                let sum = 0, cnt = 0;
                for (let ddy = -sR; ddy <= sR; ddy++) {
                  for (let ddx = -sR; ddx <= sR; ddx++) {
                    const px = cx + ddx;
                    const py = cy + ddy;
                    if (px >= 0 && px < badgeW && py >= 0 && py < badgeH) {
                      sum += bGray[py * badgeW + px];
                      cnt++;
                    }
                  }
                }
                cells.push(cnt > 0 ? (sum / cnt) : 255);
              }
            }

            const minL = Math.min(...cells);
            const maxL = Math.max(...cells);
            const contrast = maxL - minL;
            if (contrast >= 40 && contrast > bestContrast) {
              const thresh = (minL + maxL) * 0.5;
              let decoded = 0;
              for (let i = 0; i < 9; i++) {
                if (cells[i] < thresh) decoded |= (1 << i);
              }
              if (decoded > 0 && decoded <= effectiveMaxIdx) {
                bestContrast = contrast;
                binaryId = decoded;
              }
            }
          }
        }
      }

      return { qrResult: qrRes, binaryId: binaryId };
    }

    // ── YENİ: OPTİK BINARY ID DEDEKTÖRÜ (BÜYÜK 3x3 OMR MATRİSİ - 9 BİT / 512 ÖĞRENCİ) ──
    // Ortaöğretim ve kalabalık kademeler için 511 öğrenciye kadar tam kapasite destekler.
    // Kart başlığında (0.65 - 0.98 U, -0.03 - 0.25 V) 3x3 kutucuk rozetini dinamik tespit eder.
    function detectBinaryIdInCard(grayBuf, imgW, imgH, cardCorners, maxValidIdx = 50) {
      if (!cardCorners || !cardCorners.tl || !cardCorners.tr || !cardCorners.bl) return null;
      const effectiveMaxIdx = (maxValidIdx && maxValidIdx > 0) ? maxValidIdx : 50;

      // 1. Homografi ile doğrudan kalibre edilmiş 3x3 OMR bölgesi örneği
      if (typeof createProjectiveHomography === 'function') {
        const mapFn = createProjectiveHomography(cardCorners);
        const uStart = 0.810, uEnd = 0.880;
        const vStart = 0.045, vEnd = 0.160;
        let bestDirectDecoded = null, bestDirectContrast = 0;

        for (let dv = -0.015; dv <= 0.025; dv += 0.003) {
          for (let du = -0.020; du <= 0.020; du += 0.003) {
            const curU0 = uStart + du, curU1 = uEnd + du;
            const curV0 = vStart + dv, curV1 = vEnd + dv;
            const cw = (curU1 - curU0) / 3;
            const ch = (curV1 - curV0) / 3;
            const cells = [];

            for (let r = 0; r < 3; r++) {
              for (let c = 0; c < 3; c++) {
                const pt = mapFn(curU0 + (c + 0.5) * cw, curV0 + (r + 0.5) * ch);
                let sum = 0, count = 0;
                for (let dy = -2; dy <= 2; dy++) {
                  for (let dx = -2; dx <= 2; dx++) {
                    const px = pt.x + dx, py = pt.y + dy;
                    if (px >= 0 && px < imgW && py >= 0 && py < imgH) {
                      sum += grayBuf[py * imgW + px];
                      count++;
                    }
                  }
                }
                cells.push(count > 0 ? (sum / count) : 255);
              }
            }
            const minL = Math.min(...cells);
            const maxL = Math.max(...cells);
            const contrast = maxL - minL;
            if (contrast > 60 && contrast > bestDirectContrast) {
              const thresh = (minL + maxL) * 0.5;
              let dec = 0;
              for (let i = 0; i < 9; i++) {
                if (cells[i] < thresh) dec |= (1 << i);
              }
              if (dec > 0 && dec <= effectiveMaxIdx) {
                bestDirectContrast = contrast;
                bestDirectDecoded = dec;
              }
            }
          }
        }
        if (bestDirectDecoded) return bestDirectDecoded;
      }

      const cardW = Math.hypot(cardCorners.tr.x - cardCorners.tl.x, cardCorners.tr.y - cardCorners.tl.y);
      const cardH = Math.hypot(cardCorners.bl.x - cardCorners.tl.x, cardCorners.bl.y - cardCorners.tl.y);
      if (cardW < 50 || cardH < 50) return null;

      // 3x3 OMR matrisi başlık bölgesinde, sağ çeyrekte (0.65 - 0.98 U) ve üst kısımda (-0.03 - 0.25 V) bulunur
      const minX = Math.max(0, Math.round(cardCorners.tl.x + cardW * 0.65));
      const maxX = Math.min(imgW - 1, Math.round(cardCorners.tl.x + cardW * 0.98));
      const minY = Math.max(0, Math.round(cardCorners.tl.y - cardH * 0.03));
      const maxY = Math.min(imgH - 1, Math.round(cardCorners.tl.y + cardH * 0.25));

      // Boyut: cardW * 0.04 ile cardW * 0.10 arası
      const minSide = Math.max(16, Math.round(cardW * 0.04));
      const maxSide = Math.max(minSide + 6, Math.round(cardW * 0.10));

      let bestCandidate = null;

      for (let y = minY; y <= maxY - minSide; y += 1) {
        for (let x = minX; x <= maxX - minSide; x += 1) {
          for (let side = minSide; side <= maxSide; side += 2) {
            if (x + side >= maxX || y + side >= maxY) continue;

            let topD = 0, botD = 0, leftD = 0, rightD = 0;
            for (let dx = 0; dx < side; dx++) {
              if (grayBuf[y * imgW + (x + dx)] < 145) topD++;
              if (grayBuf[(y + side) * imgW + (x + dx)] < 145) botD++;
            }
            for (let dy = 0; dy < side; dy++) {
              if (grayBuf[(y + dy) * imgW + x] < 145) leftD++;
              if (grayBuf[(y + dy) * imgW + (x + side)] < 145) rightD++;
            }

            const borderScore = (topD + botD + leftD + rightD) / (4 * side);
            if (borderScore >= 0.50) {
              // 3x3 hücreleri incele
              const cw = side / 3.0;
              const ch = side / 3.0;
              const sR = Math.max(1, Math.round(cw * 0.20));
              const cells = [];

              for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                  const cx = x + (c + 0.5) * cw;
                  const cy = y + (r + 0.5) * ch;
                  let sum = 0, cnt = 0;
                  for (let ddy = -sR; ddy <= sR; ddy++) {
                    for (let ddx = -sR; ddx <= sR; ddx++) {
                      const px = Math.round(cx + ddx);
                      const py = Math.round(cy + ddy);
                      if (px >= 0 && px < imgW && py >= 0 && py < imgH) {
                        sum += grayBuf[py * imgW + px];
                        cnt++;
                      }
                    }
                  }
                  cells.push(cnt > 0 ? (sum / cnt) : 255);
                }
              }

              const minL = Math.min(...cells);
              const maxL = Math.max(...cells);
              const contrast = maxL - minL;

              if (contrast >= 35) {
                const thresh = (minL + maxL) * 0.5;
                let decoded = 0;
                for (let i = 0; i < 9; i++) {
                  if (cells[i] < thresh) decoded |= (1 << i);
                }

                if (decoded > 0 && decoded <= effectiveMaxIdx) {
                  const totalScore = borderScore * 0.5 + (contrast / 255) * 0.5;
                  if (!bestCandidate || totalScore > bestCandidate.totalScore) {
                    bestCandidate = { x, y, side, decoded, totalScore, borderScore, contrast };
                  }
                }
              }
            }
          }
        }
      }

      return bestCandidate ? bestCandidate.decoded : null;
    }

    // Sayfada 2 form var mı? (A4 Sayfa Başına 2 Form Tespiti)
    // 1) Sayfanın 2 form barındırabilmesi için mutlaka DİKEY (PORTRAIT, targetH > targetW * 1.15) olması gerekir.
    // Yatay (landscape) taranan A5 veya tekil optik kartlar asla 2 form içeremez.
    const maxRosterCount = Array.isArray(classStudents) && classStudents.length > 0 ? classStudents.length : 50;
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
      cardTop.binaryId = detectBinaryIdInCard(gray, targetW, targetH, cornersTopOrig, maxRosterCount);
      // Üst form QR arama: Önce rozet bölgesini geniş tara, sonra üst yarının tamamında ara
      if (cornersTopOrig && cornersTopOrig.tr) {
        const subW = Math.round(targetW * 0.45);
        const subH = Math.round(targetH * 0.30);
        const subX = Math.max(0, cornersTopOrig.tr.x - subW + 80);
        const subY = Math.max(0, cornersTopOrig.tl.y - 20);
        cardTop.qrResult = scanQrInRegion(ctx, subX, subY, subW, subH);
      }
      if (!cardTop.qrResult) {
        cardTop.qrResult = scanQrInRegion(ctx, 0, 0, targetW, Math.min(targetH, midY + 60));
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
      cardBottom.binaryId = detectBinaryIdInCard(gray, targetW, targetH, cornersBottomOrig, maxRosterCount);
      // Alt form QR arama: Önce rozet bölgesini geniş tara, sonra alt yarının tamamında ara
      if (cornersBottomOrig && cornersBottomOrig.tr) {
        const subW = Math.round(targetW * 0.45);
        const subH = Math.round(targetH * 0.30);
        const subX = Math.max(0, cornersBottomOrig.tr.x - subW + 80);
        const subY = Math.max(0, cornersBottomOrig.tl.y - 20);
        cardBottom.qrResult = scanQrInRegion(ctx, subX, subY, subW, subH);
      }
      if (!cardBottom.qrResult) {
        cardBottom.qrResult = scanQrInRegion(ctx, 0, Math.max(0, midY - 60), targetW, targetH - Math.max(0, midY - 60));
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
      const cardFull = scanSingleCard(canvas, gray, targetW, targetH, cornersFull, exam, classStudents, options);
      const fullBadge = unwarpAndScanBadge(ctx, createProjectiveHomography(cornersFull), targetW, targetH, maxRosterCount);
      cardFull.qrResult = fullBadge.qrResult;
      cardFull.binaryId = detectBinaryIdInCard(gray, targetW, targetH, cornersFullOrig, maxRosterCount) || fullBadge.binaryId;
      if (!cardFull.qrResult) {
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
      }
      if (!cardFull.binaryId && !cardFull.qrResult && scaledBounds) {
        // Eğer vizör sınırıyla bulunan köşelerden rozet / ID çözülemediyse, tüm kare üzerinden tekrar dene
        const globalCorners = detectCornerAnchors(gray, targetW, targetH, threshold, null);
        if (globalCorners) {
          const gCard = scanSingleCard(canvas, gray, targetW, targetH, globalCorners, exam, classStudents, options);
          const gBadge = unwarpAndScanBadge(ctx, createProjectiveHomography(globalCorners), targetW, targetH, maxRosterCount);
          const gBinaryId = detectBinaryIdInCard(gray, targetW, targetH, globalCorners, maxRosterCount) || gBadge.binaryId;
          if (gBinaryId || gBadge.qrResult) {
            cornersFull = globalCorners;
            cardFull = gCard;
            cardFull.qrResult = gBadge.qrResult || cardFull.qrResult;
            cardFull.binaryId = gBinaryId;
          }
        }
      }
      detectedCards.push(cardFull);
    }

    // Binary ID / QR Kod / Liste Sırası ile Öğrenci Eşleme (Form Baskı Sırasına %100 Uyumlu)
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

      // 1. İLK ÖNCELİK: QR KOD (Reed-Solomon Hata Düzeltmeli & %100 Kesin Doğrulama)
      let rawStuId = '';
      let rawStuNo = '';
      let rawStuIdx = 0;

      const qrData = (card.qrResult && card.qrResult.data) ? card.qrResult.data : '';
      if (qrData) {
        const parts = qrData.split(':');
        if (parts[0] === 'SA') {
          if (parts[1] === 'STU' || parts[1] === 'SMP' || parts[1] === 'BLK') {
            // Eski format: SA:STU:studentId:studentNo:studentIndex:examId
            rawStuId = parts[2];
            rawStuNo = parts[3];
            rawStuIdx = parseInt(parts[4], 10) || 0;
          } else {
            // Yeni format: SA:studentIndex:studentNo
            rawStuIdx = parseInt(parts[1], 10) || 0;
            rawStuNo = parts[2] || '';
          }

          // 1a. Okul numarasına göre eşleme
          if (rawStuNo && rawStuNo !== '......') {
            matched = sortedRoster.find(s => String(s.number).trim() === String(rawStuNo).trim()) ||
                      classStudents.find(s => String(s.number).trim() === String(rawStuNo).trim());
          }
          // 1b. Sıra numarasına göre eşleme
          if (!matched && rawStuIdx > 0 && rawStuIdx <= sortedRoster.length) {
            matched = sortedRoster[rawStuIdx - 1];
          }
          // 1c. Sistem ID'sine göre eşleme
          if (!matched && rawStuId) {
            matched = sortedRoster.find(s => String(s.id) === String(rawStuId)) ||
                      classStudents.find(s => String(s.id) === String(rawStuId));
          }

          if (matched) {
            rawStudentName = `${matched.name} ${matched.surname || ''}`.trim();
            rawStudentNo = matched.number || '';
          }
        }
      }

      // 2. İKİNCİ ÖNCELİK: OPTİK BINARY ID (Sadece sınıf mevcudu sınırları içindeyse)
      if (card.binaryId && (sortedRoster.length > 0 ? (card.binaryId > sortedRoster.length || card.binaryId <= 0) : (card.binaryId > 50 || card.binaryId <= 0))) {
        card.binaryId = null; // Sınıf mevcudunu aşan sahte gürültü / sınır dışı binary ID'yi sıfırla
      }

      if (!matched && card.binaryId && card.binaryId > 0 && card.binaryId <= sortedRoster.length) {
        matched = sortedRoster[card.binaryId - 1];
        if (matched) {
          rawStudentName = `${matched.name} ${matched.surname || ''}`.trim();
          rawStudentNo = matched.number || '';
        }
      }

      // 3. ÜÇÜNCÜ ÖNCELİK: Küresel Öğrenci Havuzundan Numara / Sıra ile Kurtarma
      if (!matched && (rawStuNo || card.binaryId || rawStuIdx)) {
        let globalList = [];
        try {
          if (typeof window !== 'undefined') {
            if (window.Companion && typeof window.Companion.getData === 'function') {
              const d = window.Companion.getData();
              if (Array.isArray(d.students)) globalList = globalList.concat(d.students);
            }
            if (window.stateManager && typeof window.stateManager.loadState === 'function') {
              const s = window.stateManager.loadState();
              if (Array.isArray(s.students)) globalList = globalList.concat(s.students);
            }
          }
        } catch (e) {}

        if (globalList.length > 0) {
          if (rawStuNo && rawStuNo !== '......') {
            matched = globalList.find(s => String(s.number).trim() === String(rawStuNo).trim());
          }
          if (!matched && (card.binaryId || rawStuIdx)) {
            const idxToFind = card.binaryId || rawStuIdx;
            if (idxToFind > 0 && idxToFind <= globalList.length) {
              matched = globalList.find(s => parseInt(s.index || s.studentIndex, 10) === idxToFind) || globalList[idxToFind - 1];
            }
          }
          if (matched) {
            rawStudentName = `${matched.name} ${matched.surname || ''}`.trim();
            rawStudentNo = matched.number || '';
          }
        }
      }

      // 4. DÖRDÜNCÜ ÖNCELİK: Sayfa ve Kart Sırası (Baskı Şablonuna Göre Fallback)
      let candidate = null;
      if (!matched && sortedRoster.length > 0) {
        let expectedIdx = -1;
        if (typeof options.pageNumber === 'number' && options.pageNumber > 0) {
          const perPage = detectedCards.length > 1 ? 2 : 1;
          expectedIdx = (options.pageNumber - 1) * perPage + idx;
        } else if (detectedCards.length > 1 && idx < sortedRoster.length) {
          expectedIdx = idx;
        }
        if (expectedIdx >= 0 && expectedIdx < sortedRoster.length) {
          candidate = sortedRoster[expectedIdx];
          if (!rawStudentName) rawStudentName = `${candidate.name} ${candidate.surname || ''}`.trim();
          if (!rawStudentNo) rawStudentNo = candidate.number || '';
        }
      }

      if (!matched && rawStuNo && rawStuNo !== '......') {
        rawStudentNo = rawStuNo;
        if (!rawStudentName) rawStudentName = `Öğrenci No: ${rawStuNo}`;
      } else if (!matched && (card.binaryId || rawStuIdx)) {
        const validIdx = card.binaryId || rawStuIdx;
        if (validIdx > 0 && validIdx <= sortedRoster.length) {
          if (!rawStudentName) rawStudentName = `Öğrenci #${validIdx}`;
        }
      }

      card.matched = matched;
      card.candidate = candidate;
      card.rawStudentName = rawStudentName;
      card.rawStudentNo = rawStudentNo;
      card.rawStudentIndex = card.binaryId || rawStuIdx || 0;
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
    findCorrectAnswerForKey
  };

})();
