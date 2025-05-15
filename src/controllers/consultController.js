const knex = require('../config/connect');
const mailer = require('../modules/mailer');
const dayjs = require('dayjs')
const listConsults = async (req, res) => {
  const { id } = req.params;
  try {
    if (id < 1) {
      const status = req.query.status || undefined;
      const startDate = req.query.startDate || undefined;
      const endDate = req.query.endDate || undefined;
      const mapStatus = {
        ativo: 'Ativo',
        inativo: 'Inativo',
        'em aprovação': 'Em aprovação',
      }
      // Primeiro, obtemos todos os consultores
      let consultores = [];
      if (mapStatus[status]) {
        consultores = await knex('usuarios').select('*').where('cargo_id', 4).where('status', mapStatus[status] ?? 'Ativo');
      } else {
        consultores = await knex('usuarios').select('*').where('cargo_id', 4);
      }
      // Agora vamos buscar todos os pedidos realizados para calcular o faturamento
      const pedidos = await knex('pedidos')
      .select('*')
      .where('statuspag', 'realizado')
      .where('modelo', 'venda')
      // .whereIn('formapag_id', [1, 2, 3, 4])
      .where(function () {
        const fDate = (d) => {
          if (!d.includes('/')) return d;
          const [day, month, year] = d.split('/');
          return `${year}-${month}-${day}`;
        } 
        if (startDate) {
          this.whereRaw("to_date(datapedido, 'DD/MM/YYYY') >= to_date(?, 'YYYY-MM-DD')", [fDate(startDate)]);
        }
        if (endDate) {
          this.whereRaw("to_date(datapedido, 'DD/MM/YYYY') <= to_date(?, 'YYYY-MM-DD')", [fDate(endDate)]);
        }
      });    
      // Mapeamos o faturamento total por consultor
      const faturamentoPorConsultor = {};
      pedidos.forEach(pedido => {
        const consultorId = pedido.consultor_id;
        const valor = parseFloat(pedido.valor);
        
        if (faturamentoPorConsultor[consultorId]) {
          faturamentoPorConsultor[consultorId] += valor;
        } else {
          faturamentoPorConsultor[consultorId] = valor;
        }
      });
      
      // Adicionamos o faturamento e calculamos a posição no ranking
      const consultoresComFaturamento = consultores.map(consultor => ({
        ...consultor,
        faturamentoAgregado: faturamentoPorConsultor[consultor.id] ? faturamentoPorConsultor[consultor.id].toFixed(2) : "0.00"
      }));
      
      // Ordenar consultores por faturamento (do maior para o menor)
      consultoresComFaturamento.sort((a, b) => 
        parseFloat(b.faturamentoAgregado) - parseFloat(a.faturamentoAgregado)
      );
      
      // Adicionar posição no ranking
      const consultoresComRanking = consultoresComFaturamento.map((consultor, index) => ({
        ...consultor,
        position: index + 1
      }));
      
      return res.status(200).json(consultoresComRanking);
    } else {
      // Obtendo um consultor específico
      const consultor = await knex('usuarios')
        .select('*')
        .where('id', id)
        .where('cargo_id', 4);
        
      if (consultor.length === 0)
        return res.status(404).json({ error: 'Usuário não encontrado!' });
      
      // Calcular o faturamento para este consultor específico
      const pedidos = await knex('pedidos')
        .select('*')
        .where('consultor_id', id)
        .where('statuspag', 'realizado')
        .where('modelo', 'venda')
        .whereIn('formapag_id', [1, 2, 3, 4]);
      
      let faturamentoTotal = 0;
      pedidos.forEach(pedido => {
        faturamentoTotal += parseFloat(pedido.valor);
      });
      
      // Determinar a posição deste consultor no ranking
      const todosConsultores = await knex('usuarios')
        .select('id')
        .where('cargo_id', 4);
      
      const faturamentoOutrosConsultores = [];
      
      // Para cada consultor, calculamos o faturamento total
      for (const c of todosConsultores) {
        if (c.id !== parseInt(id)) {
          const pedidosConsultor = await knex('pedidos')
            .select('*')
            .where('consultor_id', c.id)
            .where('statuspag', 'realizado')
            .where('modelo', 'venda')
            .whereIn('formapag_id', [1, 2, 3, 4]);
          
          let faturamentoConsultor = 0;
          pedidosConsultor.forEach(pedido => {
            faturamentoConsultor += parseFloat(pedido.valor);
          });
          
          faturamentoOutrosConsultores.push({
            id: c.id,
            faturamento: faturamentoConsultor
          });
        }
      }
      
      // Contar quantos consultores têm faturamento maior que este consultor
      const position = faturamentoOutrosConsultores.filter(c => 
        c.faturamento > faturamentoTotal
      ).length + 1;
      
      // Adicionar faturamento e posição
      const consultorComRanking = {
        ...consultor[0],
        faturamentoAgregado: faturamentoTotal.toFixed(2),
        position: position
      };
      
      return res.status(200).json(consultorComRanking);
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Erro no servidor!' });
  }
};

const bloqConsult = async (req, res) => {
  const { id } = req.params;
  const { opt } = req.body;
  if (!opt || (opt != 1 && opt != 2 && opt != 3))
    return res.status(400).json({ error: 'Opção não identificada!' });

  let optText =
    opt == 1 ? 'Ativo' : opt == 2 ? 'Em aprovação' : opt == 3 ? 'Inativo' : '';

  try {
    const user = await knex('usuarios')
      .where('id', id)
      .update({ status: optText })
      .returning('*');

    // if(opt === 1) {
    //   try {
    //     mailer.sendMail(
    //       {
    //         to: email,
    //         bcc: process.env.BIODERMIS_MAIL,
    //         from: process.env.FROM_MAIL,
    //         template: './userActive',
    //         subject: `✅ Cadastro Aprovado! Você já pode começar a revender Biodermis!`,
    //         context: {
    //           nome,
    //         },
    //       },
    //       (err) => {
    //         if (err)
    //           console.log(err)
    //       },
    //     )
    //   } catch (error) {
    //     console.log('Erro ao tentar enviar e-mail:', err);
    //   }
    // } else {
    //   try {
    //     mailer.sendMail(
    //       {
    //         to: email,
    //         bcc: process.env.BIODERMIS_MAIL,
    //         from: process.env.FROM_MAIL,
    //         template: './userBloq',
    //         subject: `Infelizmente, seu cadastro não pôde ser aprovado.`,
    //         context: {
    //           nome,
    //         },
    //       },
    //       (err) => {
    //         if (err)
    //           console.log(err)
    //       },
    //     )
    //   } catch (error) {
    //     console.log('Erro ao tentar enviar e-mail:', err);
    //   }
    // }

    return res.status(200).json({ success: 'Status alterado com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro no servidor!' });
  }
};

const addProductConsult = async (req, res) => {
  const produto_id = req.params.id;
  const valorprod = parseFloat(req.body.valorprod);

  try {
    const product = await knex('produtos')
      .where('id', produto_id)
      .where('inativo', false);
    if (product.length === 0)
      return res.status(404).json({ error: 'Produto não encontrado!' });

    const productConsult = await knex('consultor_produtos')
      .where('produto_id', produto_id)
      .where('consultor_id', req.userLogged.id);
    if (productConsult.length > 0)
      return res
        .status(404)
        .json({ error: 'Consultor com produto já cadastrado!' });

    if (valorprod < parseFloat(product[0].valormin))
      return res.status(404).json({
        error:
          'O valor do consultor não pode ser menor que o valor mínimo do produto!',
      });
    if (valorprod > parseFloat(product[0].valormax))
      return res.status(404).json({
        error:
          'O valor do consultor não pode ser maior que o valor máximo do produto!',
      });

    const valortotal = valorprod;
    let valorconsult = valorprod - parseFloat(product[0].valormin);
    if (valorconsult === 0) valorconsult = 1;

    const newData = {
      produto_id: produto_id,
      consultor_id: req.userLogged.id,
      valorconsult: valorconsult.toFixed(2),
      valortotal: valortotal.toFixed(2),
    };

    await knex('consultor_produtos').insert(newData).returning('*');
    return res
      .status(200)
      .json({ success: 'Produto do consultor cadastrado com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro no servidor!' });
  }
};

const listMyProducts = async (req, res) => {
  try {
    const products = await knex('consultor_produtos')
      .select(['*', 'consultor_produtos.id'])
      .where('consultor_id', req.userLogged.id)
      .innerJoin('produtos', 'produtos.id', 'consultor_produtos.produto_id');

    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({ error: 'Erro no servidores!' });
  }
};

const listMyProductsParams = async (req, res) => {
  const {consultor_id, produto_ids} = req.body

  if(!consultor_id  || produto_ids.length == 0)
    return res.status(400).json({ error: 'Preencha todos os campos!' });

  const consultor = await knex('usuarios').where('id', consultor_id).where('cargo_id', 4)
  if(consultor.length == 0)
    return res.status(400).json({ error: 'Consultor não existe!' });

  try {
    const products = await knex('consultor_produtos')
      .select(['*', 'consultor_produtos.id'])
      .where('consultor_produtos.consultor_id', consultor_id)
      .whereIn('consultor_produtos.produto_id', produto_ids)
      .innerJoin('produtos', 'produtos.id', 'consultor_produtos.produto_id');

    if(products.length != produto_ids.length)
      return res.status(400).json({
        error: 'Produto selecionado não existe, tente novamente!',
      });

    return res.status(200).json(products);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Erro no servidor!' });
  }
};

const editProductConsult = async (req, res) => {
  const { id } = req.params;
  try {
    if (!req.body.valorprod)
      return res.status(400).json({ error: 'Nenhuma alteração encontrada!' });

    let valorprod = parseFloat(req.body.valorprod);

    const productConsult = await knex('consultor_produtos')
      .where('produto_id', id)
      .where('consultor_id', req.userLogged.id);
    if (productConsult.length === 0)
      return res
        .status(404)
        .json({ error: 'Produto do consultor não encontrado!' });

    const product = await knex('produtos').where('id', id);
    if (product.length === 0)
      return res.status(404).json({ error: 'Produto não encontrado!' });

    if (valorprod < parseFloat(product[0].valormin))
      return res.status(404).json({
        error:
          'O valor do consultor não pode ser menor que o valor mínimo do produto!',
      });
    if (valorprod > parseFloat(product[0].valormax))
      return res.status(404).json({
        error:
          'O valor do consultor não pode ser maior que o valor máximo do produto!',
      });

    const valortotal = valorprod;
    let valorconsult = valorprod - parseFloat(product[0].valormin);
    if (valorconsult === 0) valorconsult = 1;

    await knex('consultor_produtos')
      .where('produto_id', id)
      .where('consultor_id', req.userLogged.id)
      .update({
        valorconsult: valorconsult.toFixed(2),
        valortotal: valortotal.toFixed(2),
      })
      .returning('*');

    return res.status(200).json({ success: 'Valor atualizado com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro no servidor!' });
  }
};

const deleteProductConsult = async (req, res) => {
  const { id } = req.params;

  try {
    const productDeleted = await knex('consultor_produtos')
      .del()
      .where('produto_id', id)
      .where('consultor_id', req.userLogged.id);
    if (productDeleted === 0)
      return res
        .status(404)
        .json({ error: 'Produto do consultor não encontrado!' });
    if (productDeleted.rowCount === 0)
      return res.status(400).json({
        error: 'Não foi possível excluir o Produto, tente novamente!',
      });

    return res.status(200).json({ success: 'Produto excluído com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro no servidor!' });
  }
};

module.exports = {
  listConsults,
  bloqConsult,
  addProductConsult,
  listMyProducts,
  editProductConsult,
  deleteProductConsult,
  listMyProductsParams
};
