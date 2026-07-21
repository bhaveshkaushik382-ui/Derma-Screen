/**
 * DermaScreen — API Client
 * Centralized API client for communicating with the FastAPI backend.
 * Automatically injects Firebase auth token into requests.
 */

import { getIdToken } from "./firebase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

// ─────────────────── Core Request Helpers ───────────────────

/**
 * Get authorization headers with Firebase token.
 */
async function getAuthHeaders() {
  const token = await getIdToken();
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Make an authenticated GET request.
 */
export async function apiGet(endpoint) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Make an authenticated POST request with JSON body.
 */
export async function apiPost(endpoint, body) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Make an authenticated DELETE request.
 */
export async function apiDelete(endpoint) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "DELETE",
    headers: {
      ...headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Upload a file (multipart/form-data) with authentication.
 */
export async function apiUpload(endpoint, file, additionalFields = {}) {
  const headers = await getAuthHeaders();
  const formData = new FormData();
  formData.append("file", file);

  Object.entries(additionalFields).forEach(([key, val]) => {
    formData.append(key, typeof val === 'object' ? JSON.stringify(val) : val);
  });

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      ...headers,
      // Don't set Content-Type — browser sets it with boundary for FormData
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// ─────────────────── API Service Functions ───────────────────

/** Verify Firebase token with backend and sync user. */
export async function verifyAuth(idToken) {
  return apiPost("/auth/verify", { id_token: idToken });
}

/** Get current user profile. */
export async function getMe() {
  return apiGet("/auth/me");
}

/** Upload a scan image. */
export async function uploadScanImage(file) {
  return apiUpload("/scans/upload", file);
}

/** Get all scans. */
export async function getScans() {
  return apiGet("/scans/");
}

/** Get a single scan. */
export async function getScan(scanId) {
  return apiGet(`/scans/${scanId}`);
}

/** Delete a scan. */
export async function deleteScan(scanId) {
  return apiDelete(`/scans/${scanId}`);
}

/** Run image quality analysis. */
export async function analyzeQuality(file) {
  return apiUpload("/quality/analyze", file);
}

/** Run ML prediction (full pipeline). */
export async function predictScan(file, abcdeAnswers = null) {
  const fields = abcdeAnswers ? { abcde_answers: abcdeAnswers } : {};
  return apiUpload("/predict/", file, fields);
}

/** Send a chat message. */
export async function sendChatMessage(message, history = [], imageUrl = null) {
  return apiPost("/chat/", { message, history, image_url: imageUrl });
}

/** Get chat history. */
export async function getChatHistory() {
  return apiGet("/chat/history");
}

/** Clear all chat history. */
export async function deleteChatHistory() {
  return apiDelete("/chat/history");
}

/** Get dashboard stats. */
export async function getDashboardStats() {
  return apiGet("/dashboard/stats");
}

/** Health check. */
export async function healthCheck() {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
}
