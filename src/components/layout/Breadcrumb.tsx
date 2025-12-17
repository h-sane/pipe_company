import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface BreadcrumbItem {
  name: string
  href: string
  current?: boolean
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  className?: string
}

// Default breadcrumb mapping based on pathname
const getDefaultBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Home', href: '/' }
  ]

  // Build breadcrumbs from URL segments
  let currentPath = ''
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const isLast = index === segments.length - 1
    
    // Convert segment to readable name
    const name = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    
    breadcrumbs.push({
      name,
      href: currentPath,
      current: isLast
    })
  })

  return breadcrumbs
}

// Custom breadcrumb mappings for specific pages
const customBreadcrumbs: Record<string, BreadcrumbItem[]> = {
  '/products': [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/products', current: true }
  ],
  '/quote': [
    { name: 'Home', href: '/' },
    { name: 'Quote Request', href: '/quote', current: true }
  ],
  '/about': [
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/about', current: true }
  ],
  '/contact': [
    { name: 'Home', href: '/' },
    { name: 'Contact', href: '/contact', current: true }
  ],
  '/admin': [
    { name: 'Home', href: '/' },
    { name: 'Admin Dashboard', href: '/admin', current: true }
  ],
  '/auth/signin': [
    { name: 'Home', href: '/' },
    { name: 'Sign In', href: '/auth/signin', current: true }
  ]
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  const pathname = usePathname()
  
  // Use provided items or generate from pathname
  const breadcrumbItems = items || customBreadcrumbs[pathname] || getDefaultBreadcrumbs(pathname)
  
  // Don't show breadcrumbs on home page or if only home exists
  if (pathname === '/' || breadcrumbItems.length <= 1) {
    return null
  }

  return (
    <nav 
      className={`flex ${className}`} 
      aria-label="Breadcrumb"
    >
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {breadcrumbItems.map((item, index) => (
          <li key={item.href} className="inline-flex items-center">
            {index > 0 && (
              <svg
                className="w-3 h-3 text-gray-400 mx-1"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 6 10"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="m1 9 4-4-4-4"
                />
              </svg>
            )}
            
            {item.current ? (
              <span 
                className="ml-1 text-sm font-medium text-gray-500 md:ml-2"
                aria-current="page"
              >
                {item.name}
              </span>
            ) : (
              <Link
                href={item.href}
                className="inline-flex items-center ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2 transition-colors"
              >
                {index === 0 && (
                  <svg
                    className="w-3 h-3 mr-2.5"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                  </svg>
                )}
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// Hook for programmatically setting breadcrumbs
export function useBreadcrumbs(items: BreadcrumbItem[]) {
  // This could be extended to use context or state management
  // For now, it's a placeholder for future enhancement
  return items
}