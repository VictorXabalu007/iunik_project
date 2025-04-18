const knex = require('../../src/config/connect');
const { faker } = require('@faker-js/faker/locale/pt_BR');
const { randomDate, randomDecimal, getRandomItem, generateTrackingCode } = require('../helpers');

// Store orders for saques
let pedidos = [];

async function seedPedidos() {
  console.log('Seeding pedidos and movimentacoes tables...');
  
  const startDate = new Date(2023, 0, 1); // Jan 1, 2023
  const endDate = new Date(2025, 3, 18);  // Apr 18, 2025 (current date)
  const statusPagamento = ['aguardando', 'pago', 'cancelado'];
  const statusEntrega = ['pendente', 'enviado', 'entregue', 'cancelado'];
  const formasEnvio = ['PAC', 'SEDEX', 'SEDEX 10', 'Transportadora'];
  const modelos = ['A vista', 'Parcelado'];
  
  // Create 100 pedidos (orders)
  for (let i = 0; i < 100; i++) {
    // Select active client and consultant
    const activeClientes = await knex('usuarios')
      .select('id')
      .where('cargo_id', 5)
      .where('status', 'Ativo')
      .limit(10);
    
    const activeConsultores = await knex('usuarios')
      .select('id')
      .where('cargo_id', 4)
      .where('status', 'Ativo')
      .limit(10);
    
    if (activeClientes.length === 0 || activeConsultores.length === 0) continue;
    
    const clienteId = getRandomItem(activeClientes).id;
    const consultorId = getRandomItem(activeConsultores).id;
    
    // Get client and consultor info
    const [cliente] = await knex('usuarios')
      .select('nome', 'cpf', 'email', 'telefone')
      .where('id', clienteId);
    
    const [consultor] = await knex('usuarios')
      .select('nome')
      .where('id', consultorId);
    
    // Get client address
    const [endereco] = await knex('enderecos')
      .select('*')
      .where('usuario_id', clienteId)
      .limit(1);
    
    if (!endereco) continue;
    
    // Random date for pedido
    const dataPedido = randomDate(startDate, endDate);
    
    // Get consultor's products
    const consultorProdutos = await knex('consultor_produtos')
      .join('produtos', 'consultor_produtos.produto_id', 'produtos.id')
      .select(
        'consultor_produtos.produto_id',
        'consultor_produtos.valorConsult',
        'consultor_produtos.valorTotal',
        'produtos.nome'
      )
      .where('consultor_produtos.consultor_id', consultorId)
      .where('produtos.inativo', false)
      .limit(10);
    
    if (consultorProdutos.length === 0) continue;
    
    // Select 1-3 products for the order
    const numProdutos = faker.number.int({ min: 1, max: 3 });
    const pedidoProdutos = [];
    let valorTotal = 0;
    let valorConsultTotal = 0;
    
    // Shuffle consultant products array to randomize selection
    const shuffledProducts = [...consultorProdutos]
      .sort(() => 0.5 - Math.random())
      .slice(0, numProdutos);
    
    for (const produto of shuffledProducts) {
      const quantidade = faker.number.int({ min: 1, max: 3 });
      
      pedidoProdutos.push({
        id: produto.produto_id,
        nome: produto.nome,
        quantidade: quantidade,
        valorUnitario: produto.valorTotal,
        valorConsult: produto.valorConsult
      });
      
      valorTotal += produto.valorTotal * quantidade;
      valorConsultTotal += produto.valorConsult * quantidade;
    }
    
    if (pedidoProdutos.length === 0) continue;
    
    const valorFrete = randomDecimal(15, 50);
    valorTotal += valorFrete;
    
    const formaPagId = faker.number.int({ min: 1, max: 5 });
    const statuspag = getRandomItem(statusPagamento);
    let statusentrega = 'pendente';
    let dataEnvio = null;
    let codigoRastreio = null;
    
    // If payment is confirmed, maybe it's shipped
    if (statuspag === 'pago') {
      statusentrega = getRandomItem(statusEntrega);
      
      if (statusentrega === 'enviado' || statusentrega === 'entregue') {
        const pedidoDate = new Date(dataPedido);
        dataEnvio = randomDate(
          pedidoDate, 
          new Date(pedidoDate.getTime() + 14 * 24 * 60 * 60 * 1000)
        );
        codigoRastreio = generateTrackingCode();
      }
    }
    
    // Maybe consultor has been paid
    const consultPago = statuspag === 'pago' && Math.random() > 0.4;
    
    try {
      let [pedido] = await knex('pedidos').insert({
        dataPedido,
        valor: valorTotal,
        valorconsult: valorConsultTotal,
        valorFrete,
        formaEnvio: getRandomItem(formasEnvio),
        dataEnvio,
        codigoRastreio,
        rua: endereco.rua,
        numero: endereco.numero,
        bairro: endereco.bairro,
        cep: endereco.cep,
        cidade: endereco.cidade,
        estado: endereco.estado,
        complemento: endereco.complemento || '',
        statuspag,
        statusentrega,
        modelo: getRandomItem(modelos),
        consultPago,
        produtos_ids: JSON.stringify(pedidoProdutos),
        nomeCliente: cliente.nome,
        cpfCliente: cliente.cpf,
        emailCliente: cliente.email,
        nomeConsultor: consultor.nome,
        telefone: cliente.telefone,
        formapag_id: formaPagId,
        cliente_id: clienteId,
        consultor_id: consultorId
      }).returning('id');
    pedido = pedido.id
      // Store for saques
      if (statuspag === 'pago' && consultPago) {
        pedidos.push({
          id: pedido,
          consultor_id: consultorId,
          valor: valorTotal,
          valorConsult: valorConsultTotal
        });
      }
      
      // Create movimentacao for this pedido
      if (statuspag === 'pago') {
        await knex('movimentacoes').insert({
          tipo: 'entrada',
          valor: valorTotal,
          pedido_id: pedido
        });
        
        // Update consultant totalFat and valorDispSaque if consultPago is true
        if (consultPago) {
          await knex('usuarios')
            .where('id', consultorId)
            .increment({
              totalFat: valorTotal,
              valorDispSaque: valorConsultTotal
            });
        } else {
          await knex('usuarios')
            .where('id', consultorId)
            .increment({
              totalFat: valorTotal,
              valortrancado: valorConsultTotal
            });
        }
      }
    } catch (err) {
      console.error('Error creating pedido:', err);
    }
  }
  
  console.log('Pedidos seeding completed!');
  return { pedidos };
}

module.exports = seedPedidos;