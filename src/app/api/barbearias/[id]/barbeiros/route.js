import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUsuarioAutenticado } from '@/lib/auth'

export async function GET(request, { params }) {
  const { id: barbeariaID } = await params;

  try {
    // verifica se a barbearia existe antes de buscar os barbeiros
    const barbeariaExiste = await prisma.barbearia.findUnique({
      where: { id: barbeariaID },
    });

    if (!barbeariaExiste) {
      return NextResponse.json(
        { error: "Barbearia não encontrada" },
        { status: 404 },
      );
    }

    // Busca os barbeiros vinculados a esta barbearia
    const barbeiros = await prisma.barbeiro.findMany({
      where: { barbeariaId: barbeariaID },
    });

    return NextResponse.json(barbeiros, { status: 200 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro ao tentar listar os barbeiros da barbearia" },
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
      { error: 'Acesso negado. Apenas o administrador da barbearia pode cadastrar barbeiros.' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json();

    if (!body.nome) {
      return NextResponse.json(
        { error: "O campo nome é obrigatório" },
        { status: 400 },
      );
    }

    // Cria o barbeiro vinculando o barbeariaId recebido nos params da URL
    const novoBarbeiro = await prisma.barbeiro.create({
      data: {
        nome: body.nome,
        foto: body.foto ?? null,
        barbeariaId: barbeariaID,
      },
    });

    return NextResponse.json(novoBarbeiro, { status: 201 });
  } catch (error) {
    console.error(error);

    // Erro de violação de Foreign Key (P2003): ocorre se o barbeariaID da URL não existir
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Barbearia informada não existe" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Erro ao cadastrar barbeiro" },
      { status: 500 },
    );
  }
}