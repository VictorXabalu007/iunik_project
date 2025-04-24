const knex = require("../config/connect");
const fs = require("fs");

const categoriasExistem = async (categoriaIds) => {
  const categorias = await knex("categorias").whereIn("id", categoriaIds);
  return categorias.length === categoriaIds.length;
};

const addProduct = async (req, res) => {
  const { nome, descricao, categoria_ids } = req.body;
  const valorvenda = parseFloat(req.body.valorvenda);
  const valormin = parseFloat(req.body.valormin);
  const valormax = parseFloat(req.body.valormax);
  const altura = parseFloat(req.body.altura) || 0;
  const peso = parseFloat(req.body.peso) || 0;
  const largura = parseFloat(req.body.largura) || 0;
  const profundidade = parseFloat(req.body.profundidade) || 0;

  if (
    !valorvenda ||
    !valormax ||
    !valormin ||
    !nome ||
    !descricao ||
    !categoria_ids ||
    !Array.isArray(categoria_ids) ||
    categoria_ids.length === 0
  )
    return res.status(400).json({ error: "Preencha todos os campos!" });

  try {
    const categoriasValidas = await categoriasExistem(categoria_ids);

    if (!categoriasValidas) {
      return res
        .status(400)
        .json({ error: "Uma ou mais categorias fornecidas não existem." });
    }

    if (!categoria_ids.every(Number.isInteger)) {
      return res
        .status(400)
        .json({ error: "Categorias não identificadas, tente novamente." });
    }

    if (parseFloat(valorvenda) < parseFloat(valormin))
      return res.status(400).json({
        error:
          "O valor da venda não pode ser menor que o valor mínimo do produto!",
      });
    if (parseFloat(valorvenda) > parseFloat(valormax))
      return res.status(400).json({
        error:
          "O valor da venda não pode ser maior que o valor máximo do produto!",
      });

    const newProduct = {
      nome,
      descricao,
      valorvenda: valorvenda.toFixed(2),
      valormax: valormax.toFixed(2),
      valormin: valormin.toFixed(2),
      altura: altura.toFixed(2),
      peso: peso.toFixed(2),
      largura: largura.toFixed(2),
      profundidade: profundidade.toFixed(2),
      categoria_ids,
    };

    const product = await knex("produtos").insert(newProduct).returning("*");
    return res.status(200).json({
      success: "Produto cadastrado com sucesso!",
      idProduct: product[0].id,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Erro no servidor!" });
  }
};
const listProducts = async (req, res) => {
  const { id } = req.params;
  try {
    if (id < 1) {
      const products = await knex("produtos").select("*");
      return res.status(200).json(products);
    } else {
      const products = await knex("produtos").select("*").where("id", id);
      if (products.length === 0)
        return res.status(404).json({ error: "Produto não encontrado!" });
      return res.status(200).json(products[0]);
    }
  } catch (error) {
    return res.status(500).json({ error: "Erro no servidor!" });
  }
};

const listProductsConsult = async (req, res) => {
  try {
    const products = await knex("consultor_produtos")
      .select(["*", "consultor_produtos.id"])
      .where("produtos.inativo", false)
      .innerJoin("produtos", "produtos.id", "consultor_produtos.produto_id");

    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({ error: "Erro no servidor!" });
  }
};

const editProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await knex("produtos").where("id", id);
    if (product.length === 0)
      return res.status(404).json({ error: "Produto não encontrado!" });

    const { nome, descricao, categoria_ids } = req.body;
    let valorvenda = parseFloat(req.body.valorvenda);
    let valormin = parseFloat(req.body.valormin);
    let valormax = parseFloat(req.body.valormax);
    let altura = parseFloat(req.body.altura);
    let peso = parseFloat(req.body.peso);
    let largura = parseFloat(req.body.largura);
    let profundidade = parseFloat(req.body.profundidade);

    if (
      !valormin &&
      !valormax &&
      !valorvenda &&
      !nome &&
      !descricao &&
      !altura &&
      !peso &&
      !largura &&
      !profundidade &&
      !categoria_ids
    )
      return res.status(400).json({ error: "Nenhuma alteração encontrada!" });

    if (categoria_ids && categoria_ids.length === 0)
      return res
        .status(400)
        .json({ error: "Informe pelo menos uma categoria para o produto!" });

    if (categoria_ids && !categoria_ids.every(Number.isInteger))
      return res
        .status(400)
        .json({ error: "Todas as categorias devem ser números inteiros." });

    if (categoria_ids) {
      const categoriasValidas = await categoriasExistem(categoria_ids);

      if (!categoriasValidas)
        return res
          .status(400)
          .json({ error: "Uma ou mais categorias fornecidas não existem." });
    }

    valorvenda = req.body.valorvenda
      ? parseFloat(valorvenda).toFixed(2)
      : parseFloat(product[0].valorvenda);
    valormin = req.body.valormin
      ? parseFloat(valormin).toFixed(2)
      : parseFloat(product[0].valormin);
    valormax = req.body.valormax
      ? parseFloat(valormax).toFixed(2)
      : parseFloat(product[0].valormax);
    altura = req.body.altura
      ? parseFloat(altura).toFixed(2)
      : product[0].altura;
    peso = req.body.peso ? parseFloat(peso).toFixed(2) : product[0].peso;
    largura = req.body.largura
      ? parseFloat(largura).toFixed(2)
      : product[0].largura;
    profundidade = req.body.profundidade
      ? parseFloat(profundidade).toFixed(2)
      : product[0].profundidade;

    if (parseFloat(valorvenda) < parseFloat(valormin))
      return res.status(400).json({
        error:
          "O valor da venda não pode ser menor que o valor mínimo do produto!",
      });
    if (parseFloat(valorvenda) > parseFloat(valormax))
      return res.status(400).json({
        error:
          "O valor da venda não pode ser maior que o valor máximo do produto!",
      });

    const data = {
      nome: nome ?? product[0].nome,
      descricao: descricao ?? product[0].descricao,
      valorvenda,
      valormin,
      valormax,
      altura,
      peso,
      largura,
      profundidade,
      categoria_ids: categoria_ids ?? product[0].categoria_ids,
    };

    await knex("produtos").where("id", id).update(data).returning("*");

    return res.status(200).json({ success: "Produto atualizado com sucesso!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Erro no servidor!" });
  }
};
const removeProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await knex("produtos").where("id", id);
    if (product.length === 0)
      return res.status(404).json({ error: "Produto não encontrado!" });

    const productConsultDeleted = await knex("consultor_produtos")
      .del()
      .where("produto_id", id);

    const assessmentsDeleted = await knex("avaliacoes")
      .del()
      .where("produto_id", id);

    const productDeleted = await knex("produtos").del().where("id", id);
    if (productDeleted.rowCount === 0)
      return res.status(400).json({
        error: "Não foi possível excluir o Produto, tente novamente!",
      });

    return res.status(200).json({ success: "Produto excluído com sucesso!" });
  } catch (error) {
    return res.status(500).json({ error: "Erro no servidor!" });
  }
};

const addImgProd = async (req, res) => {
  const { id } = req.params;
  const files = req.files;
  try {
    const product = await knex("produtos").where("id", id);
    if (product.length === 0)
      return res.status(404).json({ error: "Produto não encontrado!" });

    if (files.length === 0)
      return res
        .status(400)
        .json({ error: "Nenhuma imagem enviada, tente novamente!" });

    const imagesPath = product[0].imagens || [];
    files.forEach((file) => {
      imagesPath.push(file.path);
    });

    await knex("produtos")
      .where("id", id)
      .update({ imagens: imagesPath })
      .returning("*");
    return res.json({ success: "Imagens adicionadas com sucesso!" });
  } catch (error) {
    return res.status(500).json({ error: "Erro no servidor!" });
  }
};

const removeImgProd = async (req, res) => {
  const { id } = req.params;
  const { imagens } = req.body;
  let cancela = false;
  try {
    const product = await knex("produtos").where("id", id);
    if (product.length === 0)
      return res.status(404).json({ error: "Produto não encontrado!" });

    const imagesPath = [...product[0].imagens];
    const imagesDeleted = [];
    imagens.forEach((img) => {
      if (img > imagesPath.length - 1) cancela = true;
    });

    if (cancela)
      return res.status(404).json({ error: `Imagem não encontrada! ` });

    if (imagesPath.length > 0) {
      if (imagens.length > 0) {
        imagens.forEach((img) => {
          if (imagesPath[img].startsWith("http")) {
            imagesDeleted.push(imagesPath[img]);
          } else {
            try {
              fs.unlinkSync(imagesPath[img]);
            } catch (err) {}
            imagesDeleted.push(imagesPath[img]);
          }
        });
      } else {
        return res
          .status(400)
          .json({ error: "Informe quais imagens para deletar!" });
      }

      const data = imagesPath.filter((image) => !imagesDeleted.includes(image));

      await knex("produtos")
        .where("id", id)
        .update({ imagens: data })
        .returning("*");

      return res.json({ success: "Imagens excluídas com sucesso!" });
    } else {
      return res
        .status(400)
        .json({ error: "Imagens não excluídas, produto sem fotos!" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Erro no servidor!" });
  }
};

const getTop5ProdutosMaisVendidos = async (req, res) => {
  try {
    const pedidos = await knex("pedidos").select("produtos_ids");

    const produtosCount = {};

    pedidos.forEach((pedido) => {
      const produtos = pedido.produtos_ids;

      produtos.forEach((produto) => {
        const { id, quantidade } = produto;

        if (produtosCount[id]) {
          produtosCount[id] += quantidade;
        } else {
          produtosCount[id] = quantidade;
        }
      });
    });

    const topProdutos = Object.entries(produtosCount)
      .map(([id, quantidade]) => ({ id, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);

    const { id: idLancamentos } = await knex("categorias")
      .where("categoria", "Lançamentos")
      .first();
    const lancamentos = await knex("produtos")
      .whereRaw("categoria_ids @> ARRAY[?]::integer[]", [idLancamentos])
      .select("*");

    const { id: idPromocoes } = await knex("categorias")
      .where("categoria", "Promoções")
      .first();
    const promocoes = await knex("produtos")
      .whereRaw("categoria_ids @> ARRAY[?]::integer[]", [idPromocoes])
      .select("*");

    const arrayDeIds = topProdutos.map((produto) => produto.id);
    let produtos = await knex("produtos").whereIn("id", arrayDeIds);
    if (produtos.length === 0) {
      produtos = await knex("produtos").select("*");
    }
    produtos.slice(0, 5);

    return res
      .status(200)
      .json({ maisVendidos: produtos, lancamentos, promocoes });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Erro no servidor." });
  }
};

module.exports = {
  addProduct,
  listProducts,
  editProduct,
  removeProduct,
  listProductsConsult,
  addImgProd,
  removeImgProd,
  getTop5ProdutosMaisVendidos,
};
