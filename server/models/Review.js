const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    reviewerName: { type: String, required: true, trim: true, maxlength: 120 },
    reviewerEmail: { type: String, trim: true, default: '' },
    reviewerInstagram: { type: String, trim: true, default: '' },
    projectType: { type: String, required: true, trim: true, maxlength: 120 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    reviewText: { type: String, required: true, trim: true, maxlength: 3000 },
    allowDisplay: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

reviewSchema.set('toJSON', {
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Review', reviewSchema);
