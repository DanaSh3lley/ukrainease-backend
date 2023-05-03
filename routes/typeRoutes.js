const express = require('express');
const typeController = require('../controllers/typeController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(typeController.getAllTypes)
  .post(authController.restrictTo('admin'), typeController.createType);

router
  .route('/:id')
  .get(typeController.getType)
  .patch(authController.restrictTo('admin'), typeController.updateType)
  .delete(authController.restrictTo('admin'), typeController.deleteType);

module.exports = router;
