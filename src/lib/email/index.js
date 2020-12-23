const sgMail = require("@sendgrid/mail")

module.exports = async (attachment) => {
  try {
    const myFile64 = attachment.toString("base64")
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    const email = {
      to: process.env.RECEIVER_EMAIL,
      from: process.env.SENDER_EMAIL,
      subject: "Order confirm",
      text: "Order confirm",
      attachments: [{
        content: myFile64,
        type: "plain/text",
        filename: "order.pdf",
        disposition: "attachment",
      }, ],
    }
    await sgMail.send(email)
  } catch (error) {
    console.log(JSON.stringify(error))
  }
}