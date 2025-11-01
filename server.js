import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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
  res.json({ status: 'ok' });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (users.has(email)) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }
    
    const hashedPassword = await bcryptjs.hash(password, 10);
    users.set(email, { email, password: hashedPassword, isAdmin: false });
    
    res.json({ message: 'Usuário criado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    let user;
    
    if (email === ADMIN_EMAIL) {
      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Senha incorreta' });
      }
      user = { email: ADMIN_EMAIL, isAdmin: true };
    } else {
      user = users.get(email);
      if (!user) {
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }
      
      const validPassword = await bcryptjs.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Senha incorreta' });
      }
    }
    
    const token = jwt.sign({ email: user.email, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, email: user.email, isAdmin: user.isAdmin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify token middleware
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// Verify admin middleware
function verifyAdmin(req, res, next) {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  next();
}

// Create task
app.post('/api/tasks', verifyToken, (req, res) => {
  try {
    const { name, description, stages } = req.body;
    
    const taskId = taskIdCounter++;
    const task = {
      id: taskId,
      name,
      description,
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
    res.status(500).json({ error: error.message });
  }
});

// Get all tasks
app.get('/api/tasks', verifyToken, (req, res) => {
  try {
    const userTasks = Array.from(tasks.values());
    res.json(userTasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get activity log
app.get('/api/admin/activity-log', verifyToken, verifyAdmin, (req, res) => {
  try {
    const log = activityLog.slice(-100).reverse();
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
});

// Fallback route
app.use((req, res) => {
  res.sendFile(new URL('./public/index.html', import.meta.url).pathname);
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
  console.log(`👤 Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
});
