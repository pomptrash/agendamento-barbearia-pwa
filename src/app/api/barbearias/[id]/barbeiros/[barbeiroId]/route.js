import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: Busca um barbeiro específico pelo ID dentro de uma barbearia
export async function GET(request, { params }) {
  const { id: barbeariaID, barbeiroId } = await params;

  try {
    const barbeiro = await prisma.barbeiro.findUnique({
      where: { id: barbeiroId },
    });

    // Se o barbeiro não existir OU pertencer a outra barbearia, retorna 404
    if (!barbeiro || barbeiro.barbeariaId !== barbeariaID) {
      return NextResponse.json(
        { error: "Barbeiro não encontrado nesta barbearia" },
        { status: 404 },
      );
    }

    return NextResponse.json(barbeiro, { status: 200 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro ao tentar localizar o barbeiro" },
      { status: 500 },
    );
  }
}

// PUT: Atualiza os dados de um barbeiro específico
export async function PUT(request, { params }) {
  const { id: barbeariaID, barbeiroId } = await params;

  try {
    const body = await request.json();

    if (!body.nome) {
      return NextResponse.json(
        { error: "O campo nome é obrigatório" },
        { status: 400 },
      );
    }

    // 1. Verifica se o barbeiro existe e se pertence a esta barbearia
    const barbeiroExiste = await prisma.barbeiro.findUnique({
      where: { id: barbeiroId },
    });

    if (!barbeiroExiste || barbeiroExiste.barbeariaId !== barbeariaID) {
      return NextResponse.json(
        { error: "Barbeiro não encontrado nesta barbearia" },
        { status: 404 },
      );
    }

    // 2. Executa a atualização
    const barbeiroAtualizado = await prisma.barbeiro.update({
      where: { id: barbeiroId },
      data: {
        nome: body.nome,
        foto: body.foto ?? null,
      },
    });

    return NextResponse.json(barbeiroAtualizado, { status: 200 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro ao atualizar barbeiro" },
      { status: 500 },
    );
  }
}

// DELETE: Remove um barbeiro específico
export async function DELETE(request, { params }) {
  const { id: barbeariaID, barbeiroId } = await params;

  try {
    // 1. Verifica se o barbeiro existe e pertence a esta barbearia
    const barbeiroExiste = await prisma.barbeiro.findUnique({
      where: { id: barbeiroId },
    });

    if (!barbeiroExiste || barbeiroExiste.barbeariaId !== barbeariaID) {
      return NextResponse.json(
        { error: "Barbeiro não encontrado nesta barbearia" },
        { status: 404 },
      );
    }

    // 2. Executa a exclusão
    await prisma.barbeiro.delete({
      where: { id: barbeiroId },
    });

    return NextResponse.json(
      { message: "Barbeiro deletado com sucesso!" },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);

    // P2003: Ocorre se o barbeiro possuir agendamentos, serviços ou atendimentos vinculados
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "Não é possível deletar o barbeiro pois existem dados associados.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Erro ao deletar barbeiro" },
      { status: 500 },
    );
  }
}