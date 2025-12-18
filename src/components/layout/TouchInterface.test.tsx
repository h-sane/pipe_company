import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import * as fc from 'fast-check'
import { 
  TouchButton, 
  TouchInput, 
  TouchCard, 
  TouchToggle,
  SwipeHandler 
} from './TouchInterface'

describe('TouchInterface Components', () => {
  describe('TouchButton', () => {
    it('renders with correct touch-friendly classes', () => {
      render(<TouchButton>Click me</TouchButton>)
      const button = screen.getByRole('button')
      
      expect(button).toHaveClass('touch-target-large')
      expect(button).toHaveClass('interactive-scale')
    })

    it('handles click events', () => {
      const handleClick = jest.fn()
      render(<TouchButton onClick={handleClick}>Click me</TouchButton>)
      
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('shows loading state correctly', () => {
      render(<TouchButton loading>Click me</TouchButton>)
      
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('applies correct size classes', () => {
      const { rerender } = render(<TouchButton size="sm">Small</TouchButton>)
      expect(screen.getByRole('button')).toHaveClass('touch-target')
      
      rerender(<TouchButton size="lg">Large</TouchButton>)
      expect(screen.getByRole('button')).toHaveClass('min-h-[56px]')
    })

    it('handles touch events for press feedback', () => {
      render(<TouchButton>Touch me</TouchButton>)
      const button = screen.getByRole('button')
      
      fireEvent.touchStart(button)
      // Touch feedback is handled via inline styles, so we test the event handlers
      fireEvent.touchEnd(button)
    })
  })

  describe('TouchInput', () => {
    it('renders with touch-friendly sizing', () => {
      render(<TouchInput placeholder="Enter text" />)
      const input = screen.getByRole('textbox')
      
      expect(input).toHaveClass('touch-target-large')
      expect(input).toHaveStyle({ fontSize: '16px' })
    })

    it('handles value changes', () => {
      const handleChange = jest.fn()
      render(<TouchInput value="" onChange={handleChange} />)
      
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } })
      expect(handleChange).toHaveBeenCalledWith('test')
    })

    it('shows error state correctly', () => {
      render(<TouchInput error="This field is required" />)
      
      expect(screen.getByText('This field is required')).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toHaveClass('border-red-300')
    })

    it('shows required indicator', () => {
      render(<TouchInput label="Name" required />)
      
      expect(screen.getByText('*')).toBeInTheDocument()
    })
  })

  describe('TouchCard', () => {
    it('renders as clickable when onClick provided', () => {
      const handleClick = jest.fn()
      render(
        <TouchCard onClick={handleClick}>
          <div>Card content</div>
        </TouchCard>
      )
      
      const card = screen.getByRole('button')
      expect(card).toHaveClass('cursor-pointer')
      
      fireEvent.click(card)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('renders as non-interactive when no onClick', () => {
      render(
        <TouchCard>
          <div>Card content</div>
        </TouchCard>
      )
      
      const card = screen.getByText('Card content').parentElement
      expect(card).not.toHaveClass('cursor-pointer')
    })
  })

  describe('TouchToggle', () => {
    it('renders with correct initial state', () => {
      render(<TouchToggle checked={false} onChange={() => {}} />)
      const toggle = screen.getByRole('checkbox')
      
      expect(toggle).not.toBeChecked()
    })

    it('handles toggle changes', () => {
      const handleChange = jest.fn()
      render(<TouchToggle checked={false} onChange={handleChange} />)
      
      fireEvent.click(screen.getByRole('checkbox'))
      expect(handleChange).toHaveBeenCalledWith(true)
    })

    it('shows label when provided', () => {
      render(<TouchToggle checked={false} onChange={() => {}} label="Enable feature" />)
      
      expect(screen.getByText('Enable feature')).toBeInTheDocument()
    })

    it('applies correct size classes', () => {
      const { rerender } = render(
        <TouchToggle checked={false} onChange={() => {}} size="sm" />
      )
      
      // Check for small size container - look for the actual toggle div
      const toggleDiv = screen.getByRole('checkbox').parentElement?.querySelector('div')
      expect(toggleDiv).toHaveClass('w-8')
      
      rerender(<TouchToggle checked={false} onChange={() => {}} size="lg" />)
      const largToggleDiv = screen.getByRole('checkbox').parentElement?.querySelector('div')
      expect(largToggleDiv).toHaveClass('w-14')
    })
  })

  describe('SwipeHandler', () => {
    it('renders children correctly', () => {
      render(
        <SwipeHandler>
          <div>Swipeable content</div>
        </SwipeHandler>
      )
      
      expect(screen.getByText('Swipeable content')).toBeInTheDocument()
    })

    it('handles swipe gestures', () => {
      const handleSwipeLeft = jest.fn()
      const handleSwipeRight = jest.fn()
      
      render(
        <SwipeHandler onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight}>
          <div>Swipeable content</div>
        </SwipeHandler>
      )
      
      const container = screen.getByText('Swipeable content').parentElement
      
      // Simulate swipe right (start at 0, end at 100)
      fireEvent.touchStart(container!, {
        touches: [{ clientX: 0, clientY: 0 }]
      })
      fireEvent.touchEnd(container!, {
        changedTouches: [{ clientX: 100, clientY: 0 }]
      })
      
      expect(handleSwipeRight).toHaveBeenCalledTimes(1)
    })

    it('respects swipe threshold', () => {
      const handleSwipeLeft = jest.fn()
      
      render(
        <SwipeHandler onSwipeLeft={handleSwipeLeft} threshold={100}>
          <div>Swipeable content</div>
        </SwipeHandler>
      )
      
      const container = screen.getByText('Swipeable content').parentElement
      
      // Simulate small swipe (below threshold)
      fireEvent.touchStart(container!, {
        touches: [{ clientX: 100, clientY: 0 }]
      })
      fireEvent.touchEnd(container!, {
        changedTouches: [{ clientX: 50, clientY: 0 }]
      })
      
      expect(handleSwipeLeft).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('TouchButton has proper ARIA attributes', () => {
      render(<TouchButton disabled>Disabled button</TouchButton>)
      const button = screen.getByRole('button')
      
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })

    it('TouchInput has proper ARIA attributes for errors', () => {
      render(<TouchInput error="Invalid input" />)
      const input = screen.getByRole('textbox')
      
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAttribute('aria-describedby', 'error-message')
    })

    it('TouchCard has proper role when clickable', () => {
      render(
        <TouchCard onClick={() => {}}>
          <div>Clickable card</div>
        </TouchCard>
      )
      
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Touch-friendly sizing', () => {
    it('all interactive elements meet minimum touch target size', () => {
      render(
        <div>
          <TouchButton>Button</TouchButton>
          <TouchInput />
          <TouchToggle checked={false} onChange={() => {}} />
        </div>
      )
      
      const button = screen.getByRole('button')
      const input = screen.getByRole('textbox')
      const toggleContainer = screen.getByRole('checkbox').parentElement
      
      // Check that elements have touch-friendly classes
      expect(button).toHaveClass('touch-target-large')
      expect(input).toHaveClass('touch-target-large')
      expect(toggleContainer).toHaveClass('touch-target')
    })
  })

  describe('Property-Based Tests', () => {
    /**
     * **Feature: pipe-supply-website, Property 16: Touch interface optimization**
     * For any interactive element, the system should provide appropriately sized touch targets that meet accessibility guidelines
     * **Validates: Requirements 6.5**
     */
    it('Property 16: All interactive elements meet minimum touch target accessibility guidelines', () => {
      fc.assert(
        fc.property(
          // Generate random component configurations
          fc.record({
            buttonSize: fc.constantFrom('sm', 'md', 'lg'),
            buttonVariant: fc.constantFrom('primary', 'secondary', 'ghost'),
            buttonText: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
            inputType: fc.constantFrom('text', 'email', 'password', 'number', 'tel'),
            inputLabel: fc.option(fc.string({ minLength: 1, maxLength: 15 }).filter(s => s.trim().length > 0)),
            toggleSize: fc.constantFrom('sm', 'md', 'lg'),
            toggleLabel: fc.option(fc.string({ minLength: 1, maxLength: 15 }).filter(s => s.trim().length > 0)),
            cardClickable: fc.boolean(),
            disabled: fc.boolean()
          }),
          (config) => {
            const { container } = render(
              <div data-testid="touch-interface-container">
                <TouchButton 
                  size={config.buttonSize as 'sm' | 'md' | 'lg'}
                  variant={config.buttonVariant as 'primary' | 'secondary' | 'ghost'}
                  disabled={config.disabled}
                  onClick={() => {}}
                  data-testid="test-button"
                >
                  {config.buttonText}
                </TouchButton>
                
                <TouchInput 
                  type={config.inputType as 'text' | 'email' | 'password' | 'number' | 'tel'}
                  label={config.inputLabel || undefined}
                  disabled={config.disabled}
                  data-testid="test-input"
                />
                
                <TouchToggle 
                  checked={false}
                  onChange={() => {}}
                  size={config.toggleSize as 'sm' | 'md' | 'lg'}
                  label={config.toggleLabel || undefined}
                  disabled={config.disabled}
                />
                
                <TouchCard 
                  onClick={config.cardClickable ? () => {} : undefined}
                  data-testid="test-card"
                >
                  <div>Card content</div>
                </TouchCard>
              </div>
            )

            // Get all interactive elements using container-scoped selectors
            const testContainer = container.querySelector('[data-testid="touch-interface-container"]')!
            const button = testContainer.querySelector('[data-testid="test-button"]') as HTMLButtonElement
            const input = testContainer.querySelector('[data-testid="test-input"]') as HTMLInputElement
            const toggle = testContainer.querySelector('input[type="checkbox"]') as HTMLInputElement
            const card = config.cardClickable ? testContainer.querySelector('[data-testid="test-card"]') as HTMLElement : null

            expect(button).toBeTruthy()
            expect(input).toBeTruthy()
            expect(toggle).toBeTruthy()

            // Verify touch target sizes based on component specifications
            const buttonStyles = window.getComputedStyle(button)
            const inputStyles = window.getComputedStyle(input)
            const toggleContainer = toggle.parentElement!
            const toggleStyles = window.getComputedStyle(toggleContainer)

            // TouchButton size requirements - check CSS classes for touch-friendly sizing
            if (config.buttonSize === 'sm') {
              // Small buttons should have touch-target class (44px minimum)
              expect(button.classList.contains('touch-target')).toBe(true)
            } else if (config.buttonSize === 'lg') {
              // Large buttons should have explicit min dimensions (56px)
              expect(button.classList.contains('min-h-[56px]')).toBe(true)
              expect(button.classList.contains('min-w-[56px]')).toBe(true)
            } else {
              // Medium buttons should have touch-target-large class (48px minimum)
              expect(button.classList.contains('touch-target-large')).toBe(true)
            }

            // TouchInput should always have large touch targets
            expect(input.classList.contains('touch-target-large')).toBe(true)

            // TouchToggle container should have appropriate touch targets
            expect(toggleContainer.classList.contains('touch-target')).toBe(true)

            // Verify CSS classes are applied correctly for touch sizing
            const touchTargetElements = [button, input, toggleContainer]
            touchTargetElements.forEach(element => {
              const hasMinTouchSize = 
                element.classList.contains('touch-target') ||
                element.classList.contains('touch-target-large') ||
                element.classList.contains('min-h-[56px]')
              
              expect(hasMinTouchSize).toBe(true)
            })

            // TouchCard when clickable should have proper interactive styling
            if (card) {
              expect(card.classList.contains('cursor-pointer')).toBe(true)
              expect(card.getAttribute('role')).toBe('button')
              expect(card.getAttribute('tabindex')).toBe('0')
            }

            // Verify all interactive elements have proper cursor styles when not disabled
            if (!config.disabled) {
              // Check CSS classes instead of computed styles for better JSDOM compatibility
              expect(button.classList.contains('disabled:cursor-not-allowed')).toBe(true)
              expect(input.classList.contains('cursor-not-allowed')).toBe(false)
              
              if (card) {
                expect(card.classList.contains('cursor-pointer')).toBe(true)
              }
            } else {
              // When disabled, elements should have disabled styling
              expect(button.classList.contains('disabled:cursor-not-allowed')).toBe(true)
              expect(input.classList.contains('cursor-not-allowed')).toBe(true)
            }

            // Verify focus accessibility for non-disabled elements
            if (!config.disabled) {
              act(() => {
                button.focus()
              })
              expect(document.activeElement).toBe(button)
              
              act(() => {
                input.focus()
              })
              expect(document.activeElement).toBe(input)
              
              act(() => {
                toggle.focus()
              })
              expect(document.activeElement).toBe(toggle)

              if (card) {
                act(() => {
                  card.focus()
                })
                expect(document.activeElement).toBe(card)
              }
            }

            // Verify ARIA attributes for accessibility
            if (config.disabled) {
              expect(button.getAttribute('aria-disabled')).toBe('true')
              expect(button.disabled).toBe(true)
              expect(input.disabled).toBe(true)
              expect(toggle.disabled).toBe(true)
            } else {
              expect(button.getAttribute('aria-disabled')).toBe('false')
              expect(button.disabled).toBe(false)
              expect(input.disabled).toBe(false)
              expect(toggle.disabled).toBe(false)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})