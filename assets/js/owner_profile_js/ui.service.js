/**
 * UI Service - İnterfeys əməliyyatları
 */

class UIService {
    constructor() {
        this.notifications = [];
    }

    // Form doldurmaq
    populateForm(formData) {
        console.log('📝 Form doldurulur...');

        const fieldMapping = {
            // Şəxsi məlumatlar
            'firstName': formData.firstName || formData.ceo_name || '',
            'lastName': formData.lastName || formData.ceo_lastname || '',
            'fatherName': formData.fatherName || '',
            'gender': formData.gender || '',
            'birthDate': formData.birthDate || '',
            'voen': formData.voen || '',

            // ASAN məlumatları
            'asanImza': formData.asanImza || '',
            'asanId': formData.asanId || '',
            'pin1': formData.pin1 || '',
            'pin2': formData.pin2 || '',
            'puk': formData.puk || '',
            'finCode': formData.finCode || '',

            // Əlaqə məlumatları
            'email': formData.email || '',
            'phone': formData.phone || '',

            // Şirkət adı
            'company_name': formData.company_name || formData.companyName || formData.originalData?.company_name || '',

            // Telegram
            'telegramUsername': formData.telegramUsername || ''
        };

        // Hər bir field-i doldur
        Object.keys(fieldMapping).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.value = fieldMapping[key];
            }
        });

        // Status indikatorlarını yenilə
        this.updateStatusIndicators(formData);
        console.log('✅ Form tam dolduruldu');
    }

    // Formdan məlumatları almaq
    getFormData(formId) {
        const form = document.getElementById(formId);
        if (!form) return {};

        const formData = new FormData(form);
        const data = {};

        formData.forEach((value, key) => {
            data[key] = value;
        });

        return data;
    }

    // Status indikatorlarını yeniləmək
    updateStatusIndicators(statusData) {
        const indicators = {
            emailStatus: {
                verified: statusData.emailVerified,
                elementId: 'emailStatus'
            },
            phoneStatus: {
                verified: statusData.phoneVerified,
                elementId: 'phoneStatus'
            },
            telegramStatus: {
                verified: statusData.telegramVerified,
                elementId: 'telegramStatus'
            }
        };

        Object.keys(indicators).forEach(key => {
            const indicator = indicators[key];
            const element = document.getElementById(indicator.elementId);

            if (element) {
                if (indicator.verified) {
                    element.innerHTML = '<i class="fa-solid fa-check-circle text-success-green"></i><span class="ml-1">Təsdiqlənib</span>';
                    element.className = 'text-xs font-normal text-success-green';
                } else {
                    element.innerHTML = '<i class="fa-solid fa-times-circle text-error-red"></i><span class="ml-1">Təsdiqlənməyib</span>';
                    element.className = 'text-xs font-normal text-error-red';
                }
            }
        });
    }

    // Notification göstərmək
    showNotification(message, type = 'success', duration = 4000) {
        // Köhnə notifikasiyaları təmizlə
        this.clearNotifications();

        // Yeni notification yarat
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-xl text-white font-semibold z-50 shadow-lg transition-all duration-300 transform translate-x-full`;

        // Tipə görə rəng
        switch (type) {
            case 'success':
                notification.classList.add('bg-green-500');
                break;
            case 'error':
                notification.classList.add('bg-red-500');
                break;
            case 'warning':
                notification.classList.add('bg-yellow-500');
                break;
            case 'info':
                notification.classList.add('bg-blue-500');
                break;
            default:
                notification.classList.add('bg-brand-blue');
        }

        notification.textContent = message;
        notification.dataset.id = Date.now();

        document.body.appendChild(notification);

        // Animasiya başlat
        requestAnimationFrame(() => {
            notification.classList.remove('translate-x-full');
        });

        this.notifications.push(notification.dataset.id);

        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);
    }

    removeNotification(notification) {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    clearNotifications() {
        document.querySelectorAll('.fixed.top-4.right-4').forEach(notification => {
            this.removeNotification(notification);
        });
        this.notifications = [];
    }

    setLoading(element, isLoading) {
        if (!element) return;

        if (isLoading) {
            element.dataset.originalText = element.innerHTML;
            element.innerHTML = '<div class="loading-spinner"></div>';
            element.disabled = true;
            element.classList.add('opacity-75');
        } else {
            if (element.dataset.originalText) {
                element.innerHTML = element.dataset.originalText;
                delete element.dataset.originalText;
            }
            element.disabled = false;
            element.classList.remove('opacity-75');
        }
    }

    showFormErrors(errors, formId = 'profileForm') {
        this.clearFormErrors(formId);
        errors.forEach(error => {
            this.showError(error.field || 'general', error.message);
        });
    }

    showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        field.classList.add('border-red-500');
        const errorElement = document.createElement('div');
        errorElement.className = 'text-red-500 text-sm mt-1';
        errorElement.textContent = message;
        field.parentNode.appendChild(errorElement);

        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.parentNode.removeChild(errorElement);
            }
            field.classList.remove('border-red-500');
        }, 5000);
    }

    clearFormErrors(formId) {
        const form = document.getElementById(formId);
        if (!form) return;
        form.querySelectorAll('.border-red-500').forEach(el => el.classList.remove('border-red-500'));
        form.querySelectorAll('.text-red-500.text-sm.mt-1').forEach(el => el.remove());
    }

    displayImage(file, containerSelector, isRound = false) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const container = document.querySelector(containerSelector);
            if (!container) return;

            const oldImg = container.querySelector('img');
            if (oldImg) oldImg.remove();

            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'w-full h-full object-cover';
            img.alt = 'Uploaded image';

            if (isRound) {
                img.classList.add('rounded-full');
            } else {
                img.classList.add('rounded-xl');
            }

            container.appendChild(img);
        };
        reader.readAsDataURL(file);
    }

    // ✅ SIDEBAR FUNKSİYALARI (İndi Class daxilindədir və 280px istifadə edir)
    setupSidebar() {
        console.log('📐 Sidebar UI qurulur...');

        const toggleBtn = document.getElementById('sidebarToggle');
        const mainLayout = document.getElementById('mainLayout');

        if (!toggleBtn || !mainLayout) {
            console.warn('⚠️ Sidebar elementləri tapılmadı (HTML-də ID-ləri yoxlayın)');
            return;
        }

        // 1. LocalStorage-dan oxu
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
            this.setSidebarState(true);
        }

        // 2. Klik hadisəsi
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isCurrentlyCollapsed = document.body.classList.contains('sidebar-collapsed');
            this.setSidebarState(!isCurrentlyCollapsed);
        });
    }

    setSidebarState(collapsed) {
        const mainLayout = document.getElementById('mainLayout');

        if (collapsed) {
            document.body.classList.add('sidebar-collapsed');
            // 280px-dən 80px-ə
            mainLayout.classList.remove('lg:grid-cols-[280px_1fr]');
            mainLayout.classList.add('lg:grid-cols-[80px_1fr]');
            localStorage.setItem('sidebarCollapsed', 'true');
        } else {
            document.body.classList.remove('sidebar-collapsed');
            // 80px-dən 280px-ə
            mainLayout.classList.remove('lg:grid-cols-[80px_1fr]');
            mainLayout.classList.add('lg:grid-cols-[280px_1fr]');
            localStorage.setItem('sidebarCollapsed', 'false');
        }
    }

} // Class burada bitir

// Global export
window.UIService = UIService;