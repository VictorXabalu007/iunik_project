const knex = require('../../src/config/connect');
const { faker } = require('@faker-js/faker/locale/pt_BR');

async function seedAvaliacoes() {
  console.log('Seeding avaliacoes table...');
  
  // Get product IDs
  const produtos = await knex('produtos')
    .select('id')
    .limit(30);  // Limit to 30 products for performance
  
  for (const produto of produtos) {
    // Each product gets 0-10 reviews
    const numAvaliacoes = faker.number.int({ min: 0, max: 10 });
    
    for (let i = 0; i < numAvaliacoes; i++) {
      const comentario = faker.commerce.productDescription();
      const estrelas = faker.number.int({ min: 1, max: 5 });
      
      await knex('avaliacoes').insert({
        comentario,
        estrelas,
        produto_id: produto.id
      });
    }
    
    // Update media de avaliações
    const [avgRating] = await knex('avaliacoes')
      .avg('estrelas as media')
      .where('produto_id', produto.id);
    
    if (avgRating.media) {
      await knex('produtos')
        .where('id', produto.id)
        .update({ mediaAvs: parseFloat(avgRating.media).toFixed(1) });
    }
  }
  
  console.log('Avaliacoes seeding completed!');
}

module.exports = seedAvaliacoes;