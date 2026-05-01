const API_BASE = '/api';

class ApiService {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const config = {
            ...options,
            headers: this.getHeaders()
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                if (response.status === 401 && this.token) {
                    this.clearToken();
                    window.location.reload();
                }
                throw new Error(data.msg || 'An error occurred');
            }
            return data;
        } catch (error) {
            throw error;
        }
    }

    // Auth
    login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    register(username, email, password, role) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password, role })
        });
    }

    getMe() {
        return this.request('/auth/me');
    }

    getUsers() {
        return this.request('/auth/users');
    }

    // Projects
    getProjects() {
        return this.request('/projects/');
    }

    getProject(id) {
        return this.request(`/projects/${id}`);
    }

    createProject(name, description) {
        return this.request('/projects/', {
            method: 'POST',
            body: JSON.stringify({ name, description })
        });
    }

    addMember(projectId, userId) {
        return this.request(`/projects/${projectId}/members`, {
            method: 'POST',
            body: JSON.stringify({ user_id: userId })
        });
    }

    // Tasks
    getTasks(projectId = null) {
        let url = '/tasks/';
        if (projectId) {
            url += `?project_id=${projectId}`;
        }
        return this.request(url);
    }

    createTask(taskData) {
        return this.request('/tasks/', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
    }

    updateTask(taskId, taskData) {
        return this.request(`/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify(taskData)
        });
    }
}

window.api = new ApiService();
