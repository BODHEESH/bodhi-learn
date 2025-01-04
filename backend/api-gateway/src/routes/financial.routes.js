const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

/**
 * Billing Routes
 */
router.get('/bills', authMiddleware, 'BillingController.list');
router.get('/bills/:id', authMiddleware, 'BillingController.get');
router.post('/bills', authMiddleware, 'BillingController.create');
router.put('/bills/:id', authMiddleware, 'BillingController.update');
router.delete('/bills/:id', authMiddleware, 'BillingController.delete');
router.post('/bills/:id/generate', authMiddleware, 'BillingController.generateBill');
router.get('/bills/:id/download', authMiddleware, 'BillingController.downloadBill');

/**
 * Payment Routes
 */
router.get('/payments', authMiddleware, 'PaymentController.list');
router.get('/payments/:id', authMiddleware, 'PaymentController.get');
router.post('/payments', authMiddleware, 'PaymentController.create');
router.post('/payments/process', authMiddleware, 'PaymentController.processPayment');
router.get('/payments/:id/receipt', authMiddleware, 'PaymentController.generateReceipt');
router.get('/payments/history', authMiddleware, 'PaymentController.getHistory');

/**
 * Scholarship Routes
 */
router.get('/scholarships', authMiddleware, 'ScholarshipController.list');
router.get('/scholarships/:id', authMiddleware, 'ScholarshipController.get');
router.post('/scholarships', authMiddleware, 'ScholarshipController.create');
router.put('/scholarships/:id', authMiddleware, 'ScholarshipController.update');
router.delete('/scholarships/:id', authMiddleware, 'ScholarshipController.delete');
router.post('/scholarships/:id/apply', authMiddleware, 'ScholarshipController.apply');
router.put('/scholarships/applications/:id', authMiddleware, 'ScholarshipController.processApplication');

/**
 * Financial Aid Routes
 */
router.get('/financial-aid', authMiddleware, 'FinancialAidController.list');
router.get('/financial-aid/:id', authMiddleware, 'FinancialAidController.get');
router.post('/financial-aid', authMiddleware, 'FinancialAidController.apply');
router.put('/financial-aid/:id', authMiddleware, 'FinancialAidController.update');
router.get('/financial-aid/:id/status', authMiddleware, 'FinancialAidController.checkStatus');
router.post('/financial-aid/:id/approve', authMiddleware, 'FinancialAidController.approve');

/**
 * Accounting Routes
 */
router.get('/accounts', authMiddleware, 'AccountingController.list');
router.get('/accounts/:id', authMiddleware, 'AccountingController.get');
router.post('/accounts', authMiddleware, 'AccountingController.create');
router.put('/accounts/:id', authMiddleware, 'AccountingController.update');
router.get('/accounts/:id/transactions', authMiddleware, 'AccountingController.getTransactions');
router.post('/accounts/:id/transactions', authMiddleware, 'AccountingController.addTransaction');

/**
 * Payroll Routes
 */
router.get('/payroll', authMiddleware, 'PayrollController.list');
router.get('/payroll/:id', authMiddleware, 'PayrollController.get');
router.post('/payroll', authMiddleware, 'PayrollController.create');
router.put('/payroll/:id', authMiddleware, 'PayrollController.update');
router.post('/payroll/process', authMiddleware, 'PayrollController.processPayroll');
router.get('/payroll/reports', authMiddleware, 'PayrollController.generateReports');

/**
 * Expense Management Routes
 */
router.get('/expenses', authMiddleware, 'ExpenseController.list');
router.get('/expenses/:id', authMiddleware, 'ExpenseController.get');
router.post('/expenses', authMiddleware, 'ExpenseController.create');
router.put('/expenses/:id', authMiddleware, 'ExpenseController.update');
router.delete('/expenses/:id', authMiddleware, 'ExpenseController.delete');
router.post('/expenses/:id/approve', authMiddleware, 'ExpenseController.approve');
router.get('/expenses/reports', authMiddleware, 'ExpenseController.generateReports');

module.exports = router;
