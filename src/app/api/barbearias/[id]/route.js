import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
    const { id: barbeariaID } = await params;

    try {
        const barbearia = await prisma.barbearia.findUnique({
            where: { id: barbeariaID }
        })

        if (!barbearia) {
            return NextResponse.json(
                { error: "Barbearia não encontrada" },
                { status: 404 }
            )
        }

        return NextResponse.json(barbearia, { status: 200 })
    } catch (error) {
        console.error(error)

        return NextResponse.json(
            { error: "Erro ao tentar localizar a barbearia" },
            { status: 500 }
        )
    }
}
