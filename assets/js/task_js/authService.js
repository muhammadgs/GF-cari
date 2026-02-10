// authService.js - YENİLƏNİŞ VERSİYA
// authService.js - OPTIMİZASIYA VERSİYA
const AuthService = {
    // Debounce üçün tracking
    _lastCheckTime: 0,
    _checking: false,
    _debounceDelay: 10000, // 10 saniyə debounce

    // Token vaxtı yoxlamaq
    isTokenExpired: function(token) {
        if (!token) return true;

        try {
            const payload = this.parseTokenPayload(token);
            if (!payload || !payload.exp) return true;

            const currentTime = Math.floor(Date.now() / 1000);
            const isExpired = payload.exp < currentTime;

            console.log(`🔐 Token yoxlanılır: exp=${payload.exp}, current=${currentTime}, expired=${isExpired}`);
            return isExpired;

        } catch (error) {
            console.error('Token parse error:', error);
            return true;
        }
    },

    // Token parse etmək
    parseTokenPayload: function(token) {
        if (!token) return null;

        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                console.error('❌ Token formatı səhv');
                return null;
            }

            // Base64 decode
            const base64Url = parts[1];
            let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

            // Padding əlavə et
            const pad = base64.length % 4;
            if (pad) {
                if (pad === 1) {
                    throw new Error('Invalid base64 length');
                }
                base64 += '==='.slice(0, 4 - pad);
            }

            const jsonPayload = atob(base64);
            const decoded = JSON.parse(jsonPayload);

            return decoded;

        } catch (error) {
            console.error('❌ Token parse error:', error);
            return null;
        }
    },

    // Token almaq (debounce ilə)
    getToken: function() {
        const now = Date.now();

        // Əgər son 2 saniyədə yoxlanılıbsa, yenidən yoxlama
        if (now - this._lastCheckTime < 2000 && this._cachedToken !== undefined) {
            return this._cachedToken;
        }

        this._lastCheckTime = now;

        const tokenKeys = ['guven_token', 'access_token', 'accessToken', 'token'];

        for (const key of tokenKeys) {
            // 1. localStorage
            let token = localStorage.getItem(key);
            if (token && token.trim() && token !== 'null' && token !== 'undefined') {
                this._cachedToken = token.trim();
                return this._cachedToken;
            }

            // 2. sessionStorage
            token = sessionStorage.getItem(key);
            if (token && token.trim() && token !== 'null' && token !== 'undefined') {
                this._cachedToken = token.trim();
                return this._cachedToken;
            }
        }

        // 3. Cookies
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith('access_token=')) {
                const token = cookie.substring('access_token='.length);
                this._cachedToken = token;
                return this._cachedToken;
            }
            if (cookie.startsWith('guven_token=')) {
                const token = cookie.substring('guven_token='.length);
                this._cachedToken = token;
                return this._cachedToken;
            }
        }

        this._cachedToken = null;
        return null;
    },

    // Auth yoxlama (debounce ilə)
    checkAuth: function(force = false) {
        const now = Date.now();

        // Əgər artıq yoxlanılırsa, qayıt
        if (this._checking && !force) {
            console.log('⏳ Auth yoxlanılır, gözləyin...');
            return true;
        }

        // Əgər son 5 saniyədə yoxlanılıbsa və force deyilsə, cache-dən istifadə et
        if (!force && now - this._lastAuthCheck < 5000 && this._lastAuthResult !== undefined) {
            return this._lastAuthResult;
        }

        this._checking = true;
        console.log('🔐 Auth yoxlanılır...');

        const token = this.getToken();

        // 1. Token yoxdursa
        if (!token) {
            console.error('❌ Token tapılmadı');
            this._checking = false;
            this._lastAuthResult = false;
            this._lastAuthCheck = now;

            this.handleUnauthorized('Token tapılmadı');
            return false;
        }

        // 2. Token expired-dirsə
        if (this.isTokenExpired(token)) {
            console.error('❌ Token vaxtı bitmişdir');
            this._checking = false;
            this._lastAuthResult = false;
            this._lastAuthCheck = now;

            this.handleUnauthorized('Session vaxtı bitmişdir');
            return false;
        }

        // 3. Token hələ də etibarlıdır
        const payload = this.parseTokenPayload(token);
        if (payload) {
            const currentTime = Math.floor(Date.now() / 1000);
            const timeLeft = payload.exp - currentTime;

            console.log(`✅ Token etibarlıdır. ${Math.floor(timeLeft / 60)} dəqiqə ${timeLeft % 60} saniyə qalıb`);

            // 5 dəqiqədən az qalıbsa, xəbərdarlıq göstər
            if (timeLeft < 300 && timeLeft > 60) {
                this.showWarningNotification(timeLeft);
            }
        }

        this._checking = false;
        this._lastAuthResult = true;
        this._lastAuthCheck = now;
        return true;
    },

    // Unauthorized handle
    handleUnauthorized: function(message) {
        console.log(`🚫 Unauthorized: ${message}`);

        // Notification göstər
        this.showNotification(message, 'danger');

        // Auth data təmizlə
        this.clearAuthData();

        // 2 saniyədən sonra redirect et
        setTimeout(() => {
            window.location.href = '../login.html';
        }, 2000);
    },

    // Notification göstərmək
    showNotification: function(message, type = 'info') {
        // Əgər artıq notification varsa, yenisini əlavə etmə
        if (document.querySelector('.auth-notification')) {
            return;
        }

        const notification = document.createElement('div');
        notification.className = `auth-notification auth-notification-${type}`;
        notification.innerHTML = `
            <div class="auth-notification-content">
                <i class="fas ${type === 'danger' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // CSS əlavə et (əgər yoxdursa)
        if (!document.querySelector('#auth-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'auth-notification-styles';
            style.textContent = `
                .auth-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    z-index: 99999;
                    animation: slideInRight 0.3s ease;
                    max-width: 400px;
                    font-family: 'Inter', sans-serif;
                    font-size: 14px;
                }
                
                .auth-notification-danger {
                    background: linear-gradient(135deg, #ff6b6b, #ff4757);
                    color: white;
                }
                
                .auth-notification-warning {
                    background: linear-gradient(135deg, #ffa502, #ff7f00);
                    color: white;
                }
                
                .auth-notification-success {
                    background: linear-gradient(135deg, #2ed573, #1dd1a1);
                    color: white;
                }
                
                .auth-notification-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .auth-notification-content i {
                    font-size: 18px;
                }
                
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // 5 saniyədən sonra sil
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    },

    // Vaxtı bitmək üzrə xəbərdarlıq
    showWarningNotification: function(timeLeft) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;

        const notification = document.createElement('div');
        notification.className = 'auth-notification auth-notification-warning';
        notification.innerHTML = `
            <div class="auth-notification-content">
                <i class="fas fa-clock"></i>
                <div>
                    <strong>Session vaxtı bitmək üzrə</strong>
                    <p>${minutes} dəqiqə ${seconds} saniyə qalıb. Davam etmək üçün yenidən login olun.</p>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // 10 saniyədən sonra sil
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    },

    // Interval ilə auth yoxlama (optimize edilmiş)
    startAuthMonitor: function() {
        console.log('⏱️ Auth monitor başladılır...');

        // Əvvəlki interval varsa təmizlə
        if (this.authCheckInterval) {
            clearInterval(this.authCheckInterval);
        }

        // Hər 2 dəqiqədən bir yoxla
        this.authCheckInterval = setInterval(() => {
            this.checkAuth();
        }, 120000); // 2 dəqiqə

        console.log('✅ Auth monitor aktiv edildi (2 dəqiqə interval)');
    },

    // Stop auth monitor
    stopAuthMonitor: function() {
        if (this.authCheckInterval) {
            clearInterval(this.authCheckInterval);
            this.authCheckInterval = null;
            console.log('🛑 Auth monitor dayandırıldı');
        }
    },

    // Initialize auth system
    initialize: function() {
        console.log('🔐 Auth Service initialize edilir...');

        // Əvvəlcə auth yoxla
        if (!this.checkAuth()) {
            console.error('❌ Auth yoxlaması uğursuz oldu');
            return false;
        }

        // Auth monitor başlat
        this.startAuthMonitor();

        // Page unload zamanı monitoru dayandır
        window.addEventListener('beforeunload', () => {
            this.stopAuthMonitor();
        });

        console.log('✅ Auth Service hazırdır');
        return true;
    }
};

// Global export
if (typeof window !== 'undefined') {
    window.AuthService = AuthService;
}