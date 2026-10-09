import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { id: barbeariaID, clienteId } = await params;

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: {
        agendamentos: {
          include: {
            barbeiro: {
              select: { id: true, nome: true },
            },
            servico: {
              select: { id: true, nome: true, valor: true },
            },
          },
          orderBy: { dataHora: "desc" }, // do agendamento mais recente para o mais antigo
        },
      },
    });

    if (!cliente || cliente.barbeariaId !== barbeariaID) {
      return NextResponse.json(
        { error: "Cliente não encontrado nesta barbearia" },
        { status: 404 }
      );
    }

    return NextResponse.json(cliente, { status: 200 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro ao buscar dados do cliente" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const { id: barbeariaID, clienteId } = await params;

  try {
    const body = await request.json();

    const clienteExiste = await prisma.cliente.findUnique({
      where: { id: clienteId },
    });

    if (!clienteExiste || clienteExiste.barbeariaId !== barbeariaID) {
      return NextResponse.json(
        { error: "Cliente não encontrado nesta barbearia" },
        { status: 404 }
      );
    }

    const clienteAtualizado = await prisma.cliente.update({
      where: { id: clienteId },
      data: {
        ...(body.nome && { nome: body.nome }),
        ...(body.telefone && { telefone: body.telefone }),
        ...(body.assinatura !== undefined && { assinatura: body.assinatura }),
        ...(body.vencimentoAssinatura !== undefined && {
          vencimentoAssinatura: body.vencimentoAssinatura
            ? new Date(body.vencimentoAssinatura)
            : null,
        }),
      },
    });

    return NextResponse.json(clienteAtualizado, { status: 200 });
  } catch (error) {
    console.error(error);

    // Erro de unicidade se tentar alterar para um telefone que já existe na mesma barbearia
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe outro cliente cadastrado com este telefone nesta barbearia" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao atualizar dados do cliente" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { id: barbeariaID, clienteId } = await params;

  try {
    const clienteExiste = await prisma.cliente.findUnique({
      where: { id: clienteId },
    });

    if (!clienteExiste || clienteExiste.barbeariaId !== barbeariaID) {
      return NextResponse.json(
        { error: "Cliente não encontrado nesta barbearia" },
        { status: 404 }
      );
    }

    await prisma.cliente.delete({
      where: { id: clienteId },
    });

    return NextResponse.json(
      { message: "Cliente removido com sucesso!" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);

    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "Não é possível excluir o cliente pois ele possui agendamentos registrados.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao excluir cliente" },
      { status: 500 }
    );
  }
}