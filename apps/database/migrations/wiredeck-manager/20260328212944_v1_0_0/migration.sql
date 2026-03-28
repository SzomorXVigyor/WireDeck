-- CreateTable
CREATE TABLE "Domain" (
    "domain" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Instance" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ipv4" TEXT NOT NULL,
    "publicPort" INTEGER NOT NULL,
    "internal_ipv4Cidr" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "subdomainValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Instance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleList" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "ModuleList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleWebView" (
    "id" TEXT NOT NULL,
    "moduleListId" TEXT NOT NULL,
    "ipv4" TEXT NOT NULL,
    "wireguardConfig" TEXT NOT NULL,
    "subdomainValue" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "loginUsers" JSONB NOT NULL,

    CONSTRAINT "ModuleWebView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleVnc" (
    "id" TEXT NOT NULL,
    "moduleListId" TEXT NOT NULL,
    "ipv4" TEXT NOT NULL,
    "wireguardConfig" TEXT NOT NULL,
    "subdomainValue" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "loginUsers" JSONB NOT NULL,
    "vncDevices" JSONB NOT NULL,

    CONSTRAINT "ModuleVnc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Domain_domain_key" ON "Domain"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "Instance_name_key" ON "Instance"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Instance_ipv4_key" ON "Instance"("ipv4");

-- CreateIndex
CREATE UNIQUE INDEX "Instance_publicPort_key" ON "Instance"("publicPort");

-- CreateIndex
CREATE UNIQUE INDEX "Instance_subdomainValue_key" ON "Instance"("subdomainValue");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleList_instanceId_key" ON "ModuleList"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleWebView_moduleListId_key" ON "ModuleWebView"("moduleListId");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleWebView_ipv4_key" ON "ModuleWebView"("ipv4");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleWebView_subdomainValue_key" ON "ModuleWebView"("subdomainValue");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleVnc_moduleListId_key" ON "ModuleVnc"("moduleListId");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleVnc_ipv4_key" ON "ModuleVnc"("ipv4");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleVnc_subdomainValue_key" ON "ModuleVnc"("subdomainValue");

-- AddForeignKey
ALTER TABLE "Instance" ADD CONSTRAINT "Instance_subdomainValue_fkey" FOREIGN KEY ("subdomainValue") REFERENCES "Domain"("domain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleList" ADD CONSTRAINT "ModuleList_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleWebView" ADD CONSTRAINT "ModuleWebView_moduleListId_fkey" FOREIGN KEY ("moduleListId") REFERENCES "ModuleList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleWebView" ADD CONSTRAINT "ModuleWebView_subdomainValue_fkey" FOREIGN KEY ("subdomainValue") REFERENCES "Domain"("domain") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleVnc" ADD CONSTRAINT "ModuleVnc_moduleListId_fkey" FOREIGN KEY ("moduleListId") REFERENCES "ModuleList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleVnc" ADD CONSTRAINT "ModuleVnc_subdomainValue_fkey" FOREIGN KEY ("subdomainValue") REFERENCES "Domain"("domain") ON DELETE RESTRICT ON UPDATE CASCADE;
