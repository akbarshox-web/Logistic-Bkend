import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// @desc    Google Auth user & get token
// @route   POST /api/users/google
// @access  Public
const googleAuth = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ message: "Server xizmat ko'rsatmaydi. Iltimos keyinroq urinib ko'ring." });
      return;
    }

    const { credential, access_token } = req.body;

    let email, name, picture;

    if (credential) {
      // Credential (JWT) dan foydalanish
      const decoded = jwt.decode(credential);
      if (!decoded || !decoded.email) {
        res.status(400).json({ message: 'Noto\'g\'ri Google token' });
        return;
      }
      email = decoded.email;
      name = decoded.name;
      picture = decoded.picture;
    } else if (access_token) {
      // Access token dan foydalanish - Google userinfo endpoint
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
        res.status(400).json({ message: 'Google userinfo olishda xato' });
        return;
      }
      email = userinfoResponse.email;
      name = userinfoResponse.name;
      picture = userinfoResponse.picture;
    } else {
      res.status(400).json({ message: 'Google credential yoki access_token topilmadi' });
      return;
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user with Google
      let role = 'user';
      if (email === process.env.ADMIN_EMAIL) {
        role = 'superadmin';
      }

      // Generate random password for Google users
      const randomPassword = Math.random().toString(36).slice(-16) + 'Google!2024';

      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: randomPassword,
        role,
        isVerified: true // Google users are already verified
      });
    }

    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    generateToken(res, user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ message: "Server xizmat ko'rsatmaydi. Iltimos keyinroq urinib ko'ring." });
      return;
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (!user.isVerified) {
        res.status(401).json({ message: 'Iltimos, avval emailingizni tasdiqlang' });
        return;
      }

      generateToken(res, user._id);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } else {
      res.status(401).json({ message: 'Email yoki parol noto\'g\'ri' });
    }
  } catch (error) {
    console.error('Auth Error:', error);
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ message: "Server xizmat ko'rsatmaydi. Iltimos keyinroq urinib ko'ring." });
      return;
    }

    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: 'Foydalanuvchi allaqachon mavjud' });
      return;
    }

    // Generate 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Determine role
    let role = 'user';
    if (email === process.env.ADMIN_EMAIL) {
      role = 'superadmin';
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      verificationCode,
      verificationExpire,
      isVerified: false
    });

    if (user) {
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
              <p>Agar siz ro'yxatdan o'tmagan bo'lsangiz, ushbu xabarga e'tibor bermang.</p>
            </div>
          `
        });

        res.status(201).json({
          message: 'Tasdiqlash kodi emailingizga yuborildi',
          email: user.email
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Email yuborishda xatolik yuz berdi' });
      }
    } else {
      res.status(400).json({ message: 'Noto\'g\'ri foydalanuvchi ma\'lumotlari' });
    }
  } catch (error) {
    console.error('Auth Error:', error);
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};

// @desc    Verify email with OTP
// @route   POST /api/users/verify
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ message: "Server xizmat ko'rsatmaydi. Iltimos keyinroq urinib ko'ring." });
      return;
    }

    const { email, code } = req.body;

    const user = await User.findOne({
      email,
      verificationCode: code,
      verificationExpire: { $gt: Date.now() }
    });

    if (user) {
      user.isVerified = true;
      user.verificationCode = undefined;
      user.verificationExpire = undefined;
      await user.save();

      generateToken(res, user._id);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        message: 'Email muvaffaqiyatli tasdiqlandi'
      });
    } else {
      res.status(400).json({ message: 'Kod noto\'g\'ri yoki muddati o\'tgan' });
    }
  } catch (error) {
    console.error('Auth Error:', error);
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  res.status(200).json({ message: 'Tizimdan chiqildi' });
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ message: "Server xizmat ko'rsatmaydi" });
      return;
    }
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    console.error('Auth Error:', error);
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ message: "Server xizmat ko'rsatmaydi" });
      return;
    }
    const user = await User.findById(req.params.id);

    if (user) {
      if (user.role === 'superadmin') {
        res.status(400).json({ message: 'Superadminni o\'chirib bo\'lmaydi' });
        return;
      }
      await User.deleteOne({ _id: user._id });
      res.json({ message: 'Foydalanuvchi o\'chirildi' });
    } else {
      res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }
  } catch (error) {
    console.error('Auth Error:', error);
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};

// @desc    Resend verification code
// @route   POST /api/users/resend
// @access  Public
const resendVerificationCode = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ message: "Server xizmat ko'rsatmaydi" });
      return;
    }

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ message: 'Email allaqachon tasdiqlangan' });
      return;
    }

    // Generate new 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.verificationCode = verificationCode;
    user.verificationExpire = verificationExpire;
    await user.save();

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
            <p>Agar siz kod so'ramagan bo'lsangiz, ushbu xabarga e'tibor bermang.</p>
          </div>
        `
      });

      res.json({
        message: 'Yangi tasdiqlash kodi emailingizga yuborildi',
        email: user.email
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Email yuborishda xatolik yuz berdi' });
    }
  } catch (error) {
    console.error('Auth Error:', error);
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/users/me
// @access  Private
const getCurrentUser = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ message: "Server xizmat ko'rsatmaydi" });
      return;
    }
    const user = await User.findById(req.user._id).select('-password -verificationCode -verificationExpire');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }
  } catch (error) {
    console.error('Auth Error:', error);
    res.status(500).json({ message: 'Server xatoligi', error: error.message });
  }
};

export {
  googleAuth,
  authUser,
  registerUser,
  logoutUser,
  getUsers,
  deleteUser,
  verifyEmail,
  resendVerificationCode,
  getCurrentUser
};
