const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });
const nodemailer = require('nodemailer');

console.log('Testing loaded environment variables:');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS is set:', !!process.env.SMTP_PASS);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  family: 4,
  secure: false,
  tls: {
    rejectUnauthorized: false
  },
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

transporter.verify()
  .then(() => console.log('SMTP Verify: SUCCESS! Connection and credentials are correct.'))
  .catch(err => {
    console.error('SMTP Verify: FAILED!');
    console.error(err);
  });
