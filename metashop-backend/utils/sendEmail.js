import nodemailer from 'nodemailer';

const sendOrderConfirmationEmail = async (email, order) => {
  try {
    // Generate test SMTP service account from ethereal.email
    // Only needed if we don't have a real mail account for testing
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });

    const itemsHtml = order.orderItems.map(item => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid rgba(20,17,15,0.12); font-size: 14px;">${item.name}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid rgba(20,17,15,0.12); font-size: 14px; color: #6B6259;">${item.qty}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid rgba(20,17,15,0.12); font-size: 14px; text-align: right;">₹${item.price}</td>
      </tr>
    `).join('');

    // Ink on bone, Didone wordmark, hairline rules — the same system as the
    // order confirmation screen the customer has just come from.
    const htmlContent = `
      <div style="font-family: Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #EDE7DE; color: #14110F; padding: 40px 32px;">
        <div style="font-family: Didot, 'Times New Roman', serif; font-size: 15px; letter-spacing: 0.34em; text-transform: uppercase; margin-bottom: 56px;">
          AIYAASI
        </div>

        <h1 style="font-family: Didot, 'Times New Roman', serif; font-size: 34px; font-weight: 500; line-height: 1.1; margin: 0 0 14px 0;">
          Your order is placed
        </h1>
        <p style="font-size: 14px; line-height: 1.6; color: #6B6259; margin: 0 0 40px 0; max-width: 34em;">
          We have it, and we will write again the moment it ships.
        </p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(20,17,15,0.12); font-size: 13px; color: #6B6259;">Order</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(20,17,15,0.12); font-size: 13px; text-align: right;">${order._id}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(20,17,15,0.12); font-size: 13px; color: #6B6259;">Transaction</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(20,17,15,0.12); font-size: 13px; text-align: right;">${order.transactionId}</td>
          </tr>
        </table>

        <div style="font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #6B6259; margin-bottom: 12px;">
          Pieces
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <table style="width: 100%; border-collapse: collapse; margin-top: 24px;">
          <tr>
            <td style="font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #6B6259;">Paid</td>
            <td style="font-family: Didot, 'Times New Roman', serif; font-size: 26px; text-align: right;">₹${order.totalPrice}</td>
          </tr>
        </table>

        <p style="font-size: 12px; line-height: 1.6; color: #6B6259; margin: 56px 0 0 0;">
          AIYAASI
        </p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: '"AIYAASI" <support@aiyaashi.com>', // sender address — mailbox domain is infrastructure, left unchanged
      to: email, // list of receivers
      subject: `Your AIYAASI order — ${order.transactionId}`, // Subject line
      html: htmlContent, // html body
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    return true;

  } catch (error) {
    console.error("Email send failed: ", error);
    return false;
  }
};

export default sendOrderConfirmationEmail;
