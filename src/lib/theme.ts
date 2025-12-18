// Shared theme configuration for consistent styling across the application

export const theme = {
  colors: {
    primary: {
      50: 'bg-blue-50',
      100: 'bg-blue-100', 
      500: 'bg-blue-500',
      600: 'bg-blue-600',
      700: 'bg-blue-700',
      800: 'bg-blue-800',
    },
    text: {
      primary: 'text-blue-600',
      primaryDark: 'text-blue-700',
      primaryLight: 'text-blue-100',
      secondary: 'text-gray-600',
      dark: 'text-gray-900',
    },
    border: {
      primary: 'border-blue-200',
      secondary: 'border-gray-200',
    }
  },
  
  components: {
    // Hero section styling
    hero: 'bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-8',
    
    // Card styling
    card: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6',
    
    // Info box styling
    infoBox: 'bg-blue-50 border border-blue-200 rounded-lg p-6',
    
    // Button variants
    button: {
      primary: 'bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 hover:scale-105',
      secondary: 'border border-blue-600 text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-all duration-200 hover:scale-105',
      white: 'bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg'
    },
    
    // Badge styling
    badge: 'bg-blue-500 bg-opacity-50 px-3 py-1 rounded-full text-sm',
    
    // Loading spinner
    spinner: 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600',
    
    // Page background
    pageBackground: 'bg-gray-50'
  },
  
  layout: {
    // Container max widths
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    containerNarrow: 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8',
    
    // Spacing
    sectionPadding: 'py-8',
    cardSpacing: 'mb-8',
  }
}

// Utility functions for consistent styling
export const getButtonClass = (variant: 'primary' | 'secondary' | 'white' = 'primary') => {
  return theme.components.button[variant]
}

export const getHeroClass = () => {
  return theme.components.hero
}

export const getCardClass = () => {
  return theme.components.card
}

export const getInfoBoxClass = () => {
  return theme.components.infoBox
}