const express = require('express');
const router = express.Router();
const bmiController = require('../controllers/bmiController');

// GET все записи
router.get('/', bmiController.getAllRecords);

// GET запись по ID
router.get('/:id', bmiController.getRecordById);

// GET расчет ИМТ через query параметры
router.get('/calculate/query', bmiController.calculateFromQuery);

// POST расчет ИМТ с телом запроса
router.post('/calculate', bmiController.calculateFromBody);

// POST сохранение результата
router.post('/save', bmiController.saveRecord);

// PUT обновление записи
router.put('/:id', bmiController.updateRecord);

// DELETE удаление записи
router.delete('/:id', bmiController.deleteRecord);

module.exports = router;