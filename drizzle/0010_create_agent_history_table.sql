CREATE TABLE IF NOT EXISTS "agent_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"surface" text NOT NULL,
	"conversation_id" text,
	"start_time" bigint NOT NULL,
	"end_time" bigint NOT NULL,
	"input_tokens" smallint,
	"output_tokens" smallint,
	"total_tokens" smallint,
	"tool_calls" jsonb,
	"success" text NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_history_agent_id_index" ON "agent_history" ("agent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_history_surface_index" ON "agent_history" ("surface");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_history_start_time_index" ON "agent_history" ("start_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_history_conversation_id_index" ON "agent_history" ("conversation_id");
