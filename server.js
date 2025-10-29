import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Database setup
const dbPath = path.join(__dirname, 'dev.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize database
function initializeDatabase() {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        points INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        created_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS stages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        "order" INTEGER NOT NULL,
        color TEXT DEFAULT '#9333ea',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS user_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        task_id INTEGER NOT NULL,
        current_stage_id INTEGER,
        completed_at DATETIME,
        last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (current_stage_id) REFERENCES stages(id)
      );

      CREATE TABLE IF NOT EXISTS task_collaborators (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT DEFAULT 'collaborator',
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        task_id INTEGER NOT NULL,
        stage_id INTEGER,
        triggered_by INTEGER NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'stage_update',
        read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (stage_id) REFERENCES stages(id),
        FOREIGN KEY (triggered_by) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_user_progress_user_task ON user_progress(user_id, task_id);
      CREATE INDEX IF NOT EXISTS idx_task_collaborators_task ON task_collaborators(task_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    `);
    
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

// Auth functions
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }

  req.user = payload;
  next();
}

// Email notification function
async function sendStageUpdateNotification(data) {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #9333ea 0%, #fbbf24 100%); padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">🎯 TaskQuest - Atualização de Etapa</h1>
        </div>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; color: #333;">Olá!</p>
          <p style="font-size: 14px; color: #666;">
            <strong>${data.userName}</strong> avançou na tarefa:
          </p>
          <div style="background: white; padding: 15px; border-left: 4px solid #9333ea; margin: 15px 0; border-radius: 4px;">
            <p style="margin: 0 0 10px 0;"><strong>📋 Tarefa:</strong> ${data.taskTitle}</p>
            <p style="margin: 0;"><strong>✅ Etapa:</strong> <span style="color: #9333ea; font-weight: bold;">${data.stageName}</span></p>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            ${data.message}
          </p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
            <p style="font-size: 12px; color: #999;">
              TaskQuest Pro - Gerenciador Gamificado Colaborativo
            </p>
          </div>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: data.to.join(','),
      subject: data.subject,
      html: htmlContent,
    });

    console.log('📧 Email enviado:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return null;
  }
}

// Helper function to get colors for stages
function getColorForStage(index) {
  const colors = [
    '#9333ea', // Purple
    '#fbbf24', // Yellow
    '#c084fc', // Light Purple
    '#fcd34d', // Light Yellow
    '#a78bfa', // Lighter Purple
    '#fde047', // Lighter Yellow
  ];
  return colors[index % colors.length];
}

// ============ AUTH ROUTES ============

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }

    const hashedPassword = await hashPassword(password);

    const stmt = db.prepare('INSERT INTO users (email, password, name, points) VALUES (?, ?, ?, ?)');
    stmt.run(email, hashedPassword, name, 0);

    const newUser = db.prepare('SELECT id, email, name, points FROM users WHERE email = ?').get(email);

    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });

    res.json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        points: newUser.points,
      },
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        points: user.points,
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// ============ TASK ROUTES ============

app.post('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const { title, description, stages: stagesList } = req.body;
    const user = req.user;

    if (!title || !stagesList || stagesList.length === 0) {
      return res.status(400).json({ error: 'Título e etapas são obrigatórios' });
    }

    const taskStmt = db.prepare('INSERT INTO tasks (title, description, created_by) VALUES (?, ?, ?)');
    const taskResult = taskStmt.run(title, description || '', user.userId);
    const taskId = taskResult.lastInsertRowid;

    // Create stages
    const stageStmt = db.prepare('INSERT INTO stages (task_id, name, "order", color) VALUES (?, ?, ?, ?)');
    stagesList.forEach((stageName, index) => {
      stageStmt.run(taskId, stageName, index, getColorForStage(index));
    });

    // Add creator as collaborator
    const collabStmt = db.prepare('INSERT INTO task_collaborators (task_id, user_id, role) VALUES (?, ?, ?)');
    collabStmt.run(taskId, user.userId, 'owner');

    // Create initial progress for creator
    const firstStage = db.prepare('SELECT id FROM stages WHERE task_id = ? ORDER BY "order" LIMIT 1').get(taskId);
    if (firstStage) {
      const progressStmt = db.prepare('INSERT INTO user_progress (user_id, task_id, current_stage_id) VALUES (?, ?, ?)');
      progressStmt.run(user.userId, taskId, firstStage.id);
    }

    res.json({ taskId, message: 'Tarefa criada com sucesso' });
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({ error: 'Erro ao criar tarefa' });
  }
});

app.get('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    const userTasks = db.prepare('SELECT task_id FROM task_collaborators WHERE user_id = ?').all(user.userId);
    const taskIds = userTasks.map(t => t.task_id);

    if (taskIds.length === 0) {
      return res.json([]);
    }

    const placeholders = taskIds.map(() => '?').join(',');
    const allTasks = db.prepare(`SELECT * FROM tasks WHERE id IN (${placeholders})`).all(...taskIds);

    const tasksWithDetails = allTasks.map(task => {
      const taskStages = db.prepare('SELECT * FROM stages WHERE task_id = ? ORDER BY "order"').all(task.id);
      const collaborators = db.prepare('SELECT * FROM task_collaborators WHERE task_id = ?').all(task.id);
      const progress = db.prepare('SELECT * FROM user_progress WHERE task_id = ?').all(task.id);

      return {
        ...task,
        stages: taskStages,
        collaborators: collaborators.length,
        progress: progress,
      };
    });

    res.json(tasksWithDetails);
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
    res.status(500).json({ error: 'Erro ao buscar tarefas' });
  }
});

app.get('/api/tasks/:taskId', authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;
    const user = req.user;

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    const isCollaborator = db.prepare('SELECT * FROM task_collaborators WHERE task_id = ? AND user_id = ?').get(task.id, user.userId);

    if (!isCollaborator) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const taskStages = db.prepare('SELECT * FROM stages WHERE task_id = ? ORDER BY "order"').all(task.id);
    const collaborators = db.prepare('SELECT * FROM task_collaborators WHERE task_id = ?').all(task.id);
    const progress = db.prepare('SELECT * FROM user_progress WHERE task_id = ?').all(task.id);

    res.json({
      ...task,
      stages: taskStages,
      collaborators,
      progress,
    });
  } catch (error) {
    console.error('Erro ao buscar tarefa:', error);
    res.status(500).json({ error: 'Erro ao buscar tarefa' });
  }
});

// ============ PROGRESS ROUTES ============

app.post('/api/progress/update', authMiddleware, async (req, res) => {
  try {
    const { taskId, stageId } = req.body;
    const user = req.user;

    const isCollaborator = db.prepare('SELECT * FROM task_collaborators WHERE task_id = ? AND user_id = ?').get(taskId, user.userId);

    if (!isCollaborator) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const existingProgress = db.prepare('SELECT * FROM user_progress WHERE user_id = ? AND task_id = ?').get(user.userId, taskId);

    if (existingProgress) {
      const updateStmt = db.prepare('UPDATE user_progress SET current_stage_id = ?, last_updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      updateStmt.run(stageId, existingProgress.id);
    } else {
      const insertStmt = db.prepare('INSERT INTO user_progress (user_id, task_id, current_stage_id) VALUES (?, ?, ?)');
      insertStmt.run(user.userId, taskId, stageId);
    }

    // Get task and stage details
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    const stage = db.prepare('SELECT * FROM stages WHERE id = ?').get(stageId);
    const currentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.userId);

    // Notify all collaborators
    const collaborators = db.prepare('SELECT * FROM task_collaborators WHERE task_id = ?').all(taskId);
    const notificationEmails = (process.env.NOTIFICATION_EMAILS || '').split(',').filter(e => e.trim());

    // Create notifications in database
    const notifStmt = db.prepare('INSERT INTO notifications (user_id, task_id, stage_id, triggered_by, message, type) VALUES (?, ?, ?, ?, ?, ?)');
    collaborators.forEach(collab => {
      if (collab.user_id !== user.userId) {
        notifStmt.run(collab.user_id, taskId, stageId, user.userId, `${currentUser.name} avançou para a etapa "${stage.name}"`, 'stage_update');
      }
    });

    // Send email notifications
    if (notificationEmails.length > 0) {
      await sendStageUpdateNotification({
        to: notificationEmails,
        subject: `🎯 ${currentUser.name} avançou em: ${task.title}`,
        taskTitle: task.title,
        stageName: stage.name,
        userName: currentUser.name,
        message: `${currentUser.name} está agora na etapa "${stage.name}" da tarefa "${task.title}".`,
      });
    }

    res.json({ message: 'Progresso atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar progresso:', error);
    res.status(500).json({ error: 'Erro ao atualizar progresso' });
  }
});

app.get('/api/tasks/:taskId/progress', authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;
    const user = req.user;

    const isCollaborator = db.prepare('SELECT * FROM task_collaborators WHERE task_id = ? AND user_id = ?').get(taskId, user.userId);

    if (!isCollaborator) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const progress = db.prepare('SELECT * FROM user_progress WHERE task_id = ?').all(taskId);

    const progressWithUsers = progress.map(p => {
      const progressUser = db.prepare('SELECT * FROM users WHERE id = ?').get(p.user_id);
      return {
        ...p,
        user: progressUser,
      };
    });

    res.json(progressWithUsers);
  } catch (error) {
    console.error('Erro ao buscar progresso:', error);
    res.status(500).json({ error: 'Erro ao buscar progresso' });
  }
});

// ============ COLLABORATORS ROUTES ============

app.post('/api/tasks/:taskId/invite', authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { email } = req.body;
    const user = req.user;

    const collaboration = db.prepare('SELECT * FROM task_collaborators WHERE task_id = ? AND user_id = ?').get(taskId, user.userId);

    if (!collaboration || collaboration.role !== 'owner') {
      return res.status(403).json({ error: 'Apenas o proprietário pode convidar' });
    }

    const invitedUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!invitedUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const existing = db.prepare('SELECT * FROM task_collaborators WHERE task_id = ? AND user_id = ?').get(taskId, invitedUser.id);

    if (existing) {
      return res.status(400).json({ error: 'Usuário já é colaborador' });
    }

    const collabStmt = db.prepare('INSERT INTO task_collaborators (task_id, user_id, role) VALUES (?, ?, ?)');
    collabStmt.run(taskId, invitedUser.id, 'collaborator');

    const firstStage = db.prepare('SELECT id FROM stages WHERE task_id = ? ORDER BY "order" LIMIT 1').get(taskId);
    if (firstStage) {
      const progressStmt = db.prepare('INSERT INTO user_progress (user_id, task_id, current_stage_id) VALUES (?, ?, ?)');
      progressStmt.run(invitedUser.id, taskId, firstStage.id);
    }

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

    res.json({ message: 'Convite enviado com sucesso' });
  } catch (error) {
    console.error('Erro ao convidar colaborador:', error);
    res.status(500).json({ error: 'Erro ao convidar colaborador' });
  }
});

// ============ HEALTH CHECK ============

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Initialize and start server
initializeDatabase();

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📄 Frontend disponível em http://localhost:${PORT}`);
});

