const knex = require('../../src/config/connect');

async function seedFormaspagamento() {
  console.log('Seeding formaspagamento table...');
  
  await knex('formaspagamento').insert([
    { forma: 'pix' },
    { forma: 'credito' },
    { forma: 'debito' },
    { forma: 'boleto' },
    { forma: 'saldo disponivel' }
  ]);
  
  console.log('Formaspagamento seeding completed!');
}

module.exports = seedFormaspagamento;