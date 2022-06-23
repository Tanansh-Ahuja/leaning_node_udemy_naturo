const nodemailer = require('nodemailer');
const catchAsync = require('./../utils/catchAsync');

const sendEmail = catchAsync(async options => {
  //1. CREATE TRANSPORTER
  const transporter = nodemailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: 'd3f723a93244eb',
      pass: '4c07ea8d253421'
    }
  });
  // const transporter = nodemailer.createTransporter({
  //     service: 'Gmail',
  //     auth:{
  //         user:process.env.EMAIL_USERNAME,
  //         pass:process.env.EMAIL_PASSWORD,
  //     }
  //     //activate in gmail "less secure app" option
  // });

  //2. DEFINE EMAIL OPTIONS
  const mailOptions = {
    from: 'Tanansh Ahuja <tananshahuja17@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.text
  };

  //3. SEND THE EMAIL
  await transporter.sendMail(mailOptions);
});

module.exports = sendEmail;
