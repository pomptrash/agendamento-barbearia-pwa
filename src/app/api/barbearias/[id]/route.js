import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { id: barbeariaID } = await params;

  try {
    const barbearia = await prisma.barbearia.findUnique({
      where: { id: barbeariaID },
    });

    if (!barbearia) {
      return NextResponse.json(
        { error: "Barbearia não encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(barbearia, { status: 200 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro ao tentar localizar a barbearia" },
      { status: 500 },
    );
  }
}

export async function PUT(request, { params }) {
  const { id: barbeariaID } = await params;

  try {
    const body = await request.json();

    if (!body.nome || !body.endereco || !body.subdominio) {
      return NextResponse.json(
        { error: "Preencha os campos obrigatórios" },
        { status: 400 },
      );
    }

    const barbeariaAtualizada = await prisma.barbearia.update({
      where: { id: barbeariaID },
      data: {
        nome: body.nome,
        endereco: body.endereco,
        subdominio: body.subdominio,
        logo: body.logo ?? null,
      },
    });

    return NextResponse.json(barbeariaAtualizada, { status: 200 });
  } catch (error) {
    console.error(error);

    // Registro não existe para atualizar
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Barbearia não encontrada" },
        { status: 404 },
      );
    }

    // Subdomínio duplicado
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Subdomínio já utilizado por outra barbearia" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Erro ao atualizar barbearia" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  const { id: barbeariaID } = await params;

  try {
    await prisma.barbearia.delete({
      where: { id: barbeariaID },
    });

    return NextResponse.json(
      { message: "Barbearia deletada com sucesso!" },
      { status: 200 },
    );
  } catch (error) {
    // erro específico do prisma
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Barbearia não encontrada" },
        { status: 404 },
      );
    }

    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "Não é possível deletar a barbearia pois existem dados associados.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Erro ao deletar barbearia" },
      { status: 500 },
    );
  }
}
