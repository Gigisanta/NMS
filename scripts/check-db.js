const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany({
    include: { grupo: true }
  });
  console.log('Total clients:', clients.length);
  clients.forEach(c => {
    console.log(`Client: ${c.nombre} ${c.apellido}, Group ID: ${c.grupoId}, Group Name: ${c.grupo?.name}`);
  });

  const groups = await prisma.group.findMany({
    include: { _count: { select: { clients: true } } }
  });
  console.log('\nGroups:');
  groups.forEach(g => {
    console.log(`Group: ${g.name}, ID: ${g.id}, Count: ${g._count.clients}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
