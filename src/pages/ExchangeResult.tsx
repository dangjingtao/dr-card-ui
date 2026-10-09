import { Navigate } from 'react-router-dom'

/**
 * Historical /exchange/result deep links cannot prove that a coupon was issued.
 * UX-E: do not mount a fake success screen from a URL, query or browser history.
 * The real exchange process now remains inside /exchange; remove the old query.
 */
export default function ExchangeResult() {
  return <Navigate to="/exchange" replace />
}
