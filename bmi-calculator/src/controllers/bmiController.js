const fs = require('fs').promises;
const path = require('path');

// Путь к файлу с данными
const DATA_FILE = path.join(__dirname, '../data/bmiRecords.json');

// Функция для расчета ИМТ
const calculateBMI = (weight, height) => {
  if (height <= 0 || weight <= 0) {
    throw new Error('Рост и вес должны быть положительными числами');
  }
  
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  
  let category;
  if (bmi < 18.5) category = 'Недостаточный вес';
  else if (bmi < 25) category = 'Нормальный вес';
  else if (bmi < 30) category = 'Избыточный вес';
  else category = 'Ожирение';
  
  return {
    bmi: bmi.toFixed(2),
    category,
    weight,
    height
  };
};

// Функция для получения всех записей
const getAllRecords = async (req, res, next) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const records = JSON.parse(data);
    res.json(records);
  } catch (error) {
    next(error);
  }
};

// Функция для получения записи по ID
const getRecordById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const records = JSON.parse(data);
    const record = records.find(r => r.id === id);
    
    if (!record) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }
    
    res.json(record);
  } catch (error) {
    next(error);
  }
};

// Расчет ИМТ из query параметров
const calculateFromQuery = (req, res, next) => {
  try {
    const weight = parseFloat(req.query.weight);
    const height = parseFloat(req.query.height);
    
    if (!weight || !height) {
      return res.status(400).json({ 
        error: 'Необходимы параметры weight и height в query' 
      });
    }
    
    const result = calculateBMI(weight, height);
    res.json({
      ...result,
      calculatedFrom: 'query parameters'
    });
  } catch (error) {
    next(error);
  }
};

// Расчет ИМТ из тела запроса
const calculateFromBody = (req, res, next) => {
  try {
    const { weight, height, name } = req.body;
    
    if (!weight || !height) {
      return res.status(400).json({ 
        error: 'Необходимы поля weight и height в теле запроса' 
      });
    }
    
    const result = calculateBMI(parseFloat(weight), parseFloat(height));
    
    const response = {
      ...result,
      name: name || 'Аноним',
      calculatedFrom: 'request body'
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Сохранение результата
const saveRecord = async (req, res, next) => {
  try {
    const { weight, height, name } = req.body;
    
    if (!weight || !height) {
      return res.status(400).json({ 
        error: 'Необходимы поля weight и height' 
      });
    }
    
    const result = calculateBMI(parseFloat(weight), parseFloat(height));
    
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const records = JSON.parse(data);
    
    const newId = records.length > 0 ? Math.max(...records.map(r => r.id)) + 1 : 1;
    
    const newRecord = {
      id: newId,
      name: name || 'Аноним',
      ...result,
      date: new Date().toISOString()
    };
    
    records.push(newRecord);
    await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2));
    
    res.status(201).json({
      message: 'Запись сохранена успешно',
      record: newRecord
    });
  } catch (error) {
    next(error);
  }
};

// Обновление записи
const updateRecord = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { weight, height, name } = req.body;
    
    if (!weight && !height && !name) {
      return res.status(400).json({ 
        error: 'Необходимо хотя бы одно поле для обновления' 
      });
    }
    
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const records = JSON.parse(data);
    const recordIndex = records.findIndex(r => r.id === id);
    
    if (recordIndex === -1) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }
    
    const updatedRecord = { ...records[recordIndex] };
    
    if (weight && height) {
      const result = calculateBMI(parseFloat(weight), parseFloat(height));
      updatedRecord.weight = parseFloat(weight);
      updatedRecord.height = parseFloat(height);
      updatedRecord.bmi = result.bmi;
      updatedRecord.category = result.category;
    } else if (name) {
      updatedRecord.name = name;
    }
    
    updatedRecord.updatedAt = new Date().toISOString();
    records[recordIndex] = updatedRecord;
    
    await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2));
    
    res.json({
      message: 'Запись обновлена успешно',
      record: updatedRecord
    });
  } catch (error) {
    next(error);
  }
};

// Удаление записи
const deleteRecord = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    
    const data = await fs.readFile(DATA_FILE, 'utf8');
    let records = JSON.parse(data);
    const initialLength = records.length;
    
    records = records.filter(r => r.id !== id);
    
    if (records.length === initialLength) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }
    
    await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2));
    
    res.json({
      message: 'Запись удалена успешно',
      deletedId: id
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRecords,
  getRecordById,
  calculateFromQuery,
  calculateFromBody,
  saveRecord,
  updateRecord,
  deleteRecord
};