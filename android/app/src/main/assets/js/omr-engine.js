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
    const step = Math.max(2, Math.floor(radius / 3));

    const rCore = Math.max(2, Math.round(radius * 0.30));
    const rRingInner = Math.max(rCore + 1, Math.round(radius * 0.45));
    const rRingOuter = Math.max(rRingInner + 1, Math.round(radius * 0.75));
    const rOuter = Math.max(rRingOuter + 1, Math.round(radius * 1.10));

    const rCore2 = rCore * rCore;
    const rRingInner2 = rRingInner * rRingInner;
    const rRingOuter2 = rRingOuter * rRingOuter;
    const rOuter2 = rOuter * rOuter;

    for (let y = minY + rOuter; y <= maxY - rOuter; y += step) {
      for (let x = minX + rOuter; x <= maxX - rOuter; x += step) {
        let coreSum = 0, coreCount = 0;
        let ringSum = 0, ringCount = 0;
        let outerSum = 0, outerCount = 0;

        for (let dy = -rOuter; dy <= rOuter; dy += 2) {
          const py = y + dy;
          const dy2 = dy * dy;
          for (let dx = -rOuter; dx <= rOuter; dx += 2) {
            const px = x + dx;
            const d2 = dx * dx + dy2;
            if (d2 <= rOuter2) {
              const lum = gray[py * w + px];
              if (d2 <= rCore2) {
                coreSum += lum;
                coreCount++;
              } else if (d2 >= rRingInner2 && d2 <= rRingOuter2) {
                ringSum += lum;
                ringCount++;
              } else if (d2 > rRingOuter2) {
                outerSum += lum;
                outerCount++;
              }
            }
          }
        }

        if (coreCount > 0 && ringCount > 0 && outerCount > 0) {
          const coreLum = coreSum / coreCount;
          const ringLum = ringSum / ringCount;
          const outerLum = outerSum / outerCount;

          // Desen Kuralı: Core Koyu, Ring Açık (Beyaz), Dış Çerçeve Koyu
          const contrast1 = ringLum - coreLum;
          const contrast2 = ringLum - outerLum;

          if (contrast1 > 20 && contrast2 > 12) {
            const score = (contrast1 * 0.6) + (contrast2 * 0.4);
            if (score > bestScore) {
              bestScore = score;
              bestX = x;
              bestY = y;
            }
          }
        }
      }
    }

    if (bestScore > 24 && bestX > 0 && bestY > 0) {
      let fineX = bestX, fineY = bestY, fineScore = bestScore;
      const fineRadius = Math.max(2, step);
      for (let fY = Math.max(minY + rOuter, bestY - fineRadius); fY <= Math.min(maxY - rOuter, bestY + fineRadius); fY++) {
        for (let fX = Math.max(minX + rOuter, bestX - fineRadius); fX <= Math.min(maxX - rOuter, bestX + fineRadius); fX++) {
          let cSum = 0, cCnt = 0, rSum = 0, rCnt = 0, oSum = 0, oCnt = 0;
          for (let dy = -rOuter; dy <= rOuter; dy += 2) {
            const py = fY + dy;
            const dy2 = dy * dy;
            for (let dx = -rOuter; dx <= rOuter; dx += 2) {
              const px = fX + dx;
              const d2 = dx * dx + dy2;
              if (d2 <= rOuter2) {
                const lum = gray[py * w + px];
                if (d2 <= rCore2) { cSum += lum; cCnt++; }
                else if (d2 >= rRingInner2 && d2 <= rRingOuter2) { rSum += lum; rCnt++; }
                else if (d2 > rRingOuter2) { oSum += lum; oCnt++; }
              }
            }
          }
          if (cCnt > 0 && rCnt > 0 && oCnt > 0) {
            const c1 = (rSum / rCnt) - (cSum / cCnt);
            const c2 = (rSum / rCnt) - (oSum / oCnt);
            if (c1 > 18 && c2 > 10) {
              const sc = (c1 * 0.6) + (c2 * 0.4);
              if (sc > fineScore) { fineScore = sc; fineX = fX; fineY = fY; }
            }
          }
        }
      }
      return { x: fineX, y: fineY };
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

  function detectCornerAnchorsInternal(gray, w, h, threshold, bounds) {
    const minX = bounds ? bounds.minX : 0;
    const maxX = bounds ? bounds.maxX : w;
    const minY = bounds ? bounds.minY : 0;
    const maxY = bounds ? bounds.maxY : h;
    const subW = maxX - minX;
    const subH = maxY - minY;

    // 1. Önce formun belirgin dış kart çerçevesini kontrol et (CamScanner ve taranmış A4 için)
    const borderCorners = findCardBorderCorners(gray, w, h, threshold, bounds);
    if (borderCorners) {
      return borderCorners;
    }

    // 2. Kadran bazlı (Quadrant) Arama: Mobil çekimlerde form vizörün ortasında olsa bile 4 köşeyi kaçırmaz
    const qW = Math.round(subW * 0.52);
    const qH = Math.round(subH * 0.52);
    const anchorRadius = Math.max(7, Math.min(26, Math.round(subW * 0.018)));

    let tlFound = findConcentricTargetAnchor(gray, w, h, minX, minX + qW, minY, minY + qH, anchorRadius);
    let trFound = findConcentricTargetAnchor(gray, w, h, maxX - qW, maxX, minY, minY + qH, anchorRadius);
    let brFound = findConcentricTargetAnchor(gray, w, h, maxX - qW, maxX, maxY - qH, maxY, anchorRadius);
    let blFound = findConcentricTargetAnchor(gray, w, h, minX, minX + qW, maxY - qH, maxY, anchorRadius);

    let foundCount = (tlFound ? 1 : 0) + (trFound ? 1 : 0) + (brFound ? 1 : 0) + (blFound ? 1 : 0);

    // Yetersizse farklı ölçekle (daha küçük veya büyük çapa yarıçapı) tekrar dene
    if (foundCount < 3) {
      const altRadius = Math.max(6, Math.round(anchorRadius * 0.75));
      if (!tlFound) tlFound = findConcentricTargetAnchor(gray, w, h, minX, minX + qW, minY, minY + qH, altRadius);
      if (!trFound) trFound = findConcentricTargetAnchor(gray, w, h, maxX - qW, maxX, minY, minY + qH, altRadius);
      if (!brFound) brFound = findConcentricTargetAnchor(gray, w, h, maxX - qW, maxX, maxY - qH, maxY, altRadius);
      if (!blFound) blFound = findConcentricTargetAnchor(gray, w, h, minX, minX + qW, maxY - qH, maxY, altRadius);
      foundCount = (tlFound ? 1 : 0) + (trFound ? 1 : 0) + (brFound ? 1 : 0) + (blFound ? 1 : 0);
    }

    function areAnchorsGeometricallyValid(tl, tr, br, bl) {
      if (!tl || !tr || !br || !bl) return false;
      const wTop = tr.x - tl.x;
      const wBot = br.x - bl.x;
      const hLeft = bl.y - tl.y;
      const hRight = br.y - tr.y;
      if (wTop < subW * 0.35 || wBot < subW * 0.35) return false;
      if (hLeft < subH * 0.22 || hRight < subH * 0.22) return false;
      if (Math.abs(wTop - wBot) > subW * 0.35) return false;
      if (Math.abs(hLeft - hRight) > subH * 0.35) return false;
      if (Math.abs(tl.y - tr.y) > subH * 0.30) return false;
      if (Math.abs(bl.y - br.y) > subH * 0.30) return false;
      const aspect = wTop / Math.max(1, hLeft);
      if (aspect < 0.35 || aspect > 3.0) return false;
      return true;
    }

    if (foundCount >= 3) {
      const cand = {
        tl: tlFound || { x: minX, y: minY },
        tr: trFound || { x: maxX, y: minY },
        br: brFound || { x: maxX, y: maxY },
        bl: blFound || { x: minX, y: maxY }
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
    }

    // 3. Konsantrik çapa bulunamazsa dış siyah çerçeveyi dene
    const bbox = findFormOuterBoundingBox(gray, w, h, minX, maxX, minY, maxY, threshold);
    if (bbox) {
      return bbox;
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
        bl: blFound || { x: minX, y: maxY }
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
    const checkPts = [
      { x: pt.x, y: Math.max(0, pt.y - Math.round(radius * 1.6)) },
      { x: pt.x, y: Math.min(h - 1, pt.y + Math.round(radius * 1.6)) },
      { x: Math.max(0, pt.x - Math.round(radius * 2.0)), y: pt.y }
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
      return { score: 0, fillRatio: 0, medianDarkness: 0, p75Darkness: 0, meanDarkness: 0 };
    }

    darknessValues.sort((a, b) => a - b);
    const medianDarkness = darknessValues[Math.floor(totalPixels * 0.50)];
    const p75Darkness = darknessValues[Math.floor(totalPixels * 0.75)];

    let darkCount = 0;
    let sumDark = 0;
    for (let i = 0; i < totalPixels; i++) {
      const v = darknessValues[i];
      sumDark += v;
      if (v >= 0.28) darkCount++;
    }

    const fillRatio = darkCount / totalPixels;
    const meanDarkness = sumDark / totalPixels;
    const score = (medianDarkness * 0.35) + (meanDarkness * 0.35) + (fillRatio * 0.30);

    return { score, fillRatio, medianDarkness, p75Darkness, meanDarkness };
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

  // ==========================================================================
  // 4. TEKİL KART TARAMA MOTORU (HEM TEK HEM ÇOKLU DERS)
  // ==========================================================================

  function scanSingleCard(canvas, gray, w, h, corners, exam, classStudents, options = {}) {
    const isMulti = exam && !!exam.isMultiSubject && Array.isArray(exam.subjects) && exam.subjects.length > 0;
    const examSubjects = isMulti ? exam.subjects : [];
    const qCount = parseInt(exam.totalQuestions, 10) || (isMulti ? examSubjects.reduce((acc, s) => acc + (parseInt(s.questionCount, 10) || 0), 0) : 20);
    const choicesCount = parseInt(exam.choicesCount, 10) || 4;
    const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, choicesCount);
    const answerKey = exam.answerKey || {};
    const penaltyRate = exam.wrongAffects ? (parseFloat(exam.penaltyRate) || 4) : 0;

    // Kağıt Formatı (1: A4 Tam Boy, 2: A5 Kesilmiş Yarım Boy, 4: A6 Kesilmiş Çeyrek Boy)
    const perPage = parseInt(options.perPage || exam.perPage, 10) || 2;

    const mapPoint = createProjectiveHomography(corners);
    const sampleRadius = Math.max(5, Math.min(16, Math.round(w * 0.013)));

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

      // 2. Maksimum soru sayısı (tüm dersler arasındaki en yüksek soru adedi)
      // Örn: Türkçe 8, Matematik 8, Sosyal 5, Fen 5, İngilizce 6 -> maxQuestions = 8
      const maxQuestions = Math.max(...examSubjects.map(s => parseInt(s.questionCount, 10) || 0), 1);

      // 3. Kağıt formatına göre dikey gövde sınırları
      let bodyTop = 0.125;
      let bodyBottom = 0.945;
      if (perPage === 1) {
        bodyTop = 0.110;
        bodyBottom = 0.955;
      } else if (perPage === 4) {
        bodyTop = 0.140;
        bodyBottom = 0.925;
      }
      const availH = bodyBottom - bodyTop;

      // 4. Sabit Satır Yüksekliği & Dikey Ortalama (justify-content: center simülasyonu)
      // HTML'de her soru satırı (~20px + 1.5px gap) A5 kartta ~0.0441 v birimidir.
      // Soru sayısı çok olduğunda (örn. 20 soru) satırlar sıkışır: (availH - 0.065) / maxQuestions
      const rowStep = Math.min(0.0441, (availH - 0.065) / Math.max(1, maxQuestions));
      const tableHeight = 0.060 + (maxQuestions - 1) * rowStep;
      const verticalCenteringOffset = Math.max(0, (availH - tableHeight) * 0.5);

      // İlk soru satırının merkez V koordinatı (TÜM DERSLER İÇİN ORTAK & YATAYDA HİZALI!)
      const vFirstRow = bodyTop + verticalCenteringOffset + 0.055;

      // 5. Ders sütunu içindeki şıkların yayılımı (A - B - C - D)
      // HTML'de .omr-q-num (22px) ve .omr-bubble (18px x 4 + 3x4px gap)
      const bStartRatio = 0.28;
      const bEndRatio = letters.length >= 5 ? 0.78 : (letters.length === 3 ? 0.60 : 0.74);
      const choiceStepRatio = letters.length > 1 ? ((bEndRatio - bStartRatio) / (letters.length - 1)) : 0;

      examSubjects.forEach((subj, sIdx) => {
        let subjCorrect = 0;
        let subjWrong = 0;
        let subjBlank = 0;

        const colUStart = gridUStart + sIdx * slotW + 0.003;
        const colUEnd = gridUStart + (sIdx + 1) * slotW - 0.003;
        const colWidth = colUEnd - colUStart;

        const numQuestions = parseInt(subj.questionCount, 10) || 6;

        for (let q = 1; q <= numQuestions; q++) {
          const rowV = vFirstRow + (q - 1) * rowStep;
          const key = `${subj.id}_${q}`;

          // Bu ders sütununa özel lokal kağıt aydınlığı
          const rowSamplePt = mapPoint(colUStart + colWidth * 0.12, rowV);
          const rowPaperLum = sampleLocalPaperLuminance(gray, w, h, rowSamplePt, sampleRadius);

          const choiceScores = [];

          for (let lIdx = 0; lIdx < letters.length; lIdx++) {
            const choiceU = colUStart + colWidth * (bStartRatio + lIdx * choiceStepRatio);
            const initialPt = mapPoint(choiceU, rowV);
            const searchR = Math.max(6, Math.round(sampleRadius * 1.3));
            const snappedPt = refineBubbleCenter(gray, w, h, initialPt, sampleRadius, rowPaperLum, searchR, searchR);

            const metrics = analyzeBubble(gray, w, h, snappedPt.x, snappedPt.y, sampleRadius, rowPaperLum);
            choiceScores.push({
              letter: letters[lIdx],
              score: metrics.score,
              fillRatio: metrics.fillRatio,
              pt: snappedPt
            });
          }

          choiceScores.sort((a, b) => b.score - a.score);
          const best = choiceScores[0];
          const second = choiceScores[1] || { score: 0, fillRatio: 0 };

          let markedLetter = '';
          let status = 'blank';

          const diff = best.score - second.score;
          // Kurşun kalem ve tükenmez kalem için hassas adaptif doluluk eşiği
          const fillThreshold = (options.sensitivity === 'high' || options.sensitivity === 3) ? 0.18 : ((options.sensitivity === 'low' || options.sensitivity === 1) ? 0.32 : 0.23);
          const minDiff = (options.sensitivity === 'high' || options.sensitivity === 3) ? 0.05 : 0.07;

          const isFilled = (best.score >= fillThreshold && diff >= minDiff) || (best.score >= 0.38);
          const isMultiple = isFilled && (second.score >= fillThreshold) && (diff < minDiff);

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
        }

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

      let bodyTop = 0.16;
      let bodyBottom = 0.95;

      if (perPage === 2) {
        bodyTop = 0.20;
        bodyBottom = 0.93;
      } else if (perPage === 4) {
        bodyTop = 0.25;
        bodyBottom = 0.90;
      } else {
        bodyTop = 0.15;
        bodyBottom = 0.96;
      }

      const availH = bodyBottom - bodyTop;
      const actualRowStep = Math.min(0.055, Math.max(0.034, availH / Math.max(12, questionsPerCol)));
      const firstRowCenter = bodyTop + actualRowStep * 0.55;

      for (let c = 0; c < cols; c++) {
        const startQ = c * questionsPerCol + 1;
        const endQ = Math.min((c + 1) * questionsPerCol, qCount);

        let colUStart, colUEnd;
        if (cols === 1) {
          colUStart = 0.25; colUEnd = 0.75;
        } else if (cols === 2) {
          colUStart = 0.05 + c * 0.46; colUEnd = colUStart + 0.44;
        } else {
          colUStart = 0.04 + c * 0.32; colUEnd = colUStart + 0.28;
        }
        const colWidth = colUEnd - colUStart;

        for (let q = startQ; q <= endQ; q++) {
          const rowIdx = q - startQ;
          const rowV = firstRowCenter + rowIdx * actualRowStep;

          const rowSamplePt = mapPoint(colUStart + colWidth * 0.15, rowV);
          const rowPaperLum = sampleLocalPaperLuminance(gray, w, h, rowSamplePt, sampleRadius);

          const choiceScores = [];
          for (let lIdx = 0; lIdx < letters.length; lIdx++) {
            const choiceU = colUStart + colWidth * (0.24 + (lIdx + 0.5) * (0.74 / letters.length));
            const initialPt = mapPoint(choiceU, rowV);
            const snappedPt = refineBubbleCenter(gray, w, h, initialPt, sampleRadius, rowPaperLum);

            const metrics = analyzeBubble(gray, w, h, snappedPt.x, snappedPt.y, sampleRadius, rowPaperLum);
            choiceScores.push({
              letter: letters[lIdx],
              score: metrics.score,
              fillRatio: metrics.fillRatio,
              pt: snappedPt
            });
          }

          choiceScores.sort((a, b) => b.score - a.score);
          const best = choiceScores[0];
          const second = choiceScores[1] || { score: 0, fillRatio: 0 };

          let markedLetter = '';
          let status = 'blank';

          const diff = best.score - second.score;
          const fillThreshold = (options.sensitivity === 'high' || options.sensitivity === 3) ? 0.20 : ((options.sensitivity === 'low' || options.sensitivity === 1) ? 0.34 : 0.25);
          const minDiff = (options.sensitivity === 'high' || options.sensitivity === 3) ? 0.05 : 0.08;

          const isFilled = (best.score >= fillThreshold && diff >= minDiff) || (best.score >= 0.42);
          const isMultiple = isFilled && (second.score >= fillThreshold) && (diff < minDiff);

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

    // Şık vurguları
    questionDetails.forEach(qd => {
      (qd.scores || []).forEach(cs => {
        const isMarked = (qd.status === 'marked' && qd.marked === cs.letter);
        const isAnswerKey = (qd.keyAnswer && cs.letter === qd.keyAnswer);

        if (isMarked) {
          oCtx.beginPath();
          oCtx.arc(cs.pt.x, cs.pt.y, sampleRadius * 1.25, 0, Math.PI * 2);
          oCtx.fillStyle = qd.isCorrect ? 'rgba(16, 185, 129, 0.45)' : 'rgba(239, 68, 68, 0.45)';
          oCtx.strokeStyle = qd.isCorrect ? '#10b981' : '#ef4444';
          oCtx.lineWidth = 2.5;
          oCtx.fill();
          oCtx.stroke();
        } else if (isAnswerKey && !qd.isCorrect) {
          oCtx.beginPath();
          oCtx.arc(cs.pt.x, cs.pt.y, sampleRadius * 1.15, 0, Math.PI * 2);
          oCtx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
          oCtx.lineWidth = 2;
          oCtx.stroke();
        }
      });
    });

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
      thumbUrl: overlayCanvas.toDataURL('image/jpeg', 0.85)
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
    function unwarpAndScanBadge(context, mapFn, targetW, targetH) {
      if (typeof mapFn !== 'function') return { qrResult: null, binaryId: null };

      const badgeW = 280;
      const badgeH = 130;
      const bCanvas = document.createElement('canvas');
      bCanvas.width = badgeW;
      bCanvas.height = badgeH;
      const bCtx = bCanvas.getContext('2d', { willReadFrequently: true });
      if (!bCtx) return { qrResult: null, binaryId: null };

      const bImgData = bCtx.createImageData(badgeW, badgeH);
      const bData = bImgData.data;
      const srcData = context.getImageData(0, 0, targetW, targetH).data;

      for (let by = 0; by < badgeH; by++) {
        const v = 0.00 + (by / badgeH) * 0.17;
        for (let bx = 0; bx < badgeW; bx++) {
          const u = 0.58 + (bx / badgeW) * 0.41;
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
      }

      // 2. 9-Bit Binary OMR Matrisi (3x3 kutucuk)
      let binaryId = null;
      const bGray = new Uint8Array(badgeW * badgeH);
      for (let i = 0, p = 0; i < bData.length; i += 4, p++) {
        bGray[p] = (bData[i] * 77 + bData[i + 1] * 150 + bData[i + 2] * 29) >> 8;
      }

      for (let side = 32; side <= 76; side += 4) {
        for (let y = 4; y <= badgeH - side - 4; y += 4) {
          for (let x = 4; x <= Math.round(badgeW * 0.65) - side; x += 4) {
            const cw = side / 3.0;
            const ch = side / 3.0;
            const sR = Math.max(1, Math.round(cw * 0.20));
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
            // Sahte eşleşmeleri (noise) önlemek için güçlü kontrast farkı ve gerçekçi sınıf mevcudu (1..50)
            if (maxL - minL >= 48) {
              const thresh = (minL + maxL) * 0.5;
              let decoded = 0;
              for (let i = 0; i < 9; i++) {
                if (cells[i] < thresh) decoded |= (1 << i);
              }
              if (decoded > 0 && decoded <= 50) {
                binaryId = decoded;
                break;
              }
            }
          }
          if (binaryId) break;
        }
        if (binaryId) break;
      }

      return { qrResult: qrRes, binaryId: binaryId };
    }

    // ── YENİ: OPTİK BINARY ID DEDEKTÖRÜ (BÜYÜK 3x3 OMR MATRİSİ - 9 BİT / 512 ÖĞRENCİ) ──
    // Ortaöğretim ve kalabalık kademeler için 511 öğrenciye kadar tam kapasite destekler.
    // Kart başlığında (0.65 - 0.95 U, -0.03 - 0.12 V) 3x3 kutucuk rozetini dinamik tespit eder.
    function detectBinaryIdInCard(grayBuf, imgW, imgH, cardCorners) {
      if (!cardCorners || !cardCorners.tl || !cardCorners.tr || !cardCorners.bl) return null;

      const cardW = Math.hypot(cardCorners.tr.x - cardCorners.tl.x, cardCorners.tr.y - cardCorners.tl.y);
      const cardH = Math.hypot(cardCorners.bl.x - cardCorners.tl.x, cardCorners.bl.y - cardCorners.tl.y);
      if (cardW < 50 || cardH < 50) return null;

      // 3x3 OMR matrisi başlık bölgesinde, sağ çeyrekte (0.65 - 0.95 U) ve üst kısımda (-0.03 - 0.12 V) bulunur
      const minX = Math.max(0, Math.round(cardCorners.tl.x + cardW * 0.65));
      const maxX = Math.min(imgW - 1, Math.round(cardCorners.tl.x + cardW * 0.95));
      const minY = Math.max(0, Math.round(cardCorners.tl.y - cardH * 0.03));
      const maxY = Math.min(imgH - 1, Math.round(cardCorners.tl.y + cardH * 0.12));

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

                if (decoded > 0 && decoded <= 511) {
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
    const canBeDouble = options.isDoubleForm !== false;
    let isDoubleForm = false;
    let cornersTop = null;
    let cornersBottom = null;

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
    } else if (canBeDouble && (!scaledBounds || (scaledBounds.maxY - scaledBounds.minY > targetH * 0.70))) {
      // Tam sayfada veya geniş kadrajda üst yarı ve alt yarıyı bağımsız tara
      const boundsTopTest = { minX: 0, maxX: targetW, minY: 0, maxY: Math.round(targetH * 0.55) };
      const boundsBottomTest = { minX: 0, maxX: targetW, minY: Math.round(targetH * 0.45), maxY: targetH };

      cornersTop = detectCornerAnchors(gray, targetW, targetH, threshold, boundsTopTest);
      cornersBottom = detectCornerAnchors(gray, targetW, targetH, threshold, boundsBottomTest);

      const topOk = isSubFormGeometricallyValid(cornersTop, targetW, targetH);
      const botOk = isSubFormGeometricallyValid(cornersBottom, targetW, targetH);

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
        tl: { ...cornersTop.tl },
        tr: { ...cornersTop.tr },
        bl: { ...cornersTop.bl },
        br: { ...cornersTop.br }
      };
      const cardTop = scanSingleCard(canvas, gray, targetW, targetH, cornersTop, exam, classStudents, options);
      cardTop.binaryId = detectBinaryIdInCard(gray, targetW, targetH, cornersTopOrig);
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
        tl: { ...cornersBottom.tl },
        tr: { ...cornersBottom.tr },
        bl: { ...cornersBottom.bl },
        br: { ...cornersBottom.br }
      };
      const cardBottom = scanSingleCard(canvas, gray, targetW, targetH, cornersBottom, exam, classStudents, options);
      cardBottom.binaryId = detectBinaryIdInCard(gray, targetW, targetH, cornersBottomOrig);
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
      // ── SAYFA BAŞINA 1 FORM (TAM SAYFA A4 / MOBİL VİZÖR) ──
      let cornersFull = detectCornerAnchors(gray, targetW, targetH, threshold, scaledBounds);
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
        tl: { ...cornersFull.tl },
        tr: { ...cornersFull.tr },
        bl: { ...cornersFull.bl },
        br: { ...cornersFull.br }
      };
      const cardFull = scanSingleCard(canvas, gray, targetW, targetH, cornersFull, exam, classStudents, options);
      const fullBadge = unwarpAndScanBadge(ctx, createProjectiveHomography(cornersFull), targetW, targetH);
      cardFull.qrResult = fullBadge.qrResult;
      cardFull.binaryId = fullBadge.binaryId || detectBinaryIdInCard(gray, targetW, targetH, cornersFullOrig);
      if (!cardFull.qrResult) {
        cardFull.qrResult = scanQrInRegion(ctx, 0, 0, targetW, targetH);
      }
      if (!cardFull.binaryId && !cardFull.qrResult && cornersFullOrig && cornersFullOrig.tr) {
        const subW = Math.round(targetW * 0.40);
        const subH = Math.round(targetH * 0.35);
        const subX = Math.max(0, cornersFullOrig.tr.x - subW + 80);
        const subY = Math.max(0, cornersFullOrig.tr.y - Math.round(subH * 0.5));
        cardFull.qrResult = scanQrInRegion(ctx, subX, subY, subW, subH);
      }
      if (!cardFull.binaryId && !cardFull.qrResult && scaledBounds) {
        cardFull.qrResult = scanQrInRegion(ctx, scaledBounds.minX, scaledBounds.minY, scaledBounds.maxX - scaledBounds.minX, scaledBounds.maxY - scaledBounds.minY);
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

      // 2. İKİNCİ ÖNCELİK: OPTİK BINARY ID (Sadece mantıklı sınıf sınırları içindeyse)
      if (card.binaryId && (card.binaryId > Math.max(sortedRoster.length, 50) || card.binaryId <= 0)) {
        card.binaryId = null; // Sahte gürültü / sınır dışı binary ID'yi sıfırla
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
            if (idxToFind <= globalList.length) {
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
        if (validIdx > 0 && validIdx <= Math.max(sortedRoster.length, 50)) {
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
    normalizeOmrSubject,
    getOmrSubjectBaseKeywords,
    extractAnswerForSubj,
    findCorrectAnswerForKey
  };

})();
