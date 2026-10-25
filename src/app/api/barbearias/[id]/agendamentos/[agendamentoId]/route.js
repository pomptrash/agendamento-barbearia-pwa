import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// busca um agendamento específico pelo ID
export async function GET(request, { params }) {
  const { id: barbeariaID, agendamentoId } = await params;

  try {
    const agendamento = await prisma.agendamento.findUnique({
      where: { id: agendamentoId },
      include: {
        barbeiro: { select: { id: true, nome: true } },
        servico: { select: { id: true, nome: true, valor: true, duracao: true } },
        cliente: { select: { id: true, nome: true, telefone: true, assinatura: true } },
      },
    });

    if (!agendamento || agendamento.barbeariaId !== barbeariaID) {
      return NextResponse.json(
        { error: "Agendamento não encontrado nesta barbearia" },
        { status: 404 }
      );
    }

    return NextResponse.json(agendamento, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar agendamento" },
      { status: 500 }
    );
  }
}

// Atualiza o status, dataHora, ou valorPago de um agendamento
export async function PUT(request, { params }) {
  const { id: barbeariaID, agendamentoId } = await params;

  try {
    const body = await request.json();

    // Busca o agendamento atual para obter os dados existentes caso não sejam enviados no body
    const agendamentoAtual = await prisma.agendamento.findUnique({
      where: { id: agendamentoId },
      include: { servico: true },
    });

    if (!agendamentoAtual || agendamentoAtual.barbeariaId !== barbeariaID) {
      return NextResponse.json(
        { error: "Agendamento não encontrado nesta barbearia" },
        { status: 404 }
      );
    }

    // Identifica os IDs e a data/hora que serão considerados para a validação
    const novoBarbeiroId = body.barbeiroId || agendamentoAtual.barbeiroId;
    const novoServicoId = body.servicoId || agendamentoAtual.servicoId;
    const novoClienteId = body.clienteId || agendamentoAtual.clienteId;
    const novaDataHora = body.dataHora ? new Date(body.dataHora) : agendamentoAtual.dataHora;

    // Se a dataHora, barbeiro ou serviço mudou, valida o choque de horário
    if (body.dataHora || body.barbeiroId || body.servicoId) {
      const servico = await prisma.servico.findUnique({
        where: { id: novoServicoId },
      });

      if (!servico || servico.barbeariaId !== barbeariaID) {
        return NextResponse.json(
          { error: "Serviço inválido para esta barbearia" },
          { status: 404 }
        );
      }

      const inicioNovo = novaDataHora;
      const fimNovo = new Date(inicioNovo.getTime() + servico.duracao * 60000);

      // Busca agendamentos ativos ignorando o ID do próprio agendamento atual (id: { not: agendamentoId })
      const agendamentosExistentes = await prisma.agendamento.findMany({
        where: {
          barbeariaId: barbeariaID,
          id: { not: agendamentoId }, // Ignora o próprio agendamento sendo alterado
          status: { not: "CANCELADO" },
          OR: [
            { barbeiroId: novoBarbeiroId },
            { clienteId: novoClienteId },
          ],
        },
        include: { servico: true },
      });

      const conflitoBarbeiro = agendamentosExistentes.some((item) => {
        if (item.barbeiroId !== novoBarbeiroId) return false;
        const inicioExistente = new Date(item.dataHora);
        const fimExistente = new Date(inicioExistente.getTime() + item.servico.duracao * 60000);
        return inicioNovo < fimExistente && fimNovo > inicioExistente;
      });

      if (conflitoBarbeiro) {
        return NextResponse.json(
          { error: "O barbeiro selecionado já possui um agendamento nesse horário" },
          { status: 409 }
        );
      }

      const conflitoCliente = agendamentosExistentes.some((item) => {
        if (item.clienteId !== novoClienteId) return false;
        const inicioExistente = new Date(item.dataHora);
        const fimExistente = new Date(inicioExistente.getTime() + item.servico.duracao * 60000);
        return inicioNovo < fimExistente && fimNovo > inicioExistente;
      });

      if (conflitoCliente) {
        return NextResponse.json(
          { error: "O cliente já possui outro agendamento nesse mesmo horário" },
          { status: 409 }
        );
      }
    }

    // Atualiza o agendamento se passou em todas as validações
    const agendamentoAtualizado = await prisma.agendamento.update({
      where: { id: agendamentoId },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.dataHora && { dataHora: new Date(body.dataHora) }),
        ...(body.valorPago !== undefined && { valorPago: body.valorPago }),
        ...(body.barbeiroId && { barbeiroId: body.barbeiroId }),
        ...(body.servicoId && { servicoId: body.servicoId }),
      },
      include: {
        barbeiro: { select: { id: true, nome: true } },
        servico: { select: { id: true, nome: true, valor: true, duracao: true } },
        cliente: { select: { id: true, nome: true, telefone: true, assinatura: true } },
      },
    });

    return NextResponse.json(agendamentoAtualizado, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao atualizar agendamento" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { id: barbeariaID, agendamentoId } = await params;

  try {
    const agendamentoExiste = await prisma.agendamento.findUnique({
      where: { id: agendamentoId },
    });

    if (!agendamentoExiste || agendamentoExiste.barbeariaId !== barbeariaID) {
      return NextResponse.json(
        { error: "Agendamento não encontrado nesta barbearia" },
        { status: 404 }
      );
    }

    await prisma.agendamento.delete({
      where: { id: agendamentoId },
    });

    return NextResponse.json(
      { message: "Agendamento excluído com sucesso!" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao excluir agendamento" },
      { status: 500 }
    );
  }
}