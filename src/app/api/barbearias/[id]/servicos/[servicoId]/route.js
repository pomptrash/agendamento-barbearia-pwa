import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUsuarioAutenticado } from '@/lib/auth'

export async function GET(request, { params }) {
  const { id: barbeariaID, servicoId } = await params;

  try {
    const servico = await prisma.servico.findUnique({
      where: { id: servicoId },
    });

    if (!servico || servico.barbeariaId !== barbeariaID) {
      return NextResponse.json(
        { error: "Serviço não encontrado nesta barbearia" },
        { status: 404 },
      );
    }

    return NextResponse.json(servico, { status: 200 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro ao tentar localizar o serviço" },
      { status: 500 },
    );
  }
}

export async function PUT(request, { params }) {
  const { id: barbeariaID, servicoId } = await params;
  const usuario = await getUsuarioAutenticado(request)

  if (!usuario) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const ehDonoDaBarbearia =
    usuario.cargo === 'ADMINISTRADOR' && usuario.barbeariaId === barbeariaID

  if (usuario.cargo !== 'SUPER_ADMIN' && !ehDonoDaBarbearia) {
    return NextResponse.json(
      { error: 'Acesso negado. Sem permissão para editar serviços desta barbearia.' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json();

    if (!body.nome || body.valor === undefined || body.duracao === undefined) {
      return NextResponse.json(
        { error: "Preencha os campos obrigatórios (nome, valor e duracao)" },
        { status: 400 },
      );
    }

    const servicoExiste = await prisma.servico.findUnique({
      where: { id: servicoId },
    });

    if (!servicoExiste || servicoExiste.barbeariaId !== barbeariaID) {
      return NextResponse.json(
        { error: "Serviço não encontrado nesta barbearia" },
        { status: 404 },
      );
    }

    const servicoAtualizado = await prisma.servico.update({
      where: { id: servicoId },
      data: {
        nome: body.nome,
        valor: body.valor,
        duracao: body.duracao,
      },
    });

    return NextResponse.json(servicoAtualizado, { status: 200 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro ao atualizar serviço" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  const { id: barbeariaID, servicoId } = await params;
  const usuario = await getUsuarioAutenticado(request)

  if (!usuario) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const ehDonoDaBarbearia =
    usuario.cargo === 'ADMINISTRADOR' && usuario.barbeariaId === barbeariaID

  if (usuario.cargo !== 'SUPER_ADMIN' && !ehDonoDaBarbearia) {
    return NextResponse.json(
      { error: 'Acesso negado. Sem permissão para excluir serviços desta barbearia.' },
      { status: 403 }
    )
  }

  try {
    const servicoExiste = await prisma.servico.findUnique({
      where: { id: servicoId },
    });

    if (!servicoExiste || servicoExiste.barbeariaId !== barbeariaID) {
      return NextResponse.json(
        { error: "Serviço não encontrado nesta barbearia" },
        { status: 404 },
      );
    }

    await prisma.servico.delete({
      where: { id: servicoId },
    });

    return NextResponse.json(
      { message: "Serviço deletado com sucesso!" },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);

    // P2003: Ocorre se o serviço possuir agendamentos ou atendimentos vinculados
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "Não é possível deletar o serviço pois existem agendamentos ou atendimentos associados.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Erro ao deletar serviço" },
      { status: 500 },
    );
  }
}