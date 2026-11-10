import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Cargo } from '../src/generated/prisma/client.ts'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Iniciando o seed do banco de dados...')

  const superAdminLogin = process.env.SUPER_ADMIN_LOGIN
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD
  
  const donoLogin = process.env.SEED_DONO_LOGIN
  const donoPassword = process.env.SEED_DONO_PASSWORD

  const senhaHashSuperAdmin = await bcrypt.hash(superAdminPassword, 10)
  const superAdmin = await prisma.usuario.upsert({
    where: {
      id: '00000000-0000-0000-0000-000000000001',
    },
    update: {
      login: superAdminLogin,
      senha: senhaHashSuperAdmin,
    },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      login: superAdminLogin,
      senha: senhaHashSuperAdmin,
      cargo: Cargo.SUPER_ADMIN,
    },
  })

  console.log(`Super Admin configurado: ${superAdmin.login}`)

  const barbearia = await prisma.barbearia.upsert({
    where: { subdominio: 'teste' },
    update: {},
    create: {
      nome: 'Barbearia Teste',
      endereco: 'Rua Principal, 100 - Centro',
      subdominio: 'teste',
    },
  })

  console.log(`Barbearia pronta: ${barbearia.nome} (${barbearia.id})`)

  let barbeiro = await prisma.barbeiro.findFirst({
    where: { barbeariaId: barbearia.id },
  })

  if (!barbeiro) {
    barbeiro = await prisma.barbeiro.create({
      data: {
        nome: 'João Barbeiro',
        barbeariaId: barbearia.id,
      },
    })
  }

  const senhaHashDono = await bcrypt.hash(donoPassword, 10)

  const usuarioDono = await prisma.usuario.upsert({
    where: {
      barbeariaId_login: {
        barbeariaId: barbearia.id,
        login: donoLogin,
      },
    },
    update: {
      senha: senhaHashDono,
    },
    create: {
      login: donoLogin,
      senha: senhaHashDono,
      cargo: Cargo.ADMINISTRADOR,
      barbeariaId: barbearia.id,
      barbeiroId: barbeiro.id,
    },
  })

  console.log(`Administrador da Barbearia configurado: ${usuarioDono.login}`)
  console.log('Seed executado com sucesso!')
}

main()
  .catch((e) => {
    console.error('Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })