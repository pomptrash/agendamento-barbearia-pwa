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
