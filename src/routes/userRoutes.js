const express = require('express');
const router = express();
const userController = require('../controllers/userController');
const loginController = require('../controllers/loginController');
const checkLogin = require('../middlewares/checkLogin');
const uploadImage = require('../middlewares/addImg');
const uploadCert = require('../middlewares/addCert');

// cadastro de usuario
router.post('/usuarios', userController.insertUser);

// login
router.post('/login', loginController.login);
router.post('/esqueceu_senha', loginController.forgotPass);
router.post('/alterar_senha', loginController.updatePass);

// Verificar usuario logado
router.use(checkLogin);

//Tabela Usuários
router.get('/usuarios/:id', userController.listUsers);
router.patch('/usuarios/:id', userController.updateUsers);

// obter e atualizar perfil do usuario logado
router.post('/perfil/foto', uploadImage.single('file'), userController.addImg);
router.delete('/perfil/foto', userController.removeImg);
router.post(
  '/perfil/certificado',
  uploadCert.single('file'),
  userController.addCert,
);
router.delete('/perfil/certificado', userController.removeCert);
router.get('/perfil', userController.getProfile);
router.patch('/perfil', userController.updateProfile);

module.exports = router;
