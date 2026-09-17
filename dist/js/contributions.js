(() => {
  // Sınıf Katkı & Tedarik Takibi Modülü

  let toastCallbackFn = null;
  let currentActiveContributionId = null;
  let currentFilter = 'all'; // 'all' | 'completed' | 'pending'
  let currentSearchQuery = '';

  function getStudentsList() {
    if (window.stateManager && typeof window.stateManager.getStudents === 'function') {
      return window.stateManager.getStudents() || [];
    }
    if (window.stateManager && typeof window.stateManager.loadState === 'function') {
      const st = window.stateManager.loadState();
      return (st && st.students) || [];
    }
    if (window.stateManager && window.stateManager.state && window.stateManager.state.students) {
      return window.stateManager.state.students || [];
    }
    return [];
  }

  // DOM Elemanları
  let toolsLandingView;
  let toolsContributionsView;
  let btnLaunchContributions;
  let btnBackToToolsFromContributions;

  let btnShowAddContributionModal;
  let btnCreateFirstContribution;
  let contribCampaignsListView;
  let contribCampaignsGrid;
  let contribEmptyState;

  // Detay Görünümü DOM
  let contribCampaignDetailView;
  let btnBackToCampaignsList;
  let contribDetailTitle;
  let contribDetailTypeBadge;
  let contribDetailTargetText;
  let contribDetailDueDate;
  let btnContribMarkAllCompleted;
  let btnContribPrintReport;

  // İstatistik DOM
  let contribStatTotalStudents;
  let contribStatCompletedCount;
  let contribStatPendingCount;
  let contribStatMoneyBox;
  let contribStatMoneyLabel;
  let contribStatMoneyValue;

  // Tablo & Filtre DOM
  let contribStatusFilterTabs;
  let filterCountAll;
  let filterCountCompleted;
  let filterCountPending;
  let contribSearchStudent;
  let contribThAmount;
  let contribStudentsTableBody;

  // Modal DOM
  let modalAddContribution;
  let modalContribTitleHeader;
  let contribEditId;
  let contribInputTitle;
  let contribTypeMaterial;
  let contribTypeMoney;
  let contribTypeMaterialLabel;
  let contribTypeMoneyLabel;
  let contribGroupMaterial;
  let contribGroupMoney;
  let contribInputMaterial;
  let contribInputAmount;
  let contribInputDueDate;
  let contribInputDescription;
  let btnCancelAddContribution;
  let btnSaveContribution;

  // Yazdırma Alanı DOM
  let contributionPrintArea;

  function setupContributions(toastCallback) {
    toastCallbackFn = toastCallback;

    // DOM Elemanlarını Bağla
    toolsLandingView = document.getElementById('tools-landing-view');
    toolsContributionsView = document.getElementById('tools-contributions-view');
    btnLaunchContributions = document.getElementById('btn-launch-contributions');
    btnBackToToolsFromContributions = document.getElementById('btn-back-to-tools-from-contributions');

    btnShowAddContributionModal = document.getElementById('btn-show-add-contribution-modal');
    btnCreateFirstContribution = document.getElementById('btn-create-first-contribution');
    contribCampaignsListView = document.getElementById('contrib-campaigns-list-view');
    contribCampaignsGrid = document.getElementById('contrib-campaigns-grid');
    contribEmptyState = document.getElementById('contrib-empty-state');

    // Detay
    contribCampaignDetailView = document.getElementById('contrib-campaign-detail-view');
    btnBackToCampaignsList = document.getElementById('btn-back-to-campaigns-list');
    contribDetailTitle = document.getElementById('contrib-detail-title');
    contribDetailTypeBadge = document.getElementById('contrib-detail-type-badge');
    contribDetailTargetText = document.getElementById('contrib-detail-target-text');
    contribDetailDueDate = document.getElementById('contrib-detail-due-date');
    btnContribMarkAllCompleted = document.getElementById('btn-contrib-mark-all-completed');
    btnContribPrintReport = document.getElementById('btn-contrib-print-report');

    // İstatistik
    contribStatTotalStudents = document.getElementById('contrib-stat-total-students');
    contribStatCompletedCount = document.getElementById('contrib-stat-completed-count');
    contribStatPendingCount = document.getElementById('contrib-stat-pending-count');
    contribStatMoneyBox = document.getElementById('contrib-stat-money-box');
    contribStatMoneyLabel = document.getElementById('contrib-stat-money-label');
    contribStatMoneyValue = document.getElementById('contrib-stat-money-value');

    // Tablo
    contribStatusFilterTabs = document.getElementById('contrib-status-filter-tabs');
    filterCountAll = document.getElementById('filter-count-all');
    filterCountCompleted = document.getElementById('filter-count-completed');
    filterCountPending = document.getElementById('filter-count-pending');
    contribSearchStudent = document.getElementById('contrib-search-student');
    contribThAmount = document.getElementById('contrib-th-amount');
    contribStudentsTableBody = document.getElementById('contrib-students-table-body');

    // Modal
    modalAddContribution = document.getElementById('modal-add-contribution');
    modalContribTitleHeader = document.getElementById('modal-contrib-title-header');
    contribEditId = document.getElementById('contrib-edit-id');
    contribInputTitle = document.getElementById('contrib-input-title');
    contribTypeMaterial = document.getElementById('contrib-type-material');
    contribTypeMoney = document.getElementById('contrib-type-money');
    contribTypeMaterialLabel = document.getElementById('contrib-type-material-label');
    contribTypeMoneyLabel = document.getElementById('contrib-type-money-label');
    contribGroupMaterial = document.getElementById('contrib-group-material');
    contribGroupMoney = document.getElementById('contrib-group-money');
    contribInputMaterial = document.getElementById('contrib-input-material');
    contribInputAmount = document.getElementById('contrib-input-amount');
    contribInputDueDate = document.getElementById('contrib-input-due-date');
    contribInputDescription = document.getElementById('contrib-input-description');
    btnCancelAddContribution = document.getElementById('btn-cancel-add-contribution');
    btnSaveContribution = document.getElementById('btn-save-contribution');

    // Yazdırma
    contributionPrintArea = document.getElementById('contribution-print-area');

    // Navigasyon Eventleri
    if (btnLaunchContributions) {
      btnLaunchContributions.addEventListener('click', () => {
        if (toolsLandingView) toolsLandingView.style.display = 'none';
        if (toolsContributionsView) toolsContributionsView.style.display = 'block';
        showCampaignsList();
      });
    }

    if (btnBackToToolsFromContributions) {
      btnBackToToolsFromContributions.addEventListener('click', () => {
        if (toolsContributionsView) toolsContributionsView.style.display = 'none';
        if (toolsLandingView) toolsLandingView.style.display = 'block';
      });
    }

    if (btnBackToCampaignsList) {
      btnBackToCampaignsList.addEventListener('click', () => {
        showCampaignsList();
      });
    }

    // Modal Açma / Kapatma
    const openAddModal = () => {
      resetContributionModalForm();
      if (modalContribTitleHeader) modalContribTitleHeader.textContent = 'Yeni Katkı / Tedarik Takibi Başlat';
      if (modalAddContribution) modalAddContribution.classList.add('active');
    };

    if (btnShowAddContributionModal) btnShowAddContributionModal.addEventListener('click', openAddModal);
    if (btnCreateFirstContribution) btnCreateFirstContribution.addEventListener('click', openAddModal);

    if (modalAddContribution) {
      modalAddContribution.querySelectorAll('.close-btn, #btn-cancel-add-contribution').forEach(btn => {
        btn.addEventListener('click', () => {
          modalAddContribution.classList.remove('active');
        });
      });
    }

    // Modal Tür Seçimi Değişimi
    if (contribTypeMaterial && contribTypeMoney) {
      contribTypeMaterial.addEventListener('change', () => syncModalTypeUI('material'));
      contribTypeMoney.addEventListener('change', () => syncModalTypeUI('money'));
    }

    // Kaydet Butonu
    if (btnSaveContribution) {
      btnSaveContribution.addEventListener('click', saveContributionCampaign);
    }

    // Tümünü Getirdi Yap
    if (btnContribMarkAllCompleted) {
      btnContribMarkAllCompleted.addEventListener('click', markAllStudentsCompleted);
    }

    // Yazdır / Rapor
    if (btnContribPrintReport) {
      btnContribPrintReport.addEventListener('click', printContributionReport);
    }

    // Filtreleme Sekmeleri
    if (contribStatusFilterTabs) {
      contribStatusFilterTabs.querySelectorAll('.sub-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          contribStatusFilterTabs.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          currentFilter = btn.getAttribute('data-filter') || 'all';
          renderCampaignDetail();
        });
      });
    }

    // Öğrenci Arama
    if (contribSearchStudent) {
      contribSearchStudent.addEventListener('input', (e) => {
        currentSearchQuery = (e.target.value || '').toLowerCase().trim();
        renderCampaignDetail();
      });
    }

    // Global Durum Değişikliği Dinleyici
    document.addEventListener('stateChanged', () => {
      if (toolsContributionsView && toolsContributionsView.style.display === 'block') {
        if (currentActiveContributionId) {
          renderCampaignDetail();
        } else {
          renderCampaignsGrid();
        }
      }
    });
  }

  // --- KAMPANYALAR LİSTESİ GÖRÜNÜMÜ ---

  function showCampaignsList() {
    currentActiveContributionId = null;
    if (contribCampaignDetailView) contribCampaignDetailView.style.display = 'none';
    if (contribCampaignsListView) contribCampaignsListView.style.display = 'block';
    renderCampaignsGrid();
  }

  function renderCampaignsGrid() {
    if (!contribCampaignsGrid || !contribEmptyState) return;

    const contributions = stateManager.getContributions();
    const students = getStudentsList();
    const totalStudents = students.length;

    contribCampaignsGrid.innerHTML = '';

    if (contributions.length === 0) {
      contribEmptyState.style.display = 'block';
      contribCampaignsGrid.style.display = 'none';
      return;
    }

    contribEmptyState.style.display = 'none';
    contribCampaignsGrid.style.display = 'grid';

    contributions.forEach(item => {
      const records = item.records || {};
      let completedCount = 0;
      let totalCollectedMoney = 0;

      students.forEach(std => {
        const rec = records[std.id];
        if (rec) {
          if (rec.status === 'completed') {
            completedCount++;
            totalCollectedMoney += item.type === 'money' ? (rec.paidAmount || item.targetAmount || 0) : 0;
          } else if (rec.status === 'partial') {
            totalCollectedMoney += Number(rec.paidAmount) || 0;
          }
        }
      });

      const percent = totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0;
      const card = document.createElement('div');
      card.className = `game-landing-card glass-card contrib-card ${item.type === 'money' ? 'type-money' : 'type-material'}`;

      let typeBadge = '';
      let targetDisplay = '';
      if (item.type === 'money') {
        typeBadge = `<span class="badge" style="background: rgba(16,185,129,0.15); color: #10b981; font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 6px;">💵 Ücret / Para</span>`;
        targetDisplay = `<span style="font-weight: 700; color: var(--text-primary);">Kişi Başı: ${item.targetAmount || 0} ₺</span>`;
      } else {
        typeBadge = `<span class="badge" style="background: rgba(59,130,246,0.15); color: #3b82f6; font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 6px;">📦 Malzeme / Tedarik</span>`;
        targetDisplay = `<span style="font-weight: 700; color: var(--text-primary);">${escapeHtml(item.materialUnit || '1 Adet')}</span>`;
      }

      const dateStr = item.dueDate ? new Date(item.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Belirtilmedi';

      card.innerHTML = `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
            <div style="font-size: 2rem;">${item.type === 'money' ? '💵' : '📦'}</div>
            ${typeBadge}
          </div>
          <h3 title="${escapeHtml(item.title)}" style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.35rem; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${escapeHtml(item.title)}
          </h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>${targetDisplay}</span>
            <span>•</span>
            <span>Son: ${dateStr}</span>
          </p>

          <!-- İlerleme Çubuğu -->
          <div style="display: flex; justify-content: space-between; font-size: 0.78rem; font-weight: 600; color: var(--text-secondary);">
            <span>Teslim Eden: ${completedCount} / ${totalStudents}</span>
            <span>%${percent}</span>
          </div>
          <div class="contrib-progress-wrap">
            <div class="contrib-progress-bar" style="width: ${percent}%; background: ${item.type === 'money' ? '#10b981' : 'var(--primary)'};"></div>
          </div>

          ${item.type === 'money' ? `
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.35rem;">
              Toplanan: <strong style="color: #10b981;">${totalCollectedMoney} ₺</strong> / Hedef: ${(item.targetAmount || 0) * totalStudents} ₺
            </div>
          ` : ''}
        </div>

        <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1.25rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
          <button class="btn btn-primary btn-sm btn-open-contrib" style="padding: 0.35rem 0.75rem; font-size: 0.82rem; flex: 1;">
            <i data-lucide="list-checks" style="width: 14px; height: 14px;"></i> Listeyi Aç
          </button>
          <button class="btn btn-secondary btn-sm btn-edit-contrib" title="Düzenle" style="padding: 0.35rem 0.5rem;">
            <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
          </button>
          <button class="btn btn-danger btn-sm btn-delete-contrib" title="Sil" style="padding: 0.35rem 0.5rem;">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      `;

      card.querySelector('.btn-open-contrib').addEventListener('click', () => openCampaignDetail(item.id));
      card.querySelector('.btn-edit-contrib').addEventListener('click', () => openEditContributionModal(item));
      card.querySelector('.btn-delete-contrib').addEventListener('click', () => deleteContributionConfirm(item));

      contribCampaignsGrid.appendChild(card);
    });

    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  // --- KAMPANYA DETAY & ÖĞRENCİ TAKİP ---

  function openCampaignDetail(contribId) {
    currentActiveContributionId = contribId;
    currentFilter = 'all';
    currentSearchQuery = '';
    if (contribSearchStudent) contribSearchStudent.value = '';

    if (contribCampaignsListView) contribCampaignsListView.style.display = 'none';
    if (contribCampaignDetailView) contribCampaignDetailView.style.display = 'block';

    renderCampaignDetail();
  }

  function renderCampaignDetail() {
    if (!currentActiveContributionId) return;

    const contributions = stateManager.getContributions();
    const item = contributions.find(c => c.id === currentActiveContributionId);
    if (!item) {
      showCampaignsList();
      return;
    }

    const students = getStudentsList();
    const records = item.records || {};

    // Başlık Bilgisi
    if (contribDetailTitle) contribDetailTitle.textContent = item.title;
    if (contribDetailTypeBadge) {
      contribDetailTypeBadge.className = item.type === 'money' ? 'badge bg-success-light text-success' : 'badge bg-primary-light text-primary';
      contribDetailTypeBadge.textContent = item.type === 'money' ? '💵 Maddi Katkı / Ücret' : '📦 Malzeme / Tedarik';
    }
    if (contribDetailTargetText) {
      contribDetailTargetText.textContent = item.type === 'money' ? `Kişi Başı: ${item.targetAmount || 0} ₺` : `İstenen: ${item.materialUnit || '1 Adet'}`;
    }
    if (contribDetailDueDate) {
      contribDetailDueDate.textContent = item.dueDate ? `Son Tarih: ${new Date(item.dueDate).toLocaleDateString('tr-TR')}` : 'Son Tarih: Belirtilmedi';
    }

    // İstatistik Hesaplama
    let completedCount = 0;
    let pendingCount = 0;
    let totalCollectedMoney = 0;

    students.forEach(std => {
      const rec = records[std.id] || { status: 'pending', paidAmount: 0 };
      if (rec.status === 'completed') {
        completedCount++;
        totalCollectedMoney += item.type === 'money' ? (Number(rec.paidAmount) || Number(item.targetAmount) || 0) : 0;
      } else if (rec.status === 'partial') {
        pendingCount++;
        totalCollectedMoney += Number(rec.paidAmount) || 0;
      } else {
        pendingCount++;
      }
    });

    if (contribStatTotalStudents) contribStatTotalStudents.textContent = students.length;
    if (contribStatCompletedCount) contribStatCompletedCount.textContent = completedCount;
    if (contribStatPendingCount) contribStatPendingCount.textContent = pendingCount;

    if (contribStatMoneyBox) {
      if (item.type === 'money') {
        contribStatMoneyBox.style.display = 'block';
        if (contribStatMoneyLabel) contribStatMoneyLabel.textContent = 'Toplanan Tutar';
        if (contribStatMoneyValue) contribStatMoneyValue.textContent = `${totalCollectedMoney} ₺`;
      } else {
        contribStatMoneyBox.style.display = 'block';
        if (contribStatMoneyLabel) contribStatMoneyLabel.textContent = 'Teslimat Oranı';
        const percent = students.length > 0 ? Math.round((completedCount / students.length) * 100) : 0;
        if (contribStatMoneyValue) contribStatMoneyValue.textContent = `%${percent}`;
      }
    }

    // Filtre Sayaçları
    if (filterCountAll) filterCountAll.textContent = students.length;
    if (filterCountCompleted) filterCountCompleted.textContent = completedCount;
    if (filterCountPending) filterCountPending.textContent = pendingCount;

    // Tablo Başlığı
    if (contribThAmount) {
      contribThAmount.textContent = item.type === 'money' ? 'Ödenen Tutar' : 'Miktar / Birim';
    }

    // Öğrencileri Filtrele ve Sırala (Numaraya göre)
    const sortedStudents = [...students].sort((a, b) => {
      const numA = parseInt(a.number, 10) || 0;
      const numB = parseInt(b.number, 10) || 0;
      return numA - numB;
    });

    const filteredStudents = sortedStudents.filter(std => {
      const rec = records[std.id] || { status: 'pending' };
      
      // Sekme Filtresi
      if (currentFilter === 'completed' && rec.status !== 'completed') return false;
      if (currentFilter === 'pending' && rec.status === 'completed') return false;

      // Metin Arama
      if (currentSearchQuery) {
        const fullName = `${std.name || ''} ${std.surname || ''}`.toLowerCase();
        const num = (std.number || '').toString();
        if (!fullName.includes(currentSearchQuery) && !num.includes(currentSearchQuery)) {
          return false;
        }
      }

      return true;
    });

    // Tabloyu Oluştur
    if (!contribStudentsTableBody) return;
    contribStudentsTableBody.innerHTML = '';

    if (filteredStudents.length === 0) {
      contribStudentsTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            Kriterlere uygun öğrenci bulunamadı.
          </td>
        </tr>
      `;
      return;
    }

    filteredStudents.forEach(std => {
      const rec = records[std.id] || { status: 'pending', paidAmount: 0, note: '' };
      const tr = document.createElement('tr');
      tr.style.transition = 'background var(--transition-fast)';

      // Durum Butonları Grubu
      let statusButtonsHtml = '';
      if (item.type === 'money') {
        statusButtonsHtml = `
          <div class="contrib-status-btn-group">
            <button type="button" class="contrib-status-btn ${rec.status === 'completed' ? 'active status-completed' : ''}" data-status="completed" title="Tam Ödedi">
              <i data-lucide="check" style="width: 13px; height: 13px;"></i> Ödedi
            </button>
            <button type="button" class="contrib-status-btn ${rec.status === 'partial' ? 'active status-partial' : ''}" data-status="partial" title="Kısmi Ödedi">
              <i data-lucide="clock" style="width: 13px; height: 13px;"></i> Kısmi
            </button>
            <button type="button" class="contrib-status-btn ${rec.status === 'pending' ? 'active status-pending' : ''}" data-status="pending" title="Ödemedi">
              <i data-lucide="x" style="width: 13px; height: 13px;"></i> Bekliyor
            </button>
          </div>
        `;
      } else {
        statusButtonsHtml = `
          <div class="contrib-status-btn-group">
            <button type="button" class="contrib-status-btn ${rec.status === 'completed' ? 'active status-completed' : ''}" data-status="completed" title="Getirdi / Teslim Etti">
              <i data-lucide="check" style="width: 13px; height: 13px;"></i> Getirdi
            </button>
            <button type="button" class="contrib-status-btn ${rec.status === 'pending' ? 'active status-pending' : ''}" data-status="pending" title="Henüz Getirmedi">
              <i data-lucide="x" style="width: 13px; height: 13px;"></i> Bekliyor
            </button>
          </div>
        `;
      }

      // Miktar / Tutar Girişi
      let amountInputHtml = '';
      if (item.type === 'money') {
        const val = rec.status === 'completed' && !rec.paidAmount ? item.targetAmount : (rec.paidAmount || 0);
        amountInputHtml = `
          <div style="display: flex; align-items: center; justify-content: center; gap: 0.25rem;">
            <input type="number" class="form-control form-control-sm contrib-paid-input" min="0" value="${val}" style="width: 75px; text-align: right; padding: 0.2rem 0.4rem; height: 28px;">
            <span style="font-weight: 600; font-size: 0.85rem; color: var(--text-muted);">₺</span>
          </div>
        `;
      } else {
        amountInputHtml = `
          <span style="font-size: 0.82rem; color: var(--text-muted); display: block; text-align: center;">
            ${escapeHtml(item.materialUnit || '1 Adet')}
          </span>
        `;
      }

      tr.innerHTML = `
        <td style="text-align: center; font-weight: 700; color: var(--text-secondary);">${escapeHtml(std.number || '-')}</td>
        <td>
          <strong style="color: var(--text-primary); font-size: 0.95rem;">${escapeHtml(std.name)} ${escapeHtml(std.surname)}</strong>
        </td>
        <td style="text-align: center; font-size: 0.82rem; color: var(--text-muted);">${escapeHtml(std.branch || '-')}</td>
        <td>${amountInputHtml}</td>
        <td style="text-align: center;">${statusButtonsHtml}</td>
        <td>
          <input type="text" class="form-control form-control-sm contrib-note-input" placeholder="Not ekleyin..." value="${escapeHtml(rec.note || '')}" style="height: 28px; font-size: 0.8rem; width: 100%;">
        </td>
      `;

      // Eventleri Bağla
      // Durum Butonları
      tr.querySelectorAll('.contrib-status-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const newStatus = btn.getAttribute('data-status');
          const latestItems = stateManager.getContributions() || [];
          const curItem = latestItems.find(c => c.id === item.id) || item;
          const curRec = (curItem.records && curItem.records[std.id]) || {};
          let paid = curRec.paidAmount || 0;
          if (newStatus === 'completed') {
            paid = curItem.type === 'money' ? (curItem.targetAmount || 0) : 0;
          } else if (newStatus === 'pending') {
            paid = 0;
          }
          stateManager.updateContributionStudentStatus(curItem.id, std.id, {
            status: newStatus,
            paidAmount: paid,
            note: curRec.note || '',
            date: new Date().toISOString().slice(0, 10)
          });
        });
      });

      // Tutar Girişi Değişimi
      const paidInput = tr.querySelector('.contrib-paid-input');
      if (paidInput) {
        paidInput.addEventListener('change', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const newPaid = Number(e.target.value) || 0;
          const latestItems = stateManager.getContributions() || [];
          const curItem = latestItems.find(c => c.id === item.id) || item;
          const curRec = (curItem.records && curItem.records[std.id]) || {};
          let newStatus = curRec.status || 'pending';
          if (newPaid >= curItem.targetAmount && curItem.targetAmount > 0) {
            newStatus = 'completed';
          } else if (newPaid > 0 && newPaid < curItem.targetAmount) {
            newStatus = 'partial';
          } else if (newPaid === 0) {
            newStatus = 'pending';
          }
          stateManager.updateContributionStudentStatus(curItem.id, std.id, {
            status: newStatus,
            paidAmount: newPaid,
            note: curRec.note || '',
            date: new Date().toISOString().slice(0, 10)
          });
        });
      }

      // Not Girişi Değişimi
      const noteInput = tr.querySelector('.contrib-note-input');
      if (noteInput) {
        noteInput.addEventListener('change', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const newNote = (e.target.value || '').trim();
          const latestItems = stateManager.getContributions() || [];
          const curItem = latestItems.find(c => c.id === item.id) || item;
          const curRec = (curItem.records && curItem.records[std.id]) || {};
          stateManager.updateContributionStudentStatus(curItem.id, std.id, {
            status: curRec.status || 'pending',
            paidAmount: curRec.paidAmount || 0,
            note: newNote,
            date: curRec.date || new Date().toISOString().slice(0, 10)
          });
        });
      }

      contribStudentsTableBody.appendChild(tr);
    });

    if (window.safeCreateIcons) window.safeCreateIcons();
  }

  // Tümünü Getirdi Yap
  async function markAllStudentsCompleted() {
    if (!currentActiveContributionId) return;
    const contributions = stateManager.getContributions();
    const item = contributions.find(c => c.id === currentActiveContributionId);
    if (!item) return;

    const students = getStudentsList();
    const isConfirmed = window.confirmAsync ? 
      await window.confirmAsync(`Tüm öğrencileri (${students.length} öğrenci) "Getirdi / Ödedi" olarak işaretlemek istediğinize emin misiniz?`) :
      confirm(`Tüm öğrencileri (${students.length} öğrenci) "Getirdi / Ödedi" olarak işaretlemek istediğinize emin misiniz?`);

    if (isConfirmed) {
      const studentIds = students.map(s => s.id);
      stateManager.batchUpdateContributionStatus(item.id, studentIds, 'completed', item.type === 'money' ? item.targetAmount : 0);
      if (toastCallbackFn) toastCallbackFn('Tüm öğrenciler "Getirdi / Ödedi" olarak işaretlendi.', 'success');
    }
  }

  // --- MODAL İŞLEMLERİ ---

  function syncModalTypeUI(type) {
    if (type === 'money') {
      contribTypeMoney.checked = true;
      if (contribTypeMoneyLabel) {
        contribTypeMoneyLabel.style.borderColor = 'var(--primary)';
        contribTypeMoneyLabel.style.borderWidth = '2px';
      }
      if (contribTypeMaterialLabel) {
        contribTypeMaterialLabel.style.borderColor = 'var(--border-color)';
        contribTypeMaterialLabel.style.borderWidth = '1px';
      }
      if (contribGroupMoney) contribGroupMoney.style.display = 'block';
      if (contribGroupMaterial) contribGroupMaterial.style.display = 'none';
    } else {
      contribTypeMaterial.checked = true;
      if (contribTypeMaterialLabel) {
        contribTypeMaterialLabel.style.borderColor = 'var(--primary)';
        contribTypeMaterialLabel.style.borderWidth = '2px';
      }
      if (contribTypeMoneyLabel) {
        contribTypeMoneyLabel.style.borderColor = 'var(--border-color)';
        contribTypeMoneyLabel.style.borderWidth = '1px';
      }
      if (contribGroupMoney) contribGroupMoney.style.display = 'none';
      if (contribGroupMaterial) contribGroupMaterial.style.display = 'block';
    }
  }

  function resetContributionModalForm() {
    if (contribEditId) contribEditId.value = '';
    if (contribInputTitle) contribInputTitle.value = '';
    if (contribInputMaterial) contribInputMaterial.value = '1 Top A4 Kağıdı';
    if (contribInputAmount) contribInputAmount.value = '';
    if (contribInputDueDate) contribInputDueDate.value = '';
    if (contribInputDescription) contribInputDescription.value = '';
    syncModalTypeUI('material');
  }

  function openEditContributionModal(item) {
    resetContributionModalForm();
    if (modalContribTitleHeader) modalContribTitleHeader.textContent = 'Takip Bilgilerini Düzenle';
    if (contribEditId) contribEditId.value = item.id;
    if (contribInputTitle) contribInputTitle.value = item.title;
    if (contribInputMaterial) contribInputMaterial.value = item.materialUnit || '';
    if (contribInputAmount) contribInputAmount.value = item.targetAmount || '';
    if (contribInputDueDate) contribInputDueDate.value = item.dueDate || '';
    if (contribInputDescription) contribInputDescription.value = item.description || '';
    syncModalTypeUI(item.type || 'material');
    if (modalAddContribution) modalAddContribution.classList.add('active');
  }

  function saveContributionCampaign() {
    const title = (contribInputTitle.value || '').trim();
    if (!title) {
      if (toastCallbackFn) toastCallbackFn('Lütfen bir kampanya/takip başlığı girin.', 'danger');
      return;
    }

    const type = contribTypeMoney.checked ? 'money' : 'material';
    const targetAmount = Number(contribInputAmount.value) || 0;
    const materialUnit = (contribInputMaterial.value || '').trim() || '1 Adet';
    const dueDate = contribInputDueDate.value || '';
    const description = (contribInputDescription.value || '').trim();
    const editId = contribEditId.value;

    if (editId) {
      stateManager.updateContribution(editId, {
        title,
        type,
        targetAmount,
        materialUnit,
        dueDate,
        description
      });
      if (toastCallbackFn) toastCallbackFn('Takip bilgileri güncellendi.', 'success');
    } else {
      stateManager.addContribution({
        title,
        type,
        targetAmount,
        materialUnit,
        dueDate,
        description
      });
      if (toastCallbackFn) toastCallbackFn('Yeni takip süreci başlatıldı.', 'success');
    }

    modalAddContribution.classList.remove('active');
    renderCampaignsGrid();
  }

  async function deleteContributionConfirm(item) {
    const isConfirmed = window.confirmAsync ?
      await window.confirmAsync(`"${item.title}" takibini silmek istediğinize emin misiniz?`) :
      confirm(`"${item.title}" takibini silmek istediğinize emin misiniz?`);

    if (isConfirmed) {
      stateManager.deleteContribution(item.id);
      if (toastCallbackFn) toastCallbackFn('Takip silindi.', 'info');
      renderCampaignsGrid();
    }
  }

  // --- YAZDIRMA & RAPOR ALMA (A4 FORMATI) ---

  function printContributionReport() {
    if (!currentActiveContributionId || !contributionPrintArea) return;

    const contributions = stateManager.getContributions();
    const item = contributions.find(c => c.id === currentActiveContributionId);
    if (!item) return;

    const students = getStudentsList();
    const records = item.records || {};

    const sortedStudents = [...students].sort((a, b) => {
      const numA = parseInt(a.number, 10) || 0;
      const numB = parseInt(b.number, 10) || 0;
      return numA - numB;
    });

    let completedCount = 0;
    let pendingCount = 0;
    let totalMoney = 0;

    let rowsHtml = '';
    sortedStudents.forEach((std, idx) => {
      const rec = records[std.id] || { status: 'pending', paidAmount: 0, note: '' };
      let statusBadge = '';
      let amountStr = '';

      if (item.type === 'money') {
        if (rec.status === 'completed') {
          completedCount++;
          const paid = rec.paidAmount || item.targetAmount || 0;
          totalMoney += paid;
          statusBadge = '<span style="color: #10b981; font-weight: bold;">ÖDENDİ</span>';
          amountStr = `${paid} ₺`;
        } else if (rec.status === 'partial') {
          pendingCount++;
          const paid = rec.paidAmount || 0;
          totalMoney += paid;
          statusBadge = '<span style="color: #f59e0b; font-weight: bold;">KISMİ</span>';
          amountStr = `${paid} ₺`;
        } else {
          pendingCount++;
          statusBadge = '<span style="color: #ef4444;">ÖDENMEDİ</span>';
          amountStr = '0 ₺';
        }
      } else {
        if (rec.status === 'completed') {
          completedCount++;
          statusBadge = '<span style="color: #10b981; font-weight: bold;">GETİRDİ</span>';
        } else {
          pendingCount++;
          statusBadge = '<span style="color: #ef4444;">BEKLİYOR</span>';
        }
        amountStr = escapeHtml(item.materialUnit || '1 Adet');
      }

      rowsHtml += `
        <tr>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${idx + 1}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">${escapeHtml(std.number || '-')}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px;">${escapeHtml(std.name)} ${escapeHtml(std.surname)}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${escapeHtml(std.branch || '-')}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${amountStr}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${statusBadge}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 0.8rem;">${escapeHtml(rec.note || '-')}</td>
        </tr>
      `;
    });

    const todayStr = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

    contributionPrintArea.innerHTML = `
      <div style="font-family: 'Inter', system-ui, sans-serif; color: #000; width: 100%; max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px;">
          <h2 style="margin: 0; font-size: 1.4rem; text-transform: uppercase;">${escapeHtml(item.title)}</h2>
          <div style="font-size: 0.9rem; margin-top: 4px; color: #444;">
            <span>Takip Türü: <strong>${item.type === 'money' ? 'Maddi Katkı / Ücret' : 'Malzeme / Tedarik'}</strong></span> | 
            <span>Rapor Tarihi: ${todayStr}</span>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 0.88rem; background: #f8fafc; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px;">
          <div>Toplam Öğrenci: <strong>${students.length}</strong></div>
          <div>Teslim Eden: <strong style="color: #10b981;">${completedCount}</strong></div>
          <div>Bekleyen: <strong style="color: #ef4444;">${pendingCount}</strong></div>
          ${item.type === 'money' ? `<div>Toplanan: <strong>${totalMoney} ₺</strong></div>` : ''}
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="border: 1px solid #cbd5e1; padding: 6px; width: 40px; text-align: center;">Sıra</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; width: 60px; text-align: center;">No</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Öğrenci Adı Soyadı</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; width: 60px; text-align: center;">Şube</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; width: 100px; text-align: center;">${item.type === 'money' ? 'Ödenen' : 'Birim'}</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; width: 90px; text-align: center;">Durum</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px;">Açıklama / Not</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div style="margin-top: 30px; display: flex; justify-content: flex-end;">
          <div style="text-align: center; min-width: 160px;">
            <div style="font-size: 0.85rem; font-weight: bold;">Sınıf Öğretmeni</div>
            <div style="margin-top: 35px; font-size: 0.8rem; border-top: 1px dotted #000; padding-top: 4px;">İmza</div>
          </div>
        </div>
      </div>
    `;

    document.body.classList.add('print-contribution');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('print-contribution');
      contributionPrintArea.innerHTML = '';
    }, 500);
  }

  // HTML Karakter Kaçışları
  function escapeHtml(string) {
    if (!string) return '';
    return String(string)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Global erişim
  window.setupContributions = setupContributions;
  window.renderContributions = showCampaignsList;
})();
