export const styles = {
  app: {
    minHeight: '100vh',
    width: '100%',           // ensure full-width background
    minWidth: '100%',        // prevent body centering from shrinking
    boxSizing: 'border-box',
    backgroundColor: '#f9fafb', // bg-gray-50
    fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif',
    WebkitFontSmoothing: 'antialiased',
    padding: 0,
  },
  container: {
    maxWidth: '1280px', // max-w-7xl (standardized to match baseLayout)
    margin: '0 auto',
    padding: '1rem',
  },
  header: {
    backgroundColor: '#ffffff', // bg-white
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)', // subtle shadow-lg
    position: 'sticky',
    top: 0,
    zIndex: 20,
    borderBottom: '1px solid #ede9fe', // border-violet-100
  },
  headerInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem',
  },
  title: {
    fontSize: '1.875rem', // text-3xl (standardized)
    fontWeight: 800,
    color: '#6d28d9', // violet-700
    letterSpacing: '0.05em', // tracking-wider (standardized)
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '.5rem',
    backgroundColor: '#f5f3ff', // violet-50 (standardized)
    padding: '.25rem .75rem',
    borderRadius: '9999px',
    border: '1px solid #ddd6fe', // border-violet-200 (standardized)
    color: '#4b5563', // text-gray-600
    fontSize: '.75rem',
    maxWidth: '300px', // increased for longer IDs
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  logoutButton: {
    color: '#6b7280',
    padding: '0.5rem',
    borderRadius: '9999px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'color 0.15s, background-color 0.15s',
  },
  searchPanel: {
    width: '100%',
    maxWidth: '960px', // max-w-4xl (standardized)
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '1.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)', // subtle shadow-lg
    border: '1px solid #ddd6fe',
    transition: 'box-shadow 0.3s',
  },
  searchRow: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  searchInput: {
    width: '100%',
    padding: '0.875rem 1rem 0.875rem 3rem',
    border: '1px solid #c4b5fd',
    borderRadius: '0.75rem',
    outline: 'none',
    fontSize: '1rem',
    color: '#374151',
    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    transition: 'all 0.15s',
  },
  select: {
    width: '14rem',
    padding: '0.875rem 1rem 0.875rem 3rem',
    border: '1px solid rgba(156,163,175,0.4)',
    borderRadius: '0.75rem',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', // auto-fit for better collapse
    paddingTop: '1.5rem',
  },
  cardFallback: {
    gridColumn: '1/-1',
    textAlign: 'center',
    padding: '5rem 2rem',
    backgroundColor: '#fff',
    borderRadius: '1rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)', // subtle shadow-lg
    border: '1px solid #f3f4f6',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '1.5rem',
    border: '1px solid #f3f4f6',
    borderRadius: '1rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)', // subtle shadow-lg
    transition: 'all 0.3s',
    cursor: 'pointer',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '1rem',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  cardTopic: {
    fontSize: '0.875rem',
    color: '#7c3aed',
    fontWeight: '500',
    marginBottom: '0.75rem',
    display: 'flex',
    alignItems: 'center',
  },
  cardSummary: {
    color: '#4b5563',
    marginBottom: '1.25rem',
    fontSize: '0.875rem',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.875rem',
    color: '#6b7280',
    borderTop: '1px solid #f3f4f6',
    paddingTop: '0.75rem',
  },
  cardLink: {
    display: 'flex',
    alignItems: 'center',
    color: '#7c3aed',
    fontWeight: '600',
    transition: 'color 0.2s',
  },
  footer: {
    backgroundColor: '#1f2937',
    color: '#fff',
    textAlign: 'center',
    padding: '1.5rem 0',
    marginTop: '4rem',
    boxShadow: 'inset 0 20px 20px -20px rgba(0, 0, 0, 0.3)',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    border: '1px solid #f87171',
    color: '#b91c1c',
    padding: '1rem',
    borderRadius: '0.75rem',
    display: 'flex',
    alignItems: 'flex-start',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    marginTop: '1rem',
  },
};