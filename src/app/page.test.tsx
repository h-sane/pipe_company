import { render, screen } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import Home from './page'

describe('Home', () => {
  it('renders the main heading', () => {
    render(
      <SessionProvider session={null}>
        <Home />
      </SessionProvider>
    )
    const heading = screen.getByRole('heading', { name: /professional pipe supply solutions/i })
    expect(heading).toBeInTheDocument()
  })
})