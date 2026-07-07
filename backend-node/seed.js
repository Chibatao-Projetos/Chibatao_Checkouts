const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.usuarios.findFirst({ where: { Email: 'admin@empresa.com' } });
  if (!user) { console.log('Usuário não encontrado.'); return; }

  console.log('Usuário encontrado:', user.Nome, '| Perfil:', user.Perfil, '| Status:', user.Status);

  await prisma.usuarios.update({
    where: { Id: user.Id },
    data: {
      SenhaHash: bcrypt.hashSync('admin123', 10),
      Perfil: 'Admin',
      Status: 'Ativo',
    },
  });
  console.log('Senha redefinida para admin123, perfil Admin, status Ativo.');
}

main().catch(e => console.error('Erro:', e.message)).finally(() => prisma.$disconnect());
