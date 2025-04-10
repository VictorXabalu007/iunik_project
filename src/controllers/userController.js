const knex = require('../config/connect');
const bcrypt = require('bcrypt');
const fs = require('fs');
const mailer = require('../modules/mailer');
require('dotenv').config();

const insertUser = async (req, res) => {
  const {
    nome,
    cpf,
    email,
    telefone,
    senha,
    agencia,
    conta,
    banco,
    pix,
    tipochave,
    cargo_id,
  } = req.body;

  if (!nome || !email || !senha)
    return res.status(400).json({ error: 'Preencha todos os campos!' });

  if (!telefone || telefone.length < 11)
    return res.status(400).json({ error: 'Telefone inválido!' });

  if (!cpf || (cpf.length != 14 && cpf.length != 11))
    return res.status(400).json({ error: 'CPF inválido!' });

  try {
    const existPosition = await knex('cargos').where('id', cargo_id);
    if (existPosition.length === 0)
      return res.status(404).json({ error: 'Cargo não encontrado!' });

    const cpfValid = cpf.replaceAll('.', '').replace('-', '');
    const telefoneValid = telefone
      .replaceAll('(', '')
      .replaceAll(')', '')
      .replaceAll(' ', '')
      .replaceAll('+', '')
      .replaceAll('-', '');
    const existUser = await knex('usuarios')
      .where('email', email)
      .orWhere('cpf', cpfValid);

    if (existUser.length > 0)
      return res
        .status(400)
        .json({ error: 'O email ou CPF informados já existem!' });

    const passCrip = await bcrypt.hash(senha, 10);

    let status = cargo_id != 4 ? 'Ativo' : 'Em aprovação';

    const newUser = {
      nome,
      email,
      telefone: telefoneValid,
      cpf: cpfValid,
      agencia,
      banco,
      conta,
      pix,
      tipochave,
      senha: passCrip,
      cargo_id,
      status,
    };

    const user = await knex('usuarios').insert(newUser).returning('*');

    if (user.length === 0)
      return res.status(400).json({
        error: 'Ocorreu um erro ao cadastrar o usuário, tente novamente!',
      });

      if(user.cargo_id === 4){
      mailer.sendMail(
        {
          to: email,
          bcc: process.env.BIODERMIS_MAIL,
          from: process.env.FROM_MAIL,
          template: './addConsult',
          subject: `🎉 Revenda Biodermis! Sua Solicitação está em Análise`,
          context: {
            nome
          },
        },
        (err) => {
          if (err)
            console.log(err)
        },
      )
      }
    

    return res
      .status(200)
      .json({ success: 'Usuário cadastrado com sucesso!', id: user[0].id });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Erro no servidor!' });
  }
};

const getProfile = async (req, res) => {
  return res.status(200).json(req.userLogged);
};

const updateUsers = async (req, res) => {
  const { id } = req.params;
  const { nome, cpf, email, telefone, agencia, conta, banco, pix, tipochave, senha } =
    req.body;

  if (senha != undefined && senha.trim() === '')
    return res.status(400).json({ error: 'Senha não pode ser vazia!' });

  let passCrip = '';

  if (senha) {
    passCrip = await bcrypt.hash(senha, 10);
  }
  if (
    !nome &&
    !email &&
    !cpf &&
    !agencia &&
    !conta &&
    !pix &&
    !cpf &&
    !telefone &&
    !banco &&
    !tipochave
  )
    return res.status(400).json({ error: 'Sem alterações!' });

  if (cpf && cpf.length != 14 && cpf.length != 11)
    return res.status(400).json({ error: 'CPF inválido!' });
  if (telefone && telefone.length < 11)
    return res.status(400).json({ error: 'Telefone inválido!' });

  try {
    const user = await knex('usuarios').select('*').where('id', id);
    if (user.length === 0)
      return res.status(404).json({ error: 'Usuário não encontrado!' });

    const cpfValid = cpf ? cpf.replaceAll('.', '').replace('-', '') : '';
    const telefoneValid = telefone
      ? telefone
          .replaceAll('(', '')
          .replaceAll(')', '')
          .replaceAll(' ', '')
          .replaceAll('+', '')
          .replaceAll('-', '')
      : '';
    const emailValid = email ? email : '';
    const existUser = await knex('usuarios')
      .where('email', emailValid)
      .orWhere('cpf', cpfValid);

    if (existUser.length > 0 && email != user[0].email)
      return res
        .status(400)
        .json({ error: 'O email ou CPF informados já existem!' });

    const data = {
      nome: nome || user[0].nome,
      email: email || user[0].email,
      cargo_id: user[0].cargo_id,
      cpf: cpfValid || user[0].cpf,
      telefone: telefoneValid || user[0].telefone,
      agencia: agencia || user[0].agencia,
      conta: conta || user[0].conta,
      banco: banco || user[0].banco,
      pix: pix || user[0].pix,
      tipochave: tipochave || user[0].tipochave,
    };

    await knex('usuarios').where('id', id).update(data).returning('*');

    return res.status(200).json({ success: 'Usuário atualizado com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro no servidor!' });
  }
};

const updateProfile = async (req, res) => {
  const { id, ...userAtual } = req.userLogged;
  const {
    nome,
    cpf,
    email,
    telefone,
    agencia,
    conta,
    banco,
    pix,
    tipochave,
    senha,
  } = req.body;

  if (
    !nome &&
    !email &&
    !cpf &&
    !agencia &&
    !conta &&
    !pix &&
    !cpf &&
    !telefone &&
    !senha &&
    !banco &&
    !tipochave
  )
    return res.status(400).json({ error: 'Sem alterações!' });

  if (cpf && cpf.length != 14 && cpf.length != 11)
    return res.status(400).json({ error: 'CPF inválido!' });
  if (telefone && telefone.length < 11)
    return res.status(400).json({ error: 'Telefone inválido!' });

  try {
    const cpfValid = cpf ? cpf.replaceAll('.', '').replace('-', '') : '';
    const telefoneValid = telefone
      ? telefone
          .replaceAll('(', '')
          .replaceAll(')', '')
          .replaceAll(' ', '')
          .replaceAll('+', '')
          .replaceAll('-', '')
      : '';
    const emailValid = email ? email : '';
    const existUser = await knex('usuarios')
      .where('email', emailValid)
      .orWhere('cpf', cpfValid);

    if (existUser.length > 0 && email != userAtual.email)
      return res
        .status(400)
        .json({ error: 'O email ou CPF informados já existem!' });

    if (senha != undefined && senha.trim() === '')
      return res.status(400).json({ error: 'Senha não pode ser vazia!' });

    let passCrip = userAtual.senha;

    if (senha) {
      passCrip = await bcrypt.hash(senha, 10);
    }

    const data = {
      nome: nome || userAtual.nome,
      email: email || userAtual.email,
      cargo_id: userAtual.cargo_id,
      cpf: cpfValid || userAtual.cpf,
      telefone: telefoneValid || userAtual.telefone,
      agencia: agencia || userAtual.agencia,
      banco: banco || userAtual.banco,
      conta: conta || userAtual.conta,
      pix: pix || userAtual.pix,
      tipochave: tipochave || userAtual.tipochave,
      senha: passCrip,
    };

    await knex('usuarios').where('id', id).update(data).returning('*');

    return res.status(200).json({ success: 'Usuário atualizado com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro no servidor!' });
  }
};

const deleteProfile = async (req, res) => {
  const {id} = req.userLogged

  try {
    await knex('usuarios').where({id}).update({inativo: true})
    return res.status(200).json({success: "Usuário excluído com sucesso!"})
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Erro no servidor!' });
  }
};

const listUsers = async (req, res) => {
  const { id } = req.params;
  try {
    if (id < 1) {
      const users = await knex('usuarios').select('*');
      return res.status(200).json(users);
    } else {
      const user = await knex('usuarios').select('*').where('id', id);
      if (user.length === 0)
        return res.status(404).json({ error: 'Usuário não encontrado!' });
      return res.status(200).json(user[0]);
    }
  } catch (error) {
    return res.status(500).json({ error: 'Erro no servidor!' });
  }
};

const addImg = async (req, res) => {
  const { id } = req.userLogged;
  const file = req.file;
  try {
    if (!file)
      return res
        .status(400)
        .json({ error: 'Nenhuma imagem enviada, tente novamente!' });
    if (req.userLogged.srcperfil) {
      fs.unlinkSync(req.userLogged.srcperfil);
    }
    await knex('usuarios')
      .where('id', id)
      .update({ srcperfil: file.path })
      .returning('*');
    return res.json({ success: 'Imagem adicionada com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro no servidor!' });
  }
};

const removeImg = async (req, res) => {
  const { id } = req.userLogged;
  try {
    if (req.userLogged.srcperfil) {
      fs.unlinkSync(req.userLogged.srcperfil);
      await knex('usuarios')
        .where('id', id)
        .update({ srcperfil: null })
        .returning('*');
      return res.json({ success: 'Foto do perfil removida com sucesso!' });
    } else {
      return res
        .status(400)
        .json({ error: 'Imagem não excluída, usuário sem foto do perfil!' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Erro no servidor!' });
  }
};

const addCert = async (req, res) => {
  const { id } = req.userLogged;
  const file = req.file;
  try {
    if (!file)
      return res
        .status(400)
        .json({ error: 'Nenhum arquivo enviado, tente novamente!' });
    if (req.userLogged.srccert) {
      fs.unlinkSync(req.userLogged.srccert);
    }
    await knex('usuarios')
      .where('id', id)
      .update({ srccert: file.path })
      .returning('*');
    return res.json({ success: 'Certificado adicionado com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro no servidor!' });
  }
};

const removeCert = async (req, res) => {
  const { id } = req.userLogged;
  try {
    if (req.userLogged.srccert) {
      fs.unlinkSync(req.userLogged.srccert);
      await knex('usuarios')
        .where('id', id)
        .update({ srccert: null })
        .returning('*');
      return res.json({ success: 'Certificado removido com sucesso!' });
    } else {
      return res
        .status(400)
        .json({ error: 'Certificado não excluída, usuário sem anexo!' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Erro no servidor!' });
  }
};

module.exports = {
  insertUser,
  getProfile,
  updateProfile,
  updateUsers,
  listUsers,
  addImg,
  removeImg,
  addCert,
  removeCert,
  deleteProfile
};
