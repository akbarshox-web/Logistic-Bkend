import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/dbMiddleware.js';

// ✅ DB holatini tekshirish
const checkDBConnection = (res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      message: "Ma'lumotlar bazasi bilan aloqa yo'q. Iltimos, keyinroq urinib ko'ring.",
      error: 'DATABASE_DISCONNECTED'
    });
    return false;
  }
  return true;
};

// @desc    Google Auth user & get token
// @route   POST /api/users/google
// @access  Public
const googleAuth = asyncHandler(async (req, res) => {
  if (!checkDBConnection(res)) return;

  const { credential, access_token } = req.body;
  let email, name;

  if (credential) {
    const decoded = jwt.decode(credential);
    if (!decoded || !decoded.email) {
      return res.status(400).json({ success: false, message: "Noto'g'ri Google token" });
    }
    email = decoded.email;
    name = decoded.name;
  } else if (access_token) {
    const https = await import('node:https');
    const userinfoResponse = await new Promise((resolve, reject) => {
      const req = https.get(
        `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`,
        (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve(JSON.parse(data)));
        }
      );
      req.on('error', reject);
      req.end();
    });

    if (!userinfoResponse.email) {
      return res.status(400).json({ success: false, message: "Google userinfo olishda xato" });
    }
    email = userinfoResponse.email;
    name = userinfoResponse.name;
  } else {
    return res.status(400).json({ success: false, message: "Google credential yoki access_token topilmadi" });
  }

  let user = await User.findOne({ email });

  if (!user) {
    let role = 'user';
    if (email === process.env.ADMIN_EMAIL) {
      role = 'superadmin';
    }
    const randomPassword = Math.random().toString(36).slice(-16) + 'Google!2024';
    user = await User.create({
      name: name || email.split('@')[0],
      email,
      password: randomPassword,
      role,
      isVerified: true
    });
  }

  if (!user.isVerified) {
    await User.updateOne({ _id: user._id }, { isVerified: true });
    user.isVerified = true;
  }

  generateToken(res, user._id);

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  if (!checkDBConnection(res)) return;

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email va parol kiritilishi shart'
    });
  }

  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({
      success: false,
      message: 'Email yoki parol noto\'g\'ri'
    });
  }

  if (!user.isVerified) {
    return res.status(401).json({
      success: false,
      message: 'Iltimos, avval emailingizni tasdiqlang',
      needsVerification: true,
      email: user.email
    });
  }

  generateToken(res, user._id);

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  if (!checkDBConnection(res)) return;

  const { name, email, password } = req.body;

  // ✅ Validatsiya
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Ism, email va parol kiritilishi shart'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'
    });
  }

  // ✅ Email formatini tekshirish
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Email formati noto\'g\'ri'
    });
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({
      success: false,
      message: 'Bu email allaqachon ro\'yxatdan o\'tgan. Tizimga kiring.'
    });
  }

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationExpire = Date.now() + 10 * 60 * 1000;

  let role = 'user';
  if (email === process.env.ADMIN_EMAIL) {
    role = 'superadmin';
  }

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role,
    verificationCode,
    verificationExpire,
    isVerified: false
  });

  // ✅ Development rejimida kodni qaytaramiz (test oson bo'lishi uchun)
  const isDev = process.env.NODE_ENV !== 'production';

  try {
    await sendEmail({
      email: user.email,
      subject: 'Email tasdiqlash kodi',
      message: `Sizning tasdiqlash kodingiz: ${verificationCode}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">LogisticPro Tasdiqlash</h2>
          <p>Salom ${user.name},</p>
          <p>Ro'yxatdan o'tganingiz uchun rahmat. Emailingizni tasdiqlash uchun quyidagi koddan foydalaning:</p>
          <div style="background: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; border-radius: 5px; margin: 20px 0;">
            ${verificationCode}
          </div>
          <p>Kod 10 daqiqa davomida amal qiladi.</p>
        </div>
      `
    });

    res.status(201).json({
      success: true,
      message: 'Tasdiqlash kodi emailingizga yuborildi',
      email: user.email,
      ...(isDev && { devCode: verificationCode })
    });
  } catch (emailError) {
    console.error('Email xatosi:', emailError.message);
    // Email yuborilmasa ham — foydalanuvchi yaratildi
    res.status(201).json({
      success: true,
      message: 'Ro\'yxatdan o\'tdingiz! Email yuborishda muammo, kodni konsoldan oling.',
      email: user.email,
      devCode: isDev ? verificationCode : undefined
    });
  }
});

// @desc    Admin tomonidan yangi admin/user yaratish
// @route   POST /api/users/admin-create
// @access  Private/Superadmin
const adminCreateUser = asyncHandler(async (req, res) => {
  if (!checkDBConnection(res)) return;

  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Ism, email va parol talab qilinadi"
    });
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({
      success: false,
      message: 'Bu email allaqachon mavjud'
    });
  }

  const validRoles = ['admin', 'user'];
  const finalRole = validRoles.includes(role) ? role : 'user';

  const user = await User.create({
    name,
    email,
    password,
    role: finalRole,
    isVerified: true
  });

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    }
  });
});

// @desc    Verify email with OTP
// @route   POST /api/users/verify
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  if (!checkDBConnection(res)) return;

  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({
      success: false,
      message: 'Email va kod kiritilishi shart'
    });
  }

  const user = await User.findOne({
    email,
    verificationCode: code,
    verificationExpire: { $gt: Date.now() }
  });

  if (!user) {
    // Aniqroq xato
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi'
      });
    }
    if (existingUser.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email allaqachon tasdiqlangan. Tizimga kiring.'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Tasdiqlash kodi noto\'g\'ri yoki muddati o\'tgan'
    });
  }

  await User.updateOne(
    { _id: user._id },
    {
      isVerified: true,
      verificationCode: undefined,
      verificationExpire: undefined
    }
  );

  generateToken(res, user._id);

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    message: 'Email muvaffaqiyatli tasdiqlandi'
  });
});

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
const logoutUser = (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('jwt', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    expires: new Date(0)
  });

  res.status(200).json({
    success: true,
    message: 'Tizimdan chiqildi'
  });
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Superadmin
const getUsers = asyncHandler(async (req, res) => {
  if (!checkDBConnection(res)) return;

  const users = await User.find({}).select('-password -verificationCode -verificationExpire');
  res.json({
    success: true,
    data: users
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Superadmin
const deleteUser = asyncHandler(async (req, res) => {
  if (!checkDBConnection(res)) return;

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Foydalanuvchi topilmadi'
    });
  }

  if (user.role === 'superadmin') {
    return res.status(400).json({
      success: false,
      message: 'Superadminni o\'chirib bo\'lmaydi'
    });
  }

  await User.deleteOne({ _id: user._id });
  res.json({
    success: true,
    message: 'Foydalanuvchi o\'chirildi'
  });
});

// @desc    Resend verification code
// @route   POST /api/users/resend
// @access  Public
const resendVerificationCode = asyncHandler(async (req, res) => {
  if (!checkDBConnection(res)) return;

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email kiritilishi shart'
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Foydalanuvchi topilmadi'
    });
  }

  if (user.isVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email allaqachon tasdiqlangan. Tizimga kiring.'
    });
  }

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationExpire = Date.now() + 10 * 60 * 1000;

  await User.updateOne(
    { _id: user._id },
    {
      verificationCode: verificationCode,
      verificationExpire: verificationExpire
    }
  );

  const isDev = process.env.NODE_ENV !== 'production';

  try {
    await sendEmail({
      email: user.email,
      subject: 'Email tasdiqlash kodi (qayta yuborildi)',
      message: `Sizning yangi tasdiqlash kodingiz: ${verificationCode}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">LogisticPro Tasdiqlash</h2>
          <p>Salom ${user.name},</p>
          <p>Siz yangi tasdiqlash kodi so'radingiz. Quyidagi koddan foydalaning:</p>
          <div style="background: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; border-radius: 5px; margin: 20px 0;">
            ${verificationCode}
          </div>
          <p>Kod 10 daqiqa davomida amal qiladi.</p>
        </div>
      `
    });

    res.json({
      success: true,
      message: 'Yangi tasdiqlash kodi emailingizga yuborildi',
      email: user.email,
      ...(isDev && { devCode: verificationCode })
    });
  } catch (emailError) {
    console.error('Email xatosi:', emailError.message);
    res.json({
      success: true,
      message: 'Email yuborishda muammo, kodni konsoldan oling.',
      email: user.email,
      devCode: isDev ? verificationCode : undefined
    });
  }
});

// @desc    Get current user
// @route   GET /api/users/me
// @access  Private
const getCurrentUser = asyncHandler(async (req, res) => {
  if (!checkDBConnection(res)) return;

  if (!req.user || !req.user._id) {
    return res.status(401).json({
      success: false,
      message: 'Foydalanuvchi topilmadi'
    });
  }

  const user = await User.findById(req.user._id).select('-password -verificationCode -verificationExpire');
  if (user) {
    res.json({
      success: true,
      data: user
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Foydalanuvchi topilmadi'
    });
  }
});

// @desc    Profilni yangilash
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  if (!checkDBConnection(res)) return;

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
  }

  const { name, email, phone, avatar } = req.body;

  if (name) user.name = name.trim();
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Email formati noto\'g\'ri' });
    }
    // Email band bo'lsa va boshqa user bo'lsa — xato
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing && existing._id.toString() !== user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Bu email allaqachon band' });
    }
    user.email = email.toLowerCase().trim();
  }
  if (phone !== undefined) user.phone = phone.trim();
  if (avatar !== undefined) user.avatar = avatar;

  const updated = await user.save();
  const obj = updated.toObject();
  delete obj.password;
  delete obj.verificationCode;
  delete obj.verificationExpire;

  res.json({ success: true, data: obj, message: 'Profil yangilandi' });
});

// @desc    Parolni o'zgartirish
// @route   PUT /api/users/password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  if (!checkDBConnection(res)) return;

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Joriy va yangi parol kiritilishi shart',
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak',
    });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
  }

  const match = await user.matchPassword(currentPassword);
  if (!match) {
    return res.status(401).json({ success: false, message: 'Joriy parol noto\'g\'ri' });
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Parol o\'zgartirildi' });
});

export {
  googleAuth,
  authUser,
  registerUser,
  logoutUser,
  getUsers,
  deleteUser,
  verifyEmail,
  resendVerificationCode,
  getCurrentUser,
  adminCreateUser,
  updateProfile,
  changePassword,
};