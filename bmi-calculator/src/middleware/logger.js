const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  
  console.log(`[${timestamp}] ${method} ${url}`);
  
  // Добавляем уникальный ID к запросу
  req.requestId = Date.now() + Math.random().toString(36).substr(2, 9);
  
  res.on('finish', () => {
    console.log(`[${timestamp}] ${method} ${url} - ${res.statusCode} (ID: ${req.requestId})`);
  });
  
  next();
};

module.exports = logger;