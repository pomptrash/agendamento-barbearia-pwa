import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const { login, senha, subdominio } = await request.json()

    if (!login || !senha) {
      return NextResponse.json(
        { error: 'Login e senha são obrigatórios.' },
        { status: 400 }
      )
    }

    let usuario

    // LOGIN DE SUBDOMÍNIO (Dono ou Barbeiro acessando a URL da Barbearia)
    if (subdominio) {
      usuario = await prisma.usuario.findFirst({
        where: {
          login,
          barbearia: {
            subdominio,
          },
        },
        include: {
          barbearia: true,
          barbeiro: true,
        },
      })
    } else {
      // LOGIN GERAL (Restrito exclusivamente ao SUPER_ADMIN)
      usuario = await prisma.usuario.findFirst({
        where: {
          login,
          cargo: 'SUPER_ADMIN',
        },
      })
    }

    if (!usuario) {
      return NextResponse.json(
        { error: 'Credenciais inválidas.' },
        { status: 401 }
      )
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha)
    if (!senhaValida) {
      return NextResponse.json(
        { error: 'Credenciais inválidas.' },
        { status: 401 }
      )
    }

    // Assina o JWT contendo o cargo do usuário (ADMINISTRADOR, BARBEIRO ou SUPER_ADMIN)
    const token = jwt.sign(
      {
        sub: usuario.id,
        login: usuario.login,
        cargo: usuario.cargo,
        barbeiroId: usuario.barbeiroId,
        barbeariaId: usuario.barbeariaId,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    )

    const response = NextResponse.json({
      message: 'Login realizado com sucesso.',
      usuario: {
        id: usuario.id,
        login: usuario.login,
        cargo: usuario.cargo,
        barbeariaId: usuario.barbeariaId,
      },
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400, // 1 dia em segundos
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Erro na rota de login:', error)
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    )
  }
}