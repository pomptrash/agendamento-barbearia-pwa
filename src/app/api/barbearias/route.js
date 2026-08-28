import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(){
    try {
        const barbearias = await prisma.barbearia.findMany()

        return NextResponse.json(barbearias)
    } catch (error) {
        console.log(error)
        
        return NextResponse.json(
            {error: "Erro ao tentar localizar as barbearias"}, 
            {status: 500}
        )
    }
}