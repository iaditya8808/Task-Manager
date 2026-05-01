document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let currentUser = null;
    let currentProject = null;
    let allUsers = [];

    // --- DOM Elements ---
    const app = document.getElementById('app');
    const authView = document.getElementById('auth-view');
    const dashboardView = document.getElementById('dashboard-view');
    
    // Auth
    const btnShowLogin = document.getElementById('btn-show-login');
    const btnShowRegister = document.getElementById('btn-show-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    // Nav
    const navLinks = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('.main-content .section');
    const pageTitle = document.getElementById('page-title');
    
    // Modals
    const overlay = document.getElementById('modal-overlay');
    const modals = document.querySelectorAll('.modal');
    const btnCloseModals = document.querySelectorAll('.btn-close-modal');

    // --- Init ---
    async function init() {
        if (api.token) {
            try {
                const res = await api.getMe();
                currentUser = res.user;
                showDashboard();
            } catch (e) {
                console.error("Token invalid or expired");
                api.clearToken();
                showAuth();
            }
        } else {
            showAuth();
        }
        setupEventListeners();
    }

    // --- UI Navigation ---
    function showAuth() {
        authView.classList.add('active');
        dashboardView.classList.remove('active');
    }

    function showDashboard() {
        authView.classList.remove('active');
        dashboardView.classList.add('active');
        
        document.getElementById('current-username').textContent = currentUser.username;
        document.getElementById('current-role').textContent = currentUser.role;
        
        if (currentUser.role === 'Admin') {
            document.body.classList.add('role-admin');
            loadAllUsers();
        }

        loadProjects();
    }

    function switchSection(targetId, title) {
        sections.forEach(s => s.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');
        pageTitle.textContent = title;
        
        if (targetId === 'my-tasks') {
            loadMyTasks();
        }
    }

    // --- Modals ---
    function openModal(modalId) {
        overlay.classList.add('active');
        document.getElementById(modalId).classList.add('active');
    }

    function closeAllModals() {
        overlay.classList.remove('active');
        modals.forEach(m => m.classList.remove('active'));
    }

    // --- Data Loading ---
    async function loadAllUsers() {
        try {
            allUsers = await api.getUsers();
            
            // Populate select dropdowns
            const assigneeSelect = document.getElementById('task-assignee');
            const memberSelect = document.getElementById('member-user-id');
            
            assigneeSelect.innerHTML = '<option value="">Unassigned</option>';
            memberSelect.innerHTML = '<option value="">Select User</option>';
            
            allUsers.forEach(u => {
                assigneeSelect.innerHTML += `<option value="${u.id}">${u.username} (${u.role})</option>`;
                memberSelect.innerHTML += `<option value="${u.id}">${u.username} (${u.role})</option>`;
            });
        } catch(e) {
            console.error("Failed to load users", e);
        }
    }

    async function loadProjects() {
        try {
            const projects = await api.getProjects();
            const grid = document.getElementById('projects-grid');
            grid.innerHTML = '';
            
            if (projects.length === 0) {
                grid.innerHTML = '<p class="text-muted">No projects found. Create one to get started.</p>';
                return;
            }

            projects.forEach(p => {
                const card = document.createElement('div');
                card.className = 'project-card';
                card.innerHTML = `
                    <h4>${p.name}</h4>
                    <p>${p.description || 'No description'}</p>
                    <div class="project-meta">
                        <span><i class="fa-solid fa-users"></i> ${p.members.length} members</span>
                        <span>Created ${new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                `;
                card.addEventListener('click', () => loadProjectDetail(p.id));
                grid.appendChild(card);
            });
        } catch(e) {
            console.error("Error loading projects", e);
        }
    }

    async function loadProjectDetail(projectId) {
        try {
            currentProject = await api.getProject(projectId);
            document.getElementById('detail-project-name').textContent = currentProject.name;
            document.getElementById('detail-project-desc').textContent = currentProject.description || '';
            document.getElementById('task-project-id').value = currentProject.id;
            document.getElementById('member-project-id').value = currentProject.id;
            
            switchSection('project-detail', currentProject.name);
            await loadProjectTasks(projectId);
        } catch(e) {
            alert('Failed to load project details');
        }
    }

    async function loadProjectTasks(projectId) {
        try {
            const tasks = await api.getTasks(projectId);
            renderTasks(tasks, 'col-todo', 'col-inprogress', 'col-done');
        } catch(e) {
            console.error("Error loading tasks", e);
        }
    }

    async function loadMyTasks() {
        try {
            const tasks = await api.getTasks();
            renderTasks(tasks, 'my-col-todo', 'my-col-inprogress', 'my-col-done');
        } catch(e) {
            console.error("Error loading my tasks", e);
        }
    }

    function renderTasks(tasks, todoId, inprogId, doneId) {
        const todoContainer = document.querySelector(`#${todoId} .task-list`);
        const inprogContainer = document.querySelector(`#${inprogId} .task-list`);
        const doneContainer = document.querySelector(`#${doneId} .task-list`);
        
        todoContainer.innerHTML = '';
        inprogContainer.innerHTML = '';
        doneContainer.innerHTML = '';
        
        tasks.forEach(t => {
            const card = document.createElement('div');
            card.className = 'task-card';
            
            // Assignee name (rough lookup if available)
            let assigneeName = 'Unassigned';
            if (t.assigned_to) {
                if (allUsers.length > 0) {
                    const u = allUsers.find(x => x.id === t.assigned_to);
                    if(u) assigneeName = u.username;
                } else if (currentProject && currentProject.members) {
                    const u = currentProject.members.find(x => x.id === t.assigned_to);
                    if(u) assigneeName = u.username;
                }
                
                if(assigneeName === 'Unassigned' && t.assigned_to === currentUser.id) {
                    assigneeName = currentUser.username;
                }
            }

            card.innerHTML = `
                <div class="task-title">${t.title}</div>
                <div class="task-desc">${t.description || ''}</div>
                <div class="task-footer">
                    <span class="task-priority ${t.priority}"><i class="fa-solid fa-flag"></i> ${t.priority}</span>
                    <span><i class="fa-solid fa-user"></i> ${assigneeName}</span>
                </div>
            `;
            
            // Click to edit status (if admin or assigned to current user)
            if (currentUser.role === 'Admin' || t.assigned_to === currentUser.id) {
                card.addEventListener('click', () => {
                    document.getElementById('edit-task-id').value = t.id;
                    document.getElementById('edit-task-status').value = t.status;
                    openModal('modal-edit-task');
                });
            }

            if (t.status === 'Todo') todoContainer.appendChild(card);
            else if (t.status === 'In Progress') inprogContainer.appendChild(card);
            else if (t.status === 'Done') doneContainer.appendChild(card);
        });
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        // Auth Toggles
        btnShowLogin.addEventListener('click', () => {
            btnShowLogin.classList.add('active');
            btnShowRegister.classList.remove('active');
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
        });
        
        btnShowRegister.addEventListener('click', () => {
            btnShowRegister.classList.add('active');
            btnShowLogin.classList.remove('active');
            registerForm.classList.add('active');
            loginForm.classList.remove('active');
        });

        // Login
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const u = document.getElementById('login-username').value;
            const p = document.getElementById('login-password').value;
            const err = document.getElementById('login-error');
            try {
                const res = await api.login(u, p);
                api.setToken(res.access_token);
                currentUser = res.user;
                err.textContent = '';
                showDashboard();
            } catch(ex) {
                err.textContent = ex.message;
            }
        });

        // Register
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const u = document.getElementById('reg-username').value;
            const em = document.getElementById('reg-email').value;
            const p = document.getElementById('reg-password').value;
            const r = document.getElementById('reg-role').value;
            const err = document.getElementById('reg-error');
            const suc = document.getElementById('reg-success');
            
            try {
                await api.register(u, em, p, r);
                err.textContent = '';
                suc.textContent = 'Registration successful! Please login.';
                setTimeout(() => btnShowLogin.click(), 2000);
            } catch(ex) {
                err.textContent = ex.message;
                suc.textContent = '';
            }
        });

        // Logout
        document.getElementById('btn-logout').addEventListener('click', () => {
            api.clearToken();
            window.location.reload();
        });

        // Nav Links
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                switchSection(link.dataset.target, link.textContent.trim());
            });
        });

        // Back to projects
        document.getElementById('btn-back-projects').addEventListener('click', () => {
            switchSection('projects-list', 'Projects');
            navLinks.forEach(l => l.classList.remove('active'));
            navLinks[0].classList.add('active');
        });

        // Modals functionality
        document.getElementById('btn-new-project').addEventListener('click', () => openModal('modal-new-project'));
        document.getElementById('btn-new-task').addEventListener('click', () => {
            // Only populate assignees from current project members
            if (currentProject) {
                const sel = document.getElementById('task-assignee');
                sel.innerHTML = '<option value="">Unassigned</option>';
                currentProject.members.forEach(m => {
                    sel.innerHTML += `<option value="${m.id}">${m.username} (${m.role})</option>`;
                });
            }
            openModal('modal-new-task');
        });
        document.getElementById('btn-add-member').addEventListener('click', () => openModal('modal-add-member'));

        btnCloseModals.forEach(btn => btn.addEventListener('click', closeAllModals));
        overlay.addEventListener('click', closeAllModals);

        // Forms inside modals
        document.getElementById('form-new-project').addEventListener('submit', async (e) => {
            e.preventDefault();
            const n = document.getElementById('project-name').value;
            const d = document.getElementById('project-desc').value;
            try {
                await api.createProject(n, d);
                closeAllModals();
                e.target.reset();
                loadProjects();
            } catch(ex) { alert(ex.message); }
        });

        document.getElementById('form-new-task').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                project_id: document.getElementById('task-project-id').value,
                title: document.getElementById('task-title').value,
                description: document.getElementById('task-desc').value,
                priority: document.getElementById('task-priority').value,
                due_date: document.getElementById('task-due-date').value || null,
                assigned_to: document.getElementById('task-assignee').value || null
            };
            try {
                await api.createTask(data);
                closeAllModals();
                e.target.reset();
                loadProjectTasks(currentProject.id);
            } catch(ex) { alert(ex.message); }
        });

        document.getElementById('form-add-member').addEventListener('submit', async (e) => {
            e.preventDefault();
            const pid = document.getElementById('member-project-id').value;
            const uid = document.getElementById('member-user-id').value;
            try {
                await api.addMember(pid, uid);
                closeAllModals();
                e.target.reset();
                alert('Member added successfully!');
                loadProjectDetail(pid); // Refresh details to include new member in select dropdowns
            } catch(ex) { alert(ex.message); }
        });

        document.getElementById('form-edit-task').addEventListener('submit', async (e) => {
            e.preventDefault();
            const tid = document.getElementById('edit-task-id').value;
            const st = document.getElementById('edit-task-status').value;
            try {
                await api.updateTask(tid, { status: st });
                closeAllModals();
                
                // Refresh appropriate view
                if (document.getElementById('project-detail').classList.contains('active')) {
                    loadProjectTasks(currentProject.id);
                } else {
                    loadMyTasks();
                }
            } catch(ex) { alert(ex.message); }
        });
    }

    // Start
    init();
});
