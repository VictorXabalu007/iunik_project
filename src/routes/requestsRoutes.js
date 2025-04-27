const express = require('express');
const router = express();
const requestsController = require('../controllers/requestsController');
const authorize = require('../middlewares/authorize');

router.post('/pedidos', requestsController.addRequest);

router.get('/pedidos/:id', requestsController.listRequests);
router.get('/pedido-mais-vendido', requestsController.getMoreSelled);
router.get('/pedidos/usuarios/:id', requestsController.listRequestsUsers);
router.patch('/pedidos/:id', requestsController.editRequest);
router.delete('/pedidos/:id', requestsController.removeRequest);

router.post('/saldodisp', requestsController.balanceAvailable);
router.get('/saldodisp', requestsController.getBalance);
router.get(
  '/pedidos/preferences/:preferenceId',
  requestsController.listPreferenceRequest,
);

router.post('/pedidos/abastecimento', requestsController.addRequestAbast)
router.post('/pedidos/produtos', requestsController.addRequestWithProducts)
router.patch('/pedidos/produtos/:id', requestsController.editRequestWithProducts);

module.exports = router;
