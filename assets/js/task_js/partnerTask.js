/**
 * Partner Task Manager
 * "Partnyorlar" cədvəli üçün xüsusi idarəetmə faylı
 */

const PartnerTaskManager = {
    // API Endpoints
    endpoints: {
        list: '/api/v1/partner-tasks/',
        create: '/api/v1/partner-tasks/',
        get: (id) => `/api/v1/partner-tasks/${id}`,
        update: (id) => `/api/v1/partner-tasks/${id}`,
        delete: (id) => `/api/v1/partner-tasks/${id}`,
        complete: (id) => `/api/v1/partner-tasks/${id}/complete`,
        stats: '/api/v1/partner-tasks/stats/'
    },

    // State
    currentPage: 1,
    itemsPerPage: 10,
    data: [],

    // Başlatma funksiyası (Tab açılanda çağırılacaq)
    init: function() {
        console.log('Partner Task Manager başladıldı');
        this.loadTasks();
    },

    // API-dən məlumatları yüklə
    loadTasks: async function() {
        const tableBody = document.getElementById('partnerTableBody');
        const metaInfo = document.getElementById('partnerMeta');

        if (!tableBody) return;

        // Loading effekti
        tableBody.innerHTML = `
            <tr class="loading-row">
                <td colspan="11">
                    <div class="table-loading">
                        <div class="loader"><div></div><div></div></div>
                        <p>Partnyor məlumatları yüklənir...</p>
                    </div>
                </td>
            </tr>
        `;

        try {
            // QEYD: ApiService.get mövcud layihənizdəki ümumi fetch funksiyasıdır
            // Əgər birbaşa fetch işlədirsizsə, buranı uyğunlaşdırın.
            const response = await ApiService.get(this.endpoints.list);

            if (response && response.data) {
                this.data = response.data; // Məlumatları yadda saxla
                this.renderTable(this.data);

                if(metaInfo) {
                    metaInfo.textContent = `${this.data.length} partnyor tapşırığı`;
                }
            } else {
                this.renderEmptyState();
            }
        } catch (error) {
            console.error('Partnyorlar yüklənərkən xəta:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="11" class="text-center text-red-500 py-4">
                        Məlumatları yükləmək mümkün olmadı. Zəhmət olmasa yenidən cəhd edin.
                    </td>
                </tr>
            `;
        }
    },

    // Cədvəli çək
    renderTable: function(tasks) {
        const tableBody = document.getElementById('partnerTableBody');
        if (!tasks || tasks.length === 0) {
            this.renderEmptyState();
            return;
        }

        let html = '';

        tasks.forEach((task, index) => {
            // Status rənglərini təyin edirik
            let statusClass = 'bg-gray-100 text-gray-600';
            let statusText = task.status;

            if(task.status === 'completed') { statusClass = 'bg-green-100 text-green-600'; statusText = 'Tamamlanıb'; }
            else if(task.status === 'pending') { statusClass = 'bg-yellow-100 text-yellow-600'; statusText = 'Gözləmədə'; }
            else if(task.status === 'rejected') { statusClass = 'bg-red-100 text-red-600'; statusText = 'Ləğv edilib'; }

            html += `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="text-center font-medium text-gray-500">
                        ${index + 1}
                    </td>

                    <td>
                        <div class="flex flex-col">
                            <span class="font-medium text-gray-700">${this.formatDate(task.created_at)}</span>
                            <span class="text-xs text-gray-400">${this.formatTime(task.created_at)}</span>
                        </div>
                    </td>

                    <td>
                        <span class="font-semibold text-gray-700">${task.company_name || '-'}</span>
                    </td>

                    <td>
                        <div class="flex items-center gap-2">
                            <div class="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-600 font-bold">
                                ${(task.creator_name || 'U').charAt(0)}
                            </div>
                            <span class="text-sm text-gray-600">${task.creator_name || '-'}</span>
                        </div>
                    </td>

                    <td>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                             ${task.source_company_name || '-'}
                        </span>
                    </td>

                    <td>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                             ${task.executor_company_name || '-'}
                        </span>
                    </td>

                    <td>
                        <div class="flex items-center gap-2">
                            <button onclick="PartnerTaskManager.viewDetails(${task.id})" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Bax">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="PartnerTaskManager.editTask(${task.id})" class="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Düzəliş et">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="PartnerTaskManager.deleteTask(${task.id})" class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" title="Sil">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>

                    <td>
                        <span class="text-sm text-gray-600 font-medium">${this.formatDate(task.due_date)}</span>
                    </td>

                    <td>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                            ${statusText}
                        </span>
                    </td>

                    <td>
                        <span class="text-sm text-gray-700 font-medium">
                            ${task.responsible_person || '-'}
                        </span>
                    </td>

                    <td>
                        <a href="tel:${task.responsible_contact}" class="text-sm text-blue-600 hover:underline">
                            ${task.responsible_contact || '-'}
                        </a>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
    },

    renderEmptyState: function() {
        const tableBody = document.getElementById('partnerTableBody');
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="11">
                    <div class="empty-state py-12 flex flex-col items-center justify-center text-center">
                        <div class="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                            <i class="fas fa-handshake text-3xl text-amber-500"></i>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-800 mb-1">Partnyor Tapşırığı Yoxdur</h3>
                        <p class="text-gray-500 text-sm">Hazırda sistemdə partnyorlarla bağlı heç bir tapşırıq mövcud deyil.</p>
                    </div>
                </td>
            </tr>
        `;
    },

    // Yardımçı funksiyalar
    formatDate: function(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('az-AZ');
    },

    formatTime: function(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });
    },

    // Əməliyyat funksiyaları (Placeholder)
    viewDetails: function(id) {
        console.log('View partner task:', id);
        // Mövcud modalı açmaq üçün kod burada olacaq
    },

    editTask: function(id) {
        console.log('Edit partner task:', id);
    },

    deleteTask: async function(id) {
        if(confirm('Bu partnyor tapşırığını silmək istədiyinizə əminsiniz?')) {
            try {
                await ApiService.delete(this.endpoints.delete(id));
                // Uğurlu silinmə
                this.loadTasks(); // Cədvəli yenilə
            } catch (e) {
                alert('Silinmə zamanı xəta baş verdi');
            }
        }
    }
};

// Qlobala əlavə et ki, HTML-dən çağırmaq olsun
window.PartnerTaskManager = PartnerTaskManager;