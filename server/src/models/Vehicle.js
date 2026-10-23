const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['car', 'bike', 'auto', 'truck', 'bus', 'other'], required: true },
    make: { type: String, required: true, trim: true, maxlength: 50 },
    model: { type: String, required: true, trim: true, maxlength: 50 },
    registrationNumber: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },
    fuelType: { type: String, enum: ['petrol', 'diesel', 'electric', 'cng', 'hybrid'], required: true },
    year: { type: Number, min: 1950, max: new Date().getFullYear() + 1 },
    notes: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

// One owner cannot save the same registration number twice.
vehicleSchema.index({ owner: 1, registrationNumber: 1 }, { unique: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
