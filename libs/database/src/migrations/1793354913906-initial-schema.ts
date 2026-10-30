import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitialSchema1793354913906 implements MigrationInterface {
  name = 'InitialSchema1793354913906'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "users"`)
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "tasks"`)
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "notifications"`)
    await queryRunner.query(
      `CREATE TABLE "notifications"."notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "message" character varying(500) NOT NULL, "is_read" boolean NOT NULL DEFAULT false, "source_message_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "notifications_user_created_at_index" ON "notifications"."notifications" ("user_id", "created_at") `,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "notifications_source_message_id_unique" ON "notifications"."notifications" ("source_message_id") `,
    )
    await queryRunner.query(
      `CREATE TYPE "tasks"."message_type" AS ENUM('users-exists-request', 'users-exists-response', 'task.completed')`,
    )
    await queryRunner.query(
      `CREATE TYPE "tasks"."outbox_status" AS ENUM('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED')`,
    )
    await queryRunner.query(
      `CREATE TABLE "tasks"."outbox_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "message_id" uuid NOT NULL, "message_type" "tasks"."message_type" NOT NULL, "aggregate_id" uuid NOT NULL, "payload" jsonb NOT NULL, "attempts" integer NOT NULL DEFAULT '0', "status" "tasks"."outbox_status" NOT NULL DEFAULT 'PENDING', "available_at" TIMESTAMP WITH TIME ZONE NOT NULL, "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL, "published_at" TIMESTAMP WITH TIME ZONE, "last_error_code" character varying(100), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0171348f527c64b137e4d4f5b66" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "outbox_messages_polling_index" ON "tasks"."outbox_messages" ("status", "available_at", "created_at") `,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "outbox_messages_message_id_unique" ON "tasks"."outbox_messages" ("message_id") `,
    )
    await queryRunner.query(
      `CREATE TYPE "tasks"."task_status" AS ENUM('TODO', 'IN_PROGRESS', 'DONE')`,
    )
    await queryRunner.query(
      `CREATE TABLE "tasks"."tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(150) NOT NULL, "description" character varying(1000), "status" "tasks"."task_status" NOT NULL DEFAULT 'TODO', "assigned_user_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "tasks_created_at_index" ON "tasks"."tasks" ("created_at") `,
    )
    await queryRunner.query(
      `CREATE INDEX "tasks_assigned_user_id_index" ON "tasks"."tasks" ("assigned_user_id") `,
    )
    await queryRunner.query(
      `CREATE INDEX "tasks_status_index" ON "tasks"."tasks" ("status") `,
    )
    await queryRunner.query(
      `CREATE TABLE "users"."refresh_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "family_id" uuid NOT NULL, "token_hash" character varying(64) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, "replaced_by_session_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_9190032f6967b7971dca07d69f3" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "refresh_sessions_token_hash_index" ON "users"."refresh_sessions" ("token_hash") `,
    )
    await queryRunner.query(
      `CREATE INDEX "refresh_sessions_family_id_index" ON "users"."refresh_sessions" ("family_id") `,
    )
    await queryRunner.query(
      `CREATE INDEX "refresh_sessions_user_id_index" ON "users"."refresh_sessions" ("user_id") `,
    )
    await queryRunner.query(
      `CREATE TYPE "users"."user_role" AS ENUM('ADMIN', 'MEMBER')`,
    )
    await queryRunner.query(
      `CREATE TABLE "users"."users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "email" character varying(320) NOT NULL, "role" "users"."user_role" NOT NULL, "password_hash" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "users_email_unique" ON "users"."users" ("email") `,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "users"."users_email_unique"`)
    await queryRunner.query(`DROP TABLE "users"."users"`)
    await queryRunner.query(`DROP TYPE "users"."user_role"`)
    await queryRunner.query(
      `DROP INDEX "users"."refresh_sessions_user_id_index"`,
    )
    await queryRunner.query(
      `DROP INDEX "users"."refresh_sessions_family_id_index"`,
    )
    await queryRunner.query(
      `DROP INDEX "users"."refresh_sessions_token_hash_index"`,
    )
    await queryRunner.query(`DROP TABLE "users"."refresh_sessions"`)
    await queryRunner.query(`DROP INDEX "tasks"."tasks_status_index"`)
    await queryRunner.query(`DROP INDEX "tasks"."tasks_assigned_user_id_index"`)
    await queryRunner.query(`DROP INDEX "tasks"."tasks_created_at_index"`)
    await queryRunner.query(`DROP TABLE "tasks"."tasks"`)
    await queryRunner.query(`DROP TYPE "tasks"."task_status"`)
    await queryRunner.query(
      `DROP INDEX "tasks"."outbox_messages_message_id_unique"`,
    )
    await queryRunner.query(
      `DROP INDEX "tasks"."outbox_messages_polling_index"`,
    )
    await queryRunner.query(`DROP TABLE "tasks"."outbox_messages"`)
    await queryRunner.query(`DROP TYPE "tasks"."outbox_status"`)
    await queryRunner.query(`DROP TYPE "tasks"."message_type"`)
    await queryRunner.query(
      `DROP INDEX "notifications"."notifications_source_message_id_unique"`,
    )
    await queryRunner.query(
      `DROP INDEX "notifications"."notifications_user_created_at_index"`,
    )
    await queryRunner.query(`DROP TABLE "notifications"."notifications"`)
    await queryRunner.query(`DROP SCHEMA "notifications"`)
    await queryRunner.query(`DROP SCHEMA "tasks"`)
    await queryRunner.query(`DROP SCHEMA "users"`)
  }
}
