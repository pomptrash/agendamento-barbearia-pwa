-- CreateEnum
CREATE TYPE "Cargo" AS ENUM ('ADMINISTRADOR', 'BARBEIRO');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('AGENDADO', 'CANCELADO', 'CONCLUIDO', 'NAO_COMPARECEU');

-- CreateTable
CREATE TABLE "Barbearia" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "logo" TEXT,
    "subdominio" TEXT NOT NULL,

    CONSTRAINT "Barbearia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Barbeiro" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "foto" TEXT,
    "barbeariaId" UUID NOT NULL,

    CONSTRAINT "Barbeiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" UUID NOT NULL,
    "login" TEXT NOT NULL,
    "cargo" "Cargo" NOT NULL DEFAULT 'BARBEIRO',
    "barbeiroId" UUID NOT NULL,
    "barbeariaId" UUID NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "barbeariaId" UUID NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servico" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "duracao" INTEGER NOT NULL,
    "barbeariaId" UUID NOT NULL,

    CONSTRAINT "Servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agendamento" (
    "id" UUID NOT NULL,
    "valorPago" DECIMAL(10,2),
    "dataHora" TIMESTAMP(3) NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'AGENDADO',
    "barbeariaId" UUID NOT NULL,
    "clienteId" UUID NOT NULL,
    "barbeiroId" UUID NOT NULL,
    "servicoId" UUID NOT NULL,

    CONSTRAINT "Agendamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtendimentoAvulso" (
    "id" UUID NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "nomeCliente" TEXT NOT NULL,
    "valorPago" DECIMAL(10,2) NOT NULL,
    "barbeiroId" UUID NOT NULL,
    "servicoId" UUID NOT NULL,
    "barbeariaId" UUID NOT NULL,

    CONSTRAINT "AtendimentoAvulso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BarbeiroToServico" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_BarbeiroToServico_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Barbearia_subdominio_key" ON "Barbearia"("subdominio");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_barbeiroId_key" ON "Usuario"("barbeiroId");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_barbeariaId_login_key" ON "Usuario"("barbeariaId", "login");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_barbeariaId_telefone_key" ON "Cliente"("barbeariaId", "telefone");

-- CreateIndex
CREATE INDEX "_BarbeiroToServico_B_index" ON "_BarbeiroToServico"("B");

-- AddForeignKey
ALTER TABLE "Barbeiro" ADD CONSTRAINT "Barbeiro_barbeariaId_fkey" FOREIGN KEY ("barbeariaId") REFERENCES "Barbearia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_barbeiroId_fkey" FOREIGN KEY ("barbeiroId") REFERENCES "Barbeiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_barbeariaId_fkey" FOREIGN KEY ("barbeariaId") REFERENCES "Barbearia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_barbeariaId_fkey" FOREIGN KEY ("barbeariaId") REFERENCES "Barbearia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servico" ADD CONSTRAINT "Servico_barbeariaId_fkey" FOREIGN KEY ("barbeariaId") REFERENCES "Barbearia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_barbeariaId_fkey" FOREIGN KEY ("barbeariaId") REFERENCES "Barbearia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_barbeiroId_fkey" FOREIGN KEY ("barbeiroId") REFERENCES "Barbeiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "Servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtendimentoAvulso" ADD CONSTRAINT "AtendimentoAvulso_barbeiroId_fkey" FOREIGN KEY ("barbeiroId") REFERENCES "Barbeiro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtendimentoAvulso" ADD CONSTRAINT "AtendimentoAvulso_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "Servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtendimentoAvulso" ADD CONSTRAINT "AtendimentoAvulso_barbeariaId_fkey" FOREIGN KEY ("barbeariaId") REFERENCES "Barbearia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BarbeiroToServico" ADD CONSTRAINT "_BarbeiroToServico_A_fkey" FOREIGN KEY ("A") REFERENCES "Barbeiro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BarbeiroToServico" ADD CONSTRAINT "_BarbeiroToServico_B_fkey" FOREIGN KEY ("B") REFERENCES "Servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;
