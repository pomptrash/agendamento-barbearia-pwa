-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "assinatura" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vencimentoAssinatura" TIMESTAMPTZ;
