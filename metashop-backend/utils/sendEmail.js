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
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.qty}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">₹${item.price}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaec; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #FF3F6C; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">MetaShop Order Confirmation</h1>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #282c3f; margin-top: 0;">Thank you for your purchase!</h2>
          <p style="color: #7e818c; font-size: 16px; line-height: 1.5;">Your payment has been successfully processed and your order is now confirmed.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 25px 0;">
            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order._id}</p>
            <p style="margin: 5px 0;"><strong>Transaction ID:</strong> <span style="color: #20B2AA;">${order.transactionId}</span></p>
            <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${order.totalPrice}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #f4f4f5; text-align: left;">
                <th style="padding: 10px;">Item</th>
                <th style="padding: 10px;">Qty</th>
                <th style="padding: 10px;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="margin-top: 40px; text-align: center; color: #7e818c; font-size: 14px;">
            <p>We'll send you another email when your order ships.</p>
            <p>MetaShop Team</p>
          </div>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: '"MetaShop Support" <support@metashop.com>', // sender address
      to: email, // list of receivers
      subject: `Order Confirmed - ${order.transactionId}`, // Subject line
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
