import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitialNotificationSchema1793319918879 implements MigrationInterface {
  name = 'InitialNotificationSchema1793319918879'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "notifications"."notifications_source_message_id_unique"`,
    )
    await queryRunner.query(
      `DROP INDEX "notifications"."notifications_user_created_at_index"`,
    )
    await queryRunner.query(`DROP TABLE "notifications"."notifications"`)
    await queryRunner.query(`DROP SCHEMA "notifications"`)
  }
}
