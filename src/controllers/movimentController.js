const knex = require('../config/connect');

//listar cargos
const listMoviments = async (req, res) => {
  const startDate = req.query.startDate || undefined;
  const endDate = req.query.endDate || undefined;
  try {
    let query = knex('movimentacoes').where(function () {
      const fDate = (d) => {
        const [day, month, year] = d.split('/');
        // Adiciona zeros à esquerda se necessário
        const paddedMonth = month.padStart(2, '0');
        const paddedDay = day.padStart(2, '0');
        return `${year}-${paddedMonth}-${paddedDay}`;
      }
      if (startDate) {
        this.whereRaw("to_date(datarealizado, 'YYYY-MM-DD') >= to_date(?, 'YYYY-MM-DD')", [fDate(startDate)]);
      }
      if (endDate) {
        this.whereRaw("to_date(datarealizado, 'YYYY-MM-DD') <= to_date(?, 'YYYY-MM-DD')", [fDate(endDate)]);
      }
    }).orderBy('datarealizado', 'desc');

    const moviments = await query;
    return res.status(200).json(moviments);
  } catch (error) {
    console.log({ error })
    return res.status(500).json({ error: 'Erro no servidor!' });
  }
};

module.exports = {
  listMoviments,
};
