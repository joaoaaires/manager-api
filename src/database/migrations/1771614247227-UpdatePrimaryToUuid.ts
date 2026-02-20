import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePrimaryToUuid1771614247227 implements MigrationInterface {
    name = 'UpdatePrimaryToUuid1771614247227'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "UQ_user_email_active"`);
        await queryRunner.query(`CREATE TABLE "temporary_user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(100) NOT NULL, "email" varchar(70) NOT NULL, "password" varchar(255) NOT NULL, "create_at" datetime NOT NULL DEFAULT (datetime('now')), "update_at" datetime NOT NULL DEFAULT (datetime('now')), "delete_at" datetime)`);
        await queryRunner.query(`INSERT INTO "temporary_user"("id", "name", "email", "password", "create_at", "update_at", "delete_at") SELECT "id", "name", "email", "password", "create_at", "update_at", "delete_at" FROM "user"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`ALTER TABLE "temporary_user" RENAME TO "user"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_user_email_active" ON "user" ("email") WHERE "delete_at" IS NULL`);
        await queryRunner.query(`DROP INDEX "UQ_user_email_active"`);
        await queryRunner.query(`CREATE TABLE "temporary_user" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar(100) NOT NULL, "email" varchar(70) NOT NULL, "password" varchar(255) NOT NULL, "create_at" datetime NOT NULL DEFAULT (datetime('now')), "update_at" datetime NOT NULL DEFAULT (datetime('now')), "delete_at" datetime)`);
        await queryRunner.query(`INSERT INTO "temporary_user"("id", "name", "email", "password", "create_at", "update_at", "delete_at") SELECT "id", "name", "email", "password", "create_at", "update_at", "delete_at" FROM "user"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`ALTER TABLE "temporary_user" RENAME TO "user"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_user_email_active" ON "user" ("email") WHERE "delete_at" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "UQ_user_email_active"`);
        await queryRunner.query(`ALTER TABLE "user" RENAME TO "temporary_user"`);
        await queryRunner.query(`CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(100) NOT NULL, "email" varchar(70) NOT NULL, "password" varchar(255) NOT NULL, "create_at" datetime NOT NULL DEFAULT (datetime('now')), "update_at" datetime NOT NULL DEFAULT (datetime('now')), "delete_at" datetime)`);
        await queryRunner.query(`INSERT INTO "user"("id", "name", "email", "password", "create_at", "update_at", "delete_at") SELECT "id", "name", "email", "password", "create_at", "update_at", "delete_at" FROM "temporary_user"`);
        await queryRunner.query(`DROP TABLE "temporary_user"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_user_email_active" ON "user" ("email") WHERE "delete_at" IS NULL`);
        await queryRunner.query(`DROP INDEX "UQ_user_email_active"`);
        await queryRunner.query(`ALTER TABLE "user" RENAME TO "temporary_user"`);
        await queryRunner.query(`CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(100) NOT NULL, "email" varchar(70) NOT NULL, "password" varchar(255) NOT NULL, "create_at" datetime NOT NULL DEFAULT (datetime('now')), "update_at" datetime NOT NULL DEFAULT (datetime('now')), "delete_at" datetime)`);
        await queryRunner.query(`INSERT INTO "user"("id", "name", "email", "password", "create_at", "update_at", "delete_at") SELECT "id", "name", "email", "password", "create_at", "update_at", "delete_at" FROM "temporary_user"`);
        await queryRunner.query(`DROP TABLE "temporary_user"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_user_email_active" ON "user" ("email") WHERE "delete_at" IS NULL`);
    }

}
