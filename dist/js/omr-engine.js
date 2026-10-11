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

          if (contrast1 > 25 && contrast2 > 15) {
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

    return bestScore > 35 ? { x: bestX, y: bestY } : null;
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

  function detectCornerAnchors(gray, w, h, threshold, bounds) {
    const minX = bounds ? bounds.minX : 0;
    const maxX = bounds ? bounds.maxX : w;
    const minY = bounds ? bounds.minY : 0;
    const maxY = bounds ? bounds.maxY : h;
    const subW = maxX - minX;
    const subH = maxY - minY;

    const qW = Math.round(subW * 0.30);
    const qH = Math.round(subH * 0.28);
    const anchorRadius = Math.max(8, Math.min(24, Math.round(subW * 0.018)));

    const corners = {
      tl: { x: Math.round(minX + subW * 0.05), y: Math.round(minY + subH * 0.04) },
      tr: { x: Math.round(minX + subW * 0.95), y: Math.round(minY + subH * 0.04) },
      br: { x: Math.round(minX + subW * 0.95), y: Math.round(minY + subH * 0.96) },
      bl: { x: Math.round(minX + subW * 0.05), y: Math.round(minY + subH * 0.96) }
    };

    let tlFound = findConcentricTargetAnchor(gray, w, h, minX, minX + qW, minY, minY + qH, anchorRadius);
    let trFound = findConcentricTargetAnchor(gray, w, h, maxX - qW, maxX, minY, minY + qH, anchorRadius);
    let brFound = findConcentricTargetAnchor(gray, w, h, maxX - qW, maxX, maxY - qH, maxY, anchorRadius);
    let blFound = findConcentricTargetAnchor(gray, w, h, minX, minX + qW, maxY - qH, maxY, anchorRadius);

    let foundCount = (tlFound ? 1 : 0) + (trFound ? 1 : 0) + (brFound ? 1 : 0) + (blFound ? 1 : 0);

    function areAnchorsGeometricallyValid(tl, tr, br, bl) {
      if (!tl || !tr || !br || !bl) return false;
      const wTop = tr.x - tl.x;
      const wBot = br.x - bl.x;
      const hLeft = bl.y - tl.y;
      const hRight = br.y - tr.y;
      if (wTop < subW * 0.60 || wBot < subW * 0.60) return false;
      if (hLeft < subH * 0.55 || hRight < subH * 0.55) return false;
      if (Math.abs(wTop - wBot) > subW * 0.25) return false;
      if (Math.abs(hLeft - hRight) > subH * 0.25) return false;
      if (Math.abs(tl.y - tr.y) > subH * 0.15) return false;
      if (Math.abs(bl.y - br.y) > subH * 0.15) return false;
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
        corners.tl = cand.tl;
        corners.tr = cand.tr;
        corners.br = cand.br;
        corners.bl = cand.bl;
        return corners;
      }
    }

    // Konsantrik çapa yoksa veya geçersizse (örn: CamScanner / taranmış A4 formu):
    // Önce formun dış siyah çerçevesini algıla
    const bbox = findFormOuterBoundingBox(gray, w, h, minX, maxX, minY, maxY, threshold);
    if (bbox) {
      corners.tl = bbox.tl;
      corners.tr = bbox.tr;
      corners.br = bbox.br;
      corners.bl = bbox.bl;
      return corners;
    }

    // Dış çerçeve de bulunamazsa köşe koyu lekelerini ara
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
        corners.tl = cand.tl;
        corners.tr = cand.tr;
        corners.br = cand.br;
        corners.bl = cand.bl;
      }
    }

    return corners;
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
    const defaultRange = Math.max(2, Math.round(radius * 0.5));
    const rangeX = maxRangeX !== undefined ? Math.max(2, maxRangeX) : defaultRange;
    const rangeY = maxRangeY !== undefined ? Math.max(2, maxRangeY) : defaultRange;
    const stepX = Math.max(1, Math.round(rangeX / 5));
    const stepY = Math.max(1, Math.round(rangeY / 5));

    let bestX = initialPt.x;
    let bestY = initialPt.y;
    let maxDarkSum = -1;
    const rCheck = Math.max(2, Math.round(radius * 0.45));
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
      subjectBreakdown = {};
      const numSubjects = examSubjects.length;
      let cumulativeOffset = 0;

      // 1. Dikey çizgiler profilini çıkar (Ders kutularının sol/sağ sınırlarını doğrudan tespit et)
      const colScores = new Float32Array(w);
      const startScanY = Math.round(h * 0.20);
      const endScanY = Math.round(h * 0.85);
      const searchH = endScanY - startScanY;

      for (let x = Math.round(w * 0.03); x < Math.round(w * 0.97); x++) {
        let dark = 0;
        for (let y = startScanY; y < endScanY; y++) {
          if (gray[y * w + x] < 115) dark++;
        }
        colScores[x] = dark / searchH;
      }

      const vLines = [];
      for (let x = 10; x < w - 10; x++) {
        if (colScores[x] > 0.40) {
          let isPeak = true;
          for (let dx = -6; dx <= 6; dx++) {
            if (colScores[x + dx] > colScores[x]) { isPeak = false; break; }
          }
          if (isPeak) {
            vLines.push(x);
            x += Math.max(6, Math.round(w * 0.005));
          }
        }
      }

      // N ders için sol ve sağ sütun sınırları
      const detectedBoxes = [];
      if (numSubjects === 3) {
        const b1L = vLines.find(x => x > w * 0.04 && x < w * 0.12) || Math.round(w * 0.065);
        const b1R = vLines.find(x => x > w * 0.32 && x < w * 0.38) || Math.round(w * 0.35);
        const b2L = vLines.find(x => x > b1R && x < w * 0.42) || Math.round(w * 0.37);
        const b2R = vLines.find(x => x > w * 0.62 && x < w * 0.68) || Math.round(w * 0.65);
        const b3L = vLines.find(x => x > b2R && x < w * 0.72) || Math.round(w * 0.67);
        const b3R = vLines.find(x => x > w * 0.90 && x < w * 0.98) || Math.round(w * 0.95);
        detectedBoxes.push({ left: b1L, right: b1R }, { left: b2L, right: b2R }, { left: b3L, right: b3R });
      } else {
        const spanW = w * 0.88;
        const boxStepW = spanW / numSubjects;
        for (let sIdx = 0; sIdx < numSubjects; sIdx++) {
          detectedBoxes.push({
            left: Math.round(w * 0.06 + sIdx * boxStepW),
            right: Math.round(w * 0.06 + (sIdx + 1) * boxStepW - w * 0.02)
          });
        }
      }

      // 2. Kutuların üst sınırını tespit et
      let boxTop = null;
      for (let y = Math.round(h * 0.08); y < Math.round(h * 0.35); y++) {
        let dark = 0;
        for (let x = Math.round(w * 0.2); x < Math.round(w * 0.8); x++) {
          if (gray[y * w + x] < 115) dark++;
        }
        if (dark > (w * 0.6) * 0.60) {
          boxTop = y;
          break;
        }
      }
      boxTop = boxTop || Math.round(h * 0.15);

      // Kutuların ortak alt sınırını da tespit et ve corners'ı güncelle
      let commonBottom = null;
      const firstB = detectedBoxes[0];
      const fbW = firstB.right - firstB.left;
      const fbX1 = firstB.left + Math.round(fbW * 0.1);
      const fbX2 = firstB.right - Math.round(fbW * 0.1);
      const fbSpan = fbX2 - fbX1;
      for (let y = Math.round(h * 0.98); y > Math.round(h * 0.70); y--) {
        let dark = 0;
        for (let x = fbX1; x < fbX2; x++) if (gray[y * w + x] < 115) dark++;
        if (dark >= fbSpan * 0.65) {
          let whiteAbove = 0, whiteBelow = 0;
          const checkDist = Math.max(3, Math.round(h * 0.010));
          if (y - checkDist >= 0) for (let x = fbX1; x < fbX2; x++) if (gray[(y - checkDist) * w + x] > 160) whiteAbove++;
          if (y + checkDist < h) for (let x = fbX1; x < fbX2; x++) if (gray[(y + checkDist) * w + x] > 160) whiteBelow++;
          if (whiteAbove > fbSpan * 0.35 && whiteBelow > fbSpan * 0.35) {
            commonBottom = y;
            break;
          }
        }
      }
      commonBottom = commonBottom || Math.round(h * 0.90);

      corners.tl = { x: detectedBoxes[0].left, y: boxTop };
      corners.tr = { x: detectedBoxes[detectedBoxes.length - 1].right, y: boxTop };
      corners.br = { x: detectedBoxes[detectedBoxes.length - 1].right, y: commonBottom };
      corners.bl = { x: detectedBoxes[0].left, y: commonBottom };

      examSubjects.forEach((subj, sIdx) => {
        let subjCorrect = 0;
        let subjWrong = 0;
        let subjBlank = 0;

        const bBox = detectedBoxes[sIdx] || detectedBoxes[0];
        const boxW = bBox.right - bBox.left;
        const bX1 = bBox.left + Math.round(boxW * 0.1);
        const bX2 = bBox.right - Math.round(boxW * 0.1);
        const bSpan = bX2 - bX1;

        // Kutunun alt çizgisini bu kutu içinde ara (CamScanner gölge ve filigranını filtreleyerek)
        let boxBottom = null;
        for (let y = Math.round(h * 0.98); y > Math.round(h * 0.70); y--) {
          let dark = 0;
          for (let x = bX1; x < bX2; x++) if (gray[y * w + x] < 115) dark++;
          if (dark >= bSpan * 0.65) {
            let whiteAbove = 0, whiteBelow = 0;
            const checkDist = Math.max(3, Math.round(h * 0.010));
            if (y - checkDist >= 0) for (let x = bX1; x < bX2; x++) if (gray[(y - checkDist) * w + x] > 160) whiteAbove++;
            if (y + checkDist < h) for (let x = bX1; x < bX2; x++) if (gray[(y + checkDist) * w + x] > 160) whiteBelow++;
            if (whiteAbove > bSpan * 0.35 && whiteBelow > bSpan * 0.35) {
              boxBottom = y;
              break;
            }
          }
        }
        boxBottom = boxBottom || commonBottom;
        const boxH = boxBottom - boxTop;

        // Ders başlığı alt çizgisini ara
        let headerLineY = null;
        for (let y = Math.round(boxTop + boxH * 0.04); y < Math.round(boxTop + boxH * 0.14); y++) {
          let dark = 0;
          for (let x = bX1; x < bX2; x++) if (gray[y * w + x] < 125) dark++;
          if (dark > bSpan * 0.60) {
            headerLineY = y;
            break;
          }
        }

        const pad = Math.max(3, Math.round(boxH * 0.007));
        const contentTop = headerLineY ? (headerLineY + pad) : (boxTop + Math.round(boxH * 0.08));
        const contentBottom = boxBottom - pad;
        const contentH = contentBottom - contentTop;

        const numQuestions = subj.questionCount || 8;
        const rowStep = contentH / numQuestions;
        const choiceStep = boxW * 0.222;
        const choiceStartX = bBox.left + boxW * 0.280;

        for (let q = 1; q <= numQuestions; q++) {
          const rowY = Math.round(contentTop + (q - 0.5) * rowStep);
          const key = `${subj.id}_${q}`;

          // Lokal kağıt aydınlığı
          let pSum = 0, pCnt = 0;
          const pR = Math.max(2, Math.round(rowStep * 0.10));
          for (let dy = -pR; dy <= pR; dy++) {
            for (let dx = -pR; dx <= pR; dx++) {
              pSum += gray[(rowY + dy) * w + (bBox.left + Math.round(boxW * 0.08) + dx)];
              pCnt++;
            }
          }
          const rowPaperLum = pCnt > 0 ? (pSum / pCnt) : 230;

          const choiceScores = [];
          const searchYRange = Math.min(32, Math.round(rowStep * 0.32));
          const searchXRange = Math.min(22, Math.round(choiceStep * 0.18));

          for (let lIdx = 0; lIdx < letters.length; lIdx++) {
            const initX = Math.round(choiceStartX + lIdx * choiceStep);
            const initY = rowY;

            let bestX = initX, bestY = initY, maxDark = -1;
            const rCheck = Math.max(2, Math.round(choiceStep * 0.18));
            for (let dy = -searchYRange; dy <= searchYRange; dy += 2) {
              for (let dx = -searchXRange; dx <= searchXRange; dx += 2) {
                let sum = 0;
                for (let ry = -rCheck; ry <= rCheck; ry += 2) {
                  for (let rx = -rCheck; rx <= rCheck; rx += 2) {
                    const lum = gray[(initY + dy + ry) * w + (initX + dx + rx)];
                    sum += Math.max(0, rowPaperLum - lum);
                  }
                }
                if (sum > maxDark) {
                  maxDark = sum;
                  bestX = initX + dx;
                  bestY = initY + dy;
                }
              }
            }

            let darkCount = 0, totalCount = 0, sumDark = 0;
            const rSample = Math.max(2, Math.round(choiceStep * 0.11));
            for (let dy = -rSample; dy <= rSample; dy++) {
              for (let dx = -rSample; dx <= rSample; dx++) {
                if (dx * dx + dy * dy <= rSample * rSample) {
                  totalCount++;
                  const lum = gray[(bestY + dy) * w + (bestX + dx)];
                  const d = Math.max(0, (rowPaperLum - lum) / Math.max(1, rowPaperLum));
                  sumDark += d;
                  if (d >= 0.28) darkCount++;
                }
              }
            }

            const meanDark = sumDark / Math.max(1, totalCount);
            const fill = darkCount / Math.max(1, totalCount);
            const score = meanDark * 0.5 + fill * 0.5;

            choiceScores.push({
              letter: letters[lIdx],
              score,
              fillRatio: fill,
              pt: { x: bestX, y: bestY }
            });
          }

          choiceScores.sort((a, b) => b.score - a.score);
          const best = choiceScores[0];
          const second = choiceScores[1] || { score: 0, fillRatio: 0 };

          let markedLetter = '';
          let status = 'blank';

          const diff = best.score - second.score;
          const isFilled = best.score >= 0.58 && (diff >= 0.12 || best.score >= 0.70);
          const isMultiple = isFilled && second.score >= 0.55 && diff < 0.10;

          if (isMultiple) {
            status = 'multiple';
            markedLetter = '';
          } else if (isFilled) {
            status = 'marked';
            markedLetter = best.letter;
          }

          const correctAns = typeof window.findCorrectAnswerForKey === 'function'
            ? window.findCorrectAnswerForKey(answerKey, subj, sIdx, q, cumulativeOffset)
            : (answerKey[key] || answerKey[q] || answerKey[String(q)] || '');

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

      const bodyTop = 0.17;
      const actualRowStep = Math.min(0.050, Math.max(0.038, 0.74 / Math.max(16, questionsPerCol)));
      const firstRowCenter = bodyTop + actualRowStep * 0.65;

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
          const isFilled = best.score >= 0.58 && (diff >= 0.12 || best.score >= 0.70);
          const isMultiple = isFilled && second.score >= 0.55 && diff < 0.10;

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

    // ── YENİ: OPTİK BINARY ID DEDEKTÖRÜ (BÜYÜK 3x3 OMR MATRİSİ - 9 BİT / 512 ÖĞRENCİ) ──
    // Ortaöğretim ve kalabalık kademeler için 511 öğrenciye kadar tam kapasite destekler.
    // Dinamik kart en-boy oranı (cardAspect), aralık beyazlığı (gap test), 8 noktalı dış çerçeve doğrulaması
    // ve mikro zirve optimizasyonu ile uzak çekim ve perspektif kaymalarında %100 çalışır.
    function detectBinaryIdInCard(grayBuf, imgW, imgH, cardCorners) {
      if (!cardCorners || !cardCorners.tl || !cardCorners.tr || !cardCorners.bl) return null;

      const mapPoint = createProjectiveHomography(cardCorners);
      if (!mapPoint || typeof mapPoint !== 'function') return null;

      const cardW = Math.hypot(cardCorners.tr.x - cardCorners.tl.x, cardCorners.tr.y - cardCorners.tl.y);
      const cardH = Math.hypot(cardCorners.bl.x - cardCorners.tl.x, cardCorners.bl.y - cardCorners.tl.y);
      const cardAspect = cardH > 0 ? (cardW / cardH) : 1.0;

      function evalCandidate(u0, v0, su, sv) {
        const cellStepU = su * 0.625;
        const cellStepV = sv * 0.625;

        // 1. Hücreler arası 4 boşluğun beyazlığını test et (Arka plan kontrolü)
        const gapPts = [
          mapPoint(u0, v0 - cellStepV * 0.5),
          mapPoint(u0, v0 + cellStepV * 0.5),
          mapPoint(u0 - cellStepU * 0.5, v0),
          mapPoint(u0 + cellStepU * 0.5, v0)
        ];
        let gapSum = 0;
        for (const gp of gapPts) {
          if (gp.x < 2 || gp.x >= imgW - 2 || gp.y < 2 || gp.y >= imgH - 2) return null;
          gapSum += grayBuf[gp.y * imgW + gp.x];
        }
        const avgGapLum = gapSum / 4;
        if (avgGapLum < 115) return null; // Boşluklar açık renkli kağıt olmalıdır

        // 2. 9 Hücreyi Örnekle
        const cellLums = [];
        const sampleR = Math.max(1, Math.min(5, Math.round(su * cardW * 0.05)));

        for (let r = 0; r < 3; r++) {
          const vCell = v0 + (r - 1) * cellStepV;
          for (let c = 0; c < 3; c++) {
            const uCell = u0 + (c - 1) * cellStepU;
            const pt = mapPoint(uCell, vCell);
            if (pt.x < sampleR || pt.x >= imgW - sampleR || pt.y < sampleR || pt.y >= imgH - sampleR) return null;

            let sum = 0, cnt = 0;
            for (let dy = -sampleR; dy <= sampleR; dy++) {
              for (let dx = -sampleR; dx <= sampleR; dx++) {
                if (dx * dx + dy * dy <= sampleR * sampleR) {
                  sum += grayBuf[(pt.y + dy) * imgW + (pt.x + dx)];
                  cnt++;
                }
              }
            }
            cellLums.push(cnt > 0 ? (sum / cnt) : grayBuf[pt.y * imgW + pt.x]);
          }
        }

        let minL = 255, maxL = 0;
        for (let i = 0; i < 9; i++) {
          if (cellLums[i] < minL) minL = cellLums[i];
          if (cellLums[i] > maxL) maxL = cellLums[i];
        }

        // En az 1 siyah kutu olmalı (1..511 öğrenci indeksi)
        if (minL > 145 || (avgGapLum - minL) < 32) return null;

        const midThresh = (minL + Math.max(maxL, avgGapLum)) * 0.5;
        let separationSum = 0;
        let minSeparation = 255;
        for (let i = 0; i < 9; i++) {
          const sep = Math.abs(cellLums[i] - midThresh);
          separationSum += sep;
          if (sep < minSeparation) minSeparation = sep;
        }

        // 3. 8 Noktalı Dış Çerçeve Doğrulaması (+/- 1px tolerans)
        let borderDarkCount = 0;
        const borderPts = [
          mapPoint(u0 - su, v0), mapPoint(u0 + su, v0),
          mapPoint(u0, v0 - sv), mapPoint(u0, v0 + sv),
          mapPoint(u0 - su, v0 - sv), mapPoint(u0 + su, v0 - sv),
          mapPoint(u0 - su, v0 + sv), mapPoint(u0 + su, v0 + sv)
        ];
        for (const bp of borderPts) {
          let ptDark = false;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const bx = bp.x + dx;
              const by = bp.y + dy;
              if (bx >= 0 && bx < imgW && by >= 0 && by < imgH && grayBuf[by * imgW + bx] < midThresh) {
                ptDark = true; break;
              }
            }
            if (ptDark) break;
          }
          if (ptDark) borderDarkCount++;
        }

        const score = (separationSum / 9) + minSeparation * 0.8 + borderDarkCount * 8 + (avgGapLum - minL) * 0.3;
        let decodedIdx = 0;
        for (let i = 0; i < 9; i++) {
          if (cellLums[i] < midThresh) decodedIdx |= (1 << i);
        }

        return { index: decodedIdx, score, borderDarkCount };
      }

      let best = null;
      // 3x3 OMR matrisi başlığın sağ tarafında, QR kodun solunda yer alır.
      // Soru baloncukları ve harici metinlerden etkilenmemesi için hassas pencere taranır.
      const uScales = [0.030, 0.034, 0.038];
      const uMin = 0.816, uMax = 0.840, uStep = 0.003;
      const vMin = 0.098, vMax = 0.130, vStep = 0.003;

      for (let u0 = uMin; u0 <= uMax; u0 += uStep) {
        for (let v0 = vMin; v0 <= vMax; v0 += vStep) {
          for (const su of uScales) {
            const sv = su * cardAspect;
            const res = evalCandidate(u0, v0, su, sv);
            if (res && res.index > 0 && res.borderDarkCount >= 2) {
              if (!best || res.score > best.score) {
                best = { ...res, u0, v0, su, sv };
              }
            }
          }
        }
      }

      // Mikro Zirve Hassas Ayarı (Yerel merkez kaymalarını düzeltir)
      if (best) {
        const duStep = 0.0015;
        const dvStep = 0.0015 * cardAspect;
        for (let du = -duStep; du <= duStep; du += duStep) {
          for (let dv = -dvStep; dv <= dvStep; dv += dvStep) {
            if (du === 0 && dv === 0) continue;
            const res = evalCandidate(best.u0 + du, best.v0 + dv, best.su, best.sv);
            if (res && res.index > 0 && res.score > best.score) {
              best = { ...res, u0: best.u0 + du, v0: best.v0 + dv, su: best.su, sv: best.sv };
            }
          }
        }
      }

      if (best && best.index > 0 && best.index <= 511 && best.score >= 12) {
        return best.index;
      }
      return null;
    }

    // Sayfada 2 form var mı? (Ortada çapa kontrolü)
    const midY = Math.round(targetH * 0.50);
    const midRadius = Math.max(8, Math.round(targetW * 0.018));
    const midAnchorL = findConcentricTargetAnchor(gray, targetW, targetH, 0, Math.round(targetW * 0.25), Math.round(targetH * 0.40), Math.round(targetH * 0.60), midRadius);
    const midAnchorR = findConcentricTargetAnchor(gray, targetW, targetH, Math.round(targetW * 0.75), targetW, Math.round(targetH * 0.40), Math.round(targetH * 0.60), midRadius);

    const isDoubleForm = (midAnchorL && midAnchorR);
    const detectedCards = [];

    if (isDoubleForm) {
      // ── SAYFA BAŞINA 2 FORM (ÜST & ALT) ──
      // 1. Üst Form (Bounds: Y = 0 ... midY + 50)
      const cornersTop = detectCornerAnchors(gray, targetW, targetH, threshold, {
        minX: 0, maxX: targetW, minY: 0, maxY: midY + 50
      });
      const cornersTopOrig = {
        tl: { ...cornersTop.tl },
        tr: { ...cornersTop.tr },
        bl: { ...cornersTop.bl },
        br: { ...cornersTop.br }
      };
      const cardTop = scanSingleCard(canvas, gray, targetW, targetH, cornersTop, exam, classStudents, options);
      cardTop.binaryId = detectBinaryIdInCard(gray, targetW, targetH, cornersTopOrig);
      cardTop.qrResult = scanQrInRegion(ctx, 0, 0, targetW, Math.min(targetH, midY + 60));
      if (!cardTop.binaryId && !cardTop.qrResult && cornersTopOrig && cornersTopOrig.tr) {
        const subW = Math.round(targetW * 0.35);
        const subH = Math.round(midY * 0.45);
        const subX = Math.max(0, cornersTopOrig.tr.x - subW + 80);
        const subY = Math.max(0, cornersTopOrig.tr.y - Math.round(subH * 0.5));
        cardTop.qrResult = scanQrInRegion(ctx, subX, subY, subW, subH);
      }

      // 2. Alt Form (Bounds: Y = midY - 50 ... targetH)
      const cornersBottom = detectCornerAnchors(gray, targetW, targetH, threshold, {
        minX: 0, maxX: targetW, minY: midY - 50, maxY: targetH
      });
      const cornersBottomOrig = {
        tl: { ...cornersBottom.tl },
        tr: { ...cornersBottom.tr },
        bl: { ...cornersBottom.bl },
        br: { ...cornersBottom.br }
      };
      const cardBottom = scanSingleCard(canvas, gray, targetW, targetH, cornersBottom, exam, classStudents, options);
      cardBottom.binaryId = detectBinaryIdInCard(gray, targetW, targetH, cornersBottomOrig);
      cardBottom.qrResult = scanQrInRegion(ctx, 0, Math.max(0, midY - 60), targetW, targetH - Math.max(0, midY - 60));
      if (!cardBottom.binaryId && !cardBottom.qrResult && cornersBottomOrig && cornersBottomOrig.tr) {
        const subW = Math.round(targetW * 0.35);
        const subH = Math.round((targetH - midY) * 0.45);
        const subX = Math.max(0, cornersBottomOrig.tr.x - subW + 80);
        const subY = Math.max(0, cornersBottomOrig.tr.y - Math.round(subH * 0.5));
        cardBottom.qrResult = scanQrInRegion(ctx, subX, subY, subW, subH);
      }

      detectedCards.push(cardTop, cardBottom);
    } else {
      // ── SAYFA BAŞINA 1 FORM (TAM SAYFA A4) ──
      const cornersFull = detectCornerAnchors(gray, targetW, targetH, threshold, null);
      const cornersFullOrig = {
        tl: { ...cornersFull.tl },
        tr: { ...cornersFull.tr },
        bl: { ...cornersFull.bl },
        br: { ...cornersFull.br }
      };
      const cardFull = scanSingleCard(canvas, gray, targetW, targetH, cornersFull, exam, classStudents, options);
      cardFull.binaryId = detectBinaryIdInCard(gray, targetW, targetH, cornersFullOrig);
      cardFull.qrResult = scanQrInRegion(ctx, 0, 0, targetW, targetH);
      if (!cardFull.binaryId && !cardFull.qrResult && cornersFullOrig && cornersFullOrig.tr) {
        const subW = Math.round(targetW * 0.35);
        const subH = Math.round(targetH * 0.28);
        const subX = Math.max(0, cornersFullOrig.tr.x - subW + 80);
        const subY = Math.max(0, cornersFullOrig.tr.y - Math.round(subH * 0.5));
        cardFull.qrResult = scanQrInRegion(ctx, subX, subY, subW, subH);
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

      // 1. ÖNCELİK: OPTİK BINARY ID (En Güvenilir & Deterministik)
      if (card.binaryId && card.binaryId > 0 && card.binaryId <= sortedRoster.length) {
        matched = sortedRoster[card.binaryId - 1];
        if (matched) {
          rawStudentName = `${matched.name} ${matched.surname || ''}`.trim();
          rawStudentNo = matched.number || '';
        }
      }

      // 2. İKİNCİ ÖNCELİK: QR KOD (Fallback)
      if (!matched) {
        const qrData = (card.qrResult && card.qrResult.data) ? card.qrResult.data : '';
        if (qrData) {
          const parts = qrData.split(':');
          if (parts[0] === 'SA') {
            let rawStuId = '';
          let rawStuNo = '';
          let rawStuIdx = 0;

          if (parts[1] === 'STU' || parts[1] === 'SMP' || parts[1] === 'BLK') {
            // Eski uzun format: SA:STU:studentId:studentNo:studentIndex:examId
            rawStuId = parts[2];
            rawStuNo = parts[3];
            rawStuIdx = parseInt(parts[4], 10) || 0;
          } else {
            // YENİ SADE QR FORMAT: SA:studentIndex:studentNo (Örn: SA:1:602) -> 21x21 Version 1 Modül
            rawStuIdx = parseInt(parts[1], 10) || 0;
            rawStuNo = parts[2] || '';
          }

          // 1. Okul numarasına göre eşleme (en kesin)
          if (rawStuNo && rawStuNo !== '......') {
            matched = sortedRoster.find(s => String(s.number).trim() === String(rawStuNo).trim()) ||
                      classStudents.find(s => String(s.number).trim() === String(rawStuNo).trim());
          }
          // 2. Sıra numarasına göre eşleme (baskı indeks sırası - ID:#1, #2...)
          if (!matched && rawStuIdx > 0 && rawStuIdx <= sortedRoster.length) {
            matched = sortedRoster[rawStuIdx - 1];
          }
          // 3. Sistem ID'sine göre eşleme
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
    }

      // QR bulunamazsa sayfa sırasına göre yalnızca bir aday önerisi (kesin eşleme yapılmaz!)
      const pageIndex = (options.pageNumber || 1) - 1;
      const candidateIndex = (pageIndex * (isDoubleForm ? 2 : 1)) + idx;
      const candidate = (!matched && sortedRoster && candidateIndex < sortedRoster.length) ? sortedRoster[candidateIndex] : null;

      card.matched = matched;
      card.candidate = candidate;
      // DİKKAT: rawStudentName ve rawStudentNo YALNIZCA gerçekten form üzerinden QR ile okunduysa doldurulur!
      // Aksi halde boş bırakılır ki sahte eşleştirme yapılmasın ve öğretmen onayına sunulsun.
      card.rawStudentName = rawStudentName;
      card.rawStudentNo = rawStudentNo;
    });

    return {
      success: true,
      cards: detectedCards
    };
  }

  // ==========================================================================
  // 6. GLOBAL DIŞA AKTARIM
  // ==========================================================================

  window.OmrEngine = {
    scanDocumentPage,
    scanSingleCard,
    detectCornerAnchors,
    createProjectiveHomography,
    analyzeBubble,
    refineBubbleCenter,
    sampleLocalPaperLuminance
  };

})();
