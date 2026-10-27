const mongoose = require('mongoose');
const { STATUSES } = require('../utils/statusRules');

const historySchema = new mongoose.Schema(
  {
    status: { type: String, enum: STATUSES, required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, trim: true, maxlength: 300 },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

// One collection holds both kinds of request. "type" tells them apart, and both follow the same status workflow.
const requestSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['breakdown', 'maintenance'], default: 'breakdown', index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    category: { type: String, required: true, trim: true, maxlength: 80 },
    serviceCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCategory' }, // maintenance only
    preferredDate: { type: Date }, // maintenance only
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 500 },
    address: { type: String, required: true, trim: true, maxlength: 250 },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    contactPhone: { type: String, required: true, trim: true },
    priority: { type: String, enum: ['Normal', 'High'], default: 'Normal' },
    status: { type: String, enum: STATUSES, default: 'Reported', index: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    rejectedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // providers who rejected it
    distanceKm: { type: Number, min: 0 }, // provider distance when automatically assigned
    etaMinutes: { type: Number, min: 0 }, // estimated travel time at an assumed average speed
    providerNotes: { type: String, trim: true, maxlength: 500 },
    estimatedCost: { type: Number, min: 0 },
    finalCost: { type: Number, min: 0 },
    statusHistory: [historySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('BreakdownRequest', requestSchema);
