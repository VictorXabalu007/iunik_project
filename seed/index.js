const knex = require('../src/config/connect');
const setupDB = require('./setup');
const seedCargos = require('./entities/cargos');
const seedFormaspagamento = require('./entities/formaspagamento');
const seedCategorias = require('./entities/categorias');
const seedCarrosseis = require('./entities/carrosseis');
const seedUsuarios = require('./entities/usuarios');
const seedProdutos = require('./entities/produtos');
const seedConsultorProdutos = require('./entities/consultor_produtos');
const seedEnderecos = require('./entities/enderecos');
const seedAvaliacoes = require('./entities/avaliacoes');
const seedPedidos = require('./entities/pedidos');
const seedSaques = require('./entities/saques');

async function seedDatabase() {
  console.log('Starting seeding process...');
  
  try {
    // Setup database (drop schema, create tables)
    await setupDB();
    console.log('Database setup completed!');
    // Begin transaction for data seeding
    await knex.raw('BEGIN');
    
    try {
      // Seed in correct order to maintain relationships
      await seedCargos();
      await seedFormaspagamento();
      await seedCategorias();
      await seedCarrosseis();
      await seedUsuarios();
      await seedProdutos();
      await seedConsultorProdutos();
      await seedEnderecos();
      await seedAvaliacoes();
      await seedPedidos();
      await seedSaques();
      
      await knex.raw('COMMIT');
      console.log('Seeding completed successfully!');
    } catch (err) {
      await knex.raw('ROLLBACK');
      console.error('Error during seeding data:', err);
      throw err;
    }
  } catch (err) {
    console.error('Error during database setup:', err);
  } finally {
    process.exit();
  }
}

// Run the seeding function
seedDatabase().catch(err => {
  console.error('Unhandled error during seeding:', err);
  process.exit(1);
});