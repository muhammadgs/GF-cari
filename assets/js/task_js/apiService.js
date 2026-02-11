const API_BASE = "http://vps.guvenfinans.az:8008";

// API Sorğu Funksiyası
async function makeApiRequest(endpoint, method = 'GET', data = null, requiresAuth = true) {
    // 1. URL Hazırlama (Slash təkrarının qarşısını almaq üçün)
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    // Əgər '/api/v1' artıq varsa, təkrarlama
    const finalPath = cleanEndpoint.includes('/api/v1') ? cleanEndpoint : `/api/v1${cleanEndpoint}`;
    const url = `${API_BASE}${finalPath}`;

    // 2. Token əldə etmə (AuthService-dən istifadə edirik)
    let token = null;
    if (requiresAuth) {
        if (typeof AuthService !== 'undefined') {
            token = AuthService.getToken();
        } else {
            token = localStorage.getItem('guven_token');
        }

        if (!token) {
            console.error('❌ Token tapılmadı! Loginə yönləndirilir...');
            if(window.AuthService) window.AuthService.redirectToLogin();
            return { error: 'No auth token', status: 401 };
        }
    }

    // 3. Headers
    const headers = { 'Accept': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = {
        method: method,
        headers: headers,
        mode: 'cors'
    };

    if (data) {
        if (data instanceof FormData) {
            options.body = data;
        } else {
            headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(data);
        }
    }

    try {
        const response = await fetch(url, options);

        if (response.status === 401) {
            console.error('⛔ 401 Unauthorized');
            if(window.AuthService) window.AuthService.redirectToLogin();
            return { error: 'Unauthorized', status: 401 };
        }

        // Response-u oxumağa cəhd et
        const contentType = response.headers.get('content-type');
        let responseData;
        if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }

        if (!response.ok) {
            return {
                error: responseData.detail || responseData.message || 'Xəta',
                status: response.status,
                raw: responseData
            };
        }

        // Uğurlu cavabı standartlaşdır
        if (responseData.data) return { data: responseData.data, success: true, status: 200 };
        if (Array.isArray(responseData)) return { data: responseData, success: true, status: 200 };

        return { data: responseData, success: true, status: 200 };

    } catch (error) {
        console.error('Network Error:', error);
        return { error: error.message, status: 0 };
    }
}

// Helper: Tokeni tapmaq (Köhnə kodlar üçün saxlanıldı)
function getAuthToken() {
    return window.AuthService ? window.AuthService.getToken() : localStorage.getItem('guven_token');
}

// Uyğunluq üçün ApiService obyekti yaradırıq (PartnerTask.js bunu axtara bilər)
const ApiService = {
    get: (endpoint) => makeApiRequest(endpoint, 'GET'),
    post: (endpoint, data) => makeApiRequest(endpoint, 'POST', data),
    put: (endpoint, data) => makeApiRequest(endpoint, 'PUT', data),
    delete: (endpoint) => makeApiRequest(endpoint, 'DELETE'),
    request: makeApiRequest
};

// Qlobala əlavə et
window.makeApiRequest = makeApiRequest;
window.getAuthToken = getAuthToken;
window.ApiService = ApiService;