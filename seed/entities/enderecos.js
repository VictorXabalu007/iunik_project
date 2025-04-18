const knex = require('../../src/config/connect');
const { faker } = require('@faker-js/faker/locale/pt_BR');
const { getRandomItem, generateCEP } = require('../helpers');

async function seedEnderecos() {
  console.log('Seeding enderecos table...');
  
  // Get all active clients
  const clientes = await knex('usuarios')
    .select('id')
    .where('cargo_id', 5);
  
  const estadosBR = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];
  
  for (const cliente of clientes) {
    // Each client gets 1-3 addresses
    const numEnderecos = faker.number.int({ min: 1, max: 3 });
    
    for (let i = 0; i < numEnderecos; i++) {
      await knex('enderecos').insert({
        usuario_id: cliente.id,
        rua: faker.location.street(),
        bairro: faker.location.street() + ' área',
        complemento: Math.random() > 0.5 ? faker.location.secondaryAddress() : null,
        numero: faker.string.numeric({ min: 1, max: 999 }),
        cep: generateCEP(),
        cidade: faker.location.city(),
        estado: getRandomItem(estadosBR),
        nomecliente: faker.person.fullName(),
        telefone: faker.phone.number('119########')
      });
    }
  }
  
  console.log('Enderecos seeding completed!');
}

module.exports = seedEnderecos;