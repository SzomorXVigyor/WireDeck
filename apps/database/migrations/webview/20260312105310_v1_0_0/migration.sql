-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('button', 'switch', 'display', 'number_input');

-- CreateEnum
CREATE TYPE "DeviceProtocol" AS ENUM ('ModbusTCP');

-- CreateTable
CREATE TABLE "views" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "layout" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CardType" NOT NULL,
    "order" INTEGER NOT NULL,
    "registerId" INTEGER NOT NULL,
    "viewId" INTEGER NOT NULL,
    "style" JSONB,
    "extra" JSONB,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "protocol" "DeviceProtocol" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "register_dict_entries" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "protocolAttributes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "register_dict_entries_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_registerId_fkey" FOREIGN KEY ("registerId") REFERENCES "register_dict_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "views"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "register_dict_entries" ADD CONSTRAINT "register_dict_entries_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
