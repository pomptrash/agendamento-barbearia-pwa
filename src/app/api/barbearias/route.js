import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getUsuarioAutenticado } from '@/lib/auth'

export async function GET(request){
    const usuario = await getUsuarioAutenticado(request);

    if (!usuario || usuario.cargo !== "SUPER_ADMIN") {
    return NextResponse.json(
        { error: "Acesso negado." },
        { status: 403 },
    );
    }

    try {
        const barbearias = await prisma.barbearia.findMany()

        return NextResponse.json(barbearias)
    } catch (error) {
        console.error(error)
        
        return NextResponse.json(
            {error: "Erro ao tentar localizar as barbearias"}, 
            {status: 500}
        )
    }
}

export async function POST(request){
    const usuario = await getUsuarioAutenticado(request);

    if (!usuario || usuario.cargo !== "SUPER_ADMIN") {
        return NextResponse.json(
        {
            error:
            "Acesso negado.",
        },
        { status: 403 },
        );
    }

  try {
    const body = await request.json()

    const { nome, endereco, subdominio } =  body

    if (!nome || !endereco || !subdominio){
        return NextResponse.json(
            {erro: "Preencha os campos obrigatórios"},
            {status: 400}
        )
    }

    const novaBarbearia = await prisma.barbearia.create({
        data: {
            nome: body.nome,
            endereco: body.endereco,
            subdominio: body.subdominio,
            logo: body.logo ?? null
        }
    })

    return NextResponse.json(
        novaBarbearia, {status: 201}
    )
  } catch (error) {
        console.error(error)

        if (error.code === "P2002"){
            return NextResponse.json({error: "Subdominio já utilizado"}, {status: 409})
        }

        return NextResponse.json({error: "Erro ao criar barbearia"}, {status: 500})
    }
} 