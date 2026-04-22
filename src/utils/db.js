import mockData from '../data/kaggleMockData.json';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, doc, query, where, orderBy, setDoc, getDoc } from 'firebase/firestore';

const VIOLATIONS_COLLECTION = 'violations';
const DB_KEY = 'traffic_violations_db';

// Admins are hardcoded
const ADMINS = [
  { email: 'asif@admin.com', password: 'asif934' },
  { email: 'pabitra@admin.com', password: 'pabitra123' },
  { email: 'nikhil@admin.com', password: 'nikhil123' }
];

// --- Users DB Functions ---
// For now, keeping User DB in local storage for simplicity to avoid breaking existing auth flow
// We only migrate Violations to Firestore to solve the admin syncing issue.
const USERS_DB_KEY = 'traffic_users_db';
export const initUsersDB = () => {
  const existing = localStorage.getItem(USERS_DB_KEY);
  if (!existing) {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify([]));
    return [];
  }
  return JSON.parse(existing);
};

export const registerUser = (email, password) => {
  if (ADMINS.some(admin => admin.email === email)) return { success: false, message: 'Cannot register admin email.' };
  
  const users = initUsersDB();
  if (users.find(u => u.email === email)) {
    return { success: false, message: 'User already exists.' };
  }
  
  const newUser = { email, password };
  users.push(newUser);
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
  return { success: true, user: { email, role: 'user' } };
};

export const verifyUser = (email, password) => {
  const admin = ADMINS.find(a => a.email === email && a.password === password);
  if (admin) {
    return { success: true, user: { email, role: 'admin' } };
  }
  
  const users = initUsersDB();
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    return { success: true, user: { email: user.email, role: 'user' } };
  }
  return { success: false, message: 'Invalid credentials.' };
};

// --- Violations DB Functions (Firestore) ---

// Helper function to migrate LocalStorage data to Firestore
const migrateLocalStorageToFirestore = async () => {
  try {
    const localData = localStorage.getItem(DB_KEY);
    if (localData) {
      const violations = JSON.parse(localData);
      console.log(`Migrating ${violations.length} reports from LocalStorage to Firestore...`);
      for (const v of violations) {
        // Use setDoc with ID if it exists, otherwise addDoc
        const id = v.id || Date.now().toString() + Math.random().toString(36).substr(2, 9);
        await setDoc(doc(db, VIOLATIONS_COLLECTION, id), {
          ...v,
          timestamp: v.timestamp || (new Date(v.date + 'T' + v.time).getTime()) || Date.now()
        }, { merge: true });
      }
      console.log("Migration successful. Clearing LocalStorage...");
      localStorage.removeItem(DB_KEY);
    }
  } catch (error) {
    console.error("Error migrating data: ", error);
  }
};

// Helper function to seed mock data if Firestore is empty
const seedMockDataIfNeeded = async () => {
  try {
    if (!db) return;
    const querySnapshot = await getDocs(collection(db, VIOLATIONS_COLLECTION));
    if (querySnapshot.empty) {
      console.log("Firestore is empty. Seeding mock data...");
      for (const violation of mockData) {
        if (!db) break;
        await setDoc(doc(db, VIOLATIONS_COLLECTION, violation.id), {
          ...violation,
          timestamp: new Date(violation.date + 'T' + violation.time).getTime() || Date.now()
        });
      }
      console.log("Mock data seeded successfully.");
    }
  } catch (error) {
    console.error("Error seeding mock data: ", error);
  }
};

// Initialize DB
export const initDB = async () => {
  if (db) {
    console.log("Initializing Cloud Database...");
    await migrateLocalStorageToFirestore();
    await seedMockDataIfNeeded();
  } else {
    console.warn("Cloud Database not initialized. Using local mock mode.");
  }
};

export const getViolations = async () => {
  try {
    if (!db) return mockData;
    const q = query(collection(db, VIOLATIONS_COLLECTION), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    const violations = [];
    querySnapshot.forEach((doc) => {
      violations.push({ id: doc.id, ...doc.data() });
    });
    // Fallback if sorting fails due to missing index
    if (violations.length === 0) {
        const fallbackSnapshot = await getDocs(collection(db, VIOLATIONS_COLLECTION));
        fallbackSnapshot.forEach((doc) => {
            violations.push({ id: doc.id, ...doc.data() });
        });
    }
    return violations;
  } catch (error) {
    console.error("Error fetching violations: ", error);
    if (!db) return mockData;
    // If indexing error, just fetch without ordering
    const fallbackSnapshot = await getDocs(collection(db, VIOLATIONS_COLLECTION));
    const violations = [];
    fallbackSnapshot.forEach((doc) => {
        violations.push({ id: doc.id, ...doc.data() });
    });
    return violations;
  }
};

export const getUserViolations = async (email) => {
  try {
    if (!db) return [];
    const q = query(collection(db, VIOLATIONS_COLLECTION), where("userEmail", "==", email));
    const querySnapshot = await getDocs(q);
    const violations = [];
    querySnapshot.forEach((doc) => {
      violations.push({ id: doc.id, ...doc.data() });
    });
    console.log(`Fetched ${violations.length} violations from Firestore.`);
    return violations;
  } catch (error) {
    console.error("Error fetching user violations: ", error);
    return [];
  }
};

export const addViolation = async (violation, userEmail) => {
  try {
    if (!db) throw new Error("Database not initialized");
    const newViolation = {
      ...violation,
      status: 'Pending',
      userEmail: userEmail || 'anonymous',
      evidenceUrl: violation.evidenceUrl || 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // Placeholder
      timestamp: Date.now()
    };
    
    console.log("Adding violation to Firestore:", newViolation);
    const docRef = await addDoc(collection(db, VIOLATIONS_COLLECTION), newViolation);
    console.log("Violation added with ID:", docRef.id);
    return { id: docRef.id, ...newViolation };
  } catch (error) {
    console.error("CRITICAL ERROR adding violation:", error);
    alert("Database Error: " + error.message);
    throw error;
  }
};

export const updateViolationStatus = async (id, newStatus) => {
  try {
    if (!db) return false;
    const violationRef = doc(db, VIOLATIONS_COLLECTION, id);
    await updateDoc(violationRef, {
      status: newStatus
    });
    return true;
  } catch (error) {
    console.error("Error updating violation status: ", error);
    return false;
  }
};
