const knex = require('../src/config/connect');
const fs = require('fs');
const path = require('path');

// Function to ensure upload directories exist
function ensureDirectoriesExist() {
  const directories = [
    'uploads/produtos',
    'uploads/perfil',
    'uploads/certificados',
    'uploads/comprovantes',
    'uploads/carrossel'
  ];

  directories.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
}

// Main setup function
async function setupDatabase() {
  console.log('Setting up database...');
  ensureDirectoriesExist();
  
  try {
    // First, drop all tables to ensure a clean start
    console.log('Dropping all tables...');
    await knex.raw('DROP SCHEMA public CASCADE');
    await knex.raw('CREATE SCHEMA public');
    
    console.log('Creating tables...');
    // Create tables in correct order
    await knex.schema.createTable('cargos', table => {
      table.increments('id').primary();
      table.text('funcao').notNullable();
    });
    
    await knex.schema.createTable('usuarios', table => {
      table.increments('id').primary();
      table.text('nome').notNullable();
      table.text('email').notNullable().unique();
      table.text('telefone').notNullable();
      table.text('cpf').notNullable().unique();
      table.text('senha').notNullable();
      table.text('senhaResetToken').nullable();
      table.text('senhaResetTempo').nullable();
      table.text('agencia').nullable();
      table.text('conta').nullable();
      table.text('banco').nullable();
      table.text('pix').nullable();
      table.text('tipoChave').nullable();
      table.text('srcPerfil').nullable();
      table.text('srcCert').nullable();
      table.text('status').defaultTo('inativo');
      table.decimal('totalFat').defaultTo(0.0);
      table.decimal('valorDispSaque').defaultTo(0.0);
      table.decimal('valortrancado').defaultTo(0.0);
      table.integer('cargo_id').notNullable().references('id').inTable('cargos');
    });

    await knex.schema.createTable('formaspagamento', table => {
      table.increments('id').primary();
      table.text('forma').notNullable();
    });

    await knex.schema.createTable('categorias', table => {
      table.increments('id').primary();
      table.text('categoria').notNullable();
    });

    await knex.schema.createTable('produtos', table => {
      table.increments('id').primary();
      table.text('nome').notNullable();
      table.text('descricao').notNullable();
      table.decimal('valorMin').notNullable();
      table.decimal('valorMax').notNullable();
      table.decimal('valorVenda').notNullable();
      table.boolean('inativo').defaultTo(false);
      table.decimal('mediaAvs').nullable().defaultTo(0.0);
      table.integer('estoque').defaultTo(0);
      table.decimal('altura').nullable();
      table.decimal('peso').nullable();
      table.decimal('largura').nullable();
      table.decimal('profundidade').nullable();
      table.specificType('imagens', 'text[]').nullable();
      table.specificType('categoria_ids', 'int[]').notNullable();
    });

    await knex.schema.createTable('consultor_produtos', table => {
      table.increments('id').primary();
      table.integer('produto_id').notNullable().references('id').inTable('produtos');
      table.integer('consultor_id').notNullable().references('id').inTable('usuarios');
      table.decimal('valorConsult').notNullable();
      table.decimal('valorTotal').notNullable();
    });

    await knex.schema.createTable('pedidos', table => {
      table.increments('id').primary();
      table.text('dataPedido').notNullable();
      table.decimal('valor').notNullable();
      table.decimal('valorconsult').notNullable();
      table.decimal('valorFrete').notNullable();
      table.text('formaEnvio').nullable();
      table.text('dataEnvio').nullable();
      table.text('codigoRastreio').nullable();
      table.text('rua').notNullable();
      table.text('numero').notNullable();
      table.text('bairro').notNullable();
      table.text('cep').notNullable();
      table.text('cidade').notNullable();
      table.text('estado').notNullable();
      table.text('complemento').notNullable();
      table.text('statuspag').defaultTo('aguardando');
      table.text('statusentrega').defaultTo('pendente');
      table.text('modelo').notNullable();
      table.boolean('consultPago').defaultTo(false);
      table.boolean('saldodisp').defaultTo(false);
      table.decimal('resto').defaultTo(0.0);
      table.jsonb('produtos_ids').notNullable();
      table.text('linkPagamento').nullable();
      table.text('mercadopago_id').nullable();
      table.text('nomeCliente').nullable();
      table.text('cpfCliente').nullable();
      table.text('emailCliente').nullable();
      table.text('nomeConsultor').nullable();
      table.text('telefone').nullable();
      table.integer('formapag_id').nullable().references('id').inTable('formaspagamento');
      table.integer('cliente_id').notNullable().references('id').inTable('usuarios');
      table.integer('consultor_id').notNullable().references('id').inTable('usuarios');
    });

    await knex.schema.createTable('saques', table => {
      table.increments('id').primary();
      table.text('dataSaque').notNullable();
      table.decimal('valorSaque').notNullable();
      table.decimal('valorResto').notNullable();
      table.integer('pedido_resto_id').notNullable();
      table.text('status').defaultTo('pendente');
      table.text('srcComp').nullable();
      table.specificType('pedidos_ids', 'int[]').notNullable();
      table.integer('consultor_id').notNullable().references('id').inTable('usuarios');
    });

    await knex.schema.createTable('avaliacoes', table => {
      table.increments('id').primary();
      table.text('comentario').notNullable();
      table.integer('estrelas').notNullable();
      table.integer('produto_id').notNullable().references('id').inTable('produtos');
    });

    await knex.schema.createTable('movimentacoes', table => {
      table.increments('id').primary();
      table.text('tipo').notNullable();
      table.decimal('valor').notNullable();
      table.integer('saque_id').nullable().references('id').inTable('saques').unique();
      table.integer('pedido_id').nullable().references('id').inTable('pedidos').unique();
    });

    await knex.schema.createTable('carrosseis', table => {
      table.increments('id').primary();
      table.text('titulo').notNullable();
      table.jsonb('imagens').notNullable();
    });

    await knex.schema.createTable('enderecos', table => {
      table.increments('id').primary();
      table.integer('usuario_id').notNullable().references('id').inTable('usuarios');
      table.text('rua').notNullable();
      table.text('bairro').notNullable();
      table.text('complemento').nullable();
      table.text('numero').notNullable();
      table.text('cep').notNullable();
      table.text('cidade').notNullable();
      table.text('estado').notNullable();
      table.text('nomecliente').nullable();
      table.text('telefone').nullable();
    });

    console.log('All tables created!');
    return true;
  } catch (err) {
    console.error('Error during database setup:', err);
    throw err;
  }
}

module.exports = setupDatabase;