import nodemailer from 'nodemailer';

const EMAIL_USER = process.env.EMAIL_USER || 'listow@guieloi.com';
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.larksuite.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '465');

if (!EMAIL_PASSWORD) {
    console.warn('⚠️ EMAIL_PASSWORD not set in environment variables. Email functionality will not work.');
}

const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465, // true for 465, false for other ports
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
    },
});

export const sendPasswordResetEmail = async (email: string, code: string): Promise<void> => {
    if (!EMAIL_PASSWORD) {
        throw new Error('Email service not configured. Please set EMAIL_PASSWORD in environment variables.');
    }

    const mailOptions = {
        from: `"Listow" <${EMAIL_USER}>`,
        to: email,
        subject: 'Código de Recuperação de Senha - Listow',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #6750A4;">Recuperação de Senha</h2>
        <p>Você solicitou a recuperação de senha para sua conta no Listow.</p>
        <p>Use o código abaixo para redefinir sua senha:</p>
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <h1 style="color: #6750A4; font-size: 32px; letter-spacing: 8px; margin: 0;">${code}</h1>
        </div>
        <p>Este código expira em 15 minutos.</p>
        <p>Se você não solicitou esta recuperação, ignore este email.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">Listow - Sua lista de compras inteligente</p>
      </div>
    `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent to:', email);
};
