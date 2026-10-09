import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { id: barbeariaID } = await params;

  try {
    const barbeariaExiste = await prisma.barbearia.findUnique({
      where: { id: barbeariaID },
    });

    if (!barbeariaExiste) {
      return NextResponse.json(
        { error: "Barbearia não encontrada" },
        { status: 404 }
      );
    }

    const clientes = await prisma.cliente.findMany({
      where: { barbeariaId: barbeariaID },
      orderBy: { nome: "asc" },
    });

    return NextResponse.json(clientes, { status: 200 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro ao tentar listar os clientes da barbearia" },
      { status: 500 }
    );
  }
}


export async function POST(request, { params }) {
  const { id: barbeariaID } = await params;

  try {
    const body = await request.json();

    if (!body.nome || !body.telefone) {
      return NextResponse.json(
        { error: "Os campos nome e telefone são obrigatórios" },
        { status: 400 }
      );
    }

    // O upsert cria o cliente novo ou atualiza se o telefone já existir na barbearia
    const cliente = await prisma.cliente.upsert({
      where: {
        barbeariaId_telefone: {
          barbeariaId: barbeariaID,
          telefone: body.telefone,
        },
      },
      update: {
        nome: body.nome,
        ...(body.assinatura !== undefined && { assinatura: body.assinatura }),
        ...(body.vencimentoAssinatura !== undefined && {
          vencimentoAssinatura: body.vencimentoAssinatura,
        }),
      },
      create: {
        nome: body.nome,
        telefone: body.telefone,
        assinatura: body.assinatura ?? false,
        vencimentoAssinatura: body.vencimentoAssinatura ?? null,
        barbeariaId: barbeariaID,
      },
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    console.error(error);

    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Barbearia informada não existe" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao cadastrar ou atualizar cliente" },
      { status: 500 }
    );
  }
}