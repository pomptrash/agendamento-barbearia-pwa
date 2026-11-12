import { jwtVerify } from 'jose'

export async function getUsuarioAutenticado(request) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return null

    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    return {
      id: payload.sub,
      login: payload.login,
      cargo: payload.cargo,
      barbeiroId: payload.barbeiroId || null,
      barbeariaId: payload.barbeariaId || null,
    }
  } catch (error) {
    return null
  }
}