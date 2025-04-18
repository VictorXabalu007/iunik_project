const knex = require('../../src/config/connect');

async function seedCategorias() {
  console.log('Seeding categorias table...');
  
  await knex('categorias').insert([
    { categoria: 'Lançamentos' },
    { categoria: 'Promoções' }
  ]);
  
  console.log('Categorias seeding completed!');
}

module.exports = seedCategorias;