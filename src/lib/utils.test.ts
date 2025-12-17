import * as fc from 'fast-check'

// Simple utility function for testing
function addNumbers(a: number, b: number): number {
  return a + b
}

describe('Property-based testing setup', () => {
  it('should verify fast-check is working', () => {
    // **Feature: pipe-supply-website, Property Test: Addition is commutative**
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return addNumbers(a, b) === addNumbers(b, a)
      }),
      { numRuns: 100 }
    )
  })
})