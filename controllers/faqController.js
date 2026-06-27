import Faq from '../models/Faq.js';
import { asyncHandler } from '../middleware/dbMiddleware.js';

// @desc    Barcha faol FAQ (public)
// @route   GET /api/faqs
const getFaqs = asyncHandler(async (req, res) => {
  const category = req.query.category;
  const filter = { isActive: true };
  if (category) filter.category = category;

  const faqs = await Faq.find(filter).sort({ order: 1, createdAt: -1 });
  res.json({ success: true, data: faqs });
});

// @desc    Barcha FAQ (admin)
// @route   GET /api/faqs/all
const getAllFaqs = asyncHandler(async (req, res) => {
  const faqs = await Faq.find({}).sort({ order: 1, createdAt: -1 });
  res.json({ success: true, data: faqs });
});

// @desc    Bitta FAQ
// @route   GET /api/faqs/:id
const getFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findById(req.params.id);
  if (!faq) return res.status(404).json({ success: false, message: 'FAQ topilmadi' });
  res.json({ success: true, data: faq });
});

// @desc    Yangi FAQ (admin)
// @route   POST /api/faqs
const createFaq = asyncHandler(async (req, res) => {
  const { question, answer, category, order, isActive } = req.body;

  if (!question || !answer) {
    return res.status(400).json({
      success: false,
      message: 'Savol va javob kiritilishi shart',
    });
  }

  const faq = await Faq.create({
    question,
    answer,
    category: category || 'umumiy',
    order: order || 0,
    isActive: isActive !== undefined ? isActive : true,
  });

  res.status(201).json({ success: true, data: faq });
});

// @desc    FAQ yangilash (admin)
// @route   PUT /api/faqs/:id
const updateFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findById(req.params.id);
  if (!faq) return res.status(404).json({ success: false, message: 'FAQ topilmadi' });

  const { question, answer, category, order, isActive } = req.body;
  if (question) faq.question = question;
  if (answer) faq.answer = answer;
  if (category) faq.category = category;
  if (order !== undefined) faq.order = order;
  if (isActive !== undefined) faq.isActive = isActive;

  const updated = await faq.save();
  res.json({ success: true, data: updated });
});

// @desc    FAQ o'chirish (admin)
// @route   DELETE /api/faqs/:id
const deleteFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findById(req.params.id);
  if (!faq) return res.status(404).json({ success: false, message: 'FAQ topilmadi' });
  await Faq.deleteOne({ _id: faq._id });
  res.json({ success: true, message: 'FAQ o\'chirildi' });
});

export { getFaqs, getAllFaqs, getFaq, createFaq, updateFaq, deleteFaq };