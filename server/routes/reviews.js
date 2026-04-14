const express = require('express');
const Review = require('../models/Review');
const { ensureAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/public', async (req, res) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.max(parseInt(req.query.limit || '6', 10), 1);
  const skip = (page - 1) * limit;

  const query = { status: 'approved', allowDisplay: true };
  const [items, total] = await Promise.all([
    Review.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Review.countDocuments(query),
  ]);

  res.json({
    success: true,
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  });
});

router.get('/stats', async (_req, res) => {
  const [all, approved, pending, rejected, approvedList] = await Promise.all([
    Review.countDocuments({}),
    Review.countDocuments({ status: 'approved', allowDisplay: true }),
    Review.countDocuments({ status: 'pending' }),
    Review.countDocuments({ status: 'rejected' }),
    Review.find({ status: 'approved', allowDisplay: true }).select('rating'),
  ]);

  const avg =
    approvedList.length > 0
      ? approvedList.reduce((sum, r) => sum + r.rating, 0) / approvedList.length
      : 0;

  res.json({
    success: true,
    total: all,
    approved,
    pending,
    rejected,
    averageRating: Number(avg.toFixed(1)),
    satisfactionRate: all > 0 ? Math.round((approved / all) * 100) : 0,
  });
});

router.post('/', async (req, res) => {
  const {
    reviewerName,
    reviewerEmail,
    reviewerInstagram,
    projectType,
    rating,
    reviewText,
    allowDisplay,
  } = req.body || {};

  if (!reviewerName || !projectType || !rating || !reviewText) {
    return res.status(400).json({
      success: false,
      message: 'Please fill in all required fields',
    });
  }

  const parsedRating = parseInt(rating, 10);
  if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 1 and 5',
    });
  }

  const review = await Review.create({
    reviewerName,
    reviewerEmail,
    reviewerInstagram,
    projectType,
    rating: parsedRating,
    reviewText,
    allowDisplay: allowDisplay !== false,
    status: 'pending',
  });

  return res.status(201).json({
    success: true,
    message: 'Review submitted successfully! It will appear after approval.',
    review,
  });
});

router.get('/admin/all', ensureAdmin, async (req, res) => {
  const status = req.query.status;
  const query = status && status !== 'all' ? { status } : {};

  const items = await Review.find(query).sort({ createdAt: -1 });
  return res.json({ success: true, items });
});

router.get('/admin/stats', ensureAdmin, async (_req, res) => {
  const [total, approved, pending, rejected, allItems] = await Promise.all([
    Review.countDocuments({}),
    Review.countDocuments({ status: 'approved' }),
    Review.countDocuments({ status: 'pending' }),
    Review.countDocuments({ status: 'rejected' }),
    Review.find({}).select('rating'),
  ]);

  const avg =
    allItems.length > 0
      ? allItems.reduce((sum, r) => sum + r.rating, 0) / allItems.length
      : 0;

  res.json({
    success: true,
    total,
    approved,
    pending,
    rejected,
    avgRating: Number(avg.toFixed(1)),
  });
});

router.patch('/admin/:id/status', ensureAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const updated = await Review.findByIdAndUpdate(id, { status }, { new: true });

  if (!updated) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  return res.json({ success: true, item: updated });
});

router.delete('/admin/:id', ensureAdmin, async (req, res) => {
  const { id } = req.params;
  const deleted = await Review.findByIdAndDelete(id);

  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  return res.json({ success: true });
});

module.exports = router;
