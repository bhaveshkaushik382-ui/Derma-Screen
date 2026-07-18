# 🩺 DermaScreen

[![React](https://img.shields.999.io/badge/React-19-blue.svg?style=flat&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.999.io/badge/FastAPI-0.115.0-green.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Tailwind CSS](https://img.shields.999.io/badge/Tailwind_CSS-4.0-38bdf8.svg?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![PyTorch](https://img.shields.999.io/badge/PyTorch-2.0+-ee4c2c.svg?style=flat&logo=pytorch)](https://pytorch.org/)

**DermaScreen** is a state-of-the-art, AI-powered clinical dermatology screening application. It provides users with an accessible tool to analyze skin lesions using machine learning, check image quality to ensure accurate scans, visualize diagnosis insights using Grad-CAM heatmaps, and consult with a virtual AI health assistant.

---

## 🌟 Key Features

*   **🛡️ Secure User Authentication**: Multi-method login and signup (Email/Password & Google OAuth) powered by Firebase Client SDK.
*   **📸 Smart Image Quality Assessment**: OpenCV-powered backend checks (blur, illumination, resolution) to ensure uploaded photos are clear enough for AI analysis before processing.
*   **🔬 Deep Learning Lesion Analysis**: A PyTorch-based image classification backend that analyzes skin scans to predict dermatological conditions.
*   **👁️ Explainable AI (Grad-CAM)**: Heatmap visualization overlay on the skin scan to show users and clinicians exactly where the model focused to make its prediction.
*   **💬 AI Health Assistant**: A context-aware chatbot integrated with **OpenRouter (Google Gemini 2.0 Flash)** to answer general skin health questions and guide patients on next steps.
*   **📊 Dynamic Patient Dashboard**: Keep track of scan history, analytics, and scan outcomes over time.

---

## 🛠️ Technology Stack

### Frontend
*   **Core**: React 19, JavaScript (ES6+), HTML5
*   **Routing**: React Router DOM v7
*   **Styling**: Tailwind CSS v4 (with PostCSS and Autoprefixer)
*   **Authentication & Services**: Firebase Client SDK

### Backend
*   **Framework**: FastAPI (Python 3.10+)
*   **Server**: Uvicorn
*   **Machine Learning**: PyTorch, Torchvision, NumPy, scikit-learn
*   **Image Processing**: OpenCV (headless), Pillow (PIL)
*   **Database & File Storage**: Supabase SDK
*   **LLM API**: OpenRouter Client (Gemini 2.0)
*   **Auth Verification**: Firebase Admin SDK

---

## 📂 Repository Structure

```text
DermaScreen/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application entry point
│   │   ├── config.py               # Settings & Environment configuration
│   │   ├── dependencies.py         # Auth & Database dependencies
│   │   ├── routers/                # API Endpoints (auth, scans, quality, predict, etc.)
│   │   ├── schemas/                # Pydantic data schemas
│   │   └── services/               # Services (ML, Firebase Admin, Quality checks)
│   ├── models/
│   │   └── grad_cam.pkl            # Trained PyTorch Model file (needs Git LFS)
│   ├── .env.example                # Template for backend secrets
│   └── requirements.txt            # Python dependencies
├── src/
│   ├── components/                 # Reusable UI components
│   ├── context/                    # App State Context (AppContext.jsx)
│   ├── pages/                      # Application Views (Dashboard, History, Scan, Chat, etc.)
│   ├── services/
│   │   └── firebase.js             # Firebase client setup & auth helpers
│   ├── App.jsx                     # Route definitions
│   └── main.jsx                    # React entrypoint
├── package.json                    # Node dependencies & frontend scripts
├── vite.config.js                  # Vite bundler configuration
└── README.md                       # Documentation
```

---

## 🚀 Installation & Local Setup

Follow these steps to set up both the frontend and backend on your local machine.

### 📋 Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [Python](https://www.python.org/) (v3.10 or higher)
*   [Git LFS](https://git-lfs.github.com/) (Required to push/pull model files larger than 50MB)

---

### 1. Backend Setup (FastAPI)

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create and activate a Python virtual environment:**
    *   **Windows (PowerShell):**
        ```powershell
        python -m venv venv
        .\venv\Scripts\Activate.ps1
        ```
    *   **macOS / Linux:**
        ```bash
        python -m venv venv
        source venv/bin/activate
        ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up Environment Variables:**
    *   Duplicate `.env.example` and name the copy `.env`.
        ```bash
        cp .env.example .env
        ```
    *   Open `.env` and fill in the required fields:
        *   **Supabase Credentials**: Get these from your Supabase dashboard settings.
        *   **Firebase Service Account Path**: Point this to your private key file (see step below).
        *   **OpenRouter API Key**: Obtain a key from [OpenRouter](https://openrouter.ai/).

5.  **Set up Firebase Admin Credentials:**
    *   Go to your **Firebase Console** ➔ **Project Settings** ➔ **Service Accounts**.
    *   Click **Generate New Private Key** and download the JSON file.
    *   Place this file inside the `backend/` directory and configure the filename in your `.env` file under `FIREBASE_SERVICE_ACCOUNT_PATH`.

6.  **Place the Machine Learning Model:**
    *   Ensure your PyTorch `.pkl` model file is located at `backend/models/grad_cam.pkl` (or matching the `ML_MODEL_PATH` setting in your `.env`).

7.  **Start the Uvicorn Dev Server:**
    ```bash
    uvicorn app.main:app --reload --port 8000
    ```
    *   The API documentation will be available at: [http://localhost:8000/docs](http://localhost:8000/docs)
    *   The backend health endpoint is: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

### 2. Frontend Setup (React + Vite)

1.  **Navigate to the root directory:**
    ```bash
    cd ..
    ```

2.  **Install the Node modules:**
    ```bash
    npm install
    ```

3.  **Configure Firebase Frontend SDK:**
    *   Ensure your Firebase Web App configuration credentials are correct in [src/services/firebase.js](file:///c:/Users/Bhavesh%20Kaushik/Desktop/DermaScreen/src/services/firebase.js).
    *   *Tip: In production, these should be moved to environment variables prefixed with `VITE_`.*

4.  **Start the frontend development server:**
    ```bash
    npm run dev
    ```
    *   Open your browser to: [http://localhost:5173](http://localhost:5173)

---

## ⚠️ Important Note on Large Files (Git LFS)

The model file `backend/models/grad_cam.pkl` is approximately ~92MB, which exceeds GitHub's standard warning limit (50MB) and is close to the hard block limit (100MB). 

To avoid push failures:
1.  Install **Git LFS** on your machine:
    ```bash
    git lfs install
    ```
2.  Track the `.pkl` file extension:
    ```bash
    git lfs track "*.pkl"
    git add .gitattributes
    ```
3.  Commit and push your files normally.

---

## ⚕️ Medical Disclaimer

> [!WARNING]
> **DermaScreen is a screening support tool powered by Artificial Intelligence.**
> It is designed to assist in highlighting areas of concern and checking image quality. It does **not** provide formal medical diagnoses and is **not** a replacement for professional clinical evaluation, consultation, or diagnosis by a licensed dermatologist. Always seek the advice of a qualified healthcare professional with any questions you have regarding skin conditions.
