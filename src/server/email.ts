import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface EmailNotification {
  to: string[];
  subject: string;
  taskTitle: string;
  stageName: string;
  userName: string;
  message: string;
}

export async function sendStageUpdateNotification(data: EmailNotification) {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #9333ea 0%, #fbbf24 100%); padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">🎯 TaskQuest - Atualização de Etapa</h1>
        </div>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; color: #333;">Olá!</p>
          <p style="font-size: 14px; color: #666;">
            <strong>${data.userName}</strong> avançou na tarefa:
          </p>
          <div style="background: white; padding: 15px; border-left: 4px solid #9333ea; margin: 15px 0; border-radius: 4px;">
            <p style="margin: 0 0 10px 0;"><strong>📋 Tarefa:</strong> ${data.taskTitle}</p>
            <p style="margin: 0;"><strong>✅ Etapa:</strong> <span style="color: #9333ea; font-weight: bold;">${data.stageName}</span></p>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            ${data.message}
          </p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
            <p style="font-size: 12px; color: #999;">
              TaskQuest Pro - Gerenciador Gamificado Colaborativo
            </p>
          </div>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: data.to.join(','),
      subject: data.subject,
      html: htmlContent,
    });

    console.log('📧 Email enviado:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    // Não lançar erro para não quebrar a aplicação
    return null;
  }
}

export async function sendTaskInvitationEmail(to: string[], taskTitle: string, invitedBy: string) {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #9333ea 0%, #fbbf24 100%); padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">🎮 TaskQuest - Você foi convidado!</h1>
        </div>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; color: #333;">Olá!</p>
          <p style="font-size: 14px; color: #666;">
            <strong>${invitedBy}</strong> o(a) convidou para colaborar na tarefa:
          </p>
          <div style="background: white; padding: 15px; border-left: 4px solid #fbbf24; margin: 15px 0; border-radius: 4px;">
            <p style="margin: 0;"><strong>📋 Tarefa:</strong> ${taskTitle}</p>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            Acesse o TaskQuest para começar a colaborar e ganhar pontos!
          </p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
            <p style="font-size: 12px; color: #999;">
              TaskQuest Pro - Gerenciador Gamificado Colaborativo
            </p>
          </div>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: to.join(','),
      subject: `🎮 Você foi convidado para colaborar em: ${taskTitle}`,
      html: htmlContent,
    });

    console.log('📧 Email de convite enviado:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Erro ao enviar email de convite:', error);
    return null;
  }
}

