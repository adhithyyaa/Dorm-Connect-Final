export interface User {
  id: string;
  username: string;
  password: string;
  role: "student" | "admin" | "primary_admin";
  approved: boolean;
  name?: string;
  rollNumber?: string;
  roomNumber?: string;
  email?: string;
}

export interface Complaint {
  id: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  description: string;
  imageUrl?: string;
  status: "pending" | "resolved" | "declined";
  adminId?: string;
  resolutionDescription?: string;
  resolutionImageUrl?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface SOSAlert {
  id: string;
  roomNumber: string;
  triggeredBy: string;
  createdAt: string;
  active: boolean;
}

interface AppData {
  users: User[];
  complaints: Complaint[];
  sosAlerts: SOSAlert[];
}

const STORAGE_KEY = "dorm_connect_data";

function getDefaultData(): AppData {
  return {
    users: [
      {
        id: "primary-admin-001",
        username: "Primary Admin",
        password: "ADMIN@123",
        role: "primary_admin",
        approved: true,
        name: "Primary Admin",
      },
    ],
    complaints: [],
    sosAlerts: [],
  };
}

export function getData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const data = getDefaultData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    }
    return JSON.parse(raw);
  } catch {
    const data = getDefaultData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }
}

export function setData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// User operations
export function findUser(username: string, password: string): User | null {
  const data = getData();
  return data.users.find((u) => u.username === username && u.password === password) || null;
}

export function registerUser(user: Omit<User, "id">): User {
  const data = getData();
  const newUser: User = { ...user, id: generateId() };
  data.users.push(newUser);
  setData(data);
  return newUser;
}

export function updateUser(id: string, updates: Partial<User>): void {
  const data = getData();
  const idx = data.users.findIndex((u) => u.id === id);
  if (idx !== -1) {
    data.users[idx] = { ...data.users[idx], ...updates };
    setData(data);
  }
}

export function getStudents(): User[] {
  return getData().users.filter((u) => u.role === "student");
}

export function getPendingAdmins(): User[] {
  return getData().users.filter((u) => u.role === "admin" && !u.approved);
}

export function getApprovedAdmins(): User[] {
  return getData().users.filter((u) => u.role === "admin" && u.approved);
}

// Complaint operations
export function addComplaint(complaint: Omit<Complaint, "id" | "createdAt" | "status">): Complaint {
  const data = getData();
  const newComplaint: Complaint = {
    ...complaint,
    id: generateId(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  data.complaints.push(newComplaint);
  setData(data);
  return newComplaint;
}

export function getComplaintsByStudent(studentId: string): Complaint[] {
  return getData().complaints.filter((c) => c.studentId === studentId);
}

export function getAllComplaints(): Complaint[] {
  return getData().complaints;
}

export function resolveComplaint(id: string, adminId: string, description: string, imageUrl?: string): void {
  const data = getData();
  const idx = data.complaints.findIndex((c) => c.id === id);
  if (idx !== -1) {
    data.complaints[idx] = {
      ...data.complaints[idx],
      status: "resolved",
      adminId,
      resolutionDescription: description,
      resolutionImageUrl: imageUrl,
      resolvedAt: new Date().toISOString(),
    };
    setData(data);
  }
}

export function declineComplaint(id: string, adminId: string): void {
  const data = getData();
  const idx = data.complaints.findIndex((c) => c.id === id);
  if (idx !== -1) {
    data.complaints[idx] = {
      ...data.complaints[idx],
      status: "declined",
      adminId,
      resolvedAt: new Date().toISOString(),
    };
    setData(data);
  }
}

// SOS operations
export function triggerSOS(roomNumber: string, triggeredBy: string): SOSAlert {
  const data = getData();
  const alert: SOSAlert = {
    id: generateId(),
    roomNumber,
    triggeredBy,
    createdAt: new Date().toISOString(),
    active: true,
  };
  data.sosAlerts.push(alert);
  setData(data);
  return alert;
}

export function getActiveSOSAlerts(): SOSAlert[] {
  return getData().sosAlerts.filter((a) => a.active);
}

export function dismissSOS(id: string): void {
  const data = getData();
  const idx = data.sosAlerts.findIndex((a) => a.id === id);
  if (idx !== -1) {
    data.sosAlerts[idx].active = false;
    setData(data);
  }
}
