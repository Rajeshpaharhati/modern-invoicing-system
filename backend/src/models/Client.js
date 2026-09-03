const mongoose = require('mongoose');

const billingAddressSchema = new mongoose.Schema(
  {
    street: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    zip: { type: String, default: '', trim: true },
    country: { type: String, default: '', trim: true }
  },
  { _id: false }
);

const clientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Client must belong to a user'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters']
    },
    email: {
      type: String,
      required: [true, 'Client email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    phone: {
      type: String,
      default: '',
      trim: true
    },
    billingAddress: {
      type: billingAddressSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true
  }
);

// Compound index to quickly find user clients and prevent duplicate email per user
clientSchema.index({ userId: 1, email: 1 });

module.exports = mongoose.model('Client', clientSchema);
