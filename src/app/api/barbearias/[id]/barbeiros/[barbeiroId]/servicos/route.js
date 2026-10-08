import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { id: barbeariaID, barbeiroId } = await params;

  try {
    // Busca o barbeiro e traz a lista de serviços associados
    const barbeiroComServicos = await prisma.barbeiro.findUnique({
      where: { id: barbeiroId },
      select: {
        id: true,
        nome: true,
        barbeariaId: true,
        servicos: true, // Inclui a lista de serviços vinculados
      },
    });

    if (!barbeiroComServicos || barbeiroComServicos.barbeariaId !== barbeariaID) {
      return NextResponse.json(
        { error: "Barbeiro não encontrado nesta barbearia" },
        { status: 404 },
      );
    }

    return NextResponse.json(barbeiroComServicos.servicos, { status: 200 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro ao buscar serviços do barbeiro" },
      { status: 500 },
    );
  }
}

export async function POST(request, { params }) {
  const { id: barbeariaID, barbeiroId } = await params;

  try {
    const body = await request.json();

    // é esperado um array de IDs de serviços no body, ex: { "servicoIds": ["uuid-1", "uuid-2"] }, será enviado pelo form select de serviços no front end
    if (!body.servicoIds || !Array.isArray(body.servicoIds)) {
      return NextResponse.json(
        { error: "Envie um array de IDs de serviços no campo 'servicoIds'" },
        { status: 400 },
      );
    }

    const barbeiroExiste = await prisma.barbeiro.findUnique({
      where: { id: barbeiroId },
    });

    if (!barbeiroExiste || barbeiroExiste.barbeariaId !== barbeariaID) {
      return NextResponse.json(
        { error: "Barbeiro não encontrado nesta barbearia" },
        { status: 404 },
      );
    }

    // Valida se todos os serviços informados pertencem à mesma barbearia
    const servicosValidos = await prisma.servico.findMany({
      where: {
        id: { in: body.servicoIds },
        barbeariaId: barbeariaID,
      },
    });

    if (servicosValidos.length !== body.servicoIds.length) {
      return NextResponse.json(
        { error: "Um ou mais serviços informados não pertencem a esta barbearia ou não existem" },
        { status: 400 },
      );
    }

    // Atualiza os vínculos do barbeiro usando connect
    // set: [] limpa os vínculos anteriores e reatribui a nova lista
    const barbeiroAtualizado = await prisma.barbeiro.update({
      where: { id: barbeiroId },
      data: {
        servicos: {
          set: body.servicoIds.map((servicoId) => ({ id: servicoId })),
        },
      },
      include: {
        servicos: true,
      },
    });

    return NextResponse.json(barbeiroAtualizado, { status: 200 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro ao vincular serviços ao barbeiro" },
      { status: 500 },
    );
  }
}