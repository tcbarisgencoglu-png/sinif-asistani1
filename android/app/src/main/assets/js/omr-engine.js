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

    if (!tlFound) tlFound = findBestCornerAnchorBlob(gray, w, h, minX, minX + qW, minY, minY + qH, minX, minY, threshold);
    if (!trFound) trFound = findBestCornerAnchorBlob(gray, w, h, maxX - qW, maxX, minY, minY + qH, maxX, minY, threshold);
    if (!brFound) brFound = findBestCornerAnchorBlob(gray, w, h, maxX - qW, maxX, maxY - qH, maxY, maxX, maxY, threshold);
    if (!blFound) blFound = findBestCornerAnchorBlob(gray, w, h, minX, minX + qW, maxY - qH, maxY, minX, maxY, threshold);

    if (tlFound) corners.tl = tlFound;
    if (trFound) corners.tr = trFound;
    if (brFound) corners.br = brFound;
    if (blFound) corners.bl = blFound;

    // 4. Köşe Kurtarma (Paralelkenar Tamamlama)
    const foundCount = (tlFound ? 1 : 0) + (trFound ? 1 : 0) + (brFound ? 1 : 0) + (blFound ? 1 : 0);
    if (foundCount === 3) {
      if (!tlFound) corners.tl = { x: corners.tr.x + corners.bl.x - corners.br.x, y: corners.tr.y + corners.bl.y - corners.br.y };
      else if (!trFound) corners.tr = { x: corners.tl.x + corners.br.x - corners.bl.x, y: corners.tl.y + corners.br.y - corners.bl.y };
      else if (!brFound) corners.br = { x: corners.tr.x + corners.bl.x - corners.tl.x, y: corners.tr.y + corners.bl.y - corners.tl.y };
      else if (!blFound) corners.bl = { x: corners.tl.x + corners.br.x - corners.tr.x, y: corners.tl.y + corners.br.y - corners.tr.y };
    }

    return corners;
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
    const rInner = Math.max(3, Math.round(radius * 0.72));
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
      if (v >= 0.22) darkCount++;
    }

    const fillRatio = darkCount / totalPixels;
    const meanDarkness = sumDark / totalPixels;
    const score = (medianDarkness * 0.45) + (p75Darkness * 0.30) + (fillRatio * 0.25);

    return { score, fillRatio, medianDarkness, p75Darkness, meanDarkness };
  }

  function refineBubbleCenter(gray, w, h, initialPt, radius, rowPaperLum) {
    const searchStep = Math.max(1, Math.round(radius * 0.25));
    let bestX = initialPt.x;
    let bestY = initialPt.y;
    let maxDarkSum = -1;
    const rCheck = Math.max(2, Math.round(radius * 0.5));
    const rCheck2 = rCheck * rCheck;

    for (let dy = -searchStep * 2; dy <= searchStep * 2; dy += searchStep) {
      for (let dx = -searchStep * 2; dx <= searchStep * 2; dx += searchStep) {
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
    const qCount = parseInt(exam.totalQuestions, 10) || 20;
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

      const bodyTop = 0.18;
      const bodyBottom = 0.93;
      const bodyHeight = bodyBottom - bodyTop;

      const gridStartU = 0.035;
      const gridEndU = 0.965;
      const gridWidth = gridEndU - gridStartU;
      const subjColWidth = gridWidth / numSubjects;

      examSubjects.forEach((subj, sIdx) => {
        let subjCorrect = 0;
        let subjWrong = 0;
        let subjBlank = 0;

        const subUStart = gridStartU + sIdx * subjColWidth + 0.005;
        const subUEnd = subUStart + subjColWidth - 0.010;
        const subW = subUEnd - subUStart;

        const numQuestions = subj.questionCount || 10;
        const rowStep = bodyHeight / Math.max(1, numQuestions);

        for (let q = 1; q <= numQuestions; q++) {
          const rowV = bodyTop + (q - 0.5) * rowStep;
          const key = `${subj.id}_${q}`;

          // Lokal kağıt aydınlığı
          const rowSamplePt = mapPoint(subUStart + subW * 0.15, rowV);
          const rowPaperLum = sampleLocalPaperLuminance(gray, w, h, rowSamplePt, sampleRadius);

          const choiceScores = [];
          for (let lIdx = 0; lIdx < letters.length; lIdx++) {
            const choiceU = subUStart + subW * (0.24 + (lIdx + 0.5) * (0.74 / letters.length));
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

          if (best.score >= minScore && best.fillRatio >= minFill) {
            if (second.score >= minScore && second.fillRatio >= minFill && (best.score - second.score) < 0.08) {
              status = 'multiple';
              markedLetter = '';
            } else {
              status = 'marked';
              markedLetter = best.letter;
            }
          }

          const correctAns = typeof window.findCorrectAnswerForKey === 'function'
            ? window.findCorrectAnswerForKey(answerKey, subj, sIdx, q, cumulativeOffset)
            : (answerKey[key] || '');

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

          if (best.score >= minScore && best.fillRatio >= minFill) {
            if (second.score >= minScore && second.fillRatio >= minFill && (best.score - second.score) < 0.08) {
              status = 'multiple';
              markedLetter = '';
            } else {
              status = 'marked';
              markedLetter = best.letter;
            }
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

    // Yardımcı: Belirli bir bölgede QR kod tarama (jsQR)
    function scanQrInRegion(context, rx, ry, rw, rh) {
      if (typeof window.jsQR !== 'function' || rw <= 20 || rh <= 20) return null;
      try {
        const subData = context.getImageData(Math.max(0, rx), Math.max(0, ry), rw, rh);
        return window.jsQR(subData.data, rw, rh, { inversionAttempts: 'attemptBoth' });
      } catch (e) {
        return null;
      }
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
      const cardTop = scanSingleCard(canvas, gray, targetW, targetH, cornersTop, exam, classStudents, options);
      cardTop.qrResult = scanQrInRegion(ctx, 0, 0, targetW, Math.min(targetH, midY + 60));

      // 2. Alt Form (Bounds: Y = midY - 50 ... targetH)
      const cornersBottom = detectCornerAnchors(gray, targetW, targetH, threshold, {
        minX: 0, maxX: targetW, minY: midY - 50, maxY: targetH
      });
      const cardBottom = scanSingleCard(canvas, gray, targetW, targetH, cornersBottom, exam, classStudents, options);
      cardBottom.qrResult = scanQrInRegion(ctx, 0, Math.max(0, midY - 60), targetW, targetH - Math.max(0, midY - 60));

      detectedCards.push(cardTop, cardBottom);
    } else {
      // ── SAYFA BAŞINA 1 FORM (TAM SAYFA A4) ──
      const cornersFull = detectCornerAnchors(gray, targetW, targetH, threshold, null);
      const cardFull = scanSingleCard(canvas, gray, targetW, targetH, cornersFull, exam, classStudents, options);
      cardFull.qrResult = scanQrInRegion(ctx, 0, 0, targetW, targetH);
      detectedCards.push(cardFull);
    }

    // QR Kod veya Liste Sırası ile Öğrenci Eşleme
    detectedCards.forEach((card, idx) => {
      let matched = null;
      let rawStudentName = '';
      let rawStudentNo = '';

      const qrData = (card.qrResult && card.qrResult.data) ? card.qrResult.data : '';
      if (qrData) {
        const parts = qrData.split(':');
        if (parts[0] === 'SA') {
          const rawStuId = parts[2];
          const rawStuNo = parts[3];
          const rawStuIdx = parseInt(parts[4], 10) || 0;

          if (rawStuId) matched = classStudents.find(s => String(s.id) === String(rawStuId));
          if (!matched && rawStuNo) matched = classStudents.find(s => String(s.number).trim() === String(rawStuNo).trim());
          if (!matched && rawStuIdx > 0 && rawStuIdx <= classStudents.length) matched = classStudents[rawStuIdx - 1];

          if (matched) {
            rawStudentName = `${matched.name} ${matched.surname || ''}`.trim();
            rawStudentNo = matched.number || '';
          }
        }
      }

      // QR bulunamazsa sayfa sırası adayı (1. sayfa -> 1. öğrenci)
      const pageIndex = (options.pageNumber || 1) - 1;
      const candidateIndex = (pageIndex * (isDoubleForm ? 2 : 1)) + idx;
      const candidate = (classStudents && candidateIndex < classStudents.length) ? classStudents[candidateIndex] : null;

      card.matched = matched;
      card.candidate = candidate;
      card.rawStudentName = rawStudentName || (matched ? `${matched.name} ${matched.surname || ''}`.trim() : (candidate ? `${candidate.name} ${candidate.surname || ''}`.trim() : ''));
      card.rawStudentNo = rawStudentNo || (matched ? matched.number : (candidate ? candidate.number : ''));
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
