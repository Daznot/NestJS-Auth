-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('GGOGLE', 'YANDEX');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "provider" "Provider";
