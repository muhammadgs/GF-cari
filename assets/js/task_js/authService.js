const AuthService = {
    tokenKeys: ['guven_token', 'access_token', 'token'], // Token adları

    getToken: function() {
        let token = null;
        // 1. Storage yoxla
        for (const key of this.tokenKeys) {
            token = localStorage.getItem(key) || sessionStorage.getItem(key);
            if (token) return token;
        }
        // 2. Cookie yoxla
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            for (const key of this.tokenKeys) {
                if (cookie.startsWith(key + '=')) {
                    return cookie.substring(key.length + 1);
                }
            }
        }
        return null;
    },

    isTokenExpired: function(token) {
        if (!token) return true;
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const { exp } = JSON.parse(jsonPayload);
            return exp < (Date.now() / 1000);
        } catch (e) {
            return true;
        }
    },

    checkAuth: function() {
        const token = this.getToken();
        if (!token || this.isTokenExpired(token)) {
            console.warn('Sessiya bitib, çıxış edilir...');
            this.logout();
            return false;
        }
        return true;
    },

    redirectToLogin: function() {
        this.logout();
    },

    logout: function() {
        this.tokenKeys.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
            document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        });
        if (!window.location.href.includes('login.html')) {
            window.location.href = '../login.html';
        }
    },

    initialize: function() {
        this.checkAuth();
        setInterval(() => this.checkAuth(), 60000); // Hər dəqiqə yoxla
    }
};

window.AuthService = AuthService;
document.addEventListener('DOMContentLoaded', () => AuthService.initialize());