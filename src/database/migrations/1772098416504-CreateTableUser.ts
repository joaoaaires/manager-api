import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableUser1772098416504 implements MigrationInterface {
    name = 'CreateTableUser1772098416504'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar(100) NOT NULL, "email" varchar(70) NOT NULL, "password" varchar(255) NOT NULL, "create_at" datetime NOT NULL DEFAULT (datetime('now')), "update_at" datetime NOT NULL DEFAULT (datetime('now')), "delete_at" datetime)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_user_email_active" ON "user" ("email") WHERE "delete_at" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "UQ_user_email_active"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
