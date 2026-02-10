// columnResizer.js - Düzəldilmiş versiya

console.log('📏 ColumnResizer script yüklənir...');

// Sadə sütun boyutlandırma funksiyası
function setupColumnResizing() {

    // Bütün cədvəlləri tap
    const tables = document.querySelectorAll('table.excel-table.data-table');

    tables.forEach((table, tableIndex) => {
        setupTableResizing(table, tableIndex);
    });

    // Sütunları sıfırlama düyməsi
    setupResetButton();
}

function setupTableResizing(table, tableIndex) {
    // Cədvələ unikal ID ver
    if (!table.id) {
        table.id = `resizable-table-${tableIndex}`;
    }

    // Resizable sinifi əlavə et
    table.classList.add('resizable-table');

    // Əvvəlcə yadda saxlanmış ölçüləri yüklə
    loadColumnWidths(table);

    // Bütün başlıqlara resizer əlavə et
    const headers = table.querySelectorAll('th');

    headers.forEach((header, colIndex) => {
        setupHeaderResizing(header, colIndex, table);
    });

    console.log(`✅ Cədvəl "${table.id}" üçün ${headers.length} sütun resizer quruldu`);
}

function setupHeaderResizing(header, colIndex, table) {
    // Header cell-i tap
    let headerCell = header.querySelector('.table-header-cell');
    if (!headerCell) {
        headerCell = header;
    }

    // Resizer əlavə et (əgər yoxdursa)
    if (!headerCell.querySelector('.resizer')) {
        const resizer = document.createElement('div');
        resizer.className = 'resizer';
        resizer.title = 'Sürüşdürərək boyutlandır';
        resizer.dataset.columnIndex = colIndex;

        // CSS təyin et - QARA XƏTT
        resizer.style.cssText = `
            position: absolute;
            top: 0;
            right: -8px;
            width: 2px;
            height: 100%;
            cursor: col-resize;
            z-index: 10;
            background: rgba(0, 0, 0, 1); /* AÇIQ QARA */
            border-left: 1px solid rgba(0, 0, 0, 0.3); /* XƏTT */
            transition: all 0.2s ease;
        `;

        headerCell.style.position = 'relative';
        headerCell.appendChild(resizer);

        // Hover effekti əlavə et
        resizer.addEventListener('mouseenter', () => {
            resizer.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
            resizer.style.borderLeft = '2px solid #000000';
            resizer.style.width = '8px';
            resizer.style.right = '-4px';
        });

        resizer.addEventListener('mouseleave', () => {
            if (!resizer.classList.contains('active')) {
                resizer.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
                resizer.style.borderLeft = '1px solid rgba(0, 0, 0, 0.3)';
                resizer.style.width = '3px';
                resizer.style.right = '-10px';
            }
        });

        // Event listeners əlavə et
        setupResizerEvents(resizer, header, colIndex, table);
    }
}

function setupResizerEvents(resizer, header, colIndex, table) {
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    // Maus hərəkəti üçün
    resizer.addEventListener('mousedown', function(e) {
        startResizing(e, header, colIndex, table);
    });

    // Touch hərəkəti üçün (mobil)
    resizer.addEventListener('touchstart', function(e) {
        startResizing(e, header, colIndex, table);
    });

    function startResizing(e, header, colIndex, table) {
        e.preventDefault();
        e.stopPropagation();

        isResizing = true;
        startX = e.clientX || e.touches[0].clientX;
        startWidth = header.offsetWidth;

        // Visual feedback
        resizer.style.backgroundColor = 'rgba(59, 130, 246, 0.5)';
        table.classList.add('resizing');
        document.body.style.cursor = 'col-resize';

        // Maus hərəkətini dinlə
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('touchmove', handleResize);
        document.addEventListener('mouseup', stopResize);
        document.addEventListener('touchend', stopResize);
    }

    function handleResize(e) {
        if (!isResizing) return;

        e.preventDefault();

        const currentX = e.clientX || e.touches[0].clientX;
        const deltaX = currentX - startX;
        let newWidth = startWidth + deltaX;

        // Minimum en təyin et
        const minWidth = header.getAttribute('data-min-width') || 100;
        if (newWidth < minWidth) {
            newWidth = parseInt(minWidth);
        }

        // Maksimum en (isteğe bağlı)
        const maxWidth = 300;
        if (newWidth > maxWidth) {
            newWidth = maxWidth;
        }

        // Bütün sətirlərdə eyni sütunu yenilə
        const rows = table.rows;
        for (let i = 0; i < rows.length; i++) {
            const cell = rows[i].cells[colIndex];
            if (cell) {
                cell.style.width = `${newWidth}px`;
                cell.style.minWidth = `${newWidth}px`;
                cell.style.maxWidth = `${newWidth}px`;
            }
        }

        // Header-i də yenilə
        header.style.width = `${newWidth}px`;
        header.style.minWidth = `${newWidth}px`;
    }

    function stopResize() {
        if (!isResizing) return;

        isResizing = false;

        // Visual feedback-i sil
        resizer.style.backgroundColor = '';
        table.classList.remove('resizing');
        document.body.style.cursor = '';

        // Event listener-ləri sil
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('touchmove', handleResize);
        document.removeEventListener('mouseup', stopResize);
        document.removeEventListener('touchend', stopResize);

        // Ölçüləri yadda saxla
        saveColumnWidths(table);
    }
}

function saveColumnWidths(table) {
    const widths = {};
    const headers = table.querySelectorAll('th');

    headers.forEach((header, index) => {
        widths[index] = header.offsetWidth;
    });

    // LocalStorage-ə yadda saxla
    try {
        localStorage.setItem(`tableWidths_${table.id}`, JSON.stringify(widths));

        // Debug üçün yadda saxlanan dəyərləri göstər
        const saved = localStorage.getItem(`tableWidths_${table.id}`);
    } catch (e) {
        console.warn('LocalStorage error:', e);
    }
}

function loadColumnWidths(table) {
    try {
        const savedWidths = localStorage.getItem(`tableWidths_${table.id}`);
        if (savedWidths) {
            const widths = JSON.parse(savedWidths);
            console.log(`📥 "${table.id}" üçün yadda saxlanmış ölçülər:`, widths);

            Object.keys(widths).forEach(index => {
                const width = widths[index];
                const header = table.querySelectorAll('th')[index];

                if (header) {
                    // Header-i yenilə
                    header.style.width = `${width}px`;
                    header.style.minWidth = `${width}px`;

                    // Bütün sətirlərdə eyni sütunu yenilə
                    const rows = table.rows;
                    for (let i = 0; i < rows.length; i++) {
                        const cell = rows[i].cells[index];
                        if (cell) {
                            cell.style.width = `${width}px`;
                            cell.style.minWidth = `${width}px`;
                            cell.style.maxWidth = `${width}px`;
                        }
                    }

                }
            });

        } else {
        }
    } catch (e) {
        console.warn('LocalStorage load error:', e);
    }
}

function resetColumnWidths(table) {
    const headers = table.querySelectorAll('th');

    headers.forEach((header, index) => {
        const minWidth = header.getAttribute('data-min-width') || 50;
        const width = parseInt(minWidth);

        // Header-i sıfırla
        header.style.width = '';
        header.style.minWidth = '';

        // Bütün sətirlərdə eyni sütunu sıfırla
        const rows = table.rows;
        for (let i = 0; i < rows.length; i++) {
            const cell = rows[i].cells[index];
            if (cell) {
                cell.style.width = '';
                cell.style.minWidth = '';
                cell.style.maxWidth = '';
            }
        }

        // Default dəyəri tətbiq et
        header.style.minWidth = `${width}px`;

        // Həmçinin width də təyin et ki, dərhal tətbiq olsun
        header.style.width = `${width}px`;

        // Cell-lərə də tətbiq et
        for (let i = 0; i < rows.length; i++) {
            const cell = rows[i].cells[index];
            if (cell) {
                cell.style.width = `${width}px`;
                cell.style.minWidth = `${width}px`;
            }
        }
    });

    // LocalStorage-dan sil
    localStorage.removeItem(`tableWidths_${table.id}`);

    console.log(`🔄 "${table.id}" cədvəlinin ölçüləri sıfırlandı`);
    showNotification('Sütun ölçüləri sıfırlandı', 'success');
}

function setupResetButton() {
    const columnsBtn = document.getElementById('activeColumnsBtn');

    if (columnsBtn) {
        columnsBtn.addEventListener('click', function(e) {
            e.stopPropagation();

            // Köhnə menyunu sil
            const oldMenu = document.querySelector('.columns-menu');
            if (oldMenu) oldMenu.remove();

            // Yeni menyu yarat
            const menu = createColumnsMenu();

            // Menyunu yerləşdir
            const rect = this.getBoundingClientRect();
            menu.style.position = 'fixed';
            menu.style.top = `${rect.bottom + 5}px`;
            menu.style.left = `${rect.left}px`;
            menu.style.zIndex = '10000';

            document.body.appendChild(menu);

            // Xaricə klikləndikdə bağla
            setTimeout(() => {
                document.addEventListener('click', function closeMenu(e) {
                    if (!menu.contains(e.target) && e.target !== columnsBtn) {
                        menu.remove();
                        document.removeEventListener('click', closeMenu);
                    }
                });
            });
        });
    }
}

function createColumnsMenu() {
    const menu = document.createElement('div');
    menu.className = 'columns-menu';
    menu.style.cssText = `
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        padding: 8px 0;
        min-width: 180px;
        animation: fadeIn 0.2s ease;
    `;

    menu.innerHTML = `
        <div style="padding: 8px 12px; border-bottom: 1px solid #ffffff; font-weight: 600; color: #374151;">
            Sütun Tənzimləmələri
        </div>
        <button id="resetColumnsBtn" style="
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            padding: 10px 12px;
            border: none;
            background: none;
            color: #374151;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
        ">
            <i class="fas fa-undo" style="width: 16px;"></i>
            Ölçüləri Sıfırla
        </button>
        <button id="saveColumnsBtn" style="
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            padding: 10px 12px;
            border: none;
            background: none;
            color: #374151;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
        ">
            <i class="fas fa-save" style="width: 16px;"></i>
            Cari Ölçüləri Saxla
        </button>
    `;

    // Reset düyməsinə event əlavə et
    menu.querySelector('#resetColumnsBtn').addEventListener('click', function() {
        const table = document.querySelector('table.excel-table.data-table');
        if (table) {
            resetColumnWidths(table);
        }
        menu.remove();
    });

    // Save düyməsinə event əlavə et
    menu.querySelector('#saveColumnsBtn').addEventListener('click', function() {
        const table = document.querySelector('table.excel-table.data-table');
        if (table) {
            saveColumnWidths(table);
            showNotification('Sütun ölçüləri yadda saxlandı', 'success');
        }
        menu.remove();
    });

    return menu;
}

function showNotification(message, type = 'info') {
    // Köhnə notification-ları sil
    const oldNotif = document.querySelector('.simple-notification');
    if (oldNotif) oldNotif.remove();

    // Yeni notification yarat
    const notif = document.createElement('div');
    notif.className = 'simple-notification';
    notif.textContent = message;
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notif);

    // 3 saniyədən sonra sil
    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}


// Əsas başlatma funksiyası
function initializeColumnResizers() {



    // DOM hazır olduqda işə sal
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(setupColumnResizing, 100);
        });
    } else {
        setTimeout(setupColumnResizing, 100);
    }

    // Debug üçün global funksiya
    window.debugColumns = function() {

        const table = document.querySelector('table.excel-table.data-table');
        if (table) {
            console.log('- Table ID:', table.id);
            console.log('- Table classList:', table.classList);
            console.log('- Headers:', table.querySelectorAll('th').length);

            // Yadda saxlanmış dəyərləri göstər
            const saved = localStorage.getItem(`tableWidths_${table.id}`);
            console.log('- Saved widths:', saved ? JSON.parse(saved) : 'Yoxdur');

            // Test resizer
            const firstResizer = table.querySelector('.resizer');
            if (firstResizer) {
                console.log('- First resizer found:', firstResizer);
                console.log('- First resizer position:', firstResizer.getBoundingClientRect());
            }

            // Cari ölçüləri göstər
            const headers = table.querySelectorAll('th');
            headers.forEach((header, index) => {
                console.log(`- Sütun ${index}: ${header.offsetWidth}px`);
            });
        }
    };

    // LocalStorage-dan oxumaq üçün funksiya
    window.getSavedColumnWidths = function(tableId) {
        const saved = localStorage.getItem(`tableWidths_${tableId}`);
        return saved ? JSON.parse(saved) : null;
    };

    // LocalStorage-a yazmaq üçün funksiya
    window.saveColumnWidthsManually = function(table) {
        saveColumnWidths(table);
    };

    // Global export
    window.initializeColumnResizers = initializeColumnResizers;
    window.setupColumnResizing = setupColumnResizing;
    window.loadColumnWidths = loadColumnWidths;
    window.saveColumnWidths = saveColumnWidths;
    window.resetColumnWidths = resetColumnWidths;
}

// Auto-initialize
initializeColumnResizers();

