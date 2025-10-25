import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { Search, Loader, List, Filter, Bookmark, BookOpen, Clock, User, LogOut, Code } from "lucide-react";
import { styles } from "./features/styling/inline/inlineStyles";

const ALL_TOPICS = ['All', 'AI & Machine Learning', 'Decentralized Finance', 'Quantum Computing', 'Biotechnology', 'Renewable Energy'];

const LoadingIndicator = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem', color: '#7c3aed' }}>
        <Loader style={{ width: '2rem', height: '2rem', marginRight: '0.75rem' }} />
        <span style={{ fontSize: '1.25rem', fontWeight: '600' }}>Fetching Cutting-Edge Research...</span>
    </div>
);

const WhitepaperCard = ({ paper }) => (
    <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <h3 style={styles.cardTitle}>{paper.title}</h3>
            <button
                style={{ color: '#9ca3af', padding: '0.5rem', borderRadius: '9999px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}
                title="Bookmark Paper"
                onClick={() => console.log('Bookmark action for:', paper.id)}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
                <Bookmark style={{ width: '1.25rem', height: '1.25rem' }} fill="currentColor" />
            </button>
        </div>
        <p style={styles.cardTopic}>
            <Filter style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
            {paper.topic}
        </p>
        <p style={styles.cardSummary}>{paper.summary}</p>
        <div style={styles.cardFooter}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
                <Clock style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
                Published: {paper.publicationDate ? new Date(paper.publicationDate.toDate()).toLocaleDateString() : 'N/A'}
            </span>
            <a
                href={paper.link || '#'}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.cardLink}
            >
                Read Full Paper
                <BookOpen style={{ width: '1rem', height: '1rem', marginLeft: '0.25rem' }} />
            </a>
        </div>
    </div>
);

export default function App() {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [whitepapers, setWhitepapers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTopic, setSelectedTopic] = useState('All');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [algoliaIndex, setAlgoliaIndex] = useState(null);

    useEffect(() => {
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

            // Initialize Algolia
            const algoliaAppId = import.meta.env.VITE_ALGOLIA_APP_ID ?? "";
            const algoliaSearchKey = import.meta.env.VITE_ALGOLIA_SEARCH_API_KEY ?? "";
            
            if (algoliaAppId && algoliaSearchKey) {
                const algoliaClient = algoliasearch(algoliaAppId, algoliaSearchKey);
                const index = algoliaClient.initIndex('whitepapers');
                setAlgoliaIndex(index);
            } else {
                console.warn('Algolia credentials not found. Search functionality will be limited.');
            }

            const unsubscribeAuth = onAuthStateChanged(authService, (currentUser) => {
                if (currentUser) {
                    setUserId(currentUser.uid);
                    console.log("Authenticated User ID:", currentUser.uid);
                } else {
                    signInAnonymously(authService).then((credentials) => {
                        setUserId(credentials.user.uid);
                        console.log("Signed in anonymously. User ID:", credentials.user.uid);
                    }).catch(authError => {
                        console.error("Error during anonymous sign-in:", authError);
                        setError("Authentication Failed. Ensure Anonymous Sign-in is enabled in Firebase Console.");
                    });
                }
                setIsLoading(false);
            });

            return () => unsubscribeAuth();

        } catch (initError) {
            console.error("Firebase Initialization Failed:", initError);
            setError("Firebase failed to initialize. Check your configuration.");
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!db || !userId) return;

        const appId = import.meta.env.VITE_FIREBASE_PROJECT_ID
            ?? (db?.app?.options?.projectId ?? db?._databaseId?.projectId ?? '');
        if (!appId) {
            console.warn('Firestore projectId (appId) not found — skipping Firestore listener.');
            return;
        }
        const papersCollectionPath = `artifacts/${appId}/public/data/whitepapers`;
        const papersRef = collection(db, papersCollectionPath);
        
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

        return () => unsubscribeSnapshot();
    }, [db, userId]);

    const filteredPapers = useMemo(() => {
        if (selectedTopic !== 'All' && searchTerm.length === 0) {
            return whitepapers.filter(paper => paper.topic === selectedTopic);
        }
        return whitepapers;
    }, [searchTerm, selectedTopic, whitepapers]);

    // Algolia search effect
    useEffect(() => {
        if (searchTerm.length > 2 && algoliaIndex) {
            setIsLoading(true);
            
            algoliaIndex.search(searchTerm, {
                filters: selectedTopic === 'All' ? '' : `topic:"${selectedTopic}"`
            }).then(({ hits }) => {
                const results = hits.map(hit => ({
                    id: hit.objectID,
                    title: hit.title,
                    summary: hit.summary,
                    topic: hit.topic,
                    link: hit.link,
                    publicationDate: { toDate: () => new Date(hit.publicationDate) }
                }));
                setWhitepapers(results);
                setIsLoading(false);
            }).catch(algoliaError => {
                console.error("Algolia search failed:", algoliaError);
                setError("Algolia search failed. Check your API key and index configuration.");
                setIsLoading(false);
            });
        }
    }, [searchTerm, selectedTopic, algoliaIndex]);

    const clearList = () => {
      setSearchTerm('');
      setSelectedTopic('All');
      setError(null);
    };

    return (
      <div style={styles.baseLayout}>
            <header style={styles.header}>
                <div style={styles.headerContent}>
                    <h1 style={styles.title}>Whitepaper Explorer</h1>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                         {userId && (
                            <div style={styles.userIdDisplay}>
                                <User style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', color: '#7c3aed', flexShrink: 0 }} />
                                <span style={{ fontFamily: 'monospace', fontSize: '.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userId}</span>
                            </div>
                         )}
                        <button
                            style={styles.logoutButton}
                            title="Sign Out"
                            onClick={() => { console.log('Attempting Firebase Sign Out'); if(auth) signOut(auth); }}
                            onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.logoutButtonHover)}
                            onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.logoutButton)}
                        >
                            <LogOut style={{ width: '1.25rem', height: '1.25rem' }} />
                        </button>
                     </div>
                 </div>
             </header>

             {error && (
                 <div style={styles.mainContent}>
                    <div style={styles.errorBox}>
                        <Code style={{ width: '1.25rem', height: '1.25rem', marginTop: '0.25rem', marginRight: '0.75rem', flexShrink: 0 }} />
                        <span style={{ fontWeight: '600' }}>{error}</span>
                    </div>
                 </div>
             )}

            <main style={styles.mainContent}>
                 <div style={styles.searchContainer}>
                     <h2 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#1f2937', marginBottom: '1.5rem', textAlign: 'center' }}>
                         Explore Cutting-Edge Research 
                     </h2>
                     
                     <div style={styles.searchBoxWrapper}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={styles.searchInputWrapper}>
                                <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, color: '#7c3aed' }} />
                                <input
                                    type="text"
                                    placeholder="Search by title, author, or keyword..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={styles.searchInput}
                                />
                            </div>

                            <div style={{ position: 'relative', width: 224 }}>
                                <List style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, color: '#9ca3af', pointerEvents: 'none' }} />
                                <select
                                    value={selectedTopic}
                                    onChange={(e) => setSelectedTopic(e.target.value)}
                                    style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 3rem', border: '1px solid rgba(156,163,175,0.4)', borderRadius: '0.75rem', backgroundColor: '#fff', fontSize: '1rem', color: '#374151', appearance: 'none', cursor: 'pointer' }}
                                >
                                     {ALL_TOPICS.map(topic => (
                                         <option key={topic} value={topic}>{topic}</option>
                                     ))}
                                 </select>
                             </div>

                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <button
                                type="button"
                                onClick={clearList}
                                style={{ marginLeft: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: '#f3f4f6', fontSize: '0.875rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e5e7eb'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
                              >
                                Clear
                              </button>
                            </div>
                        </div>
                    </div>
                 </div>

                 {isLoading && (searchTerm.length === 0 && whitepapers.length === 0) ? (
                    <LoadingIndicator />
                ) : (
                    <div style={styles.gridContainer}>
                        {filteredPapers.length > 0 ? (
                            filteredPapers.map(paper => (
                                <WhitepaperCard key={paper.id} paper={paper} />
                            ))
                        ) : (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem 2rem', backgroundColor: '#fff', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)', border: '1px solid #f3f4f6' }}>
                                <Search style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', color: '#9ca3af' }} />
                                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#374151' }}>No Matching Papers Found</p>
                                <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>Try broader terms or reset your topic filter.</p>
                            </div>
                        )}
                    </div>
                )}
             </main>
 
             <footer style={styles.footer}>
                 <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>&copy; {new Date().getFullYear()} Whitepaper Explorer. Advancing research, one paper at a time.</p>
             </footer>
         </div>
     );
 }

