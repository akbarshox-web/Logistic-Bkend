import Setting from '../models/Setting.js';
import { asyncHandler } from '../middleware/dbMiddleware.js';
import { logActivity, getClientIp } from '../utils/activityLogger.js';

// @desc    Sozlamalarni olish (public — faqat umumiy qism)
// @route   GET /api/settings
const getPublicSettings = asyncHandler(async (req, res) => {
  const settings = await Setting.getSingleton();
  // Maxfiy ma'lumotlarni chiqarib tashlaymiz
  const publicData = {
    siteName: settings.siteName,
    siteDescription: settings.siteDescription,
    contact: settings.contact,
    social: settings.social,
  };
  res.json({ success: true, data: publicData });
});

// @desc    To'liq sozlamalar (faqat admin)
// @route   GET /api/settings/admin
const getAdminSettings = asyncHandler(async (req, res) => {
  const settings = await Setting.getSingleton();
  res.json({ success: true, data: settings });
});

// @desc    Sozlamalarni yangilash (admin)
// @route   PUT /api/settings
const updateSettings = asyncHandler(async (req, res) => {
  const settings = await Setting.getSingleton();

  const allowedTopFields = ['siteName', 'siteDescription'];
  for (const field of allowedTopFields) {
    if (req.body[field] !== undefined) settings[field] = req.body[field];
  }

  if (req.body.contact) {
    settings.contact = { ...settings.contact.toObject(), ...req.body.contact };
  }
  if (req.body.social) {
    settings.social = { ...settings.social.toObject(), ...req.body.social };
  }
  if (req.body.smtp) {
    settings.smtp = { ...settings.smtp.toObject(), ...req.body.smtp };
  }
  if (req.body.pricing) {
    settings.pricing = { ...settings.pricing.toObject(), ...req.body.pricing };
  }
  if (req.body.system) {
    settings.system = { ...settings.system.toObject(), ...req.body.system };
  }

  await settings.save();

  await logActivity({
    type: 'settings_updated',
    actor: req.user._id,
    actorRole: req.user.role,
    actorName: req.user.name,
    targetType: 'settings',
    targetId: settings._id,
    description: 'Tizim sozlamalari yangilandi',
    ip: getClientIp(req),
  });

  res.json({ success: true, data: settings });
});

// @desc    Sozlamalarni default holatga qaytarish (admin)
// @route   POST /api/settings/reset
const resetSettings = asyncHandler(async (req, res) => {
  await Setting.deleteMany({});
  const settings = await Setting.getSingleton();
  res.json({ success: true, data: settings });
});

export { getPublicSettings, getAdminSettings, updateSettings, resetSettings };