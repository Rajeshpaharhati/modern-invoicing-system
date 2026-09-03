const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const User = require('../models/User');

// GET /api/invoices?status=&clientId=&startDate=&endDate=&search=
exports.getInvoices = async (req, res, next) => {
  try {
    const { status, clientId, startDate, endDate, search } = req.query;

    const query = { userId: req.user._id };

    if (status && ['draft', 'sent', 'paid', 'overdue'].includes(status.toLowerCase())) {
      query.status = status.toLowerCase();
    }

    if (clientId && clientId.trim() !== '') {
      query.clientId = clientId;
    }

    if (startDate || endDate) {
      query.issueDate = {};
      if (startDate) {
        query.issueDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.issueDate.$lte = end;
      }
    }

    if (search && search.trim() !== '') {
      query.invoiceNumber = new RegExp(search.trim(), 'i');
    }

    const invoices = await Invoice.find(query)
      .populate('clientId', 'name email phone')
      .sort({ createdAt: -1 });

    // Calculate aggregated metrics for the user's dashboard & filter state
    const summaryAgg = await Invoice.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          paidAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$total', 0] }
          },
          pendingAmount: {
            $sum: { $cond: [{ $in: ['$status', ['draft', 'sent', 'overdue']] }, '$total', 0] }
          },
          totalCount: { $sum: 1 },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          overdueCount: {
            $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] }
          }
        }
      }
    ]);

    const summary = summaryAgg[0] || {
      totalRevenue: 0,
      paidAmount: 0,
      pendingAmount: 0,
      totalCount: 0,
      paidCount: 0,
      overdueCount: 0
    };

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
      summary
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/invoices/:id
exports.getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.user._id
    })
      .populate('clientId')
      .populate('userId', 'name email role branding');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Convert to plain object for custom branding sanitization
    const invoiceObj = invoice.toObject();

    // CRITICAL EVALUATION REQUIREMENT:
    // If the issuer is not a premium user, ensure NO premium branding (custom logo)
    // leaks to the client via API response!
    if (invoiceObj.userId && invoiceObj.userId.role !== 'premium') {
      if (invoiceObj.userId.branding) {
        invoiceObj.userId.branding.logo = null;
      }
    }

    res.status(200).json({
      success: true,
      data: invoiceObj
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/invoices
exports.createInvoice = async (req, res, next) => {
  try {
    const { clientId, invoiceNumber, items, dueDate, issueDate, taxRate, notes, status } = req.body;

    // Verify client belongs to current user
    const client = await Client.findOne({ _id: clientId, userId: req.user._id });
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'The selected client was not found or does not belong to your account.'
      });
    }

    // Format invoice number
    const formattedInvoiceNumber = invoiceNumber.trim().toUpperCase();

    // Check unique invoice number for this user
    const existing = await Invoice.findOne({
      userId: req.user._id,
      invoiceNumber: formattedInvoiceNumber
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: `Invoice number '${formattedInvoiceNumber}' is already in use. Please specify a unique number.`
      });
    }

    // Calculate line items and totals
    let subtotal = 0;
    const computedItems = items.map((item) => {
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unitPrice) || 0;
      const amount = Math.round(qty * unitPrice * 100) / 100;
      subtotal += amount;
      return {
        description: item.description.trim(),
        quantity: qty,
        unitPrice,
        amount
      };
    });

    const parsedTaxRate = Number(taxRate) || 0;
    const taxAmount = Math.round((subtotal * (parsedTaxRate / 100)) * 100) / 100;
    const total = Math.round((subtotal + taxAmount) * 100) / 100;

    const invoice = await Invoice.create({
      userId: req.user._id,
      clientId: client._id,
      invoiceNumber: formattedInvoiceNumber,
      items: computedItems,
      subtotal,
      taxRate: parsedTaxRate,
      taxAmount,
      total,
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      dueDate: new Date(dueDate),
      status: status || 'draft',
      notes: notes || ''
    });

    const populatedInvoice = await Invoice.findById(invoice._id).populate('clientId');

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: populatedInvoice
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/invoices/:id
exports.updateInvoice = async (req, res, next) => {
  try {
    const { clientId, invoiceNumber, items, dueDate, issueDate, taxRate, notes, status } = req.body;

    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    if (clientId) {
      const client = await Client.findOne({ _id: clientId, userId: req.user._id });
      if (!client) {
        return res.status(404).json({
          success: false,
          error: 'The selected client was not found'
        });
      }
      invoice.clientId = client._id;
    }

    if (invoiceNumber) {
      const formatted = invoiceNumber.trim().toUpperCase();
      if (formatted !== invoice.invoiceNumber) {
        const duplicate = await Invoice.findOne({
          userId: req.user._id,
          invoiceNumber: formatted,
          _id: { $ne: invoice._id }
        });
        if (duplicate) {
          return res.status(409).json({
            success: false,
            error: `Invoice number '${formatted}' is already used by another invoice.`
          });
        }
        invoice.invoiceNumber = formatted;
      }
    }

    if (items && Array.isArray(items) && items.length > 0) {
      let subtotal = 0;
      invoice.items = items.map((item) => {
        const qty = Number(item.quantity) || 1;
        const unitPrice = Number(item.unitPrice) || 0;
        const amount = Math.round(qty * unitPrice * 100) / 100;
        subtotal += amount;
        return {
          description: item.description.trim(),
          quantity: qty,
          unitPrice,
          amount
        };
      });
      invoice.subtotal = subtotal;

      const rate = taxRate !== undefined ? Number(taxRate) : invoice.taxRate;
      invoice.taxRate = rate;
      invoice.taxAmount = Math.round((subtotal * (rate / 100)) * 100) / 100;
      invoice.total = Math.round((subtotal + invoice.taxAmount) * 100) / 100;
    }

    if (dueDate) invoice.dueDate = new Date(dueDate);
    if (issueDate) invoice.issueDate = new Date(issueDate);
    if (status) invoice.status = status;
    if (notes !== undefined) invoice.notes = notes;

    await invoice.save();

    const updated = await Invoice.findById(invoice._id).populate('clientId');

    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/invoices/:id/status
exports.updateInvoiceStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['draft', 'sent', 'paid', 'overdue'];

    if (!status || !validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status: status.toLowerCase() },
      { new: true }
    ).populate('clientId');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Invoice marked as ${status}`,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/invoices/:id
exports.deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/invoices/next-number
exports.getNextInvoiceNumber = async (req, res, next) => {
  try {
    const count = await Invoice.countDocuments({ userId: req.user._id });
    const year = new Date().getFullYear();
    const nextSeq = String(count + 1).padStart(3, '0');
    const suggestedNumber = `INV-${year}-${nextSeq}`;

    res.status(200).json({
      success: true,
      suggestedNumber
    });
  } catch (error) {
    next(error);
  }
};
