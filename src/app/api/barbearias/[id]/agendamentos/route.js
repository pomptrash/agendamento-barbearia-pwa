import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// lista todos os agendamentos da barbearia (com opção de filtro por data ou barbeiro via Query Params)
export async function GET(request, { params }) {
  const { id: barbeariaID } = await params;
  const { searchParams } = new URL(request.url);

  const dataParam = searchParams.get("data"); 
  const barbeiroId = searchParams.get("barbeiroId");

  try {
    const whereCondition = {
      barbeariaId: barbeariaID,
      ...(barbeiroId && { barbeiroId }),
    };

    // Filtra por dia específico se a data for fornecida
    if (dataParam) {
      const inicioDia = new Date(`${dataParam}T00:00:00.000Z`);
      const fimDia = new Date(`${dataParam}T23:59:59.999Z`);

      whereCondition.dataHora = {
        gte: inicioDia,
        lte: fimDia,
      };
    }

    const agendamentos = await prisma.agendamento.findMany({
      where: whereCondition,
      include: {
        barbeiro: { select: { id: true, nome: true } },
        servico: { select: { id: true, nome: true, valor: true, duracao: true } },
        cliente: { select: { id: true, nome: true, telefone: true, assinatura: true } },
      },
      orderBy: { dataHora: "asc" },
    });

    return NextResponse.json(agendamentos, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar agendamentos" },
      { status: 500 }
    );
  }
}

// Cria um novo agendamento validando conflito de horário
export async function POST(request, { params }) {
  const { id: barbeariaID } = await params;

  try {
    const body = await request.json();
    const { barbeiroId, servicoId, clienteId, dataHora } = body;

    if (!barbeiroId || !servicoId || !clienteId || !dataHora) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    // Busca a duração do serviço selecionado
    const servico = await prisma.servico.findUnique({
      where: { id: servicoId },
    });

    if (!servico || servico.barbeariaId !== barbeariaID) {
      return NextResponse.json(
        { error: "Serviço inválido para esta barbearia" },
        { status: 404 }
      );
    }

    // Calcula o intervalo do novo agendamento com base na duração do serviço (em minutos)
    const inicioNovo = new Date(dataHora);
    const fimNovo = new Date(inicioNovo.getTime() + servico.duracao * 60000);

    // Verifica se o barbeiro já possui agendamento no mesmo horário/intervalo
    const agendamentosExistentes = await prisma.agendamento.findMany({
      where: {
        barbeariaId: barbeariaID,
        status: { not: "CANCELADO" },
        OR: [
          { barbeiroId: barbeiroId }, // Agendamentos do mesmo barbeiro
          { clienteId: clienteId }, // Agendamentos do mesmo cliente
        ],
      },
      include: { servico: true },
    });

    // verifica se já existe agendamento no mesmo horário para o mesmo barbeiro
    const conflitoBarbeiro = agendamentosExistentes.some((item) => {
      if (item.barbeiroId !== barbeiroId) return false;
      const inicioExistente = new Date(item.dataHora);
      const fimExistente = new Date(
        inicioExistente.getTime() + item.servico.duracao * 60000,
      );
      return inicioNovo < fimExistente && fimNovo > inicioExistente;
    });

    if (conflitoBarbeiro) {
      return NextResponse.json(
        {
          error:
            "O barbeiro selecionado já possui um agendamento nesse horário",
        },
        { status: 409 },
      );
    }

    // verifica se o cliente já possui agendamento para o mesmo horário
    const conflitoCliente = agendamentosExistentes.some((item) => {
      if (item.clienteId !== clienteId) return false;
      const inicioExistente = new Date(item.dataHora);
      const fimExistente = new Date(
        inicioExistente.getTime() + item.servico.duracao * 60000,
      );
      return inicioNovo < fimExistente && fimNovo > inicioExistente;
    });

    if (conflitoCliente) {
      return NextResponse.json(
        {
          error:
            "Você já possui outro agendamento pendente nesse mesmo horário",
        },
        { status: 409 },
      );
    }

    // Cria o agendamento
    const novoAgendamento = await prisma.agendamento.create({
      data: {
        dataHora: inicioNovo,
        barbeariaId: barbeariaID,
        barbeiroId,
        servicoId,
        clienteId,
      },
      include: {
        barbeiro: { select: { id: true, nome: true } },
        servico: { select: { id: true, nome: true, valor: true, duracao: true } },
        cliente: { select: { id: true, nome: true, telefone: true, assinatura: true } },
      },
    });

    return NextResponse.json(novoAgendamento, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao realizar agendamento" },
      { status: 500 }
    );
  }
}