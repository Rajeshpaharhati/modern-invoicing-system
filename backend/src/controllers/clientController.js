const Client = require('../models/Client');
const Invoice = require('../models/Invoice');

// GET /api/clients
exports.getClients = async (req, res, next) => {
  try {
    const { search } = req.query;
    const query = { userId: req.user._id };

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { 'billingAddress.city': searchRegex }
      ];
    }

    const clients = await Client.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: clients.length,
      data: clients
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/clients/:id
exports.getClientById = async (req, res, next) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, userId: req.user._id });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    // Include recent invoices count and summary
    const invoiceStats = await Invoice.aggregate([
      { $match: { clientId: client._id, userId: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$total' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: client,
      stats: invoiceStats
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/clients
exports.createClient = async (req, res, next) => {
  try {
    const { name, email, phone, billingAddress } = req.body;

    // Check if client with this email already exists for this user
    const existing = await Client.findOne({
      userId: req.user._id,
      email: email.toLowerCase().trim()
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: `A client with email '${email}' already exists in your client directory.`
      });
    }

    const client = await Client.create({
      userId: req.user._id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      billingAddress: billingAddress || {}
    });

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: client
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/clients/:id
exports.updateClient = async (req, res, next) => {
  try {
    const { name, email, phone, billingAddress } = req.body;

    const client = await Client.findOne({ _id: req.params.id, userId: req.user._id });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    // If changing email, ensure no duplicate exists for this user
    if (email && email.toLowerCase().trim() !== client.email) {
      const duplicate = await Client.findOne({
        userId: req.user._id,
        email: email.toLowerCase().trim(),
        _id: { $ne: client._id }
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          error: `Another client with email '${email}' already exists.`
        });
      }
      client.email = email.toLowerCase().trim();
    }

    if (name) client.name = name.trim();
    if (phone !== undefined) client.phone = phone.trim();
    if (billingAddress !== undefined) client.billingAddress = billingAddress;

    await client.save();

    res.status(200).json({
      success: true,
      message: 'Client updated successfully',
      data: client
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/clients/:id
exports.deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, userId: req.user._id });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    // Check if client has associated invoices
    const associatedInvoicesCount = await Invoice.countDocuments({
      clientId: client._id,
      userId: req.user._id
    });

    if (associatedInvoicesCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete client. This client has ${associatedInvoicesCount} invoice(s) associated with them. Delete or reassign those invoices first.`
      });
    }

    await Client.deleteOne({ _id: client._id });

    res.status(200).json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
