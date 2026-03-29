import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding routines...');

  // Clean existing routine data
  await prisma.routineExecution.deleteMany();
  await prisma.routineDependency.deleteMany();
  await prisma.routineStep.deleteMany();
  await prisma.routine.deleteMany();

  // 1. Atualizar Razão
  const razao = await prisma.routine.create({
    data: {
      title: 'Atualizar Razão',
      description: 'Atualizar o arquivo de razão contábil com os lançamentos mais recentes.',
      filePath: 'R:\\01 - RAZÃO\\Razão Contábil.xlsx',
      frequency: 'daily',
      steps: {
        create: [
          { order: 1, content: 'Abrir o arquivo de Razão no caminho indicado' },
          { order: 2, content: 'Atualizar conexão de dados (Dados > Atualizar Tudo)' },
          { order: 3, content: 'Verificar se os lançamentos do dia apareceram' },
          { order: 4, content: 'Salvar e fechar o arquivo' },
        ],
      },
      executions: {
        create: [
          { executedAt: new Date('2026-03-13T10:30:00'), notes: 'Atualizado normalmente' },
          { executedAt: new Date('2026-03-12T09:15:00') },
          { executedAt: new Date('2026-03-11T11:00:00') },
        ],
      },
    },
  });

  // 2. Atualizar Banco de Dados
  const banco = await prisma.routine.create({
    data: {
      title: 'Atualizar Banco de Dados',
      description: 'Atualizar a base de dados de vendas com informações mais recentes.',
      filePath: 'R:\\09 - INFOS DE VENDAS\\Base Vendas.accdb',
      frequency: 'daily',
      steps: {
        create: [
          { order: 1, content: 'Abrir o banco de dados Access' },
          { order: 2, content: 'Executar a macro de importação' },
          { order: 3, content: 'Verificar registros importados' },
          { order: 4, content: 'Compactar e reparar o banco' },
        ],
      },
      executions: {
        create: [
          { executedAt: new Date('2026-03-16T14:00:00'), notes: 'Importados 150 registros novos' },
          { executedAt: new Date('2026-03-15T10:00:00') },
        ],
      },
    },
  });

  // 3. Atualizar DRE (depends on Razão)
  const dre = await prisma.routine.create({
    data: {
      title: 'Atualizar DRE',
      description: 'Atualizar o demonstrativo de resultados com base no Razão atualizado.',
      filePath: 'R:\\07 - REAL vs ORÇADO\\DRE Real vs Orçado.xlsx',
      frequency: 'daily',
      observation: 'IMPORTANTE: Antes de atualizar, copiar a aba "Razão" do arquivo de Razão para este arquivo. Usar Colar Especial > Valores para não quebrar as referências.',
      steps: {
        create: [
          { order: 1, content: 'Abrir o arquivo de Razão e copiar a aba "Razão"' },
          { order: 2, content: 'Abrir o arquivo DRE Real vs Orçado' },
          { order: 3, content: 'Colar Especial > Valores na aba "Razão" do DRE' },
          { order: 4, content: 'Verificar se os valores da DRE atualizaram' },
          { order: 5, content: 'Salvar e fechar ambos os arquivos' },
        ],
      },
      executions: {
        create: [
          { executedAt: new Date('2026-03-13T11:00:00'), notes: 'Atualizado com razão do dia 13' },
          { executedAt: new Date('2026-03-10T10:30:00') },
        ],
      },
    },
  });

  // Dependency: DRE depends on Razão
  await prisma.routineDependency.create({
    data: {
      dependentId: dre.id,
      dependencyId: razao.id,
    },
  });

  console.log('Seed completed!');
  console.log(`Created routines: ${razao.title}, ${banco.title}, ${dre.title}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
