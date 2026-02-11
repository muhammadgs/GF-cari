/**
 * Partner Task Manager
 * "Partnyorlar" cədvəli üçün xüsusi idarəetmə faylı
 */

const PartnerTaskManager = {
    // API Endpoints (Nisbi yollar - Base URL ApiService tərəfindən əlavə olunacaq)
    endpoints: {
        list: '/partner-tasks/',
        create: '/partner-tasks/',
        get: (id) => `/partner-tasks/${id}`,
        update: (id) => `/partner-tasks/${id}`,
        delete: (id) => `/partner-tasks/${id}`,
        complete: (id) => `/partner-tasks/${id}/complete`,
        stats: '/partner-tasks/stats/'
    },

    // State
    currentPage: 1,
    data: [],

    // Başlatma funksiyası
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
            // makeApiRequest funksiyasını çağırırıq (sizin apiService.js-dən gəlir)
            const response = await makeApiRequest(this.endpoints.list);

            if (response.status === 200 || response.success || (response.data && Array.isArray(response.data))) {
                // Backend strukturuna görə datanı tapırıq
                const tasks = Array.isArray(response.data) ? response.data : (response.items || []);

                this.data = tasks;
                this.renderTable(this.data);

                if(metaInfo) {
                    metaInfo.textContent = `${tasks.length} partnyor tapşırığı`;
                }
            } else {
                console.error('API Error:', response);
                tableBody.innerHTML = `<tr><td colspan="11" class="text-center text-red-500 py-4">Xəta: ${response.error || 'Naməlum xəta'}</td></tr>`;
            }
        } catch (error) {
            console.error('Catch Error:', error);
            tableBody.innerHTML = `<tr><td colspan="11" class="text-center text-red-500 py-4">Sistem xətası baş verdi.</td></tr>`;
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
            let statusClass = 'bg-gray-100 text-gray-600';
            let statusText = task.status || 'Naməlum';

            // Status rəngləri
            if(task.status === 'completed') { statusClass = 'bg-green-100 text-green-600'; statusText = 'Tamamlanıb'; }
            else if(task.status === 'pending') { statusClass = 'bg-yellow-100 text-yellow-600'; statusText = 'Gözləmədə'; }
            else if(task.status === 'in_progress') { statusClass = 'bg-blue-100 text-blue-600'; statusText = 'İcra olunur'; }
            else if(task.status === 'rejected' || task.status === 'cancelled') { statusClass = 'bg-red-100 text-red-600'; statusText = 'Ləğv edilib'; }

            html += `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="text-center font-medium text-gray-500">${index + 1}</td>
                    <td>
                        <div class="flex flex-col">
                            <span class="font-medium text-gray-700">${this.formatDate(task.created_at)}</span>
                            <span class="text-xs text-gray-400">${this.formatTime(task.created_at)}</span>
                        </div>
                    </td>
                    <td><span class="font-semibold text-gray-700">${task.company_name || '-'}</span></td>
                    <td>
                        <div class="flex items-center gap-2">
                            <div class="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-600 font-bold">
                                ${(task.creator_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span class="text-sm text-gray-600">${task.creator_name || '-'}</span>
                        </div>
                    </td>
                    <td><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">${task.source_company_name || '-'}</span></td>
                    <td><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">${task.executor_company_name || '-'}</span></td>
                    <td>
                        <div class="flex items-center gap-2">
                            <button onclick="PartnerTaskManager.viewDetails(${task.id})" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Bax"><i class="fas fa-eye"></i></button>
                            <button onclick="PartnerTaskManager.deleteTask(${task.id})" class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" title="Sil"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                    <td><span class="text-sm text-gray-600 font-medium">${this.formatDate(task.due_date)}</span></td>
                    <td><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">${statusText}</span></td>
                    <td><span class="text-sm text-gray-700 font-medium">${task.responsible_person || '-'}</span></td>
                    <td><a href="tel:${task.responsible_contact}" class="text-sm text-blue-600 hover:underline">${task.responsible_contact || '-'}</a></td>
                </tr>`;
        });

        tableBody.innerHTML = html;
    },

    renderEmptyState: function() {
        document.getElementById('partnerTableBody').innerHTML = `
            <tr class="empty-row"><td colspan="11"><div class="empty-state py-12 flex flex-col items-center justify-center text-center">
                <div class="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4"><i class="fas fa-handshake text-3xl text-amber-500"></i></div>
                <h3 class="text-lg font-semibold text-gray-800 mb-1">Partnyor Tapşırığı Yoxdur</h3>
            </div></td></tr>`;
    },

    formatDate: (dateString) => dateString ? new Date(dateString).toLocaleDateString('az-AZ') : '-',
    formatTime: (dateString) => dateString ? new Date(dateString).toLocaleTimeString('az-AZ', {hour:'2-digit', minute:'2-digit'}) : '',

    viewDetails: (id) => alert(`Detallar (ID: ${id}) tezliklə...`),

    deleteTask: async function(id) {
        if(confirm('Silmək istədiyinizə əminsiniz?')) {
            const response = await makeApiRequest(this.endpoints.delete(id), 'DELETE');
            if (response.status === 200 || response.success) {
                this.loadTasks();
            } else {
                alert('Silinmə xətası: ' + (response.error || 'Naməlum'));
            }
        }
    }
};

window.PartnerTaskManager = PartnerTaskManager;