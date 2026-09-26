document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = 'index.html';
        return;
    }

    let tasks = [];

    // Elements
    const btnLogout = document.getElementById('logout-btn');
    const btnNewTask = document.getElementById('open-new-task-modal');
    const modal = document.getElementById('task-modal');
    const btnCloseModal = document.getElementById('close-modal-btn');
    const formTask = document.getElementById('task-form');

    // Logout
    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('userId');
        window.location.href = 'index.html';
    });

    // Modals
    btnNewTask.addEventListener('click', () => {
        document.getElementById('modal-title').textContent = 'Nova Tarefa';
        formTask.reset();
        document.getElementById('task-id').value = '';
        modal.classList.remove('hidden');
    });

    btnCloseModal.addEventListener('click', () => modal.classList.add('hidden'));

    // Carregar Tarefas
    async function loadTasks() {
        try {
            const res = await fetch(`http://localhost:3000/api/tasks?userId=${userId}`);
            tasks = await res.json();
            renderTasks();
            updateStats();
        } catch (error) {
            console.error("Erro ao carregar tarefas", error);
        }
    }

    // Renderizar
    function renderTasks() {
        const cols = {
            'Não Iniciada': document.querySelector('#col-todo .column-content'),
            'Em Progresso': document.querySelector('#col-progress .column-content'),
            'Finalizada': document.querySelector('#col-done .column-content')
        };
        
        const counts = { 'Não Iniciada': 0, 'Em Progresso': 0, 'Finalizada': 0 };

        Object.values(cols).forEach(col => col.innerHTML = '');

        const todayDate = new Date().toISOString().split('T')[0];

        tasks.forEach(task => {
            counts[task.status]++;
            
            const isDelayed = task.due_date < todayDate && task.status !== 'Finalizada';
            
            const card = document.createElement('div');
            card.className = `task-card priority-${task.priority} ${isDelayed ? 'delayed' : ''}`;
            card.innerHTML = `
                <div class="task-badge">${task.type}</div>
                <div class="task-title">${task.title}</div>
                <div class="task-meta">
                    <span>Prazo: ${formatDate(task.due_date)}</span>
                    <select class="status-select" data-id="${task.id}">
                        <option value="Não Iniciada" ${task.status === 'Não Iniciada' ? 'selected' : ''}>Não Iniciada</option>
                        <option value="Em Progresso" ${task.status === 'Em Progresso' ? 'selected' : ''}>Em Progresso</option>
                        <option value="Finalizada"   ${task.status === 'Finalizada' ? 'selected' : ''}>Finalizada</option>
                    </select>
                </div>
            `;
            
            // Editar ao clicar no card, mas não no select
            card.addEventListener('click', (e) => {
                if(e.target.tagName !== 'SELECT' && e.target.tagName !== 'OPTION') {
                    openEditModal(task);
                }
            });

            const select = card.querySelector('.status-select');
            select.addEventListener('change', (e) => updateTaskStatus(task.id, e.target.value));

            if(cols[task.status]) {
                cols[task.status].appendChild(card);
            }
        });

        document.getElementById('count-todo').textContent = counts['Não Iniciada'];
        document.getElementById('count-progress').textContent = counts['Em Progresso'];
        document.getElementById('count-done').textContent = counts['Finalizada'];
    }

    function formatDate(dateString) {
        if(!dateString) return '';
        const parts = dateString.split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    // Estatísticas
    function updateStats() {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        // Config de inicio de semana
        const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay())); 
        const monthPrefix = todayStr.substring(0, 7); // yyyy-mm
        
        let completed = 0;
        let delayed = 0;
        let doneToday = 0;
        let doneWeek = 0;
        let doneMonth = 0;

        tasks.forEach(t => {
            const isDone = t.status === 'Finalizada';
            if (isDone) completed++;
            if (!isDone && t.due_date < todayStr) delayed++;
            
            if (isDone && t.completed_at) {
                const compDate = t.completed_at.split('T')[0];
                if (compDate === todayStr) doneToday++;
                if (compDate.startsWith(monthPrefix)) doneMonth++;
                
                const dDate = new Date(compDate);
                if (dDate >= firstDayOfWeek) doneWeek++;
            }
        });

        document.getElementById('stat-total').textContent = tasks.length;
        document.getElementById('stat-completed').textContent = completed;
        document.getElementById('stat-delayed').textContent = delayed;
        
        document.getElementById('stat-today').textContent = doneToday;
        document.getElementById('stat-week').textContent = doneWeek;
        document.getElementById('stat-month').textContent = doneMonth;
    }

    // Salvar Tarefa
    formTask.addEventListener('submit', async (e) => {
        e.preventDefault();
        const taskId = document.getElementById('task-id').value;
        const payload = {
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-desc').value,
            due_date: document.getElementById('task-date').value,
            type: document.getElementById('task-type').value,
            priority: document.getElementById('task-priority').value,
            user_id: userId
        };

        const method = taskId ? 'PUT' : 'POST';
        const url = taskId ? `http://localhost:3000/api/tasks/${taskId}` : 'http://localhost:3000/api/tasks';

        try {
            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            modal.classList.add('hidden');
            loadTasks();
        } catch (err) {
            console.error("Erro ao salvar", err);
        }
    });

    // Atualizar Status
    async function updateTaskStatus(id, newStatus) {
        let payload = { status: newStatus };
        if (newStatus === 'Finalizada') {
            payload.completed_at = new Date().toISOString();
        } else {
            payload.completed_at = null;
        }

        try {
            await fetch(`http://localhost:3000/api/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            loadTasks();
        } catch(err) {
            console.error("Erro status", err);
        }
    }

    // Abrir Modal Edicao
    function openEditModal(task) {
        document.getElementById('modal-title').textContent = 'Editar Tarefa';
        document.getElementById('task-id').value = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-desc').value = task.description;
        document.getElementById('task-date').value = task.due_date;
        document.getElementById('task-type').value = task.type;
        document.getElementById('task-priority').value = task.priority;
        modal.classList.remove('hidden');
    }

    // Inicialização
    loadTasks();
});
