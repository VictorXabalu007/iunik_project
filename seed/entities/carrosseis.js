const knex = require('../../src/config/connect');

async function seedCarrosseis() {
  console.log('Seeding carrosseis table...');
  
  await knex('carrosseis').insert([
    { titulo: 'Principal', imagens: '[]' },
    { titulo: 'Promoção', imagens: '[]' },
    { titulo: 'Mais Vendidos', imagens: '[]' }
  ]);
  
  console.log('Carrosseis seeding completed!');
}

module.exports = seedCarrosseis;