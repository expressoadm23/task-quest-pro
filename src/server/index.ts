import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase, db } from '../db/index';
import { authMiddleware, generateToken, hashPassword, comparePassword, JWTPayload } from './auth';
import { sendStageUpdateNotification, sendTaskInvitationEmail } from './email';
import { eq, and } from 'drizzle-orm';
import { users, tasks, stages, userProgress, taskCollaborators, notifications } from '../db/schema';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database on startup
initializeDatabase().catch(console.error);

// ============ AUTH ROUTES ============

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    // Check if user already exists
    const existingUser = db.select().from(users).where(eq(users.email, email)).all();
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }

    const hashedPassword = await hashPassword(password);

    const result = db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      points: 0,
    }).run();

    const newUser = db.select().from(users).where(eq(users.email, email)).all()[0];

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

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const user = db.select().from(users).where(eq(users.email, email)).all()[0];

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

app.post('/api/tasks', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { title, description, stages: stagesList } = req.body;
    const user = (req as any).user as JWTPayload;

    if (!title || !stagesList || stagesList.length === 0) {
      return res.status(400).json({ error: 'Título e etapas são obrigatórios' });
    }

    // Create task
    const taskResult = db.insert(tasks).values({
      title,
      description: description || '',
      createdBy: user.userId,
    }).run();

    const taskId = taskResult.lastInsertRowid as number;

    // Create stages
    stagesList.forEach((stageName: string, index: number) => {
      db.insert(stages).values({
        taskId,
        name: stageName,
        order: index,
        color: getColorForStage(index),
      }).run();
    });

    // Add creator as collaborator
    db.insert(taskCollaborators).values({
      taskId,
      userId: user.userId,
      role: 'owner',
    }).run();

    // Create initial progress for creator
    const firstStage = db.select().from(stages).where(eq(stages.taskId, taskId)).all()[0];
    db.insert(userProgress).values({
      userId: user.userId,
      taskId,
      currentStageId: firstStage?.id,
    }).run();

    res.json({ taskId, message: 'Tarefa criada com sucesso' });
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({ error: 'Erro ao criar tarefa' });
  }
});

app.get('/api/tasks', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as JWTPayload;

    // Get tasks where user is collaborator
    const userTasks = db.select({
      taskId: taskCollaborators.taskId,
    }).from(taskCollaborators)
      .where(eq(taskCollaborators.userId, user.userId))
      .all();

    const taskIds = userTasks.map(t => t.taskId);

    if (taskIds.length === 0) {
      return res.json([]);
    }

    const allTasks = db.select().from(tasks).all();
    const filteredTasks = allTasks.filter(t => taskIds.includes(t.id));

    const tasksWithDetails = filteredTasks.map(task => {
      const taskStages = db.select().from(stages).where(eq(stages.taskId, task.id)).all();
      const collaborators = db.select().from(taskCollaborators).where(eq(taskCollaborators.taskId, task.id)).all();
      const userProgress = db.select().from(userProgress).where(eq(userProgress.taskId, task.id)).all();

      return {
        ...task,
        stages: taskStages,
        collaborators: collaborators.length,
        progress: userProgress,
      };
    });

    res.json(tasksWithDetails);
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
    res.status(500).json({ error: 'Erro ao buscar tarefas' });
  }
});

app.get('/api/tasks/:taskId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const user = (req as any).user as JWTPayload;

    const task = db.select().from(tasks).where(eq(tasks.id, parseInt(taskId))).all()[0];

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    // Check if user is collaborator
    const isCollaborator = db.select().from(taskCollaborators)
      .where(and(eq(taskCollaborators.taskId, task.id), eq(taskCollaborators.userId, user.userId)))
      .all().length > 0;

    if (!isCollaborator) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const taskStages = db.select().from(stages).where(eq(stages.taskId, task.id)).all();
    const collaborators = db.select().from(taskCollaborators).where(eq(taskCollaborators.taskId, task.id)).all();
    const progress = db.select().from(userProgress).where(eq(userProgress.taskId, task.id)).all();

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

app.post('/api/progress/update', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { taskId, stageId } = req.body;
    const user = (req as any).user as JWTPayload;

    // Verify user is collaborator
    const isCollaborator = db.select().from(taskCollaborators)
      .where(and(eq(taskCollaborators.taskId, taskId), eq(taskCollaborators.userId, user.userId)))
      .all().length > 0;

    if (!isCollaborator) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Update or create progress
    const existingProgress = db.select().from(userProgress)
      .where(and(eq(userProgress.userId, user.userId), eq(userProgress.taskId, taskId)))
      .all()[0];

    if (existingProgress) {
      db.update(userProgress)
        .set({ currentStageId: stageId, lastUpdatedAt: new Date() })
        .where(eq(userProgress.id, existingProgress.id))
        .run();
    } else {
      db.insert(userProgress).values({
        userId: user.userId,
        taskId,
        currentStageId: stageId,
      }).run();
    }

    // Get task and stage details
    const task = db.select().from(tasks).where(eq(tasks.id, taskId)).all()[0];
    const stage = db.select().from(stages).where(eq(stages.id, stageId)).all()[0];
    const currentUser = db.select().from(users).where(eq(users.id, user.userId)).all()[0];

    // Notify all collaborators
    const collaborators = db.select().from(taskCollaborators).where(eq(taskCollaborators.taskId, taskId)).all();
    const notificationEmails = process.env.NOTIFICATION_EMAILS?.split(',') || [];

    // Create notifications in database
    collaborators.forEach(collab => {
      if (collab.userId !== user.userId) {
        db.insert(notifications).values({
          userId: collab.userId,
          taskId,
          stageId,
          triggeredBy: user.userId,
          message: `${currentUser.name} avançou para a etapa "${stage.name}"`,
          type: 'stage_update',
        }).run();
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

app.get('/api/tasks/:taskId/progress', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const user = (req as any).user as JWTPayload;

    // Verify user is collaborator
    const isCollaborator = db.select().from(taskCollaborators)
      .where(and(eq(taskCollaborators.taskId, parseInt(taskId)), eq(taskCollaborators.userId, user.userId)))
      .all().length > 0;

    if (!isCollaborator) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const progress = db.select().from(userProgress)
      .where(eq(userProgress.taskId, parseInt(taskId)))
      .all();

    // Enrich with user data
    const progressWithUsers = progress.map(p => {
      const progressUser = db.select().from(users).where(eq(users.id, p.userId)).all()[0];
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

app.post('/api/tasks/:taskId/invite', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { email } = req.body;
    const user = (req as any).user as JWTPayload;

    // Verify user is owner
    const collaboration = db.select().from(taskCollaborators)
      .where(and(eq(taskCollaborators.taskId, parseInt(taskId)), eq(taskCollaborators.userId, user.userId)))
      .all()[0];

    if (!collaboration || collaboration.role !== 'owner') {
      return res.status(403).json({ error: 'Apenas o proprietário pode convidar' });
    }

    // Find user by email
    const invitedUser = db.select().from(users).where(eq(users.email, email)).all()[0];

    if (!invitedUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Check if already collaborator
    const existing = db.select().from(taskCollaborators)
      .where(and(eq(taskCollaborators.taskId, parseInt(taskId)), eq(taskCollaborators.userId, invitedUser.id)))
      .all();

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Usuário já é colaborador' });
    }

    // Add collaborator
    db.insert(taskCollaborators).values({
      taskId: parseInt(taskId),
      userId: invitedUser.id,
      role: 'collaborator',
    }).run();

    // Create initial progress for new collaborator
    const firstStage = db.select().from(stages).where(eq(stages.taskId, parseInt(taskId))).all()[0];
    db.insert(userProgress).values({
      userId: invitedUser.id,
      taskId: parseInt(taskId),
      currentStageId: firstStage?.id,
    }).run();

    // Send invitation email
    const task = db.select().from(tasks).where(eq(tasks.id, parseInt(taskId))).all()[0];
    await sendTaskInvitationEmail([email], task.title, user.name);

    res.json({ message: 'Convite enviado com sucesso' });
  } catch (error) {
    console.error('Erro ao convidar colaborador:', error);
    res.status(500).json({ error: 'Erro ao convidar colaborador' });
  }
});

// ============ HEALTH CHECK ============

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

// Helper function to get colors for stages
function getColorForStage(index: number): string {
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

