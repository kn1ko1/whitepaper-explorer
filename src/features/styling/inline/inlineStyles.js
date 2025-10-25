export const styles = {
  baseLayout: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb', // bg-gray-50
    fontFamily: 'sans-serif',
    WebkitFontSmoothing: 'antialiased'
  },
  header: {
    backgroundColor: '#ffffff', // bg-white
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)', // shadow-lg
    position: 'sticky',
    top: 0,
    zIndex: 20,
    borderBottom: '1px solid #ede9fe' // border-violet-100
  },
  headerContent: {
    maxWidth: '1280px', // max-w-7xl
    margin: '0 auto',
    padding: '1rem 1rem', // py-4 px-4
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: '1.875rem', // text-3xl
    fontWeight: '800', // font-extrabold
    color: '#6d28d9', // text-violet-700
    letterSpacing: '0.05em' // tracking-wider
  },
  userIdDisplay: {
    fontSize: '0.75rem', // text-xs
    color: '#4b5563', // text-gray-600
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f5f3ff', // bg-violet-50
    padding: '0.25rem 0.75rem', // px-3 py-1
    borderRadius: '9999px', // rounded-full
    border: '1px solid #ddd6fe', // border-violet-200
    maxWidth: '300px',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis'
  },
  logoutButton: {
    color: '#6b7280', // text-gray-500
    padding: '0.5rem',
    borderRadius: '9999px',
    transition: 'color 0.15s, background-color 0.15s',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    border: 'none'
  },
  logoutButtonHover: {
    color: '#dc2626', // hover:text-red-600
    backgroundColor: '#fef2f2' // hover:bg-red-50
  },
  mainContent: {
    maxWidth: '1280px', // max-w-7xl
    margin: '0 auto',
    padding: '2.5rem 1rem' // py-10 px-4
  },
  errorBox: {
    backgroundColor: '#fee2e2', // bg-red-100
    border: '1px solid #f87171', // border-red-400
    color: '#b91c1c', // text-red-700
    padding: '1rem',
    borderRadius: '0.75rem', // rounded-xl
    display: 'flex',
    alignItems: 'flex-start',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)', // shadow-md
    marginTop: '1rem'
  },
  searchContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '4rem'
  },
  searchBoxWrapper: {
    width: '100%',
    maxWidth: '960px', // max-w-4xl
    backgroundColor: '#ffffff', // bg-white
    padding: '2rem',
    borderRadius: '1.5rem', // rounded-3xl
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', // shadow-2xl
    border: '1px solid #ddd6fe', // border-violet-200
    transition: 'box-shadow 0.3s'
  },
  searchInputWrapper: {
    position: 'relative',
    flexGrow: 1
  },
  searchInput: {
    width: '100%',
    padding: '0.875rem 1rem 0.875rem 3rem', // py-3.5 pl-12
    border: '1px solid #c4b5fd', // border-violet-300
    borderRadius: '0.75rem', // rounded-xl
    transition: 'all 0.15s',
    color: '#374151',
    fontSize: '1rem',
    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    outline: 'none'
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', // Responsive grid
    gap: '2rem',
    paddingTop: '1.5rem'
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '1.5rem',
    border: '1px solid #f3f4f6', // border-gray-100
    borderRadius: '1rem', // rounded-2xl
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)', // shadow-lg
    transition: 'all 0.3s',
    cursor: 'pointer'
  },
  cardTitle: {
    fontSize: '1.25rem', // text-xl
    fontWeight: '700', // font-bold
    color: '#1f2937', // text-gray-800
    marginBottom: '1rem',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical'
  },
  cardTopic: {
    fontSize: '0.875rem', // text-sm
    color: '#7c3aed', // text-violet-600
    fontWeight: '500', // font-medium
    marginBottom: '0.75rem',
    display: 'flex',
    alignItems: 'center'
  },
  cardSummary: {
    color: '#4b5563', // text-gray-600
    marginBottom: '1.25rem',
    fontSize: '0.875rem', // text-sm
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.875rem',
    color: '#6b7280', // text-gray-500
    borderTop: '1px solid #f3f4f6',
    paddingTop: '0.75rem'
  },
  cardLink: {
    display: 'flex',
    alignItems: 'center',
    color: '#7c3aed',
    fontWeight: '600',
    transition: 'color 0.2s'
  },
  footer: {
    backgroundColor: '#1f2937', // bg-gray-900
    color: '#ffffff', // text-white
    textAlign: 'center',
    padding: '1.5rem 0',
    marginTop: '4rem',
    boxShadow: 'inset 0 20px 20px -20px rgba(0, 0, 0, 0.3)'
  }
};