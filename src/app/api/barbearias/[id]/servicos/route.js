import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUsuarioAutenticado } from '@/lib/auth'

export async function GET(request, { params }) {
  const { id: barbeariaID } = await params;

  try {
    const barbeariaExiste = await prisma.barbearia.findUnique({
      where: { id: barbeariaID },
    });

    if (!barbeariaExiste) {
      return NextResponse.json(
        { error: "Barbearia não encontrada" },
        { status: 404 },
      );
    }

    const servicos = await prisma.servico.findMany({
      where: { barbeariaId: barbeariaID },
    });

    return NextResponse.json(servicos, { status: 200 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro ao tentar listar os serviços da barbearia" },
      { status: 500 },
    );
  }
}

export async function POST(request, { params }) {
  const { id: barbeariaID } = await params;
  const usuario = await getUsuarioAutenticado(request)

  if (!usuario) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const ehDonoDaBarbearia =
    usuario.cargo === 'ADMINISTRADOR' && usuario.barbeariaId === barbeariaID

  if (usuario.cargo !== 'SUPER_ADMIN' && !ehDonoDaBarbearia) {
    return NextResponse.json(
      { error: 'Acesso negado.' },
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

    const novoServico = await prisma.servico.create({
      data: {
        nome: body.nome,
        valor: body.valor,
        duracao: body.duracao,
        barbeariaId: barbeariaID,
      },
    });

    return NextResponse.json(novoServico, { status: 201 });
  } catch (error) {
    console.error(error);

    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Barbearia informada não existe" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Erro ao cadastrar serviço" },
      { status: 500 },
    );
  }
}