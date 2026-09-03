const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const auth = require('../middleware/auth');
const { validateInvoiceInput } = require('../middleware/validation');

// All invoice routes require authentication
router.use(auth);

router.get('/', invoiceController.getInvoices);
router.get('/next-number', invoiceController.getNextInvoiceNumber);
router.post('/', validateInvoiceInput, invoiceController.createInvoice);
router.get('/:id', invoiceController.getInvoiceById);
router.put('/:id', validateInvoiceInput, invoiceController.updateInvoice);
router.patch('/:id/status', invoiceController.updateInvoiceStatus);
router.delete('/:id', invoiceController.deleteInvoice);

module.exports = router;
