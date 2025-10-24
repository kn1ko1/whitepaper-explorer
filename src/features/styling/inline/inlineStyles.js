export const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb', // bg-gray-50
    fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif',
    WebkitFontSmoothing: 'antialiased',
    padding: 0,
  },
  container: {
    maxWidth: '1120px', // max-w-7xl
    marginInline: 'auto',
    padding: '1rem',
  },
  header: {
    backgroundColor: '#ffffff', // bg-white
    boxShadow: '0 6px 18px rgba(0,0,0,0.04)', // soft shadow
    position: 'sticky',
    top: 0,
    zIndex: 20,
    borderBottom: '1px solid rgba(140, 87, 255, 0.06)', // border-violet-100
  },
  headerInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: '#6d28d9', // violet-700
    letterSpacing: '0.025em',
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '.5rem',
    backgroundColor: '#f6f0ff', // violet-50
    padding: '.25rem .6rem',
    borderRadius: '9999px',
    border: '1px solid rgba(124,58,237,0.12)',
    color: '#4c1d95',
    fontSize: '.75rem',
    maxWidth: '240px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  searchPanel: {
    width: '100%',
    maxWidth: '64rem', // max-w-4xl center
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '24px',
    boxShadow: '0 20px 40px rgba(15,23,42,0.06)',
    border: '1px solid rgba(124,58,237,0.06)',
  },
  searchRow: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  searchInput: {
    width: '100%',
    padding: '0.9rem 1rem 0.9rem 3rem',
    border: '1px solid rgba(124,58,237,0.12)',
    borderRadius: '18px',
    outline: 'none',
    fontSize: '1rem',
    color: '#374151',
    boxShadow: 'inset 0 1px 2px rgba(15,23,42,0.02)',
  },
  select: {
    width: '14rem',
    padding: '0.9rem 1rem 0.9rem 3rem',
    border: '1px solid rgba(156,163,175,0.4)',
    borderRadius: '18px',
    backgroundColor: '#fff',
    fontSize: '1rem',
    color: '#374151',
    appearance: 'none',
    cursor: 'pointer',
  },
  clearButton: {
    marginLeft: '.75rem',
    padding: '.5rem .75rem',
    backgroundColor: '#f3f4f6',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '.9rem',
  },
  grid: {
    display: 'grid',
    gap: '2rem',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    paddingTop: '1.5rem',
  },
  cardFallback: {
    gridColumn: '1/-1',
    textAlign: 'center',
    padding: '5rem 2rem',
    backgroundColor: '#fff',
    borderRadius: '24px',
    boxShadow: '0 20px 40px rgba(2,6,23,0.04)',
    border: '1px solid rgba(229,231,235,0.6)',
  },
  footer: {
    backgroundColor: '#0f1724', // dark
    color: '#fff',
    textAlign: 'center',
    padding: '1.5rem 0',
    marginTop: '4rem',
  },
};