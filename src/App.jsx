import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import * as algoliasearchPkg from "algoliasearch";
import { Search, Loader, List, Filter, Bookmark, BookOpen, Clock, User, LogOut } from 'lucide-react';

// --- CONFIGURATION ---
// IMPORTANT: We are hardcoding the access to environment variables here to avoid module resolution errors.
// In your local VS Code environment (Vite), replace the values of the getEnv() calls below 
// with your actual VITE_ environment variables (e.g., import.meta.env.VITE_FIREBASE_API_KEY).

const getEnv = (key) => {
    // Prefer Vite-provided env vars (import.meta.env). Falls back to process.env if available (Node).
    try {
        const val = import.meta.env?.[key] ?? process.env?.[key];
        if (val && val !== '') return val;
    } catch (e) {
        // import.meta may throw in some non-Vite tooling; ignore and continue to fallback below
    }
    // Last-resort fallback (keeps existing behaviour but makes the missing-var obvious)
    console.warn(`Environment variable ${key} is undefined. Fill .env and restart Vite.`);
    return "UNDEFINED_KEY_" + key;
};

const firebaseConfig = {
    apiKey: getEnv('VITE_FIREBASE_API_KEY'),
    authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnv('VITE_FIREBASE_APP_ID')
};

const algoliaConfig = {
    appId: getEnv('VITE_ALGOLIA_APP_ID'),
    searchApiKey: getEnv('VITE_ALGOLIA_SEARCH_API_KEY'),
    indexName: 'whitepapers'
};

// --- MOCK TOPICS (For initial filter display) ---
const ALL_TOPICS = ['All', 'AI & Machine Learning', 'Decentralized Finance', 'Quantum Computing', 'Biotechnology', 'Renewable Energy'];


// --- COMPONENT: Loading Indicator ---
const LoadingIndicator = () => (
    <div className="flex justify-center items-center p-8 text-indigo-500">
        <Loader className="w-6 h-6 animate-spin mr-3" />
        <span className="text-lg font-medium">Loading Whitepapers...</span>
    </div>
);

// --- COMPONENT: Whitepaper Card ---
const WhitepaperCard = ({ paper }) => (
    <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="flex justify-between items-start mb-3">
            <h3 className="text-xl font-semibold text-gray-800 line-clamp-2">{paper.title}</h3>
            <button
                className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-2 rounded-full hover:bg-red-50"
                title="Bookmark Paper"
                onClick={() => console.log('Bookmark action for:', paper.id)}
            >
                <Bookmark className="w-5 h-5" fill="currentColor" />
            </button>
        </div>
        <p className="text-sm text-indigo-600 font-medium mb-3 flex items-center">
            <Filter className="w-4 h-4 mr-1" />
            {paper.topic}
        </p>
        <p className="text-gray-600 mb-4 line-clamp-3">{paper.summary}</p>
        <div className="flex justify-between items-center text-sm text-gray-500">
            <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {paper.publicationDate ? new Date(paper.publicationDate.toDate()).toLocaleDateString() : 'N/A'}
            </span>
            <a 
                href={paper.link || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200"
            >
                Read Paper
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

    // 1. FIREBASE INITIALIZATION & AUTHENTICATION
    useEffect(() => {
        // Initialize Firebase services
        try {
            const app = initializeApp(firebaseConfig);
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
                    });
                }
                // Auth is ready, now we can fetch data
                setIsLoading(false); 
            });

            return () => unsubscribeAuth(); // Cleanup listener

        } catch (error) {
            console.error("Firebase Initialization Failed:", error);
            setIsLoading(false);
        }
    }, []);

    // 2. FIRESTORE DATA LISTENER (Fetch initial papers when authenticated)
    useEffect(() => {
        if (!db || !userId) return;

        // Path for public whitepapers: /artifacts/{__app_id}/public/data/whitepapers
        const appId = firebaseConfig.projectId; // Using projectId as a stand-in for __app_id
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
        }, (error) => {
            console.error("Error fetching real-time whitepapers:", error);
        });

        // Cleanup listener when component unmounts or dependencies change
        return () => unsubscribeSnapshot(); 
    }, [db, userId]);

    // 3. SEARCH LOGIC (Using Algolia for dynamic search or local filtering for topics)
    const filteredPapers = useMemo(() => {
        if (searchTerm.length > 2) {
            // NOTE: Setting a short delay/debounce would be ideal in a production app to limit API calls.
            // For this example, we'll execute immediately but only if the search term is long enough.
            setIsLoading(true);
            
            // Perform Algolia search
            algoliaIndex.search(searchTerm, {
                filters: selectedTopic === 'All' ? '' : `topic:"${selectedTopic}"`
            }).then(({ hits }) => {
                const results = hits.map(hit => ({
                    id: hit.objectID,
                    title: hit.title,
                    summary: hit.summary,
                    topic: hit.topic,
                    link: hit.link,
                    // Recreate a Firestore-like object for consistency in the WhitepaperCard component
                    publicationDate: { 
                        toDate: () => new Date(hit.publicationDate) 
                    } 
                }));
                // Only update the display list with search results
                setWhitepapers(results); 
                setIsLoading(false);
            }).catch(error => {
                console.error("Algolia search failed:", error);
                setIsLoading(false);
            });
            // Return an empty array or current papers immediately while the async search is running
            // A better UI approach is to show the loading indicator over the current list, 
            // but here we return the current whitepapers list temporarily while the search updates the state.
            return whitepapers; 

        } else if (selectedTopic !== 'All' && searchTerm.length === 0) {
            // Local topic filtering if no search term is active and we're on the initial Firestore list
            // NOTE: If the Algolia search has run, whitepapers will hold the search results, so this filter applies to that.
            // For a robust implementation, you might need a separate state for the initial Firestore list.
            return whitepapers.filter(paper => paper.topic === selectedTopic);
        }

        // Default: return all fetched/current papers (either from Firestore or the last Algolia search)
        return whitepapers;

    }, [searchTerm, selectedTopic, whitepapers]);


    return (
        <div className="min-h-screen bg-gray-50 font-sans antialiased">
            {/* Header */}
            <header className="bg-white shadow-md sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-3xl font-extrabold text-indigo-700 tracking-tight">
                        Whitepaper Explorer
                    </h1>
                    <div className="flex items-center space-x-3">
                        {userId && (
                            <div className="text-sm text-gray-500 flex items-center bg-gray-100 px-3 py-1 rounded-full">
                                <User className="w-4 h-4 mr-1 text-indigo-500" />
                                {/* Displaying the userId snippet for multi-user context */}
                                {userId.substring(0, 8)}...
                            </div>
                        )}
                        <button 
                            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            title="Sign Out (Simulated)"
                            onClick={() => { console.log('Simulating logout'); if(auth) auth.signOut(); }}
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* Search and Filters */}
                <div className="bg-white p-6 rounded-2xl shadow-xl mb-8">
                    <div className="flex flex-col md:flex-row gap-6">
                        
                        {/* Search Bar */}
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by title, author, or keyword..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-150 text-gray-700"
                            />
                        </div>

                        {/* Topic Filter */}
                        <div className="relative md:w-1/4">
                            <List className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            <select
                                value={selectedTopic}
                                onChange={(e) => setSelectedTopic(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl appearance-none bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-150 text-gray-700"
                            >
                                {ALL_TOPICS.map(topic => (
                                    <option key={topic} value={topic}>{topic}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Whitepaper Grid */}
                {isLoading && (searchTerm.length === 0 || filteredPapers.length === 0) ? (
                    <LoadingIndicator />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPapers.length > 0 ? (
                            filteredPapers.map(paper => (
                                <WhitepaperCard key={paper.id} paper={paper} />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-16 bg-white rounded-xl shadow-lg border border-gray-200">
                                <Search className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                                <p className="text-xl font-medium text-gray-600">No Whitepapers Found</p>
                                <p className="text-gray-500">Try adjusting your search terms or selecting a different topic.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 text-white text-center py-6 mt-12">
                <p>&copy; {new Date().getFullYear()} Whitepaper Explorer. Built for the future of research.</p>
            </footer>
        </div>
    );
}
