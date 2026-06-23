import nodemailer from 'nodemailer';

const sendEmail = async ({ email, subject, message, html }) => {
  console.log('========== EMAIL DEBUG ==========');
  console.log('To:', email);
  console.log('Subject:', subject);
  console.log('Code:', message);
  console.log('=================================');

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: `"LogisticPro" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    text: message,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email yuborildi:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email yuborish xatoligi:', error.message);
    throw error;
  }
};

export default sendEmail;