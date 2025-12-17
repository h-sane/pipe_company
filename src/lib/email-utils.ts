// Simple email utility for quote notifications
// In production, this would integrate with services like SendGrid, AWS SES, etc.

export interface EmailOptions {
  to: string
  subject: string
  text: string
  html?: string
}

export interface QuoteNotificationData {
  quoteId: string
  customerName: string
  customerEmail: string
  company?: string
  products: Array<{
    productName: string
    quantity: number
    notes?: string
  }>
  message?: string
}

export async function sendQuoteNotificationToAdmin(data: QuoteNotificationData): Promise<boolean> {
  try {
    const subject = `New Quote Request - ${data.quoteId}`
    const text = generateAdminNotificationText(data)
    const html = generateAdminNotificationHtml(data)

    // In development, just log the email
    if (process.env.NODE_ENV === 'development') {
      console.log('=== ADMIN EMAIL NOTIFICATION ===')
      console.log(`To: ${process.env.ADMIN_EMAIL || 'admin@pipesupply.com'}`)
      console.log(`Subject: ${subject}`)
      console.log(`Text: ${text}`)
      console.log('================================')
      return true
    }

    // TODO: Implement actual email sending in production
    // Example with SendGrid:
    // const msg = {
    //   to: process.env.ADMIN_EMAIL,
    //   from: process.env.FROM_EMAIL,
    //   subject,
    //   text,
    //   html
    // }
    // await sgMail.send(msg)

    return true
  } catch (error) {
    console.error('Failed to send admin notification:', error)
    return false
  }
}

export async function sendQuoteConfirmationToCustomer(data: QuoteNotificationData): Promise<boolean> {
  try {
    const subject = `Quote Request Confirmation - ${data.quoteId}`
    const text = generateCustomerConfirmationText(data)
    const html = generateCustomerConfirmationHtml(data)

    // In development, just log the email
    if (process.env.NODE_ENV === 'development') {
      console.log('=== CUSTOMER EMAIL CONFIRMATION ===')
      console.log(`To: ${data.customerEmail}`)
      console.log(`Subject: ${subject}`)
      console.log(`Text: ${text}`)
      console.log('===================================')
      return true
    }

    // TODO: Implement actual email sending in production
    return true
  } catch (error) {
    console.error('Failed to send customer confirmation:', error)
    return false
  }
}

function generateAdminNotificationText(data: QuoteNotificationData): string {
  const products = data.products.map(p => 
    `- ${p.productName} (Qty: ${p.quantity})${p.notes ? ` - Notes: ${p.notes}` : ''}`
  ).join('\n')

  return `
New Quote Request Received

Quote ID: ${data.quoteId}
Customer: ${data.customerName}
Email: ${data.customerEmail}
${data.company ? `Company: ${data.company}` : ''}

Products Requested:
${products}

${data.message ? `Message: ${data.message}` : ''}

Please review and respond to this quote request in the admin panel.
  `.trim()
}

function generateAdminNotificationHtml(data: QuoteNotificationData): string {
  const products = data.products.map(p => 
    `<li>${p.productName} (Qty: ${p.quantity})${p.notes ? ` - <em>Notes: ${p.notes}</em>` : ''}</li>`
  ).join('')

  return `
    <h2>New Quote Request Received</h2>
    <p><strong>Quote ID:</strong> ${data.quoteId}</p>
    <p><strong>Customer:</strong> ${data.customerName}</p>
    <p><strong>Email:</strong> ${data.customerEmail}</p>
    ${data.company ? `<p><strong>Company:</strong> ${data.company}</p>` : ''}
    
    <h3>Products Requested:</h3>
    <ul>${products}</ul>
    
    ${data.message ? `<p><strong>Message:</strong> ${data.message}</p>` : ''}
    
    <p>Please review and respond to this quote request in the admin panel.</p>
  `
}

function generateCustomerConfirmationText(data: QuoteNotificationData): string {
  const products = data.products.map(p => 
    `- ${p.productName} (Qty: ${p.quantity})`
  ).join('\n')

  return `
Thank you for your quote request!

Quote ID: ${data.quoteId}

We have received your request for the following products:
${products}

Our team will review your request and respond within 24 hours.

If you have any questions, please contact us at:
Email: ${process.env.CONTACT_EMAIL || 'info@pipesupply.com'}
Phone: ${process.env.CONTACT_PHONE || '(555) 123-4567'}

Thank you for choosing our pipe supply services!
  `.trim()
}

function generateCustomerConfirmationHtml(data: QuoteNotificationData): string {
  const products = data.products.map(p => 
    `<li>${p.productName} (Qty: ${p.quantity})</li>`
  ).join('')

  return `
    <h2>Thank you for your quote request!</h2>
    <p><strong>Quote ID:</strong> ${data.quoteId}</p>
    
    <p>We have received your request for the following products:</p>
    <ul>${products}</ul>
    
    <p>Our team will review your request and respond within 24 hours.</p>
    
    <p>If you have any questions, please contact us at:</p>
    <p>
      <strong>Email:</strong> ${process.env.CONTACT_EMAIL || 'info@pipesupply.com'}<br>
      <strong>Phone:</strong> ${process.env.CONTACT_PHONE || '(555) 123-4567'}
    </p>
    
    <p>Thank you for choosing our pipe supply services!</p>
  `
}