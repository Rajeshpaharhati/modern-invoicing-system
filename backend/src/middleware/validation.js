/**
 * Validation helpers for request bodies
 */

const validateClientInput = (req, res, next) => {
  const { name, email } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Client name is required');
  }

  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    errors.push('A valid client email address is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid client input',
      details: errors
    });
  }

  next();
};

const validateInvoiceInput = (req, res, next) => {
  const { clientId, invoiceNumber, items, dueDate, taxRate } = req.body;
  const errors = [];

  if (!clientId) {
    errors.push('A client must be selected');
  }

  if (!invoiceNumber || typeof invoiceNumber !== 'string' || invoiceNumber.trim().length === 0) {
    errors.push('Invoice number is required');
  }

  if (!dueDate || isNaN(new Date(dueDate).getTime())) {
    errors.push('A valid due date is required');
  }

  if (!Array.isArray(items) || items.length === 0) {
    errors.push('At least one line item is required');
  } else {
    items.forEach((item, index) => {
      if (!item.description || item.description.trim() === '') {
        errors.push(`Item #${index + 1}: Description is required`);
      }
      if (item.quantity === undefined || Number(item.quantity) <= 0) {
        errors.push(`Item #${index + 1}: Quantity must be greater than 0`);
      }
      if (item.unitPrice === undefined || Number(item.unitPrice) < 0) {
        errors.push(`Item #${index + 1}: Unit price cannot be negative`);
      }
    });
  }

  if (taxRate !== undefined && (isNaN(Number(taxRate)) || Number(taxRate) < 0 || Number(taxRate) > 100)) {
    errors.push('Tax rate must be a percentage between 0 and 100');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid invoice input',
      details: errors
    });
  }

  next();
};

const validateAuthInput = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    errors.push('A valid email address is required');
  }

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid authentication input',
      details: errors
    });
  }

  next();
};

module.exports = {
  validateClientInput,
  validateInvoiceInput,
  validateAuthInput
};
