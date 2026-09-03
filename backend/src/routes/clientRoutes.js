const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const auth = require('../middleware/auth');
const { validateClientInput } = require('../middleware/validation');

// All client routes require authentication
router.use(auth);

router.get('/', clientController.getClients);
router.post('/', validateClientInput, clientController.createClient);
router.get('/:id', clientController.getClientById);
router.put('/:id', validateClientInput, clientController.updateClient);
router.delete('/:id', clientController.deleteClient);

module.exports = router;
