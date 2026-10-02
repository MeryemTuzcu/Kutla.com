const express = require('express');
const router = express.Router();
const { validateCreateTask, validatePatchTask } = require('../middlewares/validator');
const {
    getAllTasks, getCustomerTasks, getVendorTasks, getTaskById, createTask, updateTask, deleteTask, searchTasks
} = require('../controllers/taskController');

// Sıra önemli: sabit yollar '/:id'den ÖNCE tanımlanmalı
router.get('/', getAllTasks);
router.get('/search', searchTasks);
router.get('/customer/:customerName', getCustomerTasks);
router.get('/vendor/:vendorId', getVendorTasks);
router.get('/:id', getTaskById);
router.post('/', validateCreateTask, createTask);
router.patch('/:id', validatePatchTask, updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
