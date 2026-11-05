const mongoose = require('mongoose');

const lineSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    name: String,
    variant: { type: String, default: '' },
    price: Number,
    qty: Number,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNo: { type: String, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerName: String,
    customerEmail: String,
    phone: String,
    items: [lineSchema],
    subtotal: Number,
    gst: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    total: Number,
    orderType: { type: String, enum: ['dine-in', 'takeaway', 'delivery'], default: 'dine-in' },
    tableNo: { type: String, default: '' },
    address: { type: String, default: '' },
    notes: { type: String, default: '' },
    paymentMethod: { type: String, enum: ['online', 'cod'], default: 'online' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    status: {
      type: String,
      enum: ['pending-payment', 'placed', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
      default: 'placed',
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    emailsSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
