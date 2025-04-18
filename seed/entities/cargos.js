const knex = require('../../src/config/connect');

async function seedCargos() {
  console.log('Seeding cargos table...');
  
  await knex('cargos').insert([
    { funcao: 'Admin' },
    { funcao: 'Gerente' },
    { funcao: 'Estoque' },
    { funcao: 'Consultor' },
    { funcao: 'Cliente' }
  ]);
  
  console.log('Cargos seeding completed!');
}

module.exports = seedCargos;