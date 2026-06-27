import jwt from 'jsonwebtoken';

const generateToken = (res, userId) => {
  const token = jwt.sign(
    { userId: userId.toString() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );

  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('jwt', token, {
    httpOnly: true,  // JS dan o'qib bo'lmaydi (XSS himoya)
    secure: isProduction,  // HTTPS da true
    // ✅ sameSite:
    // - 'none' + secure: turli domainlar orasida (production, Vercel → backend)
    // - 'lax': local development uchun
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,  // 30 kun
    path: '/',
  });

  return token;
};

export default generateToken;