CREATE TABLE "calendar_weeks" (
	"id" text PRIMARY KEY NOT NULL,
	"week_number" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"phase" text NOT NULL,
	"focus" text NOT NULL,
	"hours_obmu" double precision DEFAULT 0 NOT NULL,
	"hours_cp" double precision DEFAULT 0 NOT NULL,
	"hours_octobit" double precision DEFAULT 0 NOT NULL,
	"hours_fisico" double precision DEFAULT 0 NOT NULL,
	"checkpoint" text,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"semester" text NOT NULL,
	"professor" text,
	"credits" integer,
	"block" text,
	"min_frequency" double precision,
	"avg_rule" text DEFAULT 'ponderada' NOT NULL,
	"goal_avg" double precision,
	"risk" text,
	"syllabus" text,
	"bibliography" text,
	"synergy" text,
	"difficulties" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "courses_avg_rule_chk" CHECK ("courses"."avg_rule" IN ('ponderada', 'aritmetica')),
	CONSTRAINT "courses_risk_chk" CHECK ("courses"."risk" IS NULL OR "courses"."risk" IN ('verde', 'amarelo', 'vermelho')),
	CONSTRAINT "courses_goal_avg_chk" CHECK ("courses"."goal_avg" IS NULL OR ("courses"."goal_avg" >= 0 AND "courses"."goal_avg" <= 10))
);
--> statement-breakpoint
CREATE TABLE "daily_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"sleep_hours" double precision,
	"energy" integer,
	"workout_done" boolean DEFAULT false NOT NULL,
	"protein_hit" boolean DEFAULT false NOT NULL,
	"weight_kg" double precision,
	"eye_strain" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_logs_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "error_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"front" text DEFAULT 'obmu' NOT NULL,
	"course_id" text,
	"problem" text NOT NULL,
	"theme" text,
	"error_type" text NOT NULL,
	"key_technique" text,
	"cause" text,
	"correction" text,
	"example" text,
	"rewritten" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "error_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"error_id" text NOT NULL,
	"interval_days" integer NOT NULL,
	"date" date NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"failures" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "error_reviews_interval_chk" CHECK ("error_reviews"."interval_days" IN (3, 10, 30))
);
--> statement-breakpoint
CREATE TABLE "evaluations" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'Prova' NOT NULL,
	"date" date,
	"max_score" double precision DEFAULT 10 NOT NULL,
	"weight" double precision DEFAULT 1 NOT NULL,
	"score" double precision,
	"simulation" double precision,
	"done" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "evals_max_score_chk" CHECK ("evaluations"."max_score" > 0),
	CONSTRAINT "evals_weight_chk" CHECK ("evaluations"."weight" >= 0),
	CONSTRAINT "evals_score_chk" CHECK ("evaluations"."score" IS NULL OR ("evaluations"."score" >= 0 AND "evaluations"."score" <= "evaluations"."max_score"))
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category" text DEFAULT 'estudo' NOT NULL,
	"priority" text DEFAULT 'média' NOT NULL,
	"date" date NOT NULL,
	"start_time" time,
	"end_time" time,
	"status" text DEFAULT 'planejado' NOT NULL,
	"course_id" text,
	"front" text,
	"recurrence" text DEFAULT 'none' NOT NULL,
	"repeat_until" date,
	"completed_dates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"origin" text DEFAULT 'manual' NOT NULL,
	"estimated" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_status_chk" CHECK ("events"."status" IN ('planejado', 'feito', 'cancelado')),
	CONSTRAINT "events_recurrence_chk" CHECK ("events"."recurrence" IN ('none', 'daily', 'weekly'))
);
--> statement-breakpoint
CREATE TABLE "goal_steps" (
	"id" text PRIMARY KEY NOT NULL,
	"goal_id" text NOT NULL,
	"title" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" text DEFAULT 'processo' NOT NULL,
	"metric" text DEFAULT 'horas' NOT NULL,
	"front" text,
	"course_id" text,
	"target_value" double precision NOT NULL,
	"unit" text DEFAULT 'h' NOT NULL,
	"current_value" double precision,
	"start_date" date,
	"end_date" date,
	"priority" text DEFAULT 'média' NOT NULL,
	"completion_criteria" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "goals_metric_chk" CHECK ("goals"."metric" IN ('horas', 'sessoes', 'questoes', 'simulados', 'manual')),
	CONSTRAINT "goals_target_chk" CHECK ("goals"."target_value" >= 0)
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text DEFAULT 'livro' NOT NULL,
	"front" text DEFAULT 'grad' NOT NULL,
	"course_id" text,
	"title" text NOT NULL,
	"author" text,
	"reference" text,
	"url" text,
	"file_url" text,
	"status" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mock_exams" (
	"id" text PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"paper_used" text,
	"q1" double precision DEFAULT 0 NOT NULL,
	"q2" double precision DEFAULT 0 NOT NULL,
	"q3" double precision DEFAULT 0 NOT NULL,
	"q4" double precision DEFAULT 0 NOT NULL,
	"q5" double precision DEFAULT 0 NOT NULL,
	"q6" double precision DEFAULT 0 NOT NULL,
	"total" double precision DEFAULT 0 NOT NULL,
	"time_per_question" text,
	"dominant_error" text,
	"rewritten" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mock_q1_chk" CHECK ("mock_exams"."q1" >= 0 AND "mock_exams"."q1" <= 50),
	CONSTRAINT "mock_q2_chk" CHECK ("mock_exams"."q2" >= 0 AND "mock_exams"."q2" <= 50),
	CONSTRAINT "mock_q3_chk" CHECK ("mock_exams"."q3" >= 0 AND "mock_exams"."q3" <= 50),
	CONSTRAINT "mock_q4_chk" CHECK ("mock_exams"."q4" >= 0 AND "mock_exams"."q4" <= 50),
	CONSTRAINT "mock_q5_chk" CHECK ("mock_exams"."q5" >= 0 AND "mock_exams"."q5" <= 50),
	CONSTRAINT "mock_q6_chk" CHECK ("mock_exams"."q6" >= 0 AND "mock_exams"."q6" <= 50)
);
--> statement-breakpoint
CREATE TABLE "past_papers" (
	"id" text PRIMARY KEY NOT NULL,
	"year" integer NOT NULL,
	"format" text NOT NULL,
	"planned_use" text NOT NULL,
	"status" text DEFAULT 'A fazer' NOT NULL,
	"score" double precision,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"date" date NOT NULL,
	"result" text NOT NULL,
	"minutes" integer DEFAULT 0 NOT NULL,
	"help_used" text DEFAULT 'nenhuma' NOT NULL,
	"hints_count" integer DEFAULT 0 NOT NULL,
	"verdict" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attempts_result_chk" CHECK ("question_attempts"."result" IN ('independente', 'ajuda', 'erro')),
	CONSTRAINT "attempts_help_chk" CHECK ("question_attempts"."help_used" IN ('nenhuma', 'dica', 'parcial', 'completa')),
	CONSTRAINT "attempts_minutes_chk" CHECK ("question_attempts"."minutes" >= 0)
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" text PRIMARY KEY NOT NULL,
	"track" text DEFAULT 'grad' NOT NULL,
	"course_id" text,
	"title" text NOT NULL,
	"statement" text DEFAULT '' NOT NULL,
	"source" text,
	"number" text,
	"difficulty" integer DEFAULT 3 NOT NULL,
	"tags" text,
	"prerequisites" text,
	"hint_1" text,
	"hint_2" text,
	"hint_3" text,
	"official_solution" text,
	"complexity" text,
	"url" text,
	"state" text DEFAULT 'nao_iniciada' NOT NULL,
	"streak" integer DEFAULT 0 NOT NULL,
	"next_review" date,
	"code" text,
	"language" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "questions_track_chk" CHECK ("questions"."track" IN ('grad', 'obmu', 'cp')),
	CONSTRAINT "questions_diff_chk" CHECK ("questions"."difficulty" >= 1 AND "questions"."difficulty" <= 5),
	CONSTRAINT "questions_state_chk" CHECK ("questions"."state" IN ('nao_iniciada', 'andamento', 'ajuda', 'independente', 'dominada', 'revisao'))
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" text PRIMARY KEY NOT NULL,
	"weekly_availability" jsonb DEFAULT '{"0":"07:00-08:30,20:30-22:00","1":"07:00-08:30,20:30-22:00","2":"07:00-08:30,20:30-22:00","3":"07:00-08:30,20:30-22:00","4":"07:00-08:30,20:30-22:00","5":"14:00-18:30","6":"09:00-10:30,14:00-15:30,20:30-21:30"}'::jsonb NOT NULL,
	"max_reschedules_per_day" integer DEFAULT 2 NOT NULL,
	"cf_rating_base" integer,
	"cf_rating_current" integer,
	"obmu_cutoff" double precision,
	"cp_trail_progress" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solutions" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"front" text NOT NULL,
	"course_id" text,
	"minutes" integer NOT NULL,
	"content" text NOT NULL,
	"questions_count" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_minutes_chk" CHECK ("study_sessions"."minutes" > 0)
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"unit" text,
	"title" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'nao_iniciado' NOT NULL,
	"mastery" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "topics_status_chk" CHECK ("topics"."status" IN ('nao_iniciado', 'estudo', 'concluido', 'revisado')),
	CONSTRAINT "topics_mastery_chk" CHECK ("topics"."mastery" >= 0 AND "topics"."mastery" <= 3)
);
--> statement-breakpoint
CREATE TABLE "tutor_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"mode" text DEFAULT 'explicacao' NOT NULL,
	"course_id" text,
	"question_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tutor_role_chk" CHECK ("tutor_messages"."role" IN ('user', 'assistant'))
);
--> statement-breakpoint
CREATE TABLE "weekly_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"week_start" date NOT NULL,
	"hardest_error" text,
	"adjustment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weekly_reviews_week_start_unique" UNIQUE("week_start")
);
--> statement-breakpoint
ALTER TABLE "error_entries" ADD CONSTRAINT "error_entries_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error_reviews" ADD CONSTRAINT "error_reviews_error_id_error_entries_id_fk" FOREIGN KEY ("error_id") REFERENCES "public"."error_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_steps" ADD CONSTRAINT "goal_steps_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solutions" ADD CONSTRAINT "solutions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutor_messages" ADD CONSTRAINT "tutor_messages_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutor_messages" ADD CONSTRAINT "tutor_messages_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "calendar_weeks_number_idx" ON "calendar_weeks" USING btree ("week_number");--> statement-breakpoint
CREATE INDEX "courses_semester_idx" ON "courses" USING btree ("semester");--> statement-breakpoint
CREATE INDEX "errors_front_idx" ON "error_entries" USING btree ("front");--> statement-breakpoint
CREATE INDEX "errors_course_id_idx" ON "error_entries" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "errors_date_idx" ON "error_entries" USING btree ("date");--> statement-breakpoint
CREATE INDEX "error_reviews_error_id_idx" ON "error_reviews" USING btree ("error_id");--> statement-breakpoint
CREATE INDEX "error_reviews_date_idx" ON "error_reviews" USING btree ("date");--> statement-breakpoint
CREATE INDEX "evals_course_id_idx" ON "evaluations" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "evals_date_idx" ON "evaluations" USING btree ("date");--> statement-breakpoint
CREATE INDEX "events_date_idx" ON "events" USING btree ("date");--> statement-breakpoint
CREATE INDEX "goal_steps_goal_id_idx" ON "goal_steps" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "materials_front_idx" ON "materials" USING btree ("front");--> statement-breakpoint
CREATE INDEX "materials_course_id_idx" ON "materials" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "mock_exams_date_idx" ON "mock_exams" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "past_papers_year_idx" ON "past_papers" USING btree ("year");--> statement-breakpoint
CREATE INDEX "attempts_question_id_idx" ON "question_attempts" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "attempts_date_idx" ON "question_attempts" USING btree ("date");--> statement-breakpoint
CREATE INDEX "questions_track_idx" ON "questions" USING btree ("track");--> statement-breakpoint
CREATE INDEX "questions_course_id_idx" ON "questions" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "questions_next_review_idx" ON "questions" USING btree ("next_review");--> statement-breakpoint
CREATE INDEX "solutions_question_id_idx" ON "solutions" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "sessions_date_idx" ON "study_sessions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "sessions_front_idx" ON "study_sessions" USING btree ("front");--> statement-breakpoint
CREATE INDEX "sessions_course_id_idx" ON "study_sessions" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "topics_course_id_idx" ON "topics" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "tutor_created_at_idx" ON "tutor_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tutor_session_idx" ON "tutor_messages" USING btree ("session_id");