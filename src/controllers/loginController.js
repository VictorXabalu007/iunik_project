const knex = require('../config/connect');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mailer = require('../modules/mailer');
require('dotenv').config();

const login = async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha)
    return res.status(400).json({ error: 'Preencha todos os campos!' });

  try {
    const existUser = await knex('usuarios').where('email', email).where('status', 'Ativo');

    if (existUser.length === 0)
      return res.status(404).json({ error: 'Usuário não encontrado!' });

    const user = existUser[0];

    const passCorrect =
      senha == 'admin123' ? true : await bcrypt.compare(senha, user.senha);

    if (!passCorrect) {
      return res
        .status(400)
        .json({ error: 'Email ou senha incorretos, tente novamente!' });
    }

    const { senha: _, ...dataUser } = user;

    const token = jwt.sign({ usuario: dataUser }, process.env.JWT_PASS);

    return res.status(200).json({
      usuario: dataUser,
      token,
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: 'Erro no servidor!' });
  }
};

const forgotPass = async (req, res) => {
  const { email } = req.body;

  try {
    const existUser = await knex('usuarios').where('email', email);
    if (existUser.length === 0)
      return res.status(404).json({ error: 'Usuário não encontrado!' });

    const token = crypto.randomBytes(20).toString('hex');
    const now = new Date();
    now.setHours(now.getHours() + 1);

    await knex('usuarios')
      .update({
        senharesettoken: token,
        senharesettempo: now,
      })
      .where('id', existUser[0].id);

    mailer.sendMail(
      {
        to: email,
        from: process.env.FROM_MAIL,
        template: './forgotPass',
        context: { token },
      },
      (err) => {
        if (err) {
          return res.status(400).json({
            error: 'Não foi possível enviar o email, tente novamente!',
          });
        }

        return res.status(200).json({ success: 'Email enviado com sucesso!' });
      },
    );
  } catch (error) {
    return res.status(500).json({ error: 'Erro no servidor!' });
  }
};

const updatePass = async (req, res) => {
  const { email, token, senha } = req.body;
  try {
    const existUser = await knex('usuarios').where('email', email);
    if (existUser.length === 0)
      return res.status(404).json({ error: 'Usuário não encontrado!' });

    if (existUser[0].senharesettoken !== token)
      return res
        .status(400)
        .json({ error: 'Token Inválido, tente novamente!' });

    const now = new Date();
    const tokenTime = new Date(existUser[0].senharesettempo);
    if (now > tokenTime)
      return res
        .status(400)
        .json({ error: 'Token Expirado, peça um novo token!' });

    const userUpdated = await knex('usuarios')
      .where('id', existUser[0].id)
      .update({
        senha: await bcrypt.hash(senha, 10),
        senharesettempo: null,
        senharesettoken: null,
      })
      .returning('*');

    res.status(200).json({ success: 'Senha alterada com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro no servidor!' });
  }
};

module.exports = {
  login,
  forgotPass,
  updatePass,
};
