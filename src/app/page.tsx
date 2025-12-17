import Layout from '@/components/layout/Layout'
import Link from 'next/link'

export default function Home() {
  return (
    <Layout showBreadcrumbs={false}>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Professional Pipe Supply Solutions
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Your trusted partner for high-quality industrial piping since 1985
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg"
              >
                Browse Products
              </Link>
              <Link
                href="/quote"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg"
              >
                Request Quote
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Pipe Supply Co.?
            </h2>
            <p className="text-lg text-gray-600">
              Decades of experience delivering quality industrial piping solutions
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white">🏭</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Industrial Grade Quality</h3>
              <p className="text-gray-600">
                All products meet or exceed industry standards with full certifications
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">
                Quick turnaround times with reliable delivery to your job site
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white">🛠️</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert Support</h3>
              <p className="text-gray-600">
                Technical expertise and custom solutions for your specific needs
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Preview */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Product Categories
            </h2>
            <p className="text-lg text-gray-600">
              Comprehensive selection of industrial piping solutions
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Steel Pipes', description: 'High-strength steel piping', href: '/products?category=steel' },
              { name: 'PVC Pipes', description: 'Durable plastic piping systems', href: '/products?category=pvc' },
              { name: 'Copper Pipes', description: 'Premium copper solutions', href: '/products?category=copper' },
              { name: 'Specialty Pipes', description: 'Custom and specialty options', href: '/products?category=specialty' }
            ].map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:scale-105 hover:border-blue-300 group"
              >
                <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600 transition-colors">{category.name}</h3>
                <p className="text-gray-600 text-sm">{category.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Contact us today for a custom quote on your piping needs
          </p>
          <Link
            href="/contact"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg inline-block"
          >
            Contact Us Today
          </Link>
        </div>
      </section>
    </Layout>
  )
}