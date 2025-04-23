const knex = require('../src/config/connect');

(async () => {
  const pedidos = await knex('pedidos').select('id', 'produtos_ids');

  for (const pedido of pedidos) {
    const novosProdutos = await Promise.all(
      pedido.produtos_ids.map(async ({ id, quantidade }) => {
        const existe = await knex('produtos').where({ id }).first();

        if (existe) return { id, quantidade };

        const randomProduto = await knex('produtos')
          .orderByRaw('RANDOM()')
          .first();

        console.log(
          `Pedido ${pedido.id}: produto ${id} não encontrado → substituído por ${randomProduto.id}`
        );

        return {
          id: randomProduto.id,
          quantidade
        };
      })
    );

    // Atualiza serializando e fazendo cast
    await knex('pedidos')
      .where({ id: pedido.id })
      .update({
        produtos_ids: knex.raw('?::jsonb', [JSON.stringify(novosProdutos)])
      });
  }

  console.log('Todos os pedidos foram atualizados com sucesso.');
  process.exit(0);
})();
