const knex = require('../../src/config/connect');
const { faker } = require('@faker-js/faker/locale/pt_BR');
const { randomDate, randomDecimal } = require('../helpers');

async function seedSaques() {
  console.log('Seeding saques table...');
  
  // Get consultores with available balance
  const consultoresComSaldo = await knex('usuarios')
    .select('id', 'valorDispSaque')
    .where('cargo_id', 4)
    .where('valorDispSaque', '>', 100);
  
  for (const consultor of consultoresComSaldo) {
    const numSaques = faker.number.int({ min: 0, max: 3 });
    
    for (let i = 0; i < numSaques; i++) {
      // Get pedidos for this consultant that are paid and consultant was paid
      const pedidosConsultor = await knex('pedidos')
        .select('id')
        .where('consultor_id', consultor.id)
        .where('statuspag', 'pago')
        .where('consultPago', true)
        .limit(10);
      
      if (pedidosConsultor.length < 1) continue;
      
      const pedidosIds = pedidosConsultor.map(p => p.id);
      const valorSaque = Math.min(
        consultor.valorDispSaque * 0.8, 
        randomDecimal(100, 2000)
      );
      const valorResto = consultor.valorDispSaque - valorSaque;
      const dataSaque = randomDate(
        new Date(2023, 6, 1), 
        new Date(2025, 3, 18)
      );
      const status = faker.helpers.weightedArrayElement([
        { weight: 1, value: 'pendente' },
        { weight: 4, value: 'aprovado' },
        { weight: 1, value: 'recusado' }
      ]);
      const srcComp = status === 'aprovado' 
        ? `/uploads/comprovantes/comp_${faker.string.numeric(3)}.jpg` 
        : null;
      
      try {
        const [saque] = await knex('saques').insert({
          dataSaque,
          valorSaque,
          valorResto,
          pedido_resto_id: pedidosIds[0],
          status,
          srcComp,
          pedidos_ids: pedidosIds,
          consultor_id: consultor.id
        }).returning('id');
        
        // Create movimentacao for this saque if approved
        if (status === 'aprovado') {
          await knex('movimentacoes').insert({
            tipo: 'saida',
            valor: valorSaque,
            saque_id: saque.id
          });
          
          // Update consultant valorDispSaque
          await knex('usuarios')
            .where('id', consultor.id)
            .decrement('valorDispSaque', valorSaque);
        }
      } catch (err) {
        console.error('Error creating saque:', err);
      }
    }
  }
  
  console.log('Saques seeding completed!');
}

module.exports = seedSaques;