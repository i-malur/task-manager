const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- ROTAS DE AUTENTICAÇÃO ---

app.post('/api/auth/register', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    const sql = `INSERT INTO users (email, password) VALUES (?, ?)`;
    db.run(sql, [email, password], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Este email já está cadastrado.' });
            }
            return res.status(500).json({ error: 'Erro ao registrar usuário.' });
        }
        res.status(201).json({ id: this.lastID, message: 'Usuário registrado com sucesso.' });
    });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    const sql = `SELECT * FROM users WHERE email = ? AND password = ?`;
    db.get(sql, [email, password], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao realizar login.' });
        }
        if (!row) {
            return res.status(401).json({ error: 'Email ou senha inválidos.' });
        }
        res.json({ id: row.id, message: 'Login bem-sucedido.' });
    });
});

// --- ROTAS DE TAREFAS ---

// Obter tarefas de um usuário
app.get('/api/tasks', (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).json({ error: 'User ID é obrigatório.' });
    }

    const sql = `SELECT * FROM tasks WHERE user_id = ? ORDER BY due_date ASC`;
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar tarefas.' });
        }
        res.json(rows);
    });
});

// Criar nova tarefa
app.post('/api/tasks', (req, res) => {
    const { user_id, title, description, due_date, type, priority, status } = req.body;

    if (!user_id || !title) {
        return res.status(400).json({ error: 'ID do usuário e título são obrigatórios.' });
    }

    const sql = `
        INSERT INTO tasks (user_id, title, description, due_date, type, priority, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [user_id, title, description, due_date, type, priority, status || 'Não Iniciada'];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(500).json({ error: 'Erro ao criar tarefa.' });
        }
        res.status(201).json({ id: this.lastID, message: 'Tarefa criada com sucesso.' });
    });
});

// Atualizar tarefa
app.put('/api/tasks/:id', (req, res) => {
    const { title, description, due_date, type, priority, status, completed_at } = req.body;
    const taskId = req.params.id;

    // Constrói query dinamicamente baseada nos campos enviados
    let fields = [];
    let params = [];

    if (title !== undefined) { fields.push('title = ?'); params.push(title); }
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    if (due_date !== undefined) { fields.push('due_date = ?'); params.push(due_date); }
    if (type !== undefined) { fields.push('type = ?'); params.push(type); }
    if (priority !== undefined) { fields.push('priority = ?'); params.push(priority); }
    if (status !== undefined) { fields.push('status = ?'); params.push(status); }
    if (completed_at !== undefined) { fields.push('completed_at = ?'); params.push(completed_at); }

    if (fields.length === 0) {
        return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    }

    params.push(taskId);

    const sql = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(500).json({ error: 'Erro ao atualizar tarefa.' });
        }
        res.json({ message: 'Tarefa atualizada com sucesso.', changes: this.changes });
    });
});

// Excluir tarefa
app.delete('/api/tasks/:id', (req, res) => {
    const taskId = req.params.id;

    const sql = `DELETE FROM tasks WHERE id = ?`;
    db.run(sql, [taskId], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Erro ao deletar tarefa.' });
        }
        res.json({ message: 'Tarefa deletada com sucesso.', changes: this.changes });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
