const knex = require("../config/connect");
const {
  dataAtualFormatada,
  compararDatas,
  convertToISO8601,
  adicionarMes,
} = require("../functions/functions");
const { MercadoPagoConfig, Preference } = require("mercadopago");
require("dotenv").config();
const mailer = require("../modules/mailer");

const client = new MercadoPagoConfig({
  accessToken: process.env.ACCESS_TOKEN || "",
});

const listRequests = async (req, res) => {
  const { id } = req.params;
  try {
    if (id < 1) {
      const pedidos = await knex("pedidos").select("*");
      const enrichedPedidos = await Promise.all(
        pedidos.map(async (pedido) => {
          if (pedido.cliente_id != 1 || pedido.modelo == "abastecimento") {
            let produtosIdsArray;

            // Garantir que produtos_ids é um array válido
            if (typeof pedido.produtos_ids === "string") {
              try {
                produtosIdsArray = JSON.parse(pedido.produtos_ids);
              } catch (error) {
                console.error("Erro ao parsear produtos_ids:", error);
                produtosIdsArray = [];
              }
            } else if (Array.isArray(pedido.produtos_ids)) {
              produtosIdsArray = pedido.produtos_ids;
            } else {
              produtosIdsArray = [];
            }

            // Obter detalhes dos produtos
            const produtos = await Promise.all(
              produtosIdsArray.map((prodId) =>
                knex("produtos")
                  .select("id as produto_id", "*")
                  .where({ id: prodId.id })
                  .first()
              )
            );

            return { ...pedido, produtos };
          } else if (pedido.consultor_id != 1) {
            let produtosIdsArray;

            // Garantir que produtos_ids é um array válido
            if (typeof pedido.produtos_ids === "string") {
              try {
                produtosIdsArray = JSON.parse(pedido.produtos_ids);
              } catch (error) {
                console.error("Erro ao parsear produtos_ids:", error);
                produtosIdsArray = [];
              }
            } else if (Array.isArray(pedido.produtos_ids)) {
              produtosIdsArray = pedido.produtos_ids;
            } else {
              produtosIdsArray = [];
            }

            // Obter detalhes dos produtos
            const produtos = await Promise.all(
              produtosIdsArray.map(async (prodId) => {
                const consultorProduto = await knex("consultor_produtos")
                  .select(["*", "consultor_produtos.id"])
                  .where("consultor_id", pedido.consultor_id)
                  .where("consultor_produtos.produto_id", prodId.id)
                  .innerJoin(
                    "produtos",
                    "produtos.id",
                    "consultor_produtos.produto_id"
                  )
                  .first();

                if (consultorProduto) {
                  return consultorProduto;
                }

                // Caso não exista na tabela consultor_produtos, buscar diretamente na tabela produtos
                const produto = await knex("produtos")
                  .select("id as produto_id", "*")
                  .where({ id: prodId.id })
                  .first();

                return produto;
              })
            );

            return { ...pedido, produtos };
          }
        })
      );

      return res.status(200).json(enrichedPedidos);
    } else {
      const pedidos = await knex("pedidos").select("*").where("id", id);
      if (pedidos.length === 0)
        return res.status(404).json({ error: "Pedido não encontrado!" });

      const enrichedPedidos = await Promise.all(
        pedidos.map(async (pedido) => {
          if (pedido.cliente_id != 1) {
            let produtosIdsArray;

            // Garantir que produtos_ids é um array válido
            if (typeof pedido.produtos_ids === "string") {
              try {
                produtosIdsArray = JSON.parse(pedido.produtos_ids);
              } catch (error) {
                console.error("Erro ao parsear produtos_ids:", error);
                produtosIdsArray = [];
              }
            } else if (Array.isArray(pedido.produtos_ids)) {
              produtosIdsArray = pedido.produtos_ids;
            } else {
              produtosIdsArray = [];
            }

            // Obter detalhes dos produtos
            const produtos = await Promise.all(
              produtosIdsArray.map((prodId) =>
                knex("produtos")
                  .select("id as produto_id", "*")
                  .where({ id: prodId.id })
                  .first()
              )
            );

            return { ...pedido, produtos };
          } else if (pedido.consultor_id != 1) {
            let produtosIdsArray;

            // Garantir que produtos_ids é um array válido
            if (typeof pedido.produtos_ids === "string") {
              try {
                produtosIdsArray = JSON.parse(pedido.produtos_ids);
              } catch (error) {
                console.error("Erro ao parsear produtos_ids:", error);
                produtosIdsArray = [];
              }
            } else if (Array.isArray(pedido.produtos_ids)) {
              produtosIdsArray = pedido.produtos_ids;
            } else {
              produtosIdsArray = [];
            }

            const produtos = await Promise.all(
              produtosIdsArray.map(async (prodId) => {
                const consultorProduto = await knex("consultor_produtos")
                  .select(["*", "consultor_produtos.id"])
                  .where("consultor_id", pedido.consultor_id)
                  .where("consultor_produtos.produto_id", prodId.id)
                  .innerJoin(
                    "produtos",
                    "produtos.id",
                    "consultor_produtos.produto_id"
                  )
                  .first();

                if (consultorProduto) {
                  return consultorProduto;
                }

                // Caso não exista na tabela consultor_produtos, buscar diretamente na tabela produtos
                const produto = await knex("produtos")
                  .select("id as produto_id", "*")
                  .where({ id: prodId.id })
                  .first();

                return produto;
              })
            );

            return { ...pedido, produtos };
          }
        })
      );
      return res.status(200).json(enrichedPedidos[0]);
    }
  } catch (error) {
    return res.status(500).json({ error: "Erro no servidor!" });
  }
};

const listRequestsUsers = async (req, res) => {
  const { id } = req.params;
  try {
    const pedidos = await knex("pedidos")
      .select("*")
      .where("consultor_id", id)
      .orWhere("cliente_id", id);
    const enrichedPedidos = await Promise.all(
      pedidos.map(async (pedido) => {
        if (pedido.cliente_id != 1 || pedido.modelo == "abastecimento") {
          let produtosIdsArray;

          // Garantir que produtos_ids é um array válido
          if (typeof pedido.produtos_ids === "string") {
            try {
              produtosIdsArray = JSON.parse(pedido.produtos_ids);
            } catch (error) {
              console.error("Erro ao parsear produtos_ids:", error);
              produtosIdsArray = [];
            }
          } else if (Array.isArray(pedido.produtos_ids)) {
            produtosIdsArray = pedido.produtos_ids;
          } else {
            produtosIdsArray = [];
          }

          // Obter detalhes dos produtos
          const produtos = await Promise.all(
            produtosIdsArray.map((prodId) =>
              knex("produtos").where({ id: prodId.id }).first()
            )
          );

          return { ...pedido, produtos };
        } else if (pedido.consultor_id != 1) {
          let produtosIdsArray;

          // Garantir que produtos_ids é um array válido
          if (typeof pedido.produtos_ids === "string") {
            try {
              produtosIdsArray = JSON.parse(pedido.produtos_ids);
            } catch (error) {
              console.error("Erro ao parsear produtos_ids:", error);
              produtosIdsArray = [];
            }
          } else if (Array.isArray(pedido.produtos_ids)) {
            produtosIdsArray = pedido.produtos_ids;
          } else {
            produtosIdsArray = [];
          }

          // Obter detalhes dos produtos
          const produtos = await Promise.all(
            produtosIdsArray.map(async (prodId) => {
              const consultorProduto = await knex("consultor_produtos")
                .select(["*", "consultor_produtos.id"])
                .where("consultor_id", pedido.consultor_id)
                .where("consultor_produtos.produto_id", prodId.id)
                .innerJoin(
                  "produtos",
                  "produtos.id",
                  "consultor_produtos.produto_id"
                )
                .first();

              if (consultorProduto) {
                return consultorProduto;
              }

              // Caso não exista na tabela consultor_produtos, buscar diretamente na tabela produtos
              const produto = await knex("produtos")
                .select("id as produto_id", "*")
                .where({ id: prodId.id })
                .first();

              return produto;
            })
          );

          return { ...pedido, produtos };
        }
      })
    );

    return res.status(200).json(enrichedPedidos);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Erro no servidor!" });
  }
};

const addRequest = async (req, res) => {
  const {
    formapag_id,
    produtos_ids,
    rua,
    numero,
    bairro,
    cep,
    cidade,
    estado,
    complemento,
    formaenvio,
    nomecliente,
    emailcliente,
    cpfcliente,
    telefone,
  } = req.body;
  const valorfrete = parseFloat(req.body.valorfrete) || 0;
  const admins = await knex("usuarios").where("cargo_id", 1);

  let user_id = req.userLogged.id;
  let consultor_id = 1;
  let cliente_id = 1;
  let valorconsult = 0;
  let valor = 0;
  let email_copy = "";
  let cliente_logado_nome = "";
  const items = [];

  if (
    !produtos_ids ||
    !rua ||
    !numero ||
    !bairro ||
    !cep ||
    !cidade ||
    !estado ||
    !complemento ||
    !formaenvio
  )
    return res.status(400).json({ error: "Preencha todos os campos!" });
  try {
    const ids = produtos_ids.map((produto) => produto.id);
    const existConsult = await knex("usuarios")
      .where("id", user_id)
      .where("cargo_id", 4);
    if (existConsult.length === 0) {
      const existCliente = await knex("usuarios")
        .where("id", user_id)
        .where("cargo_id", 5);
      if (existCliente.length === 0)
        return res
          .status(400)
          .json({ error: "O cliente não existe, tente novamente!" });

      email_copy = existCliente[0].email;
      cliente_id = user_id;
      cliente_logado_nome = existCliente[0].nome;
      const products = await knex("produtos")
        .select("*")
        .whereIn("id", ids)
        .where("inativo", false);

      if (products.length !== ids.length)
        return res
          .status(400)
          .json({ error: "Produto selecionado não existe, tente novamente!" });

      products.forEach(async (product) => {
        const i = produtos_ids.findIndex(
          (produto) =>
            produto.id ===
            (product.produto_id ? product.produto_id : product.id)
        );
        valor +=
          parseFloat(product.valorvenda) * parseInt(produtos_ids[i].quantidade);
        items.push({
          id: product.id,
          title: product.nome,
          currency_id: "BRL",
          picture_url: product.imagens ? product.imagens[0] : "",
          description: product.descricao,
          category_id: product.categoria_id,
          quantity: produtos_ids[i].quantidade,
          unit_price: parseFloat(product.valorvenda),
        });
      });
    } else {
      email_copy = existConsult[0].email;
      consultor_id = user_id;

      const products = await knex("consultor_produtos")
        .select(["*", "consultor_produtos.id"])
        .whereIn("consultor_produtos.produto_id", ids)
        .where("produtos.inativo", false)
        .where("consultor_produtos.consultor_id", consultor_id)
        .innerJoin("produtos", "produtos.id", "consultor_produtos.produto_id");
      if (products.length !== ids.length) {
        products.forEach((product) => {
          if (ids.includes(product.produto_id)) {
            const index = ids.indexOf(product.produto_id);
            ids.splice(index, 1);
          }
        });
        const productsGeneral = await knex("produtos")
          .select("*")
          .whereIn("id", ids)
          .where("inativo", false);

        if (productsGeneral.length !== ids.length)
          return res.status(400).json({
            error: "Produto selecionado não existe, tente novamente!",
          });

        productsGeneral.forEach((productGeneral) => {
          products.push(productGeneral);
        });
      }
      products.forEach(async (product) => {
        const index = produtos_ids.findIndex(
          (produto) =>
            produto.id ===
            (product.produto_id ? product.produto_id : product.id)
        );
        if (product.valorconsult) {
          valorconsult +=
            parseFloat(product.valorconsult) * produtos_ids[index].quantidade;
          valor +=
            parseFloat(product.valortotal) * produtos_ids[index].quantidade;
          items.push({
            id: product.id,
            title: product.nome,
            currency_id: "BRL",
            picture_url: product.imagens ? product.imagens[0] : "",
            description: product.descricao,
            category_id: product.categoria_id,
            quantity: produtos_ids[index].quantidade,
            unit_price: parseFloat(product.valortotal),
          });
        } else {
          valorconsult += 1.0 * produtos_ids[index].quantidade;
          valor +=
            parseFloat(product.valormin) * produtos_ids[index].quantidade;
          items.push({
            id: product.id,
            title: product.nome,
            currency_id: "BRL",
            picture_url: product.imagens ? product.imagens[0] : "",
            description: product.descricao,
            category_id: product.categoria_id,
            quantity: produtos_ids[index].quantidade,
            unit_price: parseFloat(product.valormin),
          });
        }
      });
    }

    const datapedido = dataAtualFormatada();

    items.push({
      id: 0,
      title: "Frete",
      currency_id: "BRL",
      quantity: 1,
      unit_price: parseFloat(valorfrete),
    });

    const ultimoPedido = await knex("pedidos").orderBy("id", "desc").first();

    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items,
        back_urls: {
          success: "https://site.biodermis.com.br/mercadopagosuccess",
          failure: "https://site.biodermis.com.br/mercadopagofailure",
        },
        auto_return: "approved",
        external_reference: ultimoPedido.id + 1,
      },
    });

    const consultor = await knex("usuarios").where("id", consultor_id).first();

    const newRequest = {
      datapedido,
      formapag_id,
      valor: valor.toFixed(2),
      valorconsult: valorconsult.toFixed(2),
      valorfrete: valorfrete.toFixed(2),
      consultor_id,
      cliente_id,
      produtos_ids: JSON.stringify(produtos_ids),
      modelo: "venda",
      rua,
      numero,
      bairro,
      cep,
      cidade,
      estado,
      complemento,
      telefone,
      mercadopago_id: response.id,
      linkpagamento: response.init_point,
      formaenvio,
      nomecliente: nomecliente ?? "",
      emailcliente: emailcliente ?? "",
      cpfcliente: cpfcliente ?? "",
      nomeconsultor: consultor.nome ?? "",
    };

    const request = await knex("pedidos").insert(newRequest).returning("*");
    const totalQuantidade = produtos_ids.reduce((soma, produto) => {
      return soma + produto.quantidade;
    }, 0);

    let emailError = false;

    if (consultor_id != 1) {
      admins.forEach((admin) => {
        mailer.sendMail(
          {
            to: email_copy,
            bcc: process.env.BIODERMIS_MAIL,
            from: process.env.FROM_MAIL,
            template: "./newRequestConsult",
            subject: `🚀 Novo Pedido Realizado! `,
            context: {
              nome: existConsult[0].nome,
              qtd: items.length - 1,
              produtos: items,
              valorcomiss: newRequest.valorconsult,
              nomecliente,
              rua,
              numero,
              bairro,
              cidade,
              estado,
              complemento,
            },
          },
          (err) => {
            if (err) emailError = true;
          }
        );
      });
    } else {
      admins.forEach((admin) => {
        mailer.sendMail(
          {
            to: admin.email,
            bcc: process.env.BIODERMIS_MAIL,
            from: process.env.FROM_MAIL,
            template: "./newRequestConsult",
            subject: `🚀 Novo Pedido Realizado! `,
            context: {
              nome: cliente_logado_nome,
              qtd: items.length - 1,
              produtos: items,
              valorcomiss: newRequest.valortotal,
              nomecliente: admin.nome,
              rua,
              numero,
              bairro,
              cidade,
              estado,
              complemento,
            },
          },
          (err) => {
            if (err) emailError = true;
          }
        );
      });
    }

    if (emailError) {
      return res.status(400).json({
        error: "Não foi possível enviar o email, tente novamente!",
      });
    }

    return res.status(200).json({
      success: "Pedido cadastrado com sucesso!",
      link: response.init_point,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Erro no servidor!" });
  }
};

const addRequestWithProducts = async (req, res) => {
  const {
    produtos_ids,
    linkweb,
    consultor_id,
    nomecliente,
    emailcliente,
    cpfcliente,
  } = req.body;
  const valorfrete = parseFloat(req.body.valorfrete) || 0;
  const admins = await knex("usuarios").where("cargo_id", 1);
  const items = [];
  let valor = 0;
  let valorconsult = 0;
  let cliente_id = 1;

  if (!produtos_ids || !linkweb || !consultor_id)
    return res.status(400).json({ error: "Preencha todos os campos!" });
  try {
    const consultor = await knex("usuarios")
      .select("*")
      .where("id", consultor_id)
      .where("cargo_id", 4)
      .first();
    if (!consultor)
      return res.status(400).json({ error: "Consultor não existe!" });

    const ids = produtos_ids.map((produto) => produto.id);
    const products = await knex("produtos")
      .select("*")
      .whereIn("id", ids)
      .where("inativo", false);

    if (products.length !== ids.length)
      return res
        .status(400)
        .json({ error: "Produto selecionado não existe, tente novamente!" });

    products.forEach(async (product) => {
      const productConsult = await knex("consultor_produtos")
        .select("*")
        .where("consultor_id", consultor_id)
        .where("produto_id", product.id);

      if (productConsult.length == 0) {
        const i = produtos_ids.findIndex(
          (produto) => produto.id === product.id
        );
        valor +=
          parseFloat(product.valorvenda) * parseInt(produtos_ids[i].quantidade);
      } else {
        const i = produtos_ids.findIndex(
          (produto) => produto.id === productConsult[0].produto_id
        );
        valorconsult +=
          parseFloat(productConsult[0].valorconsult) *
          produtos_ids[i].quantidade;
        valor +=
          parseFloat(productConsult[0].valortotal) *
          parseInt(produtos_ids[i].quantidade);
      }
    });

    let nomeconsultor = consultor.nome;
    const datapedido = dataAtualFormatada();
    const newRequest = {
      datapedido,
      valor: 0,
      valorconsult: 0,
      valorfrete: 0,
      consultor_id,
      cliente_id,
      produtos_ids: JSON.stringify(produtos_ids),
      modelo: "venda",
      rua: "",
      numero: "",
      bairro: "",
      cep: "",
      cidade: "",
      estado: "",
      complemento: "",
      telefone: "",
      mercadopago_id: "",
      linkpagamento: "",
      formaenvio: "",
      nomecliente: nomecliente ?? "",
      emailcliente: emailcliente ?? "",
      cpfcliente: cpfcliente ?? "",
      nomeconsultor,
      linkweb,
    };

    const request = await knex("pedidos").insert(newRequest).returning("*");

    if (request[0].id) {
      // 3. Atualizar o linkweb com o pedidoId
      const novoLinkweb = `${request[0].linkweb}&pedidoId=${request[0].id}`;
    
      await knex("pedidos")
        .where({ id: request[0].id })
        .update({ linkweb: novoLinkweb });

      
      request[0].linkweb = novoLinkweb;
    
      console.log("Pedido criado e link atualizado:", novoLinkweb);
    } else {
      console.error("Erro ao criar pedido.");
    }
    const totalQuantidade = produtos_ids.reduce((soma, produto) => {
      return soma + produto.quantidade;
    }, 0);

    let emailError = false;

    if (consultor_id != 1) {
      admins.forEach((admin) => {
        mailer.sendMail(
          {
            to: consultor.email,
            bcc: process.env.BIODERMIS_MAIL,
            from: process.env.FROM_MAIL,
            template: "./newRequestConsult",
            subject: `🚀 Novo Pedido Realizado! `,
            context: {
              nome: nomeconsultor,
              qtd: items.length - 1,
              produtos: items,
              valorcomiss: 0,
              nomecliente: nomecliente || "",
              rua: "",
              numero: "",
              bairro: "",
              cep: "",
              cidade: "",
              estado: "",
              complemento: "",
            },
          },
          (err) => {
            if (err) emailError = true;
          }
        );
      });
      if (emailError) {
        return res.status(400).json({
          error: "Não foi possível enviar o email, tente novamente!",
        });
      }
    }

    if (emailError) {
      return res.status(400).json({
        error: "Não foi possível enviar o email, tente novamente!",
      });
    }

    return res.status(200).json({
      success: "Pedido cadastrado com sucesso!",
      id: request[0].id,
      linkweb: request[0].linkweb,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Erro no servidor!" });
  }
};

const editRequest = async (req, res) => {
  const { id } = req.params;
  try {
    const request = await knex("pedidos").where("id", id);

    if (request.length === 0)
      return res.status(404).json({ error: "Pedido não encontrado!" });
    const {
      statuspag,
      statusentrega,
      formapag_id,
      rua,
      numero,
      bairro,
      cep,
      cidade,
      estado,
      complemento,
      dataenvio,
      formaenvio,
      codigorastreio,
      telefone,
    } = req.body;
    if (
      !statusentrega &&
      !statuspag &&
      !formapag_id &&
      !rua &&
      !numero &&
      !bairro &&
      !cep &&
      !cidade &&
      !complemento &&
      !estado &&
      !codigorastreio &&
      !dataenvio &&
      !formaenvio &&
      !telefone &&
      !valorfrete
    )
      return res.status(400).json({ error: "Nenhuma alteração encontrada!" });

    if (statuspag == "realizado" && !formapag_id)
      return res
        .status(400)
        .json({ error: "Forma de pagamento não identificada!" });

    if (formapag_id) {
      const formapag = await knex("formaspagamento").where("id", formapag_id);
      if (formapag.length === 0)
        return res
          .status(404)
          .json({ error: "Forma de pagamento não identificada!" });
    }

    if (statuspag == "realizado") {
      const datarealizado = new Date().toISOString().split('T')[0];
      const moviments = await knex("movimentacoes")
        .select("*")
        .where("pedido_id", id);
      if (moviments.length === 0) {
        const moviment = {
          tipo: "entrada",
          valor: request[0].valor,
          pedido_id: id,
          datarealizado,
        };
        await knex("movimentacoes").insert(moviment);
      }
    }

    if (
      request[0].statusentrega !== "pendente" &&
      (rua || numero || bairro || cep || cidade || complemento || estado)
    ) {
      return res.status(400).json({
        error: "Não é possível modificar o endereço, entrega em andamento!",
      });
    }

    let client = await knex("usuarios").where("id", request[0].consultor_id);
    if (client.length === 0)
      client = await knex("usuarios").where("id", request[0].cliente_id);

    if (codigorastreio && dataenvio && formaenvio) {
      let emailError = false;
      mailer.sendMail(
        {
          to: client[0].email,
          bcc: process.env.BIODERMIS_MAIL,
          from: process.env.FROM_MAIL,
          template: "./confirmShipping",
          subject: `📦 Pedido Enviado! Rumo à Entrega para o Cliente`,
          context: {
            nome: client[0].nome,
            codigorastreio,
          },
        },
        (err) => {
          if (err) emailError = true;
        }
      );

      if (emailError) {
        return res.status(400).json({
          error: "Não foi possível enviar o email, tente novamente!",
        });
      }
    } else if (
      codigorastreio &&
      dataenvio &&
      formaenvio &&
      statuspag !== "realizado"
    ) {
      return res.json({
        error:
          "Não foi possível alterar as informações de entrega, pagamento pendente!",
      });
    }

    const data = {
      statusentrega: statusentrega ?? request[0].statusentrega,
      statuspag: statuspag ?? request[0].statuspag,
      formapag_id: formapag_id ?? request[0].formapag_id,
      rua: rua ?? request[0].rua,
      numero: numero ?? request[0].numero,
      bairro: bairro ?? request[0].bairro,
      cep: cep ?? request[0].cep,
      cidade: cidade ?? request[0].cidade,
      estado: estado ?? request[0].estado,
      complemento: complemento ?? request[0].complemento,
      dataenvio: dataenvio ?? request[0].dataenvio,
      codigorastreio: codigorastreio ?? request[0].codigorastreio,
      formaenvio: formaenvio ?? request[0].formaenvio,
      telefone: telefone ?? request[0].telefone,
    };

    await knex("pedidos").where("id", id).update(data).returning("*");

    const requests = await knex("pedidos")
      .where("consultpago", false)
      .where("consultor_id", req.userLogged.id)
      .where("saldodisp", true);

    const requestRest = await knex("pedidos")
      .where("resto", ">", 0)
      .where("consultor_id", req.userLogged.id);

    if (request[0].modelo == "abastecimento") {
      if (requestRest.length > 0) {
        await knex("pedidos")
          .update({ resto: 0.0, consultpago: true })
          .where("id", requestRest[0].id);
      } else {
        for (let request of requests) {
          await knex("pedidos")
            .update({ consultpago: true })
            .where("id", request.id);
        }
      }
      await knex("usuarios")
        .update({ valordispsaque: 0.0 })
        .where("id", request[0].consultor_id);
    }

    return res.status(200).json({ success: "Pedido atualizado com sucesso!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Erro no servidor!" });
  }
};

const editRequestWithProducts = async (req, res) => {
  const { id } = req.params;
  try {
    const request = await knex("pedidos").where("id", id);

    if (request.length === 0)
      return res.status(404).json({ error: "Pedido não encontrado!" });

    const {
      rua,
      numero,
      bairro,
      cep,
      cidade,
      estado,
      complemento,
      telefone,
      formaenvio,
      valorfrete,
      nomecliente,
      emailcliente,
      cpfcliente,
    } = req.body;
    if (
      !rua &&
      !numero &&
      !bairro &&
      !cep &&
      !cidade &&
      !complemento &&
      !formaenvio &&
      !telefone &&
      !valorfrete &&
      !nomecliente &&
      !emailcliente &&
      !cpfcliente
    )
      return res.status(400).json({ error: "Nenhuma alteração encontrada!" });

    let user_id = request[0].consultor_id;
    let valorconsult = 0;
    let valor = 0;
    const items = [];

    const ids = request[0].produtos_ids.map((produto) => produto.id);
    const existConsult = await knex("usuarios")
      .where("id", user_id)
      .where("cargo_id", 4);
    if (existConsult.length === 0) {
      const existCliente = await knex("usuarios")
        .where("id", user_id)
        .where("cargo_id", 5);
      if (existCliente.length === 0)
        return res
          .status(400)
          .json({ error: "O cliente não existe, tente novamente!" });
      const products = await knex("produtos")
        .select("*")
        .whereIn("id", ids)
        .where("inativo", false);

      if (products.length !== ids.length)
        return res
          .status(400)
          .json({ error: "Produto selecionado não existe, tente novamente!" });

      products.forEach(async (product) => {
        const i = request[0].produtos_ids.findIndex(
          (produto) =>
            produto.id ===
            (product.produto_id ? product.produto_id : product.id)
        );
        valor +=
          parseFloat(product.valorvenda) *
          parseInt(request[0].produtos_ids[i].quantidade);
        items.push({
          id: product.id,
          title: product.nome,
          currency_id: "BRL",
          picture_url: product.imagens ? product.imagens[0] : "",
          description: product.descricao,
          category_id: product.categoria_id,
          quantity: request[0].produtos_ids[i].quantidade,
          unit_price: parseFloat(product.valorvenda),
        });
      });
    } else {
      const products = await knex("consultor_produtos")
        .select(["*", "consultor_produtos.id"])
        .whereIn("consultor_produtos.produto_id", ids)
        .where("produtos.inativo", false)
        .where("consultor_produtos.consultor_id", request[0].consultor_id)
        .innerJoin("produtos", "produtos.id", "consultor_produtos.produto_id");
      if (products.length !== ids.length) {
        products.forEach((product) => {
          if (ids.includes(product.produto_id)) {
            const index = ids.indexOf(product.produto_id);
            ids.splice(index, 1);
          }
        });
        const productsGeneral = await knex("produtos")
          .select("*")
          .whereIn("id", ids)
          .where("inativo", false);

        if (productsGeneral.length !== ids.length)
          return res.status(400).json({
            error: "Produto selecionado não existe, tente novamente!",
          });

        productsGeneral.forEach((productGeneral) => {
          products.push(productGeneral);
        });
      }
      products.forEach(async (product) => {
        const index = request[0].produtos_ids.findIndex(
          (produto) =>
            produto.id ===
            (product.produto_id ? product.produto_id : product.id)
        );
        if (product.valorconsult) {
          valorconsult +=
            parseFloat(product.valorconsult) *
            request[0].produtos_ids[index].quantidade;
          valor +=
            parseFloat(product.valortotal) *
            request[0].produtos_ids[index].quantidade;
          items.push({
            id: product.id,
            title: product.nome,
            currency_id: "BRL",
            picture_url: product.imagens ? product.imagens[0] : "",
            description: product.descricao,
            category_id: product.categoria_id,
            quantity: request[0].produtos_ids[index].quantidade,
            unit_price: parseFloat(product.valortotal),
          });
        } else {
          valorconsult += 1.0 * request[0].produtos_ids[index].quantidade;
          valor +=
            parseFloat(product.valormin) *
            request[0].produtos_ids[index].quantidade;
          items.push({
            id: product.id,
            title: product.nome,
            currency_id: "BRL",
            picture_url: product.imagens ? product.imagens[0] : "",
            description: product.descricao,
            category_id: product.categoria_id,
            quantity: request[0].produtos_ids[index].quantidade,
            unit_price: parseFloat(product.valormin),
          });
        }
      });
    }

    const datapedido = dataAtualFormatada();

    items.push({
      id: 0,
      title: "Frete",
      currency_id: "BRL",
      quantity: 1,
      unit_price: parseFloat(valorfrete),
    });

    // const ultimoPedido = await knex("pedidos").orderBy("id", "desc").first();

    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items,
        back_urls: {
          success: "https://site.biodermis.com.br/mercadopagosuccess",
          failure: "https://site.biodermis.com.br/mercadopagofailure",
        },
        auto_return: "approved",
        external_reference: id,
      },
    });

    const data = {
      rua: rua ?? request[0].rua,
      numero: numero ?? request[0].numero,
      bairro: bairro ?? request[0].bairro,
      cep: cep ?? request[0].cep,
      cidade: cidade ?? request[0].cidade,
      estado: estado ?? request[0].estado,
      complemento: complemento ?? request[0].complemento,
      formaenvio: formaenvio ?? request[0].formaenvio,
      telefone: telefone ?? request[0].telefone,
      nomecliente: nomecliente ?? request[0].nomecliente,
      emailcliente: emailcliente ?? request[0].emailcliente,
      cpfcliente: cpfcliente ?? request[0].cpfcliente,
      mercadopago_id: response.id,
      linkpagamento: response.init_point,
      valorfrete: valorfrete.toFixed(2),
      valor: valor.toFixed(2),
      valorconsult: valorconsult.toFixed(2),
    };

    await knex("pedidos").where("id", id).update(data).returning("*");

    const requests = await knex("pedidos")
      .where("consultpago", false)
      .where("consultor_id", request[0].consultor_id)
      .where("saldodisp", true);

    const requestRest = await knex("pedidos")
      .where("resto", ">", 0)
      .where("consultor_id", request[0].consultor_id);

    if (request[0].modelo == "abastecimento") {
      if (requestRest.length > 0) {
        await knex("pedidos")
          .update({ resto: 0.0, consultpago: true })
          .where("id", requestRest[0].id);
      } else {
        for (let request of requests) {
          await knex("pedidos")
            .update({ consultpago: true })
            .where("id", request.id);
        }
      }
      await knex("usuarios")
        .update({ valordispsaque: 0.0 })
        .where("id", request[0].consultor_id);
    }

    return res.status(200).json({
      success: "Pedido atualizado com sucesso!",
      linkpagamento: data.linkpagamento,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: `Erro no servidor! ${error}` });
  }
};

const removeRequest = async (req, res) => {
  const { id } = req.params;

  try {
    const requestDeleted = await knex("pedidos")
      .del()
      .where("id", id)
      .where({ saldodisp: false })
      .where({ consultpago: false });
    if (requestDeleted === 0)
      return res.status(404).json({
        error: "Pedido não encontrado ou pagamento já foi realizado!",
      });
    if (requestDeleted.rowCount === 0)
      return res
        .status(400)
        .json({ error: "Não foi possível excluir o Pedido, tente novamente!" });

    return res.status(200).json({ success: "Pedido excluído com sucesso!" });
  } catch (error) {
    return res.status(500).json({ error: "Erro no servidor!" });
  }
};

const balanceAvailable = async (req, res) => {
  try {
    const requests = await knex("pedidos")
      .where("consultpago", false)
      .where("saldodisp", false);
    let consultor_id = 0;
    requests.forEach(async (request) => {
      const today = dataAtualFormatada();
      consultor_id = request.consultor_id;
      if (
        request.formapag_id === 1 &&
        compararDatas(today, request.datapedido, 2) &&
        request.statuspag == "realizado"
      ) {
        await knex("pedidos")
          .update({ saldodisp: true })
          .where("id", request.id);
      } else if (
        (request.formapag_id === 3 || request.formapag_id === 4) &&
        compararDatas(today, request.datapedido, 7) &&
        request.statuspag == "realizado"
      ) {
        await knex("pedidos")
          .update({ saldodisp: true })
          .where("id", request.id);
      } else if (
        request.formapag_id === 2 &&
        compararDatas(today, request.datapedido, 30) &&
        request.statuspag == "realizado"
      ) {
        await knex("pedidos")
          .update({ saldodisp: true })
          .where("id", request.id);
      }
    });

    const requestsSaldo = await knex("pedidos")
      .where("consultpago", false)
      .where("consultor_id", req.userLogged.id)
      .where("saldodisp", true);

    let saldodisp = 0;

    requestsSaldo.forEach(async (request) => {
      saldodisp += parseFloat(request.valorconsult);
    });

    const requestRest = await knex("pedidos")
      .where("resto", ">", 0)
      .where("consultor_id", req.userLogged.id);
    if (requestRest.length > 0) {
      saldodisp += parseFloat(requestRest[0].resto);
    }

    await knex("usuarios")
      .update({
        valordispsaque: saldodisp.toFixed(2),
      })
      .where("id", req.userLogged.id);

    const requestTot = await knex("pedidos")
      .where("statuspag", "realizado")
      .where("modelo", "venda")
      .whereIn("formapag_id", [1, 2, 3, 4])
      .where("consultor_id", req.userLogged.id);
    let totalfat = 0;
    requestTot.forEach((request) => {
      totalfat += parseFloat(request.valor);
    });
    await knex("usuarios")
      .update({ totalfat: totalfat.toFixed(2) })
      .where("id", req.userLogged.id);

    const requestBlocked = await knex("pedidos")
      .where("consultpago", false)
      .where("saldodisp", false)
      .where("statuspag", "realizado")
      .whereIn("formapag_id", [1, 2, 3, 4])
      .where("consultor_id", req.userLogged.id);

    let valortrancado = 0;
    requestBlocked.forEach((request) => {
      valortrancado += parseFloat(request.valorconsult);
    });
    await knex("usuarios")
      .update({ valortrancado: valortrancado.toFixed(2) })
      .where("id", req.userLogged.id);

    res.status(200).json({ success: "Dados Atualizados!", requestTot });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Erro no servidor!" });
  }
};

const getBalance = async (req, res) => {
  const { id } = req.userLogged;
  try {
    const requestsSaldo = await knex("pedidos")
      .where("consultpago", false)
      .where("consultor_id", id)
      .where("saldodisp", true);

    let saldodisp = 0;

    requestsSaldo.forEach(async (request) => {
      saldodisp += parseFloat(request.valorconsult);
    });

    const requestRest = await knex("pedidos").where("resto", ">", 0);
    if (requestRest.length > 0) {
      saldodisp += parseFloat(requestRest[0].resto);
    }

    return res.status(200).json({ saldodisp });
  } catch (error) {
    return res.status(500).json({ error: "Erro no servidor!" });
  }
};

const listPreferenceRequest = async (req, res) => {
  const { preferenceId } = req.params;
  try {
    const request = await knex("pedidos")
      .select("*")
      .where("mercadopago_id", preferenceId);
    return res.status(200).json(request[0]);
  } catch (error) {
    return res.status(500).json({ error: "Erro no servidor!" });
  }
};

const addRequestAbast = async (req, res) => {
  const {
    produtos_ids,
    rua,
    numero,
    bairro,
    cep,
    cidade,
    estado,
    complemento,
    formaenvio,
    nomecliente,
    nomeconsultor,
    emailcliente,
    cpfcliente,
    telefone,
  } = req.body;
  const valorfrete = parseFloat(req.body.valorfrete) || 0;
  const admins = await knex("usuarios").where("cargo_id", 1);

  let user_id = req.userLogged.id;
  let consultor_id = req.userLogged.id;
  let cliente_id = 1;
  let valorconsult = 0;
  let valor = parseFloat(valorfrete);
  let movimentValor = 0;
  let sum = 0;
  let pedidos_ids = [];
  const items = [];
  let statuspag = null;
  let formapag_id = null;
  let valorresto = 0;
  let pedido_resto_id = 0;

  if (
    !produtos_ids ||
    !rua ||
    !numero ||
    !bairro ||
    !cep ||
    !cidade ||
    !estado ||
    !complemento ||
    !formaenvio
  )
    return res.status(400).json({ error: "Preencha todos os campos!" });

  try {
    const ids = produtos_ids.map((produto) => produto.id);

    const existConsult = await knex("usuarios")
      .where("id", user_id)
      .where("cargo_id", 4);
    if (existConsult.length === 0)
      return res
        .status(404)
        .json({ error: "Consultor não encontrado, tente novamente!" });

    const products = await knex("produtos")
      .select("*")
      .whereIn("id", ids)
      .where("inativo", false);

    if (products.length !== ids.length)
      return res.status(400).json({
        error: "Produto selecionado não existe, tente novamente!",
      });

    products.forEach(async (product) => {
      const index = produtos_ids.findIndex(
        (produto) => produto.id === product.id
      );
      valor += parseFloat(product.valormin) * produtos_ids[index].quantidade;
    });

    let response;

    const requests = await knex("pedidos")
      .where("consultpago", false)
      .where("consultor_id", req.userLogged.id)
      .where("saldodisp", true);

    const requestRest = await knex("pedidos")
      .where("resto", ">", 0)
      .where("consultor_id", req.userLogged.id);

    if (valor > req.userLogged.valordispsaque) {
      if (requestRest.length > 0) {
        pedidos_ids.push(requestRest[0].id);
        sum = parseFloat(requestRest[0].resto);
        await knex("pedidos")
          .update({ resto: 0.0, consultpago: true })
          .where("id", requestRest[0].id);
      } else {
        for (let request of requests) {
          pedidos_ids.push(request.id);
          sum += parseFloat(request.valorconsult);
          await knex("pedidos")
            .update({ consultpago: true })
            .where("id", request.id);
        }
      }

      valor -= parseFloat(req.userLogged.valordispsaque);
      items.push({
        id: req.userLogged.id,
        currency_id: "BRL",
        unit_price: parseFloat(valor),
        description: "Valor",
        quantity: 1,
      });

      const ultimoPedido = await knex("pedidos").orderBy("id", "desc").first();

      const preference = new Preference(client);

      response = await preference.create({
        body: {
          items,
          back_urls: {
            success: "https://site.biodermis.com.br/mercadopagosuccess",
            failure: "https://site.biodermis.com.br/mercadopagofailure",
          },
          auto_return: "approved",
          external_reference: ultimoPedido.id + 1,
        },
      });
    } else {
      let resto = 0;
      if (requestRest.length > 0) {
        resto =
          parseFloat(requestRest[0].resto) > valor
            ? parseFloat(requestRest[0].resto) - valor
            : 0;
        pedidos_ids.push(requestRest[0].id);
        sum = parseFloat(requestRest[0].resto);
        await knex("pedidos")
          .update({ resto, consultpago: true })
          .where("id", requestRest[0].id);
        valorresto = sum;
        pedido_resto_id = requestRest[0].id;
      }

      for (let request of requests) {
        pedidos_ids.push(request.id);
        sum += parseFloat(request.valorconsult);
        await knex("pedidos")
          .update({ consultpago: true })
          .where("id", request.id);
        if (sum > valor) {
          resto = sum - valor;
          await knex("pedidos")
            .update({ consultpago: null, resto: resto.toFixed(2) })
            .where("id", request.id);
          break;
        }
      }
      response = {
        id: "Pago com o valor disponível para o consultor!",
        init_point: "Pago com o valor disponível para o consultor!",
      };
      await knex("usuarios")
        .update({ valordispsaque: resto.toFixed(2) })
        .where("id", req.userLogged.id);
      movimentValor = valor;
      statuspag = "realizado";
      formapag_id = 5;
    }

    const datapedido = dataAtualFormatada();

    const newRequest = {
      datapedido,
      valor: valor.toFixed(2),
      valorconsult: valorconsult.toFixed(2),
      valorfrete: valorfrete.toFixed(2),
      consultor_id,
      cliente_id,
      produtos_ids: JSON.stringify(produtos_ids),
      modelo: "abastecimento",
      rua,
      numero,
      bairro,
      cep,
      cidade,
      estado,
      complemento,
      telefone,
      mercadopago_id: response.id,
      linkpagamento: response.init_point,
      formaenvio,
      nomecliente: nomecliente ?? "",
      nomeconsultor: nomecliente ?? "",
      emailcliente: emailcliente ?? "",
      cpfcliente: cpfcliente ?? "",
    };

    if (statuspag) newRequest.statuspag = statuspag;
    if (formapag_id) newRequest.formapag_id = formapag_id;

    const request = await knex("pedidos").insert(newRequest).returning("*");

    const totalQuantidade = produtos_ids.reduce((soma, produto) => {
      return soma + produto.quantidade;
    }, 0);

    let emailError = false;

    admins.forEach((admin) => {
      mailer.sendMail(
        {
          to: admin.email,
          cc: existConsult[0].email,
          bcc: process.env.BIODERMIS_MAIL,
          from: process.env.FROM_MAIL,
          template: "./addRequest",
          subject: `(BIODERMIS) - Pedido n° ${request[0].id} de abastecimento, confira sua lista de saques!`,
          context: {
            qtdProdutos: totalQuantidade,
            valor: valor.toFixed(2),
            id: request[0].id,
          },
        },
        (err) => {
          if (err) emailError = true;
        }
      );
    });

    if (emailError) {
      return res.status(400).json({
        error: "Não foi possível enviar o email, tente novamente!",
      });
    }

    const datasaque = dataAtualFormatada();
    const data = {
      datasaque,
      valorsaque: movimentValor.toFixed(2),
      valorresto,
      pedido_resto_id,
      pedidos_ids,
      status: "realizado",
      consultor_id: req.userLogged.id,
    };

    const withdraw = await knex("saques").insert(data).returning("*");

    return res.status(200).json({
      success: "Pedido cadastrado com sucesso!",
      link: response.init_point,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Erro no servidor!" });
  }
};

const addRequestUnlogged = async (req, res) => {
  const {
    formapag_id,
    produtos_ids,
    rua,
    numero,
    bairro,
    cep,
    cidade,
    estado,
    complemento,
    formaenvio,
    nomecliente,
    emailcliente,
    cpfcliente,
    telefone,
    consultor_id,
  } = req.body;
  const valorfrete = parseFloat(req.body.valorfrete) || 0;
  const admins = await knex("usuarios").where("cargo_id", 1);
  const items = [];
  let valor = 0;
  let valorconsult = 0;
  let cliente_id = 1;

  if (
    !produtos_ids ||
    !rua ||
    !numero ||
    !bairro ||
    !cep ||
    !cidade ||
    !estado ||
    !complemento ||
    !nomecliente ||
    !emailcliente ||
    !cpfcliente ||
    !formaenvio ||
    !consultor_id
  )
    return res.status(400).json({ error: "Preencha todos os campos!" });

  try {
    const consultor = await knex("usuarios")
      .select("*")
      .where("id", consultor_id)
      .where("cargo_id", 4)
      .first();
    if (!consultor)
      return res.status(400).json({ error: "Consultor não existe!" });

    const ids = produtos_ids.map((produto) => produto.id);
    const products = await knex("produtos")
      .select("*")
      .whereIn("id", ids)
      .where("inativo", false);

    if (products.length !== ids.length)
      return res
        .status(400)
        .json({ error: "Produto selecionado não existe, tente novamente!" });

    products.forEach(async (product) => {
      const productConsult = await knex("consultor_produtos")
        .select("*")
        .where("consultor_id", consultor_id)
        .where("produto_id", product.id);

      if (productConsult.length == 0) {
        const i = produtos_ids.findIndex(
          (produto) => produto.id === product.id
        );
        valor +=
          parseFloat(product.valorvenda) * parseInt(produtos_ids[i].quantidade);
        items.push({
          id: product.id,
          title: product.nome,
          currency_id: "BRL",
          picture_url: product.imagens ? product.imagens[0] : "",
          description: product.descricao,
          category_id: product.categoria_id,
          quantity: produtos_ids[i].quantidade,
          unit_price: parseFloat(product.valorvenda),
        });
      } else {
        const i = produtos_ids.findIndex(
          (produto) => produto.id === productConsult[0].produto_id
        );
        valorconsult +=
          parseFloat(productConsult[0].valorconsult) *
          produtos_ids[i].quantidade;
        valor +=
          parseFloat(productConsult[0].valortotal) *
          parseInt(produtos_ids[i].quantidade);
        items.push({
          id: product.id,
          title: product.nome,
          currency_id: "BRL",
          picture_url: product.imagens ? product.imagens[0] : "",
          description: product.descricao,
          category_id: product.categoria_id,
          quantity: produtos_ids[i].quantidade,
          unit_price: parseFloat(productConsult[0].valortotal),
        });
      }
    });

    const datapedido = dataAtualFormatada();

    items.push({
      id: 0,
      title: "Frete",
      currency_id: "BRL",
      quantity: 1,
      unit_price: parseFloat(valorfrete),
    });

    const ultimoPedido = await knex("pedidos").orderBy("id", "desc").first();

    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items,
        back_urls: {
          success: "https://site.biodermis.com.br/mercadopagosuccess",
          failure: "https://site.biodermis.com.br/mercadopagofailure",
        },
        auto_return: "approved",
        external_reference: ultimoPedido.id + 1,
      },
    });

    let nomeconsultor = consultor.nome;

    const newRequest = {
      datapedido,
      formapag_id,
      valor: valor.toFixed(2),
      valorconsult: valorconsult.toFixed(2),
      valorfrete: valorfrete.toFixed(2),
      consultor_id,
      cliente_id,
      produtos_ids: JSON.stringify(produtos_ids),
      modelo: "venda",
      rua,
      numero,
      bairro,
      cep,
      cidade,
      estado,
      complemento,
      telefone,
      mercadopago_id: response.id,
      linkpagamento: response.init_point,
      formaenvio,
      nomecliente,
      emailcliente,
      cpfcliente,
      nomeconsultor,
    };

    const request = await knex("pedidos").insert(newRequest).returning("*");

    const totalQuantidade = produtos_ids.reduce((soma, produto) => {
      return soma + produto.quantidade;
    }, 0);

    let emailError = false;

    admins.forEach((admin) => {
      mailer.sendMail(
        {
          to: admin.email,
          bcc: process.env.BIODERMIS_MAIL,
          from: process.env.FROM_MAIL,
          template: "./newRequestConsult",
          subject: `🚀 Novo Pedido Realizado! `,
          context: {
            nome: nomecliente,
            qtd: items.length - 1,
            produtos: items,
            valorcomiss: newRequest.valortotal,
            nomecliente: admin.nome,
            rua,
            numero,
            bairro,
            cidade,
            estado,
            complemento,
          },
        },
        (err) => {
          if (err) emailError = true;
        }
      );
    });
    if (emailError) {
      return res.status(400).json({
        error: "Não foi possível enviar o email, tente novamente!",
      });
    }

    return res.status(200).json({
      success: "Pedido cadastrado com sucesso!",
      link: response.init_point,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Erro no servidor!" });
  }
};

const getMoreSelled = async (req, res) => {
  const startDate = req.query.startDate || undefined;
  const endDate = req.query.endDate || undefined;
  const requestMoreSelled = await knex("pedidos")
    .select("produtos_ids") // Array<{ produtos_ids: Array<{id: number, quantidade: number}> }>
    .where(function () {
      const fDate = (d) => {
        if (!d.includes("/")) return d;
        const [day, month, year] = d.split("/");
        return `${year}-${month}-${day}`;
      };
      if (startDate) {
        this.whereRaw(
          "to_date(datapedido, 'DD/MM/YYYY') >= to_date(?, 'YYYY-MM-DD')",
          [fDate(startDate)]
        );
      }
      if (endDate) {
        this.whereRaw(
          "to_date(datapedido, 'DD/MM/YYYY') <= to_date(?, 'YYYY-MM-DD')",
          [fDate(endDate)]
        );
      }
    });
  const productIds = (await knex("produtos").select("id")).map(
    (product) => product.id
  );
  const produto = requestMoreSelled
    .reduce((acc, pedido) => {
      const produtos = pedido.produtos_ids;
      produtos.forEach((produto) => {
        const produtoExistente = acc.find((p) => p.id === produto.id);
        if (produtoExistente) {
          produtoExistente.quantidade += produto.quantidade;
        } else {
          if (productIds.includes(produto.id)) {
            acc.push({ ...produto });
          } else {
            console.log("Produto não existe", produto.id);
          }
        }
      });
      return acc;
    }, [])
    .sort((a, b) => b.quantidade - a.quantidade)[0];
  console.log({ produto });
  if (!produto) return res.json([{ nome: "Sem vendas no intervalo!" }]);
  const product = await knex("produtos")
    .select("nome")
    .where({ id: produto.id });
  return res.status(200).json(product);
};

module.exports = {
  listRequests,
  listRequestsUsers,
  addRequest,
  editRequest,
  removeRequest,
  balanceAvailable,
  getBalance,
  listPreferenceRequest,
  addRequestAbast,
  addRequestUnlogged,
  addRequestWithProducts,
  editRequestWithProducts,
  getMoreSelled,
};
