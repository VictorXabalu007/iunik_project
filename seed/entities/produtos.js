const knex = require('../../src/config/connect');
const { faker } = require('@faker-js/faker/locale/pt_BR');
const { randomDecimal, getRandomItem } = require('../helpers');

// Global variable to store product IDs
let produtos = [];

async function seedProdutos() {
  console.log('Seeding produtos table...');
  
  const productTypes = [
    'Creme Hidratante', 'Protetor Solar', 'Sérum Anti-idade', 'Óleo Corporal', 'Sabonete Facial',
    'Máscara Capilar', 'Tratamento para Acne', 'Loção Tonificante', 'Creme para os Olhos', 
    'Ampola de Vitamina C', 'Gel de Limpeza', 'Hidratante Labial', 'Esfoliante Corporal', 
    'Spray Facial', 'Creme para as Mãos', 'Óleo Essencial', 'Máscara Facial', 'Contorno Corporal',
    'Água Micelar', 'Espuma de Limpeza', 'Xampu', 'Condicionador', 'Creme para Cabelo',
    'Base Facial', 'Corretivo', 'Blush', 'Batom', 'Delineador', 'Máscara para Cílios',
    'Pó Facial', 'Primer', 'Sérum Capilar', 'Tintura', 'Mousse Modeladora', 'Creme Antissinais'
  ];
  
  const brands = ['BioDermis', 'Naturalis', 'Derma Viva', 'Organi', 'Essenza', 'Pure Skin', 
                 'Revitalize', 'Natura Beauty', 'EcoDerm', 'Vitalíssima'];
  
  // Generate 70 products
  for (let i = 0; i < 70; i++) {
    const brand = getRandomItem(brands);
    const productType = getRandomItem(productTypes);
    const nome = `${brand} ${productType} ${faker.commerce.productAdjective()}`;
    const descricao = faker.commerce.productDescription();
    const valorMin = randomDecimal(20, 100);
    const valorMax = valorMin + randomDecimal(30, 150);
    const valorVenda = valorMax + randomDecimal(30, 100);
    const estoque = faker.number.int({ min: 0, max: 200 });
    const altura = randomDecimal(3, 25);
    const peso = randomDecimal(0.05, 1.5);
    const largura = randomDecimal(3, 15);
    const profundidade = randomDecimal(3, 15);
    
    // Use just original categories to avoid issues
    const categoria_ids = [faker.number.int({ min: 1, max: 2 })];
    
    // Generate product images
    const numImages = faker.number.int({ min: 1, max: 5 });
    const imagens = Array(numImages).fill().map(() => `/uploads/produtos/produto_${faker.string.numeric(3)}.jpg`);
    
    const inativo = faker.helpers.weightedArrayElement([
      { weight: 8, value: false },
      { weight: 2, value: true }
    ]);
    
    const [produtoId] = await knex('produtos').insert({
      nome, 
      descricao, 
      valorMin, 
      valorMax, 
      valorVenda, 
      estoque, 
      altura, 
      peso, 
      largura, 
      profundidade, 
      imagens, 
      categoria_ids,
      inativo
    }).returning('id');
    
    produtos.push(produtoId);
  }
  
  console.log('Produtos seeding completed!');
  return { produtos };
}

module.exports = seedProdutos;