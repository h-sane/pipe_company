import CompanyShowcase from '@/components/company/CompanyShowcase'
import Layout from '@/components/layout/Layout'

export const metadata = {
  title: 'About Us - Pipe Supply Co.',
  description: 'Learn about Pipe Supply Co. - our history, certifications, service areas, and technical expertise in industrial pipe supply.',
}

export default function About() {
  const breadcrumbItems = [
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/about', current: true }
  ]

  return (
    <Layout breadcrumbItems={breadcrumbItems}>
      <CompanyShowcase />
    </Layout>
  )
}