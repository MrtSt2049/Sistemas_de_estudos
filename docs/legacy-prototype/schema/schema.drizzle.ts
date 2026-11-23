import {
  pgTable,
  text,
  integer,
  doublePrecision,
  boolean,
  date,
  time,
  timestamp,
  jsonb,
  check,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
};

// 1. courses
export const courses = pgTable(
  'courses',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    code: text('code'),
    semester: text('semester').notNull(), // ex: 2026/2
    professor: text('professor'),
    credits: integer('credits'),
    block: text('block'),
    minFrequency: doublePrecision('min_frequency'),
    avgRule: text('avg_rule').notNull().default('ponderada'), // 'ponderada' | 'aritmetica'
    goalAvg: doublePrecision('goal_avg'),
    risk: text('risk'), // 'verde' | 'amarelo' | 'vermelho' | null
    syllabus: text('syllabus'), // ementa
    bibliography: text('bibliography'),
    synergy: text('synergy'),
    difficulties: text('difficulties'), // texto com LaTeX
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    check('courses_avg_rule_chk', sql`${table.avgRule} IN ('ponderada', 'aritmetica')`),
    check('courses_risk_chk', sql`${table.risk} IS NULL OR ${table.risk} IN ('verde', 'amarelo', 'vermelho')`),
    check('courses_goal_avg_chk', sql`${table.goalAvg} IS NULL OR (${table.goalAvg} >= 0 AND ${table.goalAvg} <= 10)`),
    index('courses_semester_idx').on(table.semester),
  ]
);

// 2. topics
export const topics = pgTable(
  'topics',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    unit: text('unit'),
    title: text('title').notNull(),
    order: integer('order').notNull().default(0),
    status: text('status').notNull().default('nao_iniciado'), // 'nao_iniciado' | 'estudo' | 'concluido' | 'revisado'
    mastery: integer('mastery').notNull().default(0), // 0..3
    ...timestamps,
  },
  (table) => [
    check('topics_status_chk', sql`${table.status} IN ('nao_iniciado', 'estudo', 'concluido', 'revisado')`),
    check('topics_mastery_chk', sql`${table.mastery} >= 0 AND ${table.mastery} <= 3`),
    index('topics_course_id_idx').on(table.courseId),
  ]
);

// 3. evaluations
export const evaluations = pgTable(
  'evaluations',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type').notNull().default('Prova'),
    date: date('date'),
    maxScore: doublePrecision('max_score').notNull().default(10),
    weight: doublePrecision('weight').notNull().default(1),
    score: doublePrecision('score'), // nullable, entre 0 e maxScore
    simulation: doublePrecision('simulation'), // nullable, nunca entra na média real
    done: boolean('done').notNull().default(false),
    notes: text('notes'),
    ...timestamps,
  },
  (table) => [
    check('evals_max_score_chk', sql`${table.maxScore} > 0`),
    check('evals_weight_chk', sql`${table.weight} >= 0`),
    check('evals_score_chk', sql`${table.score} IS NULL OR (${table.score} >= 0 AND ${table.score} <= ${table.maxScore})`),
    index('evals_course_id_idx').on(table.courseId),
    index('evals_date_idx').on(table.date),
  ]
);

// 4. questions
export const questions = pgTable(
  'questions',
  {
    id: text('id').primaryKey(),
    track: text('track').notNull().default('grad'), // 'grad' | 'obmu' | 'cp'
    courseId: text('course_id').references(() => courses.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    statement: text('statement').notNull().default(''), // LaTeX
    source: text('source'),
    number: text('number'),
    difficulty: integer('difficulty').notNull().default(3), // 1..5
    tags: text('tags'),
    prerequisites: text('prerequisites'),
    hint1: text('hint_1'),
    hint2: text('hint_2'),
    hint3: text('hint_3'),
    officialSolution: text('official_solution'),
    complexity: text('complexity'),
    url: text('url'),
    state: text('state').notNull().default('nao_iniciada'), // 'nao_iniciada' | 'andamento' | 'ajuda' | 'independente' | 'dominada' | 'revisao'
    streak: integer('streak').notNull().default(0),
    nextReview: date('next_review'),
    code: text('code'), // Maratona
    language: text('language'), // Maratona
    builtin: boolean('builtin').notNull().default(false), // true = veio do banco-base (db/content)
    ...timestamps,
  },
  (table) => [
    check('questions_track_chk', sql`${table.track} IN ('grad', 'obmu', 'cp')`),
    check('questions_diff_chk', sql`${table.difficulty} >= 1 AND ${table.difficulty} <= 5`),
    check(
      'questions_state_chk',
      sql`${table.state} IN ('nao_iniciada', 'andamento', 'ajuda', 'independente', 'dominada', 'revisao')`
    ),
    index('questions_track_idx').on(table.track),
    index('questions_course_id_idx').on(table.courseId),
    index('questions_next_review_idx').on(table.nextReview),
  ]
);

// 5. question_attempts
export const questionAttempts = pgTable(
  'question_attempts',
  {
    id: text('id').primaryKey(),
    questionId: text('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    result: text('result').notNull(), // 'independente' | 'ajuda' | 'erro'
    minutes: integer('minutes').notNull().default(0),
    helpUsed: text('help_used').notNull().default('nenhuma'), // 'nenhuma' | 'dica' | 'parcial' | 'completa'
    hintsCount: integer('hints_count').notNull().default(0),
    verdict: text('verdict'), // Maratona: AC, WA, TLE, RE, MLE, CE, Outro
    notes: text('notes'),
    ...timestamps,
  },
  (table) => [
    check('attempts_result_chk', sql`${table.result} IN ('independente', 'ajuda', 'erro')`),
    check('attempts_help_chk', sql`${table.helpUsed} IN ('nenhuma', 'dica', 'parcial', 'completa')`),
    check('attempts_minutes_chk', sql`${table.minutes} >= 0`),
    index('attempts_question_id_idx').on(table.questionId),
    index('attempts_date_idx').on(table.date),
  ]
);

// 6. solutions (versões preservadas, nunca sobrescritas)
export const solutions = pgTable(
  'solutions',
  {
    id: text('id').primaryKey(),
    questionId: text('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    text: text('text').notNull(), // LaTeX
    ...timestamps,
  },
  (table) => [index('solutions_question_id_idx').on(table.questionId)]
);

// 7. error_entries
export const errorEntries = pgTable(
  'error_entries',
  {
    id: text('id').primaryKey(),
    date: date('date').notNull(),
    front: text('front').notNull().default('obmu'), // 'grad' | 'obmu' | 'cp'
    courseId: text('course_id').references(() => courses.id, { onDelete: 'set null' }),
    problem: text('problem').notNull(),
    theme: text('theme'),
    errorType: text('error_type').notNull(),
    keyTechnique: text('key_technique'),
    cause: text('cause'),
    correction: text('correction'), // LaTeX
    example: text('example'), // LaTeX
    rewritten: boolean('rewritten').notNull().default(false),
    ...timestamps,
  },
  (table) => [
    index('errors_front_idx').on(table.front),
    index('errors_course_id_idx').on(table.courseId),
    index('errors_date_idx').on(table.date),
  ]
);

// 8. error_reviews
export const errorReviews = pgTable(
  'error_reviews',
  {
    id: text('id').primaryKey(),
    errorId: text('error_id')
      .notNull()
      .references(() => errorEntries.id, { onDelete: 'cascade' }),
    intervalDays: integer('interval_days').notNull(), // 3, 10 ou 30
    date: date('date').notNull(),
    completed: boolean('completed').notNull().default(false),
    failures: integer('failures').notNull().default(0),
    ...timestamps,
  },
  (table) => [
    check('error_reviews_interval_chk', sql`${table.intervalDays} IN (3, 10, 30)`),
    index('error_reviews_error_id_idx').on(table.errorId),
    index('error_reviews_date_idx').on(table.date),
  ]
);

// 9. study_sessions
export const studySessions = pgTable(
  'study_sessions',
  {
    id: text('id').primaryKey(),
    date: date('date').notNull(),
    front: text('front').notNull(), // 'grad' | 'obmu' | 'cp' | 'octobit' | 'fisico'
    courseId: text('course_id').references(() => courses.id, { onDelete: 'set null' }),
    minutes: integer('minutes').notNull(),
    content: text('content').notNull(),
    questionsCount: integer('questions_count'),
    notes: text('notes'),
    ...timestamps,
  },
  (table) => [
    check('sessions_minutes_chk', sql`${table.minutes} > 0`),
    index('sessions_date_idx').on(table.date),
    index('sessions_front_idx').on(table.front),
    index('sessions_course_id_idx').on(table.courseId),
  ]
);

// 10. events
export const events = pgTable(
  'events',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    category: text('category').notNull().default('estudo'),
    priority: text('priority').notNull().default('média'), // 'alta' | 'média' | 'baixa'
    date: date('date').notNull(),
    startTime: time('start_time'),
    endTime: time('end_time'),
    status: text('status').notNull().default('planejado'), // 'planejado' | 'feito' | 'cancelado'
    courseId: text('course_id').references(() => courses.id, { onDelete: 'set null' }),
    front: text('front'),
    recurrence: text('recurrence').notNull().default('none'), // 'none' | 'daily' | 'weekly'
    repeatUntil: date('repeat_until'),
    completedDates: jsonb('completed_dates').$type<string[]>().notNull().default([]),
    notes: text('notes'),
    origin: text('origin').notNull().default('manual'), // 'manual' | 'planejador'
    estimated: boolean('estimated').notNull().default(false),
    ...timestamps,
  },
  (table) => [
    check('events_status_chk', sql`${table.status} IN ('planejado', 'feito', 'cancelado')`),
    check('events_recurrence_chk', sql`${table.recurrence} IN ('none', 'daily', 'weekly')`),
    index('events_date_idx').on(table.date),
  ]
);

// 11. goals & goal_steps
export const goals = pgTable(
  'goals',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description'),
    type: text('type').notNull().default('processo'), // 'resultado' | 'processo' | 'dominio' | 'competitiva' | 'longo'
    metric: text('metric').notNull().default('horas'), // 'horas' | 'sessoes' | 'questoes' | 'simulados' | 'manual'
    front: text('front'),
    courseId: text('course_id').references(() => courses.id, { onDelete: 'set null' }),
    targetValue: doublePrecision('target_value').notNull(),
    unit: text('unit').notNull().default('h'),
    currentValue: doublePrecision('current_value'), // só se manual
    startDate: date('start_date'),
    endDate: date('end_date'),
    priority: text('priority').notNull().default('média'),
    completionCriteria: text('completion_criteria'),
    ...timestamps,
  },
  (table) => [
    check('goals_metric_chk', sql`${table.metric} IN ('horas', 'sessoes', 'questoes', 'simulados', 'manual')`),
    check('goals_target_chk', sql`${table.targetValue} >= 0`),
  ]
);

export const goalSteps = pgTable(
  'goal_steps',
  {
    id: text('id').primaryKey(),
    goalId: text('goal_id')
      .notNull()
      .references(() => goals.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    completed: boolean('completed').notNull().default(false),
    order: integer('order').notNull().default(0),
    ...timestamps,
  },
  (table) => [index('goal_steps_goal_id_idx').on(table.goalId)]
);

// 12. mock_exams (simulados OBMU)
export const mockExams = pgTable(
  'mock_exams',
  {
    id: text('id').primaryKey(),
    date: date('date').notNull(),
    paperUsed: text('paper_used'),
    q1: doublePrecision('q1').notNull().default(0),
    q2: doublePrecision('q2').notNull().default(0),
    q3: doublePrecision('q3').notNull().default(0),
    q4: doublePrecision('q4').notNull().default(0),
    q5: doublePrecision('q5').notNull().default(0),
    q6: doublePrecision('q6').notNull().default(0),
    total: doublePrecision('total').notNull().default(0), // calculado no servidor
    timePerQuestion: text('time_per_question'),
    dominantError: text('dominant_error'),
    rewritten: boolean('rewritten').notNull().default(false),
    notes: text('notes'),
    ...timestamps,
  },
  (table) => [
    check('mock_q1_chk', sql`${table.q1} >= 0 AND ${table.q1} <= 50`),
    check('mock_q2_chk', sql`${table.q2} >= 0 AND ${table.q2} <= 50`),
    check('mock_q3_chk', sql`${table.q3} >= 0 AND ${table.q3} <= 50`),
    check('mock_q4_chk', sql`${table.q4} >= 0 AND ${table.q4} <= 50`),
    check('mock_q5_chk', sql`${table.q5} >= 0 AND ${table.q5} <= 50`),
    check('mock_q6_chk', sql`${table.q6} >= 0 AND ${table.q6} <= 50`),
    index('mock_exams_date_idx').on(table.date),
  ]
);

// 13. past_papers (banco de provas OBMU)
export const pastPapers = pgTable(
  'past_papers',
  {
    id: text('id').primaryKey(),
    year: integer('year').notNull(),
    format: text('format').notNull(),
    plannedUse: text('planned_use').notNull(),
    status: text('status').notNull().default('A fazer'), // 'A fazer' | 'Em andamento' | 'Feito'
    score: doublePrecision('score'),
    notes: text('notes'),
    ...timestamps,
  },
  (table) => [uniqueIndex('past_papers_year_idx').on(table.year)]
);

// 14. calendar_weeks (52 semanas do calendário mestre)
export const calendarWeeks = pgTable(
  'calendar_weeks',
  {
    id: text('id').primaryKey(),
    weekNumber: integer('week_number').notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    phase: text('phase').notNull(),
    focus: text('focus').notNull(),
    hoursObmu: doublePrecision('hours_obmu').notNull().default(0),
    hoursCp: doublePrecision('hours_cp').notNull().default(0),
    hoursOctobit: doublePrecision('hours_octobit').notNull().default(0),
    hoursFisico: doublePrecision('hours_fisico').notNull().default(0),
    checkpoint: text('checkpoint'),
    completed: boolean('completed').notNull().default(false),
    ...timestamps,
  },
  (table) => [uniqueIndex('calendar_weeks_number_idx').on(table.weekNumber)]
);

// 15. materials (biblioteca)
export const materials = pgTable(
  'materials',
  {
    id: text('id').primaryKey(),
    kind: text('kind').notNull().default('livro'),
    front: text('front').notNull().default('grad'),
    courseId: text('course_id').references(() => courses.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    author: text('author'),
    reference: text('reference'),
    url: text('url'),
    fileUrl: text('file_url'), // armazenamento externo (ex: Vercel Blob)
    status: text('status'),
    notes: text('notes'), // LaTeX
    ...timestamps,
  },
  (table) => [
    index('materials_front_idx').on(table.front),
    index('materials_course_id_idx').on(table.courseId),
  ]
);

// 16. daily_logs
export const dailyLogs = pgTable('daily_logs', {
  id: text('id').primaryKey(), // YYYY-MM-DD
  date: date('date').notNull().unique(),
  sleepHours: doublePrecision('sleep_hours'),
  energy: integer('energy'),
  workoutDone: boolean('workout_done').notNull().default(false),
  proteinHit: boolean('protein_hit').notNull().default(false),
  weightKg: doublePrecision('weight_kg'),
  eyeStrain: integer('eye_strain'),
  notes: text('notes'),
  ...timestamps,
});

// 17. weekly_reviews
export const weeklyReviews = pgTable('weekly_reviews', {
  id: text('id').primaryKey(), // YYYY-MM-DD (monday)
  weekStart: date('week_start').notNull().unique(),
  hardestError: text('hardest_error'),
  adjustment: text('adjustment'),
  ...timestamps,
});

// 18. settings
export const settings = pgTable('settings', {
  id: text('id').primaryKey(), // 'default'
  weeklyAvailability: jsonb('weekly_availability')
    .$type<Record<string, string>>()
    .notNull()
    .default({
      '0': '07:00-08:30,20:30-22:00',
      '1': '07:00-08:30,20:30-22:00',
      '2': '07:00-08:30,20:30-22:00',
      '3': '07:00-08:30,20:30-22:00',
      '4': '07:00-08:30,20:30-22:00',
      '5': '14:00-18:30',
      '6': '09:00-10:30,14:00-15:30,20:30-21:30',
    }),
  maxReschedulesPerDay: integer('max_reschedules_per_day').notNull().default(2),
  cfRatingBase: integer('cf_rating_base'),
  cfRatingCurrent: integer('cf_rating_current'),
  obmuCutoff: doublePrecision('obmu_cutoff'),
  cpTrailProgress: jsonb('cp_trail_progress').$type<Record<string, boolean>>().notNull().default({}),
  contentVersion: integer('content_version').notNull().default(0), // versão do conteúdo-base já carregado (db/content)
  ...timestamps,
});

// 19. tutor_messages
export const tutorMessages = pgTable(
  'tutor_messages',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id').notNull(),
    role: text('role').notNull(), // 'user' | 'assistant'
    content: text('content').notNull(),
    mode: text('mode').notNull().default('explicacao'),
    courseId: text('course_id').references(() => courses.id, { onDelete: 'set null' }),
    questionId: text('question_id').references(() => questions.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (table) => [
    check('tutor_role_chk', sql`${table.role} IN ('user', 'assistant')`),
    index('tutor_created_at_idx').on(table.createdAt),
    index('tutor_session_idx').on(table.sessionId),
  ]
);

