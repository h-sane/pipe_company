import ContactPage from '@/components/company/ContactPage'
import Layout from '@/components/layout/Layout'

export const metadata = {
  title: 'Contact Us - Pipe Supply Co.',
  description: 'Get in touch with Pipe Supply Co. for quotes, technical support, and pipe supply services. Multiple contact methods available.',
}

export default function Contact() {
  const breadcrumbItems = [
    { name: 'Home', href: '/' },
    { name: 'Contact Us', href: '/contact', current: true }
  ]

  return (
    <Layout breadcrumbItems={breadcrumbItems}>
      <ContactPage />
    </Layout>
  )
}