import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import * as algoliasearchPkg from "algoliasearch";
import { Search, Loader, List, Filter, Bookmark, BookOpen, Clock, User, LogOut, Code } from "lucide-react";
import { styles } from "./features/styling/inline/inlineStyles";

// NOTE: These environment variables are accessed via global context in the Canvas environment.
// We use a mock function to ensure the code compiles successfully in the single file context.
const getEnv = (key) => {
  try {
    const raw = import.meta?.env?.[key] ?? process?.env?.[key];
    if (typeof raw === 'string' && raw.trim() !== '') return raw.trim();
  } catch (e) {}
  console.warn(`Environment variable ${key} is undefined. Make sure .env exists and restart Vite.`);
  return "";
};

// NOTE: Build runtime configs inside the component so import.meta.env is available.
// The actual initialization happens inside the component's effect below.
// (This prevents reading envs too early during module evaluation.)
let firebaseConfig, algoliaConfig, algoliaClient, algoliaIndex;

// --- MOCK TOPICS (For initial filter display) ---
const ALL_TOPICS = ['All', 'AI & Machine Learning', 'Decentralized Finance', 'Quantum Computing', 'Biotechnology', 'Renewable Energy'];


// --- COMPONENT: Loading Indicator ---
const LoadingIndicator = () => (
    <div className="flex justify-center items-center p-8 text-violet-600">
        <Loader className="w-8 h-8 animate-spin mr-3" />
        <span className="text-xl font-semibold">Fetching Cutting-Edge Research...</span>
    </div>
);

// --- COMPONENT: Whitepaper Card ---
const WhitepaperCard = ({ paper }) => (
    <div className="bg-white p-6 border border-gray-100 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">
        <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-gray-800 line-clamp-2">{paper.title}</h3>
            <button
                className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-2 rounded-full hover:bg-red-50"
                title="Bookmark Paper"
                onClick={() => console.log('Bookmark action for:', paper.id)}
            >
                <Bookmark className="w-5 h-5" fill="currentColor" />
            </button>
        </div>
        <p className="text-sm text-violet-600 font-medium mb-3 flex items-center">
            <Filter className="w-4 h-4 mr-1" />
            {paper.topic}
        </p>
        <p className="text-gray-600 mb-5 line-clamp-3 text-sm">{paper.summary}</p>
        <div className="flex justify-between items-center text-sm text-gray-500 border-t pt-3 border-gray-100">
            <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                Published: {paper.publicationDate ? new Date(paper.publicationDate.toDate()).toLocaleDateString() : 'N/A'}
            </span>
            <a
                href={paper.link || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-violet-600 font-semibold hover:text-violet-800 transition-colors duration-200"
            >
                Read Full Paper
                <BookOpen className="w-4 h-4 ml-1" />
            </a>
        </div>
    </div>
);


// --- MAIN APP COMPONENT ---
export default function App() {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [whitepapers, setWhitepapers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTopic, setSelectedTopic] = useState('All');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. FIREBASE INITIALIZATION & AUTHENTICATION
    useEffect(() => {
        // Build runtime firebase config from Vite env (available during module import at runtime)
        const runtimeFirebaseConfig = {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "",
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "",
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
            messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
            appId: import.meta.env.VITE_FIREBASE_APP_ID ?? ""
        };
        console.log('Firebase runtime config (masked):', {
          ...runtimeFirebaseConfig,
          apiKey: runtimeFirebaseConfig.apiKey ? runtimeFirebaseConfig.apiKey.slice(0,6) + '…' : runtimeFirebaseConfig.apiKey
        });
        if (!runtimeFirebaseConfig.apiKey) {
            setError("Missing Firebase API key. Add VITE_FIREBASE_API_KEY to .env and restart Vite.");
            setIsLoading(false);
            return;
        }

        try {
            const app = initializeApp(runtimeFirebaseConfig);
            const firestore = getFirestore(app);
            const authService = getAuth(app);

            setDb(firestore);
            setAuth(authService);

            // Handle initial authentication state
            const unsubscribeAuth = onAuthStateChanged(authService, (user) => {
                if (user) {
                    setUserId(user.uid);
                    console.log("Authenticated User ID:", user.uid);
                } else {
                    // Sign in anonymously if no user is found
                    signInAnonymously(authService).then((credentials) => {
                        setUserId(credentials.user.uid);
                        console.log("Signed in anonymously. User ID:", credentials.user.uid);
                    }).catch(error => {
                        console.error("Error during anonymous sign-in:", error);
                        setError("Authentication Failed. Ensure Anonymous Sign-in is enabled in Firebase Console.");
                    });
                }
                setIsLoading(false);
            });

            return () => unsubscribeAuth(); // Cleanup listener

        } catch (error) {
            console.error("Firebase Initialization Failed:", error);
            setError("Firebase failed to initialize. Check your configuration.");
            setIsLoading(false);
        }
    }, []);

    // 2. FIRESTORE DATA LISTENER (Fetch initial papers when authenticated)
    useEffect(() => {
        if (!db || !userId) return;

        // Resolve appId (projectId) at runtime from Vite env; fall back to a property on db if available
        const appId = import.meta.env.VITE_FIREBASE_PROJECT_ID
            ?? (db?.app?.options?.projectId ?? db?._databaseId?.projectId ?? '');
        if (!appId) {
            console.warn('Firestore projectId (appId) not found — skipping Firestore listener.');
            return;
        }
        // Path for public whitepapers: /artifacts/{__app_id}/public/data/whitepapers
        const papersCollectionPath = `artifacts/${appId}/public/data/whitepapers`;
        const papersRef = collection(db, papersCollectionPath);
        
        // Listen for real-time updates (onSnapshot)
        const unsubscribeSnapshot = onSnapshot(papersRef, (snapshot) => {
            const papersList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setWhitepapers(papersList);
            console.log("Firestore papers loaded:", papersList.length);
        }, (dbError) => {
            console.error("Error fetching real-time whitepapers:", dbError);
            setError("Error fetching data. Check Firestore path and security rules.");
        });

        // Cleanup listener when component unmounts or dependencies change
        return () => unsubscribeSnapshot();
    }, [db, userId]);

    // 3. SEARCH LOGIC (Using Algolia for dynamic search or local filtering for topics)
    const filteredPapers = useMemo(() => {
        // Reset loading state if search term is cleared
        if (searchTerm.length === 0 && !isLoading) {
             // If search term is cleared, and we were previously loading search results, reset to default state.
             // This is handled implicitly by the dependencies, but explicit check can prevent unneeded re-renders/searches.
        }

        // Only search Algolia if search term is active AND is long enough
        if (searchTerm.length > 2) {
            setIsLoading(true); 
            
            // Search Algolia index
            algoliaIndex.search(searchTerm, {
                filters: selectedTopic === 'All' ? '' : `topic:"${selectedTopic}"`
            }).then(({ hits }) => {
                const results = hits.map(hit => ({
                    id: hit.objectID,
                    title: hit.title,
                    summary: hit.summary,
                    topic: hit.topic,
                    link: hit.link,
                    // Handle Algolia's timestamp format
                    // Assuming publicationDate is a timestamp or milliseconds
                    publicationDate: { toDate: () => new Date(hit.publicationDate) }
                }));
                setWhitepapers(results);
                setIsLoading(false);
            }).catch(algoliaError => {
                console.error("Algolia search failed:", algoliaError);
                setError("Algolia search failed. Check your API key and Cloud Function setup.");
                setIsLoading(false);
            });
            // Return the current list while the search is resolving to avoid a flicker
            return whitepapers;

        } else if (selectedTopic !== 'All' && searchTerm.length === 0) {
            // Local topic filtering if no search term is active
            return whitepapers.filter(paper => paper.topic === selectedTopic);
        }

        // Default: return all fetched papers when no active search or filter
        return whitepapers;

    }, [searchTerm, selectedTopic, whitepapers]);


    const clearList = (opts = { resetFirestoreView: true }) => {
      setSearchTerm('');
      setSelectedTopic('All');
      setError(null);
      if (opts.resetFirestoreView) {
        // allow onSnapshot to repopulate from Firestore (leave whitepapers untouched),
        // otherwise empty the displayed list immediately:
        // setWhitepapers([]);
      } else {
        setWhitepapers([]); // explicitly clear displayed list
      }
    };

    // --- UI RENDERING ---
    return (
      <div style={styles.app}>
        <div style={{ padding: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#bbf7d0', color: '#000', marginBottom: '1rem', borderRadius: '8px' }}>tailwind test box</div>
        </div>
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.headerInner}>
                    <h1 style={styles.title}>Whitepaper Explorer</h1>
                     <div className="flex items-center space-x-4">
                         {userId && (
                            <div style={styles.userBadge}>
                                <User className="w-4 h-4 mr-2 text-violet-600 flex-shrink-0" />
                                <span style={{ fontFamily: 'monospace', fontSize: '.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userId}</span>
                            </div>
                         )}
                        <button
                            style={{ background: 'transparent', border: 'none', padding: '.5rem', cursor: 'pointer', color: '#6b7280' }}
                            title="Sign Out"
                            onClick={() => { console.log('Attempting Firebase Sign Out'); if(auth) signOut(auth); }}
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                     </div>
                 </div>
             </header>

             {/* Error Message Display */}
             {error && (
                 <div className="max-w-7xl mx-auto mt-4 px-4 sm:px-6 lg:px-8">
                    <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}>
                        <Code className="w-5 h-5 mt-1 mr-3 flex-shrink-0" />
                        <span style={{ fontWeight: 600 }}>{error}</span>
                    </div>
                 </div>
             )}

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                
                <div style={styles.container}>
                 {/* --- CENTERED SEARCH AND FILTERS --- */}
                 <div className="flex flex-col items-center mb-16">
                     <h2 className="text-4xl font-extrabold text-gray-800 mb-6 text-center">
                         Explore Cutting-Edge Research 
                     </h2>
                     
                     {/* Search/Filter Box - Restricted width and centered */}
                     <div style={styles.searchPanel}>
                        <div style={styles.searchRow}>
                             
                             {/* Search Bar (Centered and prominent) */}
                            <div style={{ position: 'relative', flexGrow: 1 }}>
                                <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, color: '#7c3aed' }} />
                                <input
                                    type="text"
                                    placeholder="Search by title, author, or keyword..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={styles.searchInput}
                                />
                            </div>

                            {/* Topic Filter */}
                            <div style={{ position: 'relative', width: 224 }}>
                                <List style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, color: '#9ca3af', pointerEvents: 'none' }} />
                                <select
                                    value={selectedTopic}
                                    onChange={(e) => setSelectedTopic(e.target.value)}
                                    style={styles.select}
                                >
                                     {ALL_TOPICS.map(topic => (
                                         <option key={topic} value={topic}>{topic}</option>
                                     ))}
                                 </select>
                             </div>

                            <div className="flex items-center">
                              {/* add Clear button */}
                              <button
                                type="button"
                                onClick={() => clearList({ resetFirestoreView: false })}
                                className="ml-3 px-3 py-2 bg-gray-100 text-sm rounded-xl hover:bg-gray-200"
                              >
                                Clear
                              </button>
                            </div>
                        </div>
                    </div>
                 </div>
                 {/* --- END CENTERED SEARCH --- */}

                 {/* Whitepaper Grid */}
                 {isLoading && (searchTerm.length === 0 && whitepapers.length === 0) ? (
                    <LoadingIndicator />
                ) : (
                    <div style={styles.grid}>
                        {filteredPapers.length > 0 ? (
                            filteredPapers.map(paper => (
                                <WhitepaperCard key={paper.id} paper={paper} />
                            ))
                        ) : (
                            <div style={styles.cardFallback}>
                                <Search style={{ width: 48, height: 48, margin: '0 auto 1rem', color: '#9ca3af' }} />
                                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#374151' }}>No Matching Papers Found</p>
                                <p style={{ color: '#6b7280', marginTop: '.5rem' }}>Try broader terms or reset your topic filter.</p>
                            </div>
                        )}
                    </div>
                )}
                </div>
             </main>
 
             {/* Footer */}
             <footer className="bg-gray-900 text-white text-center py-6 mt-16 shadow-inner">
                 <p className="text-sm opacity-80">&copy; {new Date().getFullYear()} Whitepaper Explorer. Advancing research, one paper at a time.</p>
             </footer>
         </div>
     );
 }

