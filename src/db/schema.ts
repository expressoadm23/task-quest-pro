import { sqliteTable, text, integer, boolean, timestamp } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  email: text('email').unique().notNull(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  points: integer('points').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const stages = sqliteTable('stages', {
  id: integer('id').primaryKey(),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  order: integer('order').notNull(),
  color: text('color').default('#9333ea'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userProgress = sqliteTable('user_progress', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  currentStageId: integer('current_stage_id').references(() => stages.id),
  completedAt: timestamp('completed_at'),
  lastUpdatedAt: timestamp('last_updated_at').defaultNow(),
});

export const taskCollaborators = sqliteTable('task_collaborators', {
  id: integer('id').primaryKey(),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id),
  role: text('role').default('collaborator'), // 'owner' or 'collaborator'
  joinedAt: timestamp('joined_at').defaultNow(),
});

export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  stageId: integer('stage_id').references(() => stages.id),
  triggeredBy: integer('triggered_by').notNull().references(() => users.id),
  message: text('message').notNull(),
  type: text('type').default('stage_update'), // 'stage_update', 'task_completed', 'invited'
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdTasks: many(tasks),
  progress: many(userProgress),
  collaborations: many(taskCollaborators),
  notifications: many(notifications),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  creator: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
  }),
  stages: many(stages),
  collaborators: many(taskCollaborators),
  progress: many(userProgress),
  notifications: many(notifications),
}));

export const stagesRelations = relations(stages, ({ one, many }) => ({
  task: one(tasks, {
    fields: [stages.taskId],
    references: [tasks.id],
  }),
  progress: many(userProgress),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [userProgress.taskId],
    references: [tasks.id],
  }),
  currentStage: one(stages, {
    fields: [userProgress.currentStageId],
    references: [stages.id],
  }),
}));

export const taskCollaboratorsRelations = relations(taskCollaborators, ({ one }) => ({
  task: one(tasks, {
    fields: [taskCollaborators.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskCollaborators.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [notifications.taskId],
    references: [tasks.id],
  }),
  stage: one(stages, {
    fields: [notifications.stageId],
    references: [stages.id],
  }),
  triggeredByUser: one(users, {
    fields: [notifications.triggeredBy],
    references: [users.id],
  }),
}));

