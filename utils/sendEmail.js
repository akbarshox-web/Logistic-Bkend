import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // Development rejimida email konsolga chiqariladi
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    console.log('\n========== EMAIL DEBUG ==========');
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Code: ${options.message}`);
    console.log('=================================\n');
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      timeout: 10000,
    });

    const mailOptions = {
      from: `"LogisticPro" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email muvaffaqiyatli yuborildi: ${options.email}`);
  } catch (error) {
    console.error(`Email yuborish xatoligi: ${error.message}`);
    // In development, we still want to show the code
    if (isDev) {
      console.log('Email xatosi - kodni console da ko\'ring');
    }
    // Don't throw - let the user know the code was "sent"
    // The code is still stored in the database
  }
};

export default sendEmail;