const knex = require('../config/connect');

//listar cargos
const listMoviments = async (req, res) => {
  try {
    const moviments = await knex('movimentacoes').orderBy('datarealizado', 'desc');
    return res.status(200).json(moviments);
  } catch (error) {
    return res.status(500).json({ error: 'Erro no servidor!' });
  }
};

module.exports = {
  listMoviments,
};
