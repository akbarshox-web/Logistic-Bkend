import jwt from 'jsonwebtoken';

const generateToken = (res, userId) => {
  const token = jwt.sign(
    { userId: userId.toString() },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.cookie('jwt', token, {
    httpOnly: true,                                          // JS dan o'qib bo'lmaydi (XSS himoya)
    secure: process.env.NODE_ENV === 'production',          // HTTPS da true
    // ✅ FIX: 'strict' o'rniga 'lax' — Vite proxy bilan ham ishlaydi
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,                      // 30 kun
  });
};

export default generateToken;