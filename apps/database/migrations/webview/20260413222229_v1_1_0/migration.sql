-- CreateEnum
CREATE TYPE "ConditionOperator" AS ENUM ('gt', 'lt', 'eq', 'gte', 'lte', 'neq');

-- CreateEnum
CREATE TYPE "NotificationMode" AS ENUM ('immediate', 'delayed');

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "registerId" INTEGER NOT NULL,
    "operator" "ConditionOperator" NOT NULL,
    "conditionValue" DOUBLE PRECISION NOT NULL,
    "mode" "NotificationMode" NOT NULL,
    "delaySeconds" INTEGER NOT NULL DEFAULT 0,
    "recipients" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_registerId_fkey" FOREIGN KEY ("registerId") REFERENCES "register_dict_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
