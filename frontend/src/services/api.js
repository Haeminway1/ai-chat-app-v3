const API_BASE_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  
  const config = {
    ...options,
    headers
  };
  
  // 요청 시작 시간 기록 (디버깅용)
  const startTime = Date.now();
  
  try {
    console.log(`API Request to ${url}:`, {
      method: options.method || 'GET',
      data: options.body ? JSON.parse(options.body) : undefined
    });
    
    // 타임아웃 설정
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Request to ${url} timed out after 30s`)), 30000);
    });
    
    // 실제 요청과 타임아웃 경쟁
    const response = await Promise.race([
      fetch(url, config),
      timeoutPromise
    ]);
    
    // 요청 완료 시간 계산
    const requestTime = Date.now() - startTime;
    
    if (!response.ok) {
      // Try to get detailed error from response body
      const errorData = await response.json().catch(() => ({}));
      console.error(`API error response from ${url} (${requestTime}ms):`, {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      });
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`API Response from ${url} (${requestTime}ms):`, data);
    return data;
  } catch (error) {
    // 네트워크 오류나 타임아웃의 경우 더 명확한 로깅
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      console.error(`Network error for ${url}: Server may be down or unreachable`);
    } else {
      console.error(`API request error to ${url}:`, error.message);
    }
    throw error;
  }
}

export default {
  get: (endpoint) => request(endpoint),
  
  post: (endpoint, data) => request(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  put: (endpoint, data) => request(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  delete: (endpoint) => request(endpoint, {
    method: 'DELETE'
  })
};