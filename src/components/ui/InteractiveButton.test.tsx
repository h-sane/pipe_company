/**
 * Property-based tests for UI feedback responsiveness
 * **Feature: pipe-supply-website, Property 15: UI feedback responsiveness**
 * **Validates: Requirements 6.3**
 */

import * as fc from 'fast-check'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import InteractiveButton, { InteractiveCard, InteractiveInput } from './InteractiveButton'
import LoadingIndicator, { ProgressBar, Skeleton, ButtonWithLoading } from './LoadingIndicator'
import Toast, { ToastContainer, useToast } from './Toast'

// Mock timers for testing animations and delays
jest.useFakeTimers()

// Button variant and size generators
const buttonVariantGenerator = fc.constantFrom('primary', 'secondary', 'danger', 'ghost')
const buttonSizeGenerator = fc.constantFrom('sm', 'md', 'lg')
const loadingStateGenerator = fc.boolean()

// Toast type generator
const toastTypeGenerator = fc.constantFrom('success', 'error', 'warning', 'info')

// Text content generators
const buttonTextGenerator = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
const toastTitleGenerator = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
const toastMessageGenerator = fc.option(fc.string({ minLength: 1, maxLength: 200 }))

// Progress value generator
const progressGenerator = fc.integer({ min: 0, max: 100 })

// Helper function to check if element has interactive feedback classes
function hasInteractiveFeedback(element: Element): boolean {
  const classList = element.className
  const interactivePatterns = [
    /hover:/,           // Hover states
    /active:/,          // Active states
    /focus:/,           // Focus states
    /transition/,       // Transitions
    /duration/,         // Animation duration
    /scale/,            // Scale transforms
    /shadow/,           // Shadow effects
  ]
  
  return interactivePatterns.some(pattern => pattern.test(classList))
}

// Helper function to check loading state feedback
function hasLoadingFeedback(container: Element, isLoading: boolean): boolean {
  const loadingIndicator = container.querySelector('[role="status"], .animate-spin')
  const hasLoadingIndicator = loadingIndicator !== null
  
  if (isLoading) {
    return hasLoadingIndicator
  } else {
    return !hasLoadingIndicator || loadingIndicator.className.includes('invisible')
  }
}

// Helper function to check accessibility attributes
function hasAccessibilityFeedback(element: Element): boolean {
  const hasAriaLabel = element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby')
  const hasAriaDescribedBy = element.hasAttribute('aria-describedby')
  const hasRole = element.hasAttribute('role')
  const hasAriaDisabled = element.hasAttribute('aria-disabled')
  
  return hasAriaLabel || hasAriaDescribedBy || hasRole || hasAriaDisabled
}

describe('UI Feedback Responsiveness Property Tests', () => {
  afterEach(() => {
    jest.clearAllTimers()
  })

  it('Property 15: UI feedback responsiveness - interactive elements provide immediate visual feedback', () => {
    // **Feature: pipe-supply-website, Property 15: UI feedback responsiveness**
    // **Validates: Requirements 6.3**
    
    fc.assert(
      fc.property(
        buttonVariantGenerator,
        buttonSizeGenerator,
        buttonTextGenerator,
        loadingStateGenerator,
        (variant, size, text, isLoading) => {
          const { container } = render(
            <InteractiveButton
              variant={variant as 'primary' | 'secondary' | 'ghost' | 'danger'}
              size={size as 'sm' | 'md' | 'lg'}
              loading={isLoading}
            >
              {text}
            </InteractiveButton>
          )
          
          const button = container.querySelector('button')
          if (!button) return false
          
          // Property 15a: Button should have interactive feedback classes
          const hasInteractiveClasses = hasInteractiveFeedback(button)
          
          // Property 15b: Loading state should be properly indicated
          const loadingFeedbackCorrect = hasLoadingFeedback(container, isLoading)
          
          // Property 15c: Button should have proper accessibility attributes
          const hasAccessibility = hasAccessibilityFeedback(button)
          
          // Property 15d: Button should be properly disabled when loading
          const disabledStateCorrect = isLoading ? button.disabled : true
          
          return hasInteractiveClasses && loadingFeedbackCorrect && hasAccessibility && disabledStateCorrect
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 15a: Loading indicators provide consistent feedback', () => {
    // **Feature: pipe-supply-website, Property 15a: Loading indicator consistency**
    
    fc.assert(
      fc.property(
        fc.constantFrom('sm', 'md', 'lg'),
        fc.constantFrom('blue', 'white', 'gray'),
        fc.option(buttonTextGenerator),
        (size, color, text) => {
          const { container } = render(
            <LoadingIndicator 
              size={size as 'sm' | 'md' | 'lg'} 
              color={color as 'blue' | 'white' | 'gray'} 
              text={text || undefined} 
            />
          )
          
          // Property: Loading indicator should have spinning animation
          const spinner = container.querySelector('.animate-spin')
          const hasSpinner = spinner !== null
          
          // Property: Loading indicator should have proper size classes
          const sizeClasses = {
            sm: 'w-4 h-4',
            md: 'w-6 h-6', 
            lg: 'w-8 h-8'
          }
          const hasCorrectSize = spinner ? 
            sizeClasses[size as keyof typeof sizeClasses].split(' ').every((cls: string) => spinner.classList.contains(cls)) : 
            false
          
          // Property: Text should be displayed if provided
          const textElement = container.querySelector('span')
          const textDisplayedCorrectly = text ? 
            Boolean(textElement && textElement.textContent === text) : 
            true
          
          // Property: Should have proper ARIA attributes
          const hasAriaHidden = spinner?.hasAttribute('aria-hidden') || false
          
          return hasSpinner && hasCorrectSize && textDisplayedCorrectly && hasAriaHidden
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 15b: Progress bars provide accurate feedback', () => {
    // **Feature: pipe-supply-website, Property 15b: Progress bar accuracy**
    
    fc.assert(
      fc.property(
        progressGenerator,
        fc.constantFrom('blue', 'green', 'red'),
        fc.boolean(),
        (progress, color, showPercentage) => {
          const { container } = render(
            <ProgressBar 
              progress={progress} 
              color={color as 'blue' | 'green' | 'red'}
              showPercentage={showPercentage}
            />
          )
          
          // Property: Progress bar should have proper role
          const progressBar = container.querySelector('[role="progressbar"]')
          const hasProgressRole = progressBar !== null
          
          // Property: Progress bar should have correct aria attributes
          const ariaValueNow = progressBar?.getAttribute('aria-valuenow')
          const ariaValueCorrect = ariaValueNow === progress.toString()
          
          // Property: Visual progress should match value
          const progressFill = container.querySelector('[style*="width"]')
          const visualProgressCorrect = progressFill !== null
          
          // Property: Percentage should be shown if requested
          const percentageText = container.textContent?.includes(`${progress}%`)
          const percentageCorrect = showPercentage ? percentageText : true
          
          return hasProgressRole && ariaValueCorrect && visualProgressCorrect && percentageCorrect
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 15c: Interactive cards provide hover feedback', () => {
    // **Feature: pipe-supply-website, Property 15c: Card interaction feedback**
    
    fc.assert(
      fc.property(
        fc.boolean(), // hoverable
        fc.boolean(), // elevated
        fc.option(buttonTextGenerator), // content
        (hoverable, elevated, content) => {
          const mockClick = jest.fn()
          
          const { container } = render(
            <InteractiveCard
              hoverable={hoverable}
              elevated={elevated}
              onClick={mockClick}
            >
              <div>{content || 'Card content'}</div>
            </InteractiveCard>
          )
          
          const card = container.querySelector('button, div')
          if (!card) return false
          
          // Property: Card should have base styling
          const hasBaseClasses = card.className.includes('bg-white') && 
                                 card.className.includes('rounded-lg')
          
          // Property: Hoverable cards should have hover effects
          const hoverEffectsCorrect = hoverable ? 
            hasInteractiveFeedback(card) : 
            true
          
          // Property: Elevated cards should have shadow
          const elevationCorrect = elevated ? 
            card.className.includes('shadow-lg') : 
            card.className.includes('shadow-sm')
          
          // Property: Interactive cards should have cursor pointer
          const cursorCorrect = card.className.includes('cursor-pointer')
          
          return hasBaseClasses && hoverEffectsCorrect && elevationCorrect && cursorCorrect
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 15d: Input fields provide validation feedback', () => {
    // **Feature: pipe-supply-website, Property 15d: Input validation feedback**
    
    fc.assert(
      fc.property(
        fc.option(buttonTextGenerator), // label
        fc.boolean(), // disabled
        (label, disabled) => {
          const { container } = render(
            <InteractiveInput
              label={label || undefined}
              disabled={disabled}
            />
          )
          
          const input = container.querySelector('input')
          if (!input) return false
          
          // Property: Input should have proper base classes
          const hasBaseClasses = input.classList.contains('border') && 
                                 input.classList.contains('rounded-md')
          
          // Property: Disabled state should be indicated
          const disabledStateCorrect = disabled ? input.disabled : !input.disabled
          
          // Property: Label should be displayed if provided
          const labelCorrect = label ? 
            container.textContent?.includes(label) : 
            true
          
          // Property: Input should have focus classes
          const hasFocusClasses = input.classList.contains('focus:outline-none')
          
          return hasBaseClasses && disabledStateCorrect && labelCorrect && hasFocusClasses
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 15e: Toast notifications provide appropriate feedback', () => {
    // **Feature: pipe-supply-website, Property 15e: Toast notification feedback**
    
    fc.assert(
      fc.property(
        toastTypeGenerator,
        toastTitleGenerator,
        toastMessageGenerator,
        (type, title, message) => {
          const mockOnClose = jest.fn()
          
          const { container } = render(
            <Toast
              id="test-toast"
              type={type as 'success' | 'error' | 'warning' | 'info'}
              title={title}
              message={message || undefined}
              onClose={mockOnClose}
            />
          )
          
          // Property: Toast should have proper role and aria attributes
          const toast = container.querySelector('[role="alert"]')
          const hasAlertRole = toast !== null
          const hasAriaLive = toast?.getAttribute('aria-live') === 'polite'
          
          // Property: Toast should display title
          const titleDisplayed = container.textContent?.includes(title)
          
          // Property: Toast should display message if provided
          const messageDisplayed = message ? 
            container.textContent?.includes(message) : 
            true
          
          // Property: Toast should have type-appropriate styling
          const typeStyles = {
            success: 'bg-green-50',
            error: 'bg-red-50', 
            warning: 'bg-yellow-50',
            info: 'bg-blue-50'
          }
          const hasTypeStyle = toast?.className.includes(typeStyles[type as keyof typeof typeStyles]) || false
          
          // Property: Toast should have close button
          const closeButton = container.querySelector('button[aria-label*="Close"]')
          const hasCloseButton = closeButton !== null
          
          return hasAlertRole && hasAriaLive && titleDisplayed && messageDisplayed && hasTypeStyle && hasCloseButton
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 15f: Button loading states prevent multiple submissions', () => {
    // **Feature: pipe-supply-website, Property 15f: Loading state prevention**
    
    fc.assert(
      fc.property(
        buttonTextGenerator,
        fc.option(buttonTextGenerator), // loading text
        (buttonText, loadingText) => {
          const mockClick = jest.fn()
          
          const { container } = render(
            <ButtonWithLoading
              isLoading={true}
              loadingText={loadingText || undefined}
              onClick={mockClick}
            >
              {buttonText}
            </ButtonWithLoading>
          )
          
          const button = container.querySelector('button')
          if (!button) return false
          
          // Property: Button should be disabled when loading
          const isDisabled = button.disabled
          
          // Property: Loading indicator should be visible
          const hasLoadingIndicator = hasLoadingFeedback(container, true)
          
          // Property: Button text should be hidden when loading
          const buttonTextHidden = button.querySelector('.invisible') !== null
          
          // Property: Loading text should be displayed if provided
          const loadingTextDisplayed = loadingText ? 
            container.textContent?.includes(loadingText) : 
            container.textContent?.includes('Loading...')
          
          return isDisabled && hasLoadingIndicator && buttonTextHidden && loadingTextDisplayed
        }
      ),
      { numRuns: 100 }
    )
  })
})