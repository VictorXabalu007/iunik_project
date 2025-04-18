const express = require('express');
const router = express();
const { MercadoPagoConfig, Preference } = require('mercadopago');
const knex = require('../config/connect');
require('dotenv').config();

const fetch = require("cross-fetch");

const client = new MercadoPagoConfig({
  accessToken: process.env.ACCESS_TOKEN || '',
});

router.post('/mercadopago', async (req, res) => {
  try {
    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: [
          {
            id: 'item-ID-1234',
            title: 'Meu produto',
            currency_id: 'BRL',
            picture_url:
              'https://www.mercadopago.com/org-img/MP3/home/logomp3.gif',
            description: 'Descrição do Item',
            category_id: 'art',
            quantity: 1,
            unit_price: 75.76,
          },
        ],
        back_urls: {
          success: 'http://localhost:3000/mercadopagosuccess',
          failure: 'http://localhost:3000/mercadopagofailure',
        },
        auto_return: 'approved',
        statement_descriptor: 'Teste',
        external_reference: 'Reference_1234',
        expires: true,
        expiration_date_from: '2016-02-01T12:00:00.000-04:00',
        expiration_date_to: '2024-07-28T12:00:00.000-04:00',
      },
    });

    return res.json(response);
  } catch (error) {
    res.status(500).json(error.message);
  }
});


router.post('/webhook', async (req, res) => {
  try {
    const { data, type } = req.body;
    if (type === 'payment') {
      // Consulta o pagamento pelo ID recebido
      await consultarPagamento(data.id);
    } else {
      console.log(`Evento ignorado: ${type}`);
      return res.json({ error: `Evento ignorado: ${type}`});
    }

    return res.status(200).send() // Retorne 200 para confirmar o recebimento
  } catch (error) {
    console.error('Erro no webhook:', error);
    return res.status(500).send(`Erro ao processar o webhook: ${error}`);
  }
});

// Função para consultar o pagamento pelo ID
async function consultarPagamento(paymentId) {
  const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // Substitua pelo seu token de acesso
  const url = `https://api.mercadopago.com/v1/payments/${paymentId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
  });

  const data = await response.json()
  const datarealizado = new Date().toLocaleDateString('pt-BR')


  if (data.status === 'approved') {
    const [pedido] = await knex('pedidos').where('id', data.external_reference).update({ statuspag: 'realizado' }).returning('*')
    const movimentExist = await knex('movimentacoes').where('pedido_id', pedido.id).first()
    if(!movimentExist) {
      const moviment = {
        tipo: 'entrada',
        valor: pedido.valor,
        pedido_id: pedido.id,
        datarealizado
      };
      await knex('movimentacoes').insert(moviment);
  
      if(data.payment_method_id === 'pix' || data.payment_type_id === 'account_money') {
        await knex('pedidos').where('id', data.external_reference).update({ formapag_id: 1 })
      } else if(data.payment_type_id === 'credit_card') {
        await knex('pedidos').where('id', data.external_reference).update({ formapag_id: 2 })
      } else if(data.payment_type_id === 'debit_card') {
        await knex('pedidos').where('id', data.external_reference).update({ formapag_id: 3 })
      } else if(data.payment_type_id === 'ticket') {
        await knex('pedidos').where('id', data.external_reference).update({ formapag_id: 4 })
      }
    }
    
    // Atualizando o campo qtdParcelas com a quantidade de parcelas
    if (data.payment_type_id === 'credit_card' && data.installments) {
      await knex('pedidos')
        .where('id', data.external_reference)
        .update({ qtdParcelas: data.installments });
    }
    
  } else if (data.status === 'pending') {
    await knex('pedidos').where('id', data.external_reference).update({ statuspag: 'aguardando' })
  } else {
    await knex('pedidos').where('id', data.external_reference).update({ statuspag: 'recusado' })
  }
}

router.post('/calcularfrete', async (req, res) => {
  const { zipCodeAdress, productsData } = req.body;

  // Validação inicial
  if (!zipCodeAdress || !productsData) {
    return res.status(400).json({ error: "Campos 'zipCodeAdress' e 'productsData' são obrigatórios!" });
  }

  const url = process.env.EXPO_PUBLIC_BASE_URL_MELHOR_ENVIO
  const token = process.env.EXPO_PUBLIC_MELHOR_ENVIO_TOKEN
  // Mapeamento dos produtos
  const products = productsData.map((product) => ({
    id: product.id,
    width: parseFloat(product.largura),
    height: parseFloat(product.altura),
    length: parseFloat(product.profundidade),
    weight: parseFloat(product.peso) / 1000, // Convertendo gramas para kg
    insurance_value: parseFloat(product.valorvenda),
    quantity: 1,
  }));

  const body = {
    from: { postal_code: '96020360' }, // Substitua pelo CEP de origem
    to: { postal_code: zipCodeAdress },
    products,
  };

  try {
    // Chamada para a API de cálculo de frete
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    // Verifica se a resposta foi bem-sucedida
    if (!response.ok) {
      return res.status(response.status).json({
        error: `Erro ao comunicar com a API de frete: ${response.statusText}`,
      });
    }

    const data = await response.json();

    // Retorna o cálculo do frete
    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: `Erro interno ao calcular o frete: ${error.message}`,
    });
  }
})

router.get('/mercadopagosuccess', async (req, res) => {
  res.json({ success: 'deu certo' });
});

router.get('/mercadopagofailure', async (req, res) => {
  res.json({ error: 'deu errado' });
});

module.exports = router;
