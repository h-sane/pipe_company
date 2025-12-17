import Link from 'next/link'

interface ContactInfo {
  label: string
  value: string
  href?: string
  icon: string
}

interface FooterSection {
  title: string
  links: Array<{
    name: string
    href: string
    description?: string
  }>
}

const contactInfo: ContactInfo[] = [
  {
    label: 'Phone',
    value: '(555) 123-4567',
    href: 'tel:+15551234567',
    icon: '📞'
  },
  {
    label: 'Email',
    value: 'info@pipesupply.com',
    href: 'mailto:info@pipesupply.com',
    icon: '✉️'
  },
  {
    label: 'Address',
    value: '123 Industrial Blvd, Manufacturing City, ST 12345',
    href: 'https://maps.google.com/?q=123+Industrial+Blvd+Manufacturing+City+ST+12345',
    icon: '📍'
  },
  {
    label: 'Hours',
    value: 'Mon-Fri: 7:00 AM - 6:00 PM',
    icon: '🕐'
  }
]

const footerSections: FooterSection[] = [
  {
    title: 'Products',
    links: [
      { name: 'Steel Pipes', href: '/products?category=steel', description: 'High-quality steel piping solutions' },
      { name: 'PVC Pipes', href: '/products?category=pvc', description: 'Durable PVC pipe systems' },
      { name: 'Copper Pipes', href: '/products?category=copper', description: 'Premium copper piping' },
      { name: 'Specialty Pipes', href: '/products?category=specialty', description: 'Custom and specialty solutions' }
    ]
  },
  {
    title: 'Services',
    links: [
      { name: 'Custom Quotes', href: '/quote', description: 'Get personalized pricing' },
      { name: 'Technical Support', href: '/support', description: 'Expert technical assistance' },
      { name: 'Bulk Orders', href: '/bulk', description: 'Volume pricing available' },
      { name: 'Delivery', href: '/delivery', description: 'Fast and reliable delivery' }
    ]
  },
  {
    title: 'Company',
    links: [
      { name: 'About Us', href: '/about', description: 'Learn about our company' },
      { name: 'Certifications', href: '/certifications', description: 'View our certifications' },
      { name: 'Quality Assurance', href: '/quality', description: 'Our quality standards' },
      { name: 'Careers', href: '/careers', description: 'Join our team' }
    ]
  },
  {
    title: 'Support',
    links: [
      { name: 'Contact Us', href: '/contact', description: 'Get in touch' },
      { name: 'FAQ', href: '/faq', description: 'Frequently asked questions' },
      { name: 'Documentation', href: '/docs', description: 'Technical documentation' },
      { name: 'Returns', href: '/returns', description: 'Return policy' }
    ]
  }
]

const businessDetails = {
  companyName: 'Pipe Supply Co.',
  establishedYear: '1985',
  certifications: ['ISO 9001:2015', 'ASME Certified', 'API Approved'],
  serviceAreas: ['Manufacturing City', 'Industrial District', 'Metro Area'],
  specialties: ['Industrial Piping', 'Custom Fabrication', 'Emergency Supply']
}

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Information */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">PS</span>
              </div>
              <h3 className="text-xl font-bold">{businessDetails.companyName}</h3>
            </div>
            
            <p className="text-gray-300 mb-4 text-sm leading-relaxed">
              Serving the industrial community since {businessDetails.establishedYear}. 
              Your trusted partner for high-quality pipe supply and industrial equipment.
            </p>

            {/* Certifications */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-200 mb-2">Certifications</h4>
              <div className="flex flex-wrap gap-1">
                {businessDetails.certifications.map((cert) => (
                  <span
                    key={cert}
                    className="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </div>

            {/* Specialties */}
            <div>
              <h4 className="text-sm font-semibold text-gray-200 mb-2">Specialties</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                {businessDetails.specialties.map((specialty) => (
                  <li key={specialty} className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
                    {specialty}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer Navigation Sections */}
          {footerSections.map((section) => (
            <div key={section.title} className="lg:col-span-1">
              <h3 className="text-lg font-semibold mb-4 text-white">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-all duration-200 text-sm group hover:translate-x-1"
                      title={link.description}
                    >
                      <span className="group-hover:underline">{link.name}</span>
                      {link.description && (
                        <div className="text-xs text-gray-400 mt-1 group-hover:text-gray-300">
                          {link.description}
                        </div>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Information Section */}
        <div className="border-t border-gray-700 mt-12 pt-8">
          <h3 className="text-lg font-semibold mb-6 text-white">Contact Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((contact) => (
              <div key={contact.label} className="flex items-start space-x-3">
                <span className="text-lg" role="img" aria-label={contact.label}>
                  {contact.icon}
                </span>
                <div>
                  <h4 className="text-sm font-medium text-gray-200">{contact.label}</h4>
                  {contact.href ? (
                    <a
                      href={contact.href}
                      className="text-sm text-gray-300 hover:text-white transition-all duration-200 hover:underline hover:scale-105"
                      target={contact.href.startsWith('http') ? '_blank' : undefined}
                      rel={contact.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {contact.value}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-300">{contact.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Service Areas */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-200 mb-2">Service Areas</h4>
            <p className="text-sm text-gray-300">
              {businessDetails.serviceAreas.join(' • ')}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-sm text-gray-400">
              © {currentYear} {businessDetails.companyName}. All rights reserved.
            </div>
            
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-all duration-200 hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-all duration-200 hover:underline">
                Terms of Service
              </Link>
              <Link href="/accessibility" className="text-gray-400 hover:text-white transition-all duration-200 hover:underline">
                Accessibility
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}