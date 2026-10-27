const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['customer', 'provider', 'admin'], default: 'customer' },
    // Providers must be approved by an admin before they can be assigned requests.
    isApproved: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    // Password reset by email: only a hash of the token is stored, never the token itself.
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    providerProfile: {
      services: [String],
      isAvailable: { type: Boolean, default: true },
      // Where the provider works from. Used to rank providers by distance.
      location: { lat: { type: Number, min: -90, max: 90 }, lng: { type: Number, min: -180, max: 180 } },
    },
  },
  { timestamps: true }
);

// Hash the password before saving. Plain text passwords are never stored.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10); // cost 10: still strong, about 4x faster than 12 on a small server
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
