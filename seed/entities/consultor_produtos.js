const knex = require('../../src/config/connect');
const { randomDecimal } = require('../helpers');

async function seedConsultorProdutos() {
  console.log('Seeding consultor_produtos table...');
  
  // Get IDs
  const consultores = await knex('usuarios')
    .select('id')
    .where('cargo_id', 4)
    .where('status', 'Ativo');
  
  const produtos = await knex('produtos')
    .select('id')
    .where('inativo', false);
  
  for (const consultor of consultores) {
    // Each consultor gets 5-15 products
    const numProducts = Math.floor(Math.random() * 11) + 5; // Between 5-15
    const shuffledProducts = [...produtos].sort(() => 0.5 - Math.random());
    const selectedProducts = shuffledProducts.slice(0, numProducts);
    
    for (const produto of selectedProducts) {
      const [productDetails] = await knex('produtos')
        .select('valorMin', 'valorMax', 'valorVenda')
        .where('id', produto.id);
      
      const valorConsult = randomDecimal(+productDetails.valorMin, +productDetails.valorMax);
      const valorTotal = +productDetails.valorVenda;
      
      await knex('consultor_produtos').insert({
        produto_id: produto.id,
        consultor_id: consultor.id,
        valorConsult,
        valorTotal
      });
    }
  }
  
  console.log('Consultor_produtos seeding completed!');
}

module.exports = seedConsultorProdutos;