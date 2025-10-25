import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Firebase configuration (using the same config from your .env)
const firebaseConfig = {
  apiKey: "AIzaSyAflNx8zMV9-ubi5eibRHa3t7s6igj-re4",
  authDomain: "whitepaper-explorer.firebaseapp.com",
  projectId: "whitepaper-explorer",
  storageBucket: "whitepaper-explorer.firebasestorage.app",
  messagingSenderId: "14152992537",
  appId: "1:14152992537:web:1e39ff106ed4276905e788"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Sample whitepapers data
const sampleWhitepapers = [
  {
    title: 'Attention Is All You Need',
    summary: 'This paper introduces the Transformer architecture, a novel neural network design that relies entirely on attention mechanisms, dispensing with recurrence and convolutions entirely. The model achieves superior results in machine translation tasks.',
    topic: 'AI & Machine Learning',
    link: 'https://arxiv.org/abs/1706.03762',
    publicationDate: Timestamp.fromDate(new Date('2017-06-12'))
  },
  {
    title: 'Bitcoin: A Peer-to-Peer Electronic Cash System',
    summary: 'This whitepaper introduces Bitcoin, a purely peer-to-peer version of electronic cash that allows online payments to be sent directly from one party to another without going through a financial institution.',
    topic: 'Decentralized Finance',
    link: 'https://bitcoin.org/bitcoin.pdf',
    publicationDate: Timestamp.fromDate(new Date('2008-10-31'))
  },
  {
    title: 'Quantum Supremacy Using a Programmable Superconducting Processor',
    summary: 'Google AI demonstrates quantum supremacy by performing a computation in 200 seconds that would take the world\'s fastest supercomputer 10,000 years to complete using a 53-qubit quantum processor.',
    topic: 'Quantum Computing',
    link: 'https://www.nature.com/articles/s41586-019-1666-5',
    publicationDate: Timestamp.fromDate(new Date('2019-10-23'))
  },
  {
    title: 'CRISPR-Cas9: A Revolutionary Gene Editing Tool',
    summary: 'This paper details the development and application of CRISPR-Cas9 technology for precise genome editing, opening new possibilities for treating genetic diseases and advancing biological research.',
    topic: 'Biotechnology',
    link: 'https://www.science.org/doi/10.1126/science.1225829',
    publicationDate: Timestamp.fromDate(new Date('2012-08-17'))
  },
  {
    title: 'High-Efficiency Perovskite Solar Cells: Challenges and Solutions',
    summary: 'Comprehensive analysis of perovskite solar cell technology, addressing stability issues related to moisture and temperature while proposing novel encapsulation methods for commercial viability.',
    topic: 'Renewable Energy',
    link: 'https://www.nature.com/articles/s41560-020-0558-0',
    publicationDate: Timestamp.fromDate(new Date('2020-03-15'))
  },
  {
    title: 'GPT-3: Language Models are Few-Shot Learners',
    summary: 'OpenAI presents GPT-3, a 175 billion parameter language model that achieves strong performance on many NLP tasks without task-specific fine-tuning, demonstrating impressive few-shot learning capabilities.',
    topic: 'AI & Machine Learning',
    link: 'https://arxiv.org/abs/2005.14165',
    publicationDate: Timestamp.fromDate(new Date('2020-05-28'))
  },
  {
    title: 'Ethereum: A Secure Decentralised Generalised Transaction Ledger',
    summary: 'The Ethereum Yellow Paper describes a blockchain-based distributed computing platform featuring smart contract functionality, enabling decentralized applications (DApps) and programmable money.',
    topic: 'Decentralized Finance',
    link: 'https://ethereum.github.io/yellowpaper/paper.pdf',
    publicationDate: Timestamp.fromDate(new Date('2014-04-01'))
  },
  {
    title: 'Shor\'s Algorithm: Quantum Integer Factorization',
    summary: 'Peter Shor\'s groundbreaking algorithm demonstrates how quantum computers could factor large integers exponentially faster than classical computers, with profound implications for cryptography.',
    topic: 'Quantum Computing',
    link: 'https://arxiv.org/abs/quant-ph/9508027',
    publicationDate: Timestamp.fromDate(new Date('1995-08-20'))
  },
  {
    title: 'mRNA Vaccine Technology: Principles and Applications',
    summary: 'Exploration of messenger RNA vaccine technology, detailing the mechanisms by which synthetic mRNA directs cells to produce antigens, revolutionizing vaccine development and pandemic response.',
    topic: 'Biotechnology',
    link: 'https://www.nature.com/articles/nrd.2017.243',
    publicationDate: Timestamp.fromDate(new Date('2018-01-12'))
  },
  {
    title: 'Next-Generation Wind Turbine Design: Efficiency Improvements',
    summary: 'Analysis of advanced wind turbine blade designs incorporating aerodynamic optimization and smart materials to increase energy capture efficiency by 15-20% compared to traditional models.',
    topic: 'Renewable Energy',
    link: 'https://www.sciencedirect.com/science/article/pii/S0960148121000012',
    publicationDate: Timestamp.fromDate(new Date('2021-02-10'))
  }
];

// Function to upload whitepapers to Firestore
async function populateFirestore() {
  try {
    // First, authenticate anonymously
    console.log('🔐 Authenticating with Firebase...');
    const userCredential = await signInAnonymously(auth);
    console.log(`✅ Authenticated as: ${userCredential.user.uid}\n`);

    const papersCollectionPath = `artifacts/${firebaseConfig.projectId}/public/data/whitepapers`;
    const papersRef = collection(db, papersCollectionPath);

    console.log(`📝 Starting to upload whitepapers to: ${papersCollectionPath}\n`);

    for (const paper of sampleWhitepapers) {
      const docRef = await addDoc(papersRef, paper);
      console.log(`✅ Uploaded: "${paper.title}" (ID: ${docRef.id})`);
    }

    console.log(`\n🎉 Successfully uploaded ${sampleWhitepapers.length} whitepapers to Firestore!`);
    console.log(`\n📍 Collection path: ${papersCollectionPath}`);
    console.log(`\n🔗 View in Firebase Console:`);
    console.log(`   https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/data/~2Fartifacts~2F${firebaseConfig.projectId}~2Fpublic~2Fdata~2Fwhitepapers`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error uploading whitepapers:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure Firestore is enabled in Firebase Console');
    console.error('2. Check that Anonymous Authentication is enabled in Firebase Console');
    console.error('3. Check Firestore security rules allow authenticated writes');
    console.error('4. Verify Firebase credentials are correct');
    process.exit(1);
  }
}

// Run the population script
populateFirestore();

// Note: Firestore security rules (match/allow blocks) are not valid JavaScript and must be placed
// in your Firestore rules file (e.g., firestore.rules). The rules below were removed from this
// script to avoid syntax errors.
/*
match /artifacts/{appId}/public/data/whitepapers/{docId} {
  allow read: if true;
  allow write: if request.auth.token.admin == true; // Only admins can write
}
*/