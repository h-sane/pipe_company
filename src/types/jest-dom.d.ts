import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveClass(className: string): R
      toHaveStyle(style: Record<string, any>): R
      toBeDisabled(): R
      toBeChecked(): R
      toHaveAttribute(attr: string, value?: string): R
    }
  }
}