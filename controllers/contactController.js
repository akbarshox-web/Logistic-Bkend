import Contact from '../models/Contact.js';
import { asyncHandler } from '../middleware/dbMiddleware.js';
import { logActivity, getClientIp } from '../utils/activityLogger.js';

// @desc    Yangi xabar yuborish (public)
// @route   POST /api/contacts
const createContact = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({
      success: false,
      message: 'Ism, email, mavzu va xabar kiritilishi shart',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Email formati noto\'g\'ri',
    });
  }

  const contact = await Contact.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: (phone || '').trim(),
    subject: subject.trim(),
    message: message.trim(),
    user: req.user?._id || null,
    ip: getClientIp(req),
  });

  await logActivity({
    type: 'contact_message',
    actor: req.user?._id,
    actorRole: req.user?.role || 'user',
    actorName: req.user?.name || name,
    targetType: 'contact',
    targetId: contact._id,
    targetName: name,
    description: `Yangi xabar: "${subject}"`,
    ip: getClientIp(req),
  });

  res.status(201).json({
    success: true,
    data: contact,
    message: 'Xabaringiz yuborildi. Tez orada javob beramiz.',
  });
});

// @desc    Barcha xabarlar (admin)
// @route   GET /api/contacts
const getContacts = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const status = req.query.status;
  const search = req.query.search;

  const filter = {};
  if (status) filter.status = status;
  if (search) {
    const re = new RegExp(search, 'i');
    filter.$or = [{ name: re }, { email: re }, { subject: re }];
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Contact.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Bitta xabar
// @route   GET /api/contacts/:id
const getContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id);
  if (!contact) {
    return res.status(404).json({ success: false, message: 'Xabar topilmadi' });
  }
  res.json({ success: true, data: contact });
});

// @desc    Xabarga javob berish va status o'zgartirish
// @route   PUT /api/contacts/:id
const updateContact = asyncHandler(async (req, res) => {
  const { status, adminReply } = req.body;
  const contact = await Contact.findById(req.params.id);
  if (!contact) {
    return res.status(404).json({ success: false, message: 'Xabar topilmadi' });
  }

  if (status) contact.status = status;
  if (adminReply !== undefined) {
    contact.adminReply = adminReply;
    contact.repliedAt = new Date();
    contact.repliedBy = req.user._id;
  }

  const updated = await contact.save();
  res.json({ success: true, data: updated });
});

// @desc    Xabarni o'chirish
// @route   DELETE /api/contacts/:id
const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id);
  if (!contact) {
    return res.status(404).json({ success: false, message: 'Xabar topilmadi' });
  }
  await Contact.deleteOne({ _id: contact._id });
  res.json({ success: true, message: 'Xabar o\'chirildi' });
});

export { createContact, getContacts, getContact, updateContact, deleteContact };