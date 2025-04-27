const express = require("express");
const router = express();
const positionRoutes = require("./positionRoutes");
const movimentRoutes = require("./movimentRoutes");
const categoryRoutes = require("./categoryRoutes");
const userRoutes = require("./userRoutes");
const consultRoutes = require("./consultRoutes");
const requestsRoutes = require("./requestsRoutes");
const withdrawRoutes = require("./withdrawRoutes");
const assessmentsRoutes = require("./assessmentsRoutes");
const productsRoutes = require("./productsRoutes");
const mercadoPagoRoutes = require("./mercadoPagoRoutes");
const carrosselRoutes = require("./carrosselRoutes");
const addressRoutes = require("./addressRoutes");
const productsController = require("../controllers/productsController");
const categoryController = require("../controllers/categoryController");
const carrosselController = require("../controllers/carrosselController");
const addressController = require("../controllers/addressController");
const requestsController = require("../controllers/requestsController");

router.use(positionRoutes);
router.use(mercadoPagoRoutes);
router.get("/produtos/:id", productsController.listProducts);
router.get("/maisvendidos", productsController.getTop5ProdutosMaisVendidos);
router.get("/categorias", categoryController.listCategorys);
router.get("/carrossel/:id", carrosselController.listCarrossel);
router.post("/endereco", addressController.addAddress);
router.post("/pedidos/web", requestsController.addRequestUnlogged);
router.patch(
  "/pedidos/produtos/:id",
  requestsController.editRequestWithProducts
);

router.use(userRoutes);
router.use(categoryRoutes);
router.use(consultRoutes);
router.use(requestsRoutes);
router.use(productsRoutes);
router.use(withdrawRoutes);
router.use(assessmentsRoutes);
router.use(movimentRoutes);
router.use(carrosselRoutes);
router.use(addressRoutes);

module.exports = router;
