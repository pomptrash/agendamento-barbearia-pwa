import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // Extrair o subdomínio da URL (funciona em produção e em localhost, ex: teste.localhost:3000)
  // Remove a porta (:3000) se existir
  const hostSemPorta = hostname.split(':')[0]
  const partesHost = hostSemPorta.split('.')
  
  // Define se há subdomínio
  let subdominio = null
  if (hostSemPorta.includes('localhost')) {
    if (partesHost.length > 1 && partesHost[0] !== 'localhost') {
      subdominio = partesHost[0]
    }
  } else if (partesHost.length > 2) {
    subdominio = partesHost[0]
  }

  // Ignora subdomínio 'www' ou 'app' (considerados URL geral)
  if (subdominio === 'www' || subdominio === 'app') {
    subdominio = null
  }

  // Definir rotas públicas que não exigem autenticação
  const rotasPublicas = ['/login', '/api/auth/login']
  const ehRotaPublica = rotasPublicas.some((rota) => pathname.startsWith(rota))

  // Se for acesso público à raiz da barbearia (vitrine de agendamento do cliente), permite passar
  if (ehRotaPublica || (subdominio && pathname === '/')) {
    const response = NextResponse.next()
    if (subdominio) {
      response.headers.set('x-tenant-subdominio', subdominio)
    }
    return response
  }

  // Validar o Cookie JWT nas rotas protegidas
  const token = request.cookies.get('token')?.value

  if (!token) {
    // Se for requisição de API, retorna 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Não autorizado. Token ausente.' }, { status: 401 })
    }
    // Se for página, redireciona para /login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Verifica a assinatura do token JWT usando 'jose'
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    // Regras de Autorização (RBAC + Multi-Tenant)

    // Regra A: Área do SUPER_ADMIN (/super-admin)
    if (pathname.startsWith('/super-admin')) {
      if (subdominio !== null || payload.cargo !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    // Regra B: Área Administrativa da Barbearia (/admin)
    if (pathname.startsWith('/admin')) {
      // Bloqueia acesso se não estiver em um subdomínio ou se for SUPER_ADMIN tentando entrar direto
      if (!subdominio || payload.cargo === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    // Injeta os dados do usuário decodificados e o subdomínio nos headers da requisição
    // para que as rotas de API e Server Components possam ler facilmente
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.sub)
    requestHeaders.set('x-user-cargo', payload.cargo)
    if (payload.barbeariaId) requestHeaders.set('x-barbearia-id', payload.barbeariaId)
    if (subdominio) requestHeaders.set('x-tenant-subdominio', subdominio)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    // Token inválido ou expirado
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 })
    }
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('token')
    return response
  }
}

// Configura em quais caminhos o middleware deve atuar (ignora arquivos estáticos, imagens, _next)
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json).*)'],
}