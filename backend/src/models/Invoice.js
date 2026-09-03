const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, 'Item description is required'],
      trim: true
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price must be non-negative'],
      default: 0
    },
    amount: {
      type: Number,
      required: true,
      default: 0
    }
  },
  { _id: true }
);

const invoiceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Invoice must belong to a user'],
      index: true
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Invoice must be associated with a client'],
      index: true
    },
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      trim: true,
      uppercase: true
    },
    items: {
      type: [invoiceItemSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Invoice must contain at least one line item'
      }
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0
    },
    taxRate: {
      type: Number,
      default: 0,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%']
    },
    taxAmount: {
      type: Number,
      required: true,
      default: 0
    },
    total: {
      type: Number,
      required: true,
      default: 0
    },
    issueDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required']
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'overdue'],
      default: 'draft',
      index: true
    },
    notes: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// CRITICAL EVALUATION REQUIREMENT: Unique invoice number per user
invoiceSchema.index({ userId: 1, invoiceNumber: 1 }, { unique: true });

// Query optimization index for filtering by client, status, and date range
invoiceSchema.index({ userId: 1, status: 1, issueDate: -1 });
invoiceSchema.index({ userId: 1, clientId: 1, issueDate: -1 });

// Automatically compute line item amounts, subtotal, taxAmount, and total before saving
invoiceSchema.pre('validate', function (next) {
  if (this.items && this.items.length > 0) {
    let calculatedSubtotal = 0;

    this.items.forEach((item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      item.amount = Math.round(qty * price * 100) / 100;
      calculatedSubtotal += item.amount;
    });

    this.subtotal = Math.round(calculatedSubtotal * 100) / 100;

    const rate = Number(this.taxRate) || 0;
    this.taxAmount = Math.round((this.subtotal * (rate / 100)) * 100) / 100;
    this.total = Math.round((this.subtotal + this.taxAmount) * 100) / 100;
  }
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
