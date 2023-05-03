const express = require('express');
const groupController = require('../controllers/groupController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(groupController.getAllGroups)
  .post(authController.restrictTo('admin'), groupController.createGroup);

router
  .route('/:id')
  .get(groupController.getGroup)
  .patch(authController.restrictTo('admin'), groupController.updateGroup)
  .delete(authController.restrictTo('admin'), groupController.deleteGroup);

module.exports = router;
