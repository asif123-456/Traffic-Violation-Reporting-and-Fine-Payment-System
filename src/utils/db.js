import mockData from '../data/kaggleMockData.json';

const DB_KEY = 'traffic_violations_db';
const USERS_DB_KEY = 'traffic_users_db';

// Admin is hardcoded
const ADMIN_EMAIL = 'asif@admin.com';
const ADMIN_PASS = 'asif934';

// --- Users DB Functions ---

export const initUsersDB = () => {
  const existing = localStorage.getItem(USERS_DB_KEY);
  if (!existing) {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify([]));
    return [];
  }
  return JSON.parse(existing);
};

export const registerUser = (email, password) => {
  if (email === ADMIN_EMAIL) return { success: false, message: 'Cannot register admin email.' };
  
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
  if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
    return { success: true, user: { email, role: 'admin' } };
  }
  
  const users = initUsersDB();
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    return { success: true, user: { email: user.email, role: 'user' } };
  }
  return { success: false, message: 'Invalid credentials.' };
};

// --- Violations DB Functions ---

export const initDB = () => {
  const existingData = localStorage.getItem(DB_KEY);
  if (!existingData) {
    localStorage.setItem(DB_KEY, JSON.stringify(mockData));
    return mockData;
  }
  return JSON.parse(existingData);
};

export const getViolations = () => {
  return initDB();
};

export const getUserViolations = (email) => {
  const all = getViolations();
  return all.filter(v => v.userEmail === email);
};

export const addViolation = (violation, userEmail) => {
  const currentData = getViolations();
  const newViolation = {
    ...violation,
    id: Date.now().toString(),
    status: 'Pending',
    userEmail: userEmail || 'anonymous',
    evidenceUrl: violation.evidenceUrl || 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' // Placeholder
  };
  
  const updatedData = [newViolation, ...currentData];
  localStorage.setItem(DB_KEY, JSON.stringify(updatedData));
  return newViolation;
};

export const updateViolationStatus = (id, newStatus) => {
  const currentData = getViolations();
  const updatedData = currentData.map(v => 
    v.id === id ? { ...v, status: newStatus } : v
  );
  localStorage.setItem(DB_KEY, JSON.stringify(updatedData));
  return updatedData;
};
