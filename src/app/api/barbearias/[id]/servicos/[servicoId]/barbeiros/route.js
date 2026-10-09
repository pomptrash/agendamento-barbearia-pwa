import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Lista todos os barbeiros que realizam um serviço específico
export async function GET(request, { params }) {
  const { id: barbeariaID, servicoId } = await params;

  try {
    // Busca o serviço e inclui os barbeiros associados
    const servicoComBarbeiros = await prisma.servico.findUnique({
      where: { id: servicoId },
      select: {
        id: true,
        nome: true,
        barbeariaId: true,
        barbeiros: true, // Traz os barbeiros vinculados a este serviço
      },
    });

    if (!servicoComBarbeiros || servicoComBarbeiros.barbeariaId !== barbeariaID) {
      return NextResponse.json(
        { error: "Serviço não encontrado nesta barbearia" },
        { status: 404 },
      );
    }

    return NextResponse.json(servicoComBarbeiros.barbeiros, { status: 200 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro ao buscar barbeiros do serviço" },
      { status: 500 },
    );
  }
}