import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// JWT Secret com valor padrão
const JWT_SECRET = process.env.JWT_SECRET || 'taskquest-super-secret-key-2025';

console.log('JWT_SECRET configurado:', JWT_SECRET ? 'Sim' : 'Não');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory database
const users = new Map();
const tasks = new Map();
const activityLog = [];
let taskIdCounter = 1;

// Admin credentials
const ADMIN_EMAIL = 'admin@taskquest.com';
const ADMIN_PASSWORD = 'admin123';

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando!' });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    
    if (users.has(email)) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }
    
    const hashedPassword = await bcryptjs.hash(password, 10);
    users.set(email, { email, password: hashedPassword, isAdmin: false });
    
    res.json({ message: 'Usuário criado com sucesso' });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro ao criar conta: ' + error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    
    let user;
    let isAdmin = false;
    
    // Check if it's admin login
    if (email === ADMIN_EMAIL) {
      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Senha incorreta' });
      }
      user = { email: ADMIN_EMAIL };
      isAdmin = true;
    } else {
      // Regular user login
      user = users.get(email);
      if (!user) {
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }
      
      const validPassword = await bcryptjs.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Senha incorreta' });
      }
    }
    
    const token = jwt.sign(
      { email: user.email, isAdmin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ token, email: user.email, isAdmin });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login: ' + error.message });
  }
});

// Verify token middleware
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(401).json({ error: 'Token inválido: ' + error.message });
  }
}

// Verify admin middleware
function verifyAdmin(req, res, next) {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Acesso negado. Apenas admin.' });
  }
  next();
}

// Create task
app.post('/api/tasks', verifyToken, (req, res) => {
  try {
    const { name, description, stages } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome da tarefa é obrigatório' });
    }
    
    const taskId = taskIdCounter++;
    const task = {
      id: taskId,
      name,
      description: description || '',
      stages: stages || [],
      currentStage: 0,
      creator: req.user.email,
      createdAt: new Date(),
      progress: {},
      participants: [req.user.email],
    };
    
    tasks.set(taskId, task);
    
    activityLog.push({
      timestamp: new Date(),
      type: 'task_created',
      user: req.user.email,
      taskId,
      taskName: name,
      details: `Tarefa "${name}" criada`,
    });
    
    res.json(task);
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({ error: 'Erro ao criar tarefa: ' + error.message });
  }
});

// Get all tasks
app.get('/api/tasks', verifyToken, (req, res) => {
  try {
    const userTasks = Array.from(tasks.values());
    res.json(userTasks);
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
    res.status(500).json({ error: 'Erro ao buscar tarefas: ' + error.message });
  }
});

// Get single task
app.get('/api/tasks/:id', verifyToken, (req, res) => {
  try {
    const task = tasks.get(parseInt(req.params.id));
    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    res.json(task);
  } catch (error) {
    console.error('Erro ao buscar tarefa:', error);
    res.status(500).json({ error: 'Erro ao buscar tarefa: ' + error.message });
  }
});

// Update task stage
app.put('/api/tasks/:id/stage', verifyToken, (req, res) => {
  try {
    const { stage } = req.body;
    const taskId = parseInt(req.params.id);
    const task = tasks.get(taskId);
    
    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    task.currentStage = stage;
    if (!task.progress) task.progress = {};
    task.progress[req.user.email] = stage;
    
    if (!task.participants.includes(req.user.email)) {
      task.participants.push(req.user.email);
    }
    
    activityLog.push({
      timestamp: new Date(),
      type: 'stage_updated',
      user: req.user.email,
      taskId,
      taskName: task.name,
      stage: task.stages[stage] || `Etapa ${stage}`,
      details: `${req.user.email} avançou para "${task.stages[stage] || `Etapa ${stage}`}" em "${task.name}"`,
    });
    
    res.json(task);
  } catch (error) {
    console.error('Erro ao atualizar etapa:', error);
    res.status(500).json({ error: 'Erro ao atualizar etapa: ' + error.message });
  }
});

// Delete task
app.delete('/api/tasks/:id', verifyToken, (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const task = tasks.get(taskId);
    
    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    if (task.creator !== req.user.email && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Sem permissão' });
    }
    
    tasks.delete(taskId);
    
    activityLog.push({
      timestamp: new Date(),
      type: 'task_deleted',
      user: req.user.email,
      taskId,
      taskName: task.name,
      details: `Tarefa "${task.name}" deletada`,
    });
    
    res.json({ message: 'Tarefa deletada' });
  } catch (error) {
    console.error('Erro ao deletar tarefa:', error);
    res.status(500).json({ error: 'Erro ao deletar tarefa: ' + error.message });
  }
});

// Admin: Get activity log
app.get('/api/admin/activity-log', verifyToken, verifyAdmin, (req, res) => {
  try {
    const log = activityLog.slice(-100).reverse();
    res.json(log);
  } catch (error) {
    console.error('Erro ao buscar log:', error);
    res.status(500).json({ error: 'Erro ao buscar log: ' + error.message });
  }
});

// Admin: Get tasks overview
app.get('/api/admin/tasks-overview', verifyToken, verifyAdmin, (req, res) => {
  try {
    const overview = Array.from(tasks.values()).map(task => ({
      id: task.id,
      name: task.name,
      description: task.description,
      creator: task.creator,
      createdAt: task.createdAt,
      stages: task.stages,
      participants: task.participants,
      progress: task.progress,
      totalParticipants: task.participants.length,
    }));
    
    res.json(overview);
  } catch (error) {
    console.error('Erro ao buscar overview:', error);
    res.status(500).json({ error: 'Erro ao buscar overview: ' + error.message });
  }
});

// Admin: Get statistics
app.get('/api/admin/statistics', verifyToken, verifyAdmin, (req, res) => {
  try {
    const totalUsers = users.size + 1;
    const totalTasks = tasks.size;
    const totalActivities = activityLog.length;
    
    const userActivity = {};
    activityLog.forEach(log => {
      if (!userActivity[log.user]) {
        userActivity[log.user] = 0;
      }
      userActivity[log.user]++;
    });
    
    res.json({
      totalUsers,
      totalTasks,
      totalActivities,
      userActivity,
      recentActivities: activityLog.slice(-10).reverse(),
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas: ' + error.message });
  }
});

// Fallback route - serve index.html
app.use((req, res) => {
  res.sendFile(new URL('./public/index.html', import.meta.url).pathname);
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
  console.log(`👤 Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`🔐 JWT Secret: ${JWT_SECRET.substring(0, 10)}...`);
});
