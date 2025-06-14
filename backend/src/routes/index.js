const express = require('express');
  const router = express.Router();
  
const { checkDbConnection } = require('../controllers/health.controller');

router.get('/', (req, res) => {
  res.json({
    message: "Property Repair API 服务已运行",
    apiEndpoints: {
      root: "/",
      apiStatus: "/api",
      admin: "/admin",
      processes: "/processes",
      dbHealth: "/api/health/db"
    }
  });
});

router.get('/api', (req, res) => {
  res.json({ status: "API运行正常" });
});

const { getAdminData } = require('../controllers/adminController');
// 确保createProcess已正确导入
  const processRoutes = require('./processes');
  
  router.get('/admin', getAdminData);
router.use('/processes', processRoutes);
router.get('/api/health/db', checkDbConnection);

module.exports = router;