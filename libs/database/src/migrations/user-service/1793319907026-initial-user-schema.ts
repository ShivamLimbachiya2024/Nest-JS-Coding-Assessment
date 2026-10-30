import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitialUserSchema1793319907026 implements MigrationInterface {
  name = 'InitialUserSchema1793319907026'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "users"`)
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
    await queryRunner.query(`DROP SCHEMA "users"`)
  }
}
