(() => {
  // Seating Plan State for active branch
  let desks = [];
  let teacherDesk = { x: 42.5, y: 12, visible: true };
  let whiteboard = { x: 30, y: 2, visible: true };
  
  // Active selection for seat mapping
  let activeSeatTarget = null; // { deskId, seatIndex }

  // DOM Elements
  let toolsLandingView, toolsSeatingView;
  let btnLaunchSeating, btnBackToSeating;
  let btnAddSingle, btnAddDouble, btnPrint, btnClearAll;
  let toggleBoard, toggleTeacherDesk;
  let canvas;

  // Student Select Modal Elements
  let modalSelect, btnCloseModalHeader, btnCloseModalFooter, btnClearSeat;
  let studentsListGroup, selectBranchInfo;

  function initDOMElements() {
    toolsLandingView = document.getElementById('tools-landing-view');
    toolsSeatingView = document.getElementById('tools-seating-view');
    
    btnLaunchSeating = document.getElementById('btn-launch-seating');
    btnBackToSeating = document.getElementById('btn-back-to-tools-from-seating');
    
    btnAddSingle = document.getElementById('btn-seating-add-single');
    btnAddDouble = document.getElementById('btn-seating-add-double');
    btnPrint = document.getElementById('btn-seating-print');
    btnClearAll = document.getElementById('btn-seating-clear-all');
    
    toggleBoard = document.getElementById('seating-toggle-board');
    toggleTeacherDesk = document.getElementById('seating-toggle-teacher-desk');
    canvas = document.getElementById('seating-canvas');

    // Modals
    modalSelect = document.getElementById('modal-seating-student-select');
    btnCloseModalHeader = document.getElementById('btn-close-seating-select-modal');
    btnCloseModalFooter = document.getElementById('btn-close-seating-select-modal-footer');
    btnClearSeat = document.getElementById('btn-seating-clear-seat');
    studentsListGroup = document.getElementById('seating-students-list-group');
    selectBranchInfo = document.getElementById('seating-select-branch-info');
  }

  // Load seating plan from state for current branch
  function loadSeatingData() {
    const state = stateManager.loadState();
    const activeBranch = document.getElementById('dash-select-branch') ? document.getElementById('dash-select-branch').value : 'all';
    
    const plan = (state.seatingPlans && state.seatingPlans[activeBranch]) || {
      desks: [],
      teacherDesk: { x: 42.5, y: 12, visible: true },
      whiteboard: { x: 30, y: 2, visible: true }
    };

    desks = plan.desks || [];
    teacherDesk = plan.teacherDesk || { x: 42.5, y: 12, visible: true };
    whiteboard = plan.whiteboard || { x: 30, y: 2, visible: true };

    // Sync toggle switches
    if (toggleBoard) toggleBoard.checked = whiteboard.visible;
    if (toggleTeacherDesk) toggleTeacherDesk.checked = teacherDesk.visible;
  }

  // Save seating plan to state for current branch
  function saveSeatingData() {
    const activeBranch = document.getElementById('dash-select-branch') ? document.getElementById('dash-select-branch').value : 'all';
    const planData = {
      desks: desks,
      teacherDesk: teacherDesk,
      whiteboard: whiteboard
    };
    stateManager.saveSeatingPlan(activeBranch, planData);
  }

  // Initialize Seating Tool Hooks
  window.renderSeating = function() {
    initDOMElements();
    setupListeners();
  };

  window.refreshSeatingCanvas = function() {
    const seatingView = document.getElementById('tools-seating-view');
    if (seatingView && seatingView.style.display === 'block') {
      loadSeatingData();
      renderCanvas();
    }
  };

  function setupListeners() {
    if (btnLaunchSeating) {
      btnLaunchSeating.onclick = () => {
        if (toolsLandingView && toolsSeatingView) {
          toolsLandingView.style.display = 'none';
          toolsSeatingView.style.display = 'block';
          
          loadSeatingData();
          renderCanvas();
        }
      };
    }

    if (btnBackToSeating) {
      btnBackToSeating.onclick = () => {
        if (toolsLandingView && toolsSeatingView) {
          toolsSeatingView.style.display = 'none';
          toolsLandingView.style.display = 'block';
        }
      };
    }

    // Add elements
    if (btnAddSingle) {
      btnAddSingle.onclick = () => {
        const id = 'desk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        desks.push({
          id: id,
          type: 'single',
          x: 20 + Math.random() * 20, // offset randomly in center area
          y: 35 + Math.random() * 20,
          rotation: 0,
          students: [null]
        });
        saveSeatingData();
        renderCanvas();
      };
    }

    if (btnAddDouble) {
      btnAddDouble.onclick = () => {
        const id = 'desk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        desks.push({
          id: id,
          type: 'double',
          x: 20 + Math.random() * 20,
          y: 35 + Math.random() * 20,
          rotation: 0,
          students: [null, null]
        });
        saveSeatingData();
        renderCanvas();
      };
    }

    // Toggle board & teacher desk
    if (toggleBoard) {
      toggleBoard.onchange = (e) => {
        whiteboard.visible = e.target.checked;
        saveSeatingData();
        renderCanvas();
      };
    }

    if (toggleTeacherDesk) {
      toggleTeacherDesk.onchange = (e) => {
        teacherDesk.visible = e.target.checked;
        saveSeatingData();
        renderCanvas();
      };
    }

    // Clear plan
    if (btnClearAll) {
      btnClearAll.onclick = () => {
        if (confirm('Sınıf oturma planındaki tüm sıraları temizlemek istediğinize emin misiniz?')) {
          desks = [];
          teacherDesk = { x: 42.5, y: 12, visible: true };
          whiteboard = { x: 30, y: 2, visible: true };
          
          if (toggleBoard) toggleBoard.checked = true;
          if (toggleTeacherDesk) toggleTeacherDesk.checked = true;
          
          saveSeatingData();
          renderCanvas();
        }
      };
    }

    // Print plan
    if (btnPrint) {
      btnPrint.onclick = () => {
        document.body.classList.add('print-seating');
        window.print();
        
        window.addEventListener('afterprint', () => {
          document.body.classList.remove('print-seating');
        }, { once: true });
        
        setTimeout(() => {
          document.body.classList.remove('print-seating');
        }, 1500);
      };
    }

    // Modal close hooks
    const closeModal = () => {
      if (modalSelect) modalSelect.classList.remove('active');
      activeSeatTarget = null;
    };

    if (btnCloseModalHeader) btnCloseModalHeader.onclick = closeModal;
    if (btnCloseModalFooter) btnCloseModalFooter.onclick = closeModal;
    if (modalSelect) {
      modalSelect.onclick = (e) => {
        if (e.target === modalSelect) closeModal();
      };
    }

    // Clear student from seat
    if (btnClearSeat) {
      btnClearSeat.onclick = () => {
        if (activeSeatTarget) {
          const { deskId, seatIndex } = activeSeatTarget;
          const desk = desks.find(d => d.id === deskId);
          if (desk) {
            desk.students[seatIndex] = null;
            saveSeatingData();
            renderCanvas();
          }
          closeModal();
        }
      };
    }
  }

  // Render Seating Elements on Canvas
  function renderCanvas() {
    if (!canvas) return;
    canvas.innerHTML = '';

    // 1. Yazı Tahtası
    if (whiteboard.visible) {
      const boardEl = document.createElement('div');
      boardEl.className = 'seating-element seating-whiteboard';
      boardEl.style.width = '40%';
      boardEl.style.height = '42px';
      boardEl.style.left = whiteboard.x + '%';
      boardEl.style.top = whiteboard.y + '%';
      
      boardEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <i data-lucide="presentation" style="width: 18px; height: 18px;"></i>
          <span>YAZI TAHTASI</span>
        </div>
      `;
      canvas.appendChild(boardEl);
      makeDraggable(boardEl, 'whiteboard');
    }

    // 2. Öğretmen Masası
    if (teacherDesk.visible) {
      const teacherEl = document.createElement('div');
      teacherEl.className = 'seating-element seating-teacher-desk-element';
      teacherEl.style.width = '15%';
      teacherEl.style.height = '65px';
      teacherEl.style.left = teacherDesk.x + '%';
      teacherEl.style.top = teacherDesk.y + '%';
      
      teacherEl.innerHTML = `
        <div style="font-weight: 800; font-size: 0.7rem; opacity: 0.6; display: flex; align-items: center; gap: 0.25rem;">
          <i data-lucide="user" style="width: 14px; height: 14px;"></i> ÖĞRETMEN
        </div>
        <div style="margin-top: 0.15rem;">MASASI</div>
      `;
      canvas.appendChild(teacherEl);
      makeDraggable(teacherEl, 'teacherDesk');
    }

    // 3. Sıralar (Desks)
    const state = stateManager.loadState();
    const students = state.students || [];

    // Numaralandırma için sıraları koordinatlarına göre sıralıyoruz (Önce dikey Y, sonra yatay X)
    const sortedDesks = [...desks].sort((a, b) => {
      if (Math.abs(a.y - b.y) < 8) {
        return a.x - b.x;
      }
      return a.y - b.y;
    });

    desks.forEach(desk => {
      const deskEl = document.createElement('div');
      deskEl.className = `seating-element`;
      
      const isSingle = desk.type === 'single';
      const deskNumber = sortedDesks.findIndex(d => d.id === desk.id) + 1;
      
      deskEl.style.width = isSingle ? '12%' : '22%';
      deskEl.style.height = '85px';
      deskEl.style.left = desk.x + '%';
      deskEl.style.top = desk.y + '%';
      deskEl.style.transform = `rotate(${desk.rotation || 0}deg)`;
      
      // Header for Drag, Rotate & Delete
      const header = document.createElement('div');
      header.className = 'desk-header';
      header.innerHTML = `
        <span class="desk-drag-handle">
          <i data-lucide="grip-horizontal" style="width: 12px; height: 12px;"></i>
          ${deskNumber}. Sıra (${isSingle ? 'Tekli' : 'Çiftli'})
        </span>
        <div style="display: flex; align-items: center; gap: 0.35rem;">
          <button class="desk-rotate-btn rotate-left" title="90° Sola Döndür" style="background: transparent; border: none; cursor: pointer; padding: 0.1rem; display: flex; align-items: center; opacity: 0.6; transition: opacity 0.15s; outline: none;">
            <i data-lucide="rotate-ccw" style="width: 11px; height: 11px;"></i>
          </button>
          <button class="desk-rotate-btn rotate-right" title="90° Sağa Döndür" style="background: transparent; border: none; cursor: pointer; padding: 0.1rem; display: flex; align-items: center; opacity: 0.6; transition: opacity 0.15s; outline: none;">
            <i data-lucide="rotate-cw" style="width: 11px; height: 11px;"></i>
          </button>
          <button class="desk-delete-btn" title="Sırayı Sil">
            <i data-lucide="x" style="width: 12px; height: 12px;"></i>
          </button>
        </div>
      `;

      // Delete desk button
      header.querySelector('.desk-delete-btn').onclick = (e) => {
        e.stopPropagation();
        if (confirm('Bu sırayı kaldırmak istediğinize emin misiniz?')) {
          desks = desks.filter(d => d.id !== desk.id);
          saveSeatingData();
          renderCanvas();
        }
      };

      // Rotate left button
      header.querySelector('.rotate-left').onclick = (e) => {
        e.stopPropagation();
        desk.rotation = ((desk.rotation || 0) - 90 + 360) % 360;
        saveSeatingData();
        renderCanvas();
      };

      // Rotate right button
      header.querySelector('.rotate-right').onclick = (e) => {
        e.stopPropagation();
        desk.rotation = ((desk.rotation || 0) + 90) % 360;
        saveSeatingData();
        renderCanvas();
      };

      // Desk seats body
      const body = document.createElement('div');
      body.className = 'desk-body';

      // Render seats
      desk.students.forEach((studentId, seatIdx) => {
        const seat = document.createElement('div');
        seat.className = 'seating-seat';
        
        if (!studentId) {
          // Empty Seat
          seat.innerHTML = `<span class="seating-seat-empty-btn"><i data-lucide="plus" style="width: 16px; height: 16px;"></i></span>`;
        } else {
          // Seated Student
          const s = students.find(item => item.id === studentId);
          if (s) {
            const initials = `${s.name[0] || ''}${s.surname[0] || ''}`.toUpperCase();
            const avatarStyle = s.gender === 'female' 
              ? 'background: rgba(236, 72, 153, 0.1); color: rgb(236, 72, 153); border-color: rgba(236, 72, 153, 0.2);' 
              : 'background: rgba(99, 102, 241, 0.1); color: var(--primary); border-color: rgba(99, 102, 241, 0.2);';

            const photoHtml = s.photo
              ? `<img class="seating-seat-photo" src="${s.photo}">`
              : `<div class="seating-seat-initials" style="${avatarStyle}">${initials}</div>`;

            seat.innerHTML = `
              <div class="seating-seat-occupied">
                ${photoHtml}
                <div class="seating-seat-name" title="${s.name} ${s.surname}">${s.name}</div>
              </div>
            `;
          } else {
            // Student deleted from system
            seat.innerHTML = `<span class="seating-seat-empty-btn"><i data-lucide="plus" style="width: 16px; height: 16px;"></i></span>`;
            desk.students[seatIdx] = null; // reset slot
          }
        }

        // Click on seat to assign student
        seat.onclick = (e) => {
          e.stopPropagation();
          openStudentSelectModal(desk.id, seatIdx);
        };

        body.appendChild(seat);
      });

      deskEl.appendChild(header);
      deskEl.appendChild(body);
      canvas.appendChild(deskEl);
      
      makeDraggable(deskEl, 'desk', desk.id);
    });

    if (window.safeCreateIcons) {
      window.safeCreateIcons();
    }
  }

  // Generic Drag & Drop handler for canvas elements
  function makeDraggable(element, type, id = null) {
    const handle = element.querySelector('.desk-drag-handle') || element;
    
    handle.addEventListener('mousedown', startDrag);
    handle.addEventListener('touchstart', startDrag, { passive: false });

    function startDrag(e) {
      // Prevent drag if delete button is clicked
      if (e.target.closest('.desk-delete-btn')) return;

      e.preventDefault();
      
      element.classList.add('dragging');
      
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      const elementRect = element.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      
      // Calculate offset inside the element
      const offsetX = clientX - elementRect.left;
      const offsetY = clientY - elementRect.top;
      
      const onMouseMove = (moveEvent) => {
        const currentX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
        const currentY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
        
        // Calculate new percentages
        let leftPercent = ((currentX - canvasRect.left - offsetX) / canvasRect.width) * 100;
        let topPercent = ((currentY - canvasRect.top - offsetY) / canvasRect.height) * 100;
        
        const widthPercent = (elementRect.width / canvasRect.width) * 100;
        const heightPercent = (elementRect.height / canvasRect.height) * 100;
        
        // Clamp bounds [0, 100]
        leftPercent = Math.max(0, Math.min(100 - widthPercent, leftPercent));
        topPercent = Math.max(0, Math.min(100 - heightPercent, topPercent));
        
        element.style.left = leftPercent + '%';
        element.style.top = topPercent + '%';

        // Live update coordinate variable
        if (type === 'whiteboard') {
          whiteboard.x = leftPercent;
          whiteboard.y = topPercent;
        } else if (type === 'teacherDesk') {
          teacherDesk.x = leftPercent;
          teacherDesk.y = topPercent;
        } else if (type === 'desk') {
          const desk = desks.find(d => d.id === id);
          if (desk) {
            desk.x = leftPercent;
            desk.y = topPercent;
          }
        }
      };

      const onMouseUp = () => {
        element.classList.remove('dragging');
        
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('touchmove', onMouseMove);
        document.removeEventListener('touchend', onMouseUp);
        
        saveSeatingData();
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.addEventListener('touchmove', onMouseMove, { passive: false });
      document.addEventListener('touchend', onMouseUp);
    }
  }

  // Open Student Selection Modal
  function openStudentSelectModal(deskId, seatIndex) {
    activeSeatTarget = { deskId, seatIndex };

    const state = stateManager.loadState();
    const students = state.students || [];
    const activeBranch = document.getElementById('dash-select-branch') ? document.getElementById('dash-select-branch').value : 'all';

    // Sıra numarasını bulmak için sıralıyoruz
    const sortedDesks = [...desks].sort((a, b) => {
      if (Math.abs(a.y - b.y) < 8) return a.x - b.x;
      return a.y - b.y;
    });
    const desk = desks.find(d => d.id === deskId);
    const deskNumber = desk ? sortedDesks.findIndex(d => d.id === desk.id) + 1 : '?';

    if (selectBranchInfo) {
      const levelLabel = state.educationLevel === 'middle' ? 'Ortaokul' : 'İlkokul';
      const branchLabel = state.educationLevel === 'middle' ? ` (Şube: ${activeBranch})` : '';
      selectBranchInfo.innerHTML = `
        <div>Eğitim Seviyesi: <strong>${levelLabel}</strong>${branchLabel}</div>
        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem; font-weight: 600;">
          ${deskNumber}. Sıra - Koltuk ${seatIndex + 1}
        </div>
      `;
    }

    if (!studentsListGroup) return;
    studentsListGroup.innerHTML = '';

    // Filter students by active branch
    const filteredStudents = students.filter(s => {
      const isMiddle = state.educationLevel === 'middle';
      return !isMiddle || activeBranch === 'all' || s.branch === activeBranch;
    });

    if (filteredStudents.length === 0) {
      studentsListGroup.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 1rem;">Sınıfta kayıtlı öğrenci bulunamadı.</div>`;
      if (modalSelect) modalSelect.classList.add('active');
      return;
    }

    // Sort alphabetically by name
    filteredStudents.sort((a, b) => a.name.localeCompare(b.name, 'tr'));

    // Check which students are already seated
    const seatedStudentIds = new Set();
    desks.forEach(d => {
      d.students.forEach(sId => {
        if (sId) seatedStudentIds.add(sId);
      });
    });

    filteredStudents.forEach(s => {
      const isSeated = seatedStudentIds.has(s.id);
      
      const itemBtn = document.createElement('button');
      itemBtn.className = 'btn btn-outline-secondary';
      itemBtn.style.display = 'flex';
      itemBtn.style.alignItems = 'center';
      itemBtn.style.justifyContent = 'space-between';
      itemBtn.style.padding = '0.6rem 1rem';
      itemBtn.style.textAlign = 'left';
      itemBtn.style.fontSize = '0.9rem';
      itemBtn.style.width = '100%';
      itemBtn.style.borderRadius = 'var(--radius-sm)';
      itemBtn.style.border = '1px solid var(--border-color)';
      itemBtn.style.background = isSeated ? 'rgba(255,255,255,0.02)' : 'transparent';

      const initials = `${s.name[0] || ''}${s.surname[0] || ''}`.toUpperCase();
      const avatarStyle = s.gender === 'female' 
        ? 'background: rgba(236, 72, 153, 0.1); color: rgb(236, 72, 153); border-color: rgba(236, 72, 153, 0.2);' 
        : 'background: rgba(99, 102, 241, 0.1); color: var(--primary); border-color: rgba(99, 102, 241, 0.2);';

      const photoHtml = s.photo
        ? `<img src="${s.photo}" style="width: 26px; height: 26px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color);">`
        : `<div style="width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 700; border: 1px solid var(--border-color); ${avatarStyle}">${initials}</div>`;

      const seatedBadge = isSeated 
        ? `<span class="badge" style="background: rgba(16, 185, 129, 0.1); color: #10b981; font-size: 0.7rem; padding: 0.15rem 0.4rem; border-radius: 4px;">Yerleştirildi</span>`
        : '';

      itemBtn.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          ${photoHtml}
          <div style="font-weight: 600; color: var(--text-primary);">${s.name} ${s.surname}</div>
        </div>
        ${seatedBadge}
      `;

      itemBtn.onclick = () => {
        assignStudentToActiveSeat(s.id);
        if (modalSelect) modalSelect.classList.remove('active');
      };

      studentsListGroup.appendChild(itemBtn);
    });

    if (modalSelect) modalSelect.classList.add('active');
  }

  // Assign selected student to active seat and resolve duplicate seated slots
  function assignStudentToActiveSeat(studentId) {
    if (!activeSeatTarget) return;
    const { deskId, seatIndex } = activeSeatTarget;

    // 1. Remove student from any previous seat to prevent duplication
    desks.forEach(d => {
      d.students.forEach((sId, idx) => {
        if (sId === studentId) {
          d.students[idx] = null;
        }
      });
    });

    // 2. Set to active seat slot
    const activeDesk = desks.find(d => d.id === deskId);
    if (activeDesk) {
      activeDesk.students[seatIndex] = studentId;
      saveSeatingData();
      renderCanvas();
    }
  }
})();
