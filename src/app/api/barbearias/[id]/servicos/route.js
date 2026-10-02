import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: Lista todos os serviços de uma barbearia específica
export async function GET(request, { params }) {
  const { id: barbeariaID } = await params;

  try {
    // 1. Verifica se a barbearia existe
    const barbeariaExiste = await prisma.barbearia.findUnique({
      where: { id: barbeariaID },
    });

    if (!barbeariaExiste) {
      return NextResponse.json(
        { error: "Barbearia não encontrada" },
        { status: 404 },
      );
    }

    // 2. Busca os serviços da barbearia
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

// POST: Cadastra um novo serviço vinculado a esta barbearia
export async function POST(request, { params }) {
  const { id: barbeariaID } = await params;

  try {
    const body = await request.json();

    // Validação de campos obrigatórios
    if (!body.nome || body.valor === undefined || body.duracao === undefined) {
      return NextResponse.json(
        { error: "Preencha os campos obrigatórios (nome, valor e duracao)" },
        { status: 400 },
      );
    }

    // Cria o serviço no banco
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

    // Violação de Foreign Key se o barbeariaID não existir no banco
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