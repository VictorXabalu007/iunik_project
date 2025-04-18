const knex = require('../../src/config/connect');
const bcrypt = require('bcrypt');
const { faker } = require('@faker-js/faker/locale/pt_BR');
const { getRandomItem } = require('../helpers');

// Global variables to store generated IDs
let consultores = [];
let clientes = [];

async function seedUsuarios() {
  console.log('Seeding usuarios table...');
  
  // Create admin, manager, stock users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const gerentePassword = await bcrypt.hash('gerente123', 10);
  const estoquePassword = await bcrypt.hash('estoque123', 10);
  
  await knex('usuarios').insert([
    {
      nome: 'BIODERMIS', 
      cpf: '00000000001', 
      email: 'adminbiodermis1@biodermis.com', 
      telefone: '00000000000', 
      senha: adminPassword, 
      cargo_id: 1, 
      status: 'Ativo'
    },
    {
      nome: 'Gerente BioDermis', 
      email: 'gerente@biodermis.com', 
      telefone: '11987654321', 
      cpf: '12345678901', 
      senha: gerentePassword, 
      cargo_id: 2, 
      status: 'Ativo'
    },
    {
      nome: 'Estoque BioDermis', 
      email: 'estoque@biodermis.com', 
      telefone: '11976543210', 
      cpf: '23456789012', 
      senha: estoquePassword, 
      cargo_id: 3, 
      status: 'Ativo'
    }
  ]);
  
  // Create consultores
  for (let i = 0; i < 15; i++) {
    const nome = faker.person.fullName();
    const email = faker.internet.email({ firstName: nome.split(' ')[0], lastName: nome.split(' ')[1] });
    const telefone = faker.phone.number('119########');
    const cpf = faker.string.numeric(11);
    const senha = await bcrypt.hash('senha123', 10);
    const agencia = faker.string.numeric(4);
    const conta = faker.string.numeric(6);
    const banco = getRandomItem(['Itaú', 'Bradesco', 'Santander', 'Nubank', 'Inter', 'Caixa', 'Banco do Brasil']);
    const pix = faker.internet.email();
    const tipoChave = 'email';
    const status = getRandomItem(['Ativo', 'Ativo', 'Em aprovação', 'Bloqueado']);
    
    const [consultorId] = await knex('usuarios').insert({
      nome, email, telefone, cpf, senha, agencia, conta, banco, pix, 
      tipoChave, cargo_id: 4, status
    }).returning('id');
    
    consultores.push(consultorId);
  }
  
  // Create clientes
  for (let i = 0; i < 50; i++) {
    const nome = faker.person.fullName();
    const email = faker.internet.email({ firstName: nome.split(' ')[0], lastName: nome.split(' ')[1] });
    const telefone = faker.phone.number('119########');
    const cpf = faker.string.numeric(11);
    const senha = await bcrypt.hash('senha123', 10);
    const status = faker.helpers.weightedArrayElement([
      { weight: 4, value: 'Ativo' },
      { weight: 1, value: 'inativo' }
    ]);
    
    const [clienteId] = await knex('usuarios').insert({
      nome, email, telefone, cpf, senha, cargo_id: 5, status
    }).returning('id');
    
    clientes.push(clienteId);
  }
  
  console.log('Usuarios seeding completed!');
  return { consultores, clientes };
}

module.exports = seedUsuarios;