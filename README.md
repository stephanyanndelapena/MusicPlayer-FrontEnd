I. Project Overview
- This repository contains the frontend component of Stopify, a mobile application developed using React Native and published through Snack Expo.
- The frontend communicates with a Django backend API to provide users with an interactive interface for browsing, uploading, and organizing music tracks into playlists.
- The application demonstrates key concepts in mobile UI design, RESTful API integration, and cross‑platform development.

II. Key Features
- Fetch, display, and manage Tracks and Playlists from hosted backend API
- Create and modify playlists
- Upload and display details for music tracks and artwork
- Mobile‑friendly UI developed with React Native components
- Published via Snack Expo for easy testing and access

III. Technologies Used
- React Native
- Expo / Snack Expo
 -Axios for API requests

IV. System Requirements
- Node.js (LTS recommended)
- Expo CLI
- Smartphone with Expo Go app (optional for testing)

V. Installation and Setup
To run locally:
- Clone repository: git clone https://github.com/stephanyanndelapena/MusicPlayer-FrontEnd
- cd MusicPlayer-FrontEnd
Install dependencies:
- npm install
Start development environment:
- npx expo start
To run via Snack Expo:
- Open the provided Snack Expo project URL
- Scan QR code using Expo Go

VI. API Configuration
- Update the backend API base URL inside the project:
    - export const API_URL = "https://musicplayer-backend-c1vt.onrender.com/api";
- Ensure the backend is deployed and accessible before running the app.

VII. Deployment Notes
- The final build must be accessible through Snack Expo as required by the course.
- Ensure that all API routes correctly match the hosted backend.

VIII. Acknowledgements
- This frontend application is developed as part of the final project for PEITEL – System Development.

IX. Project Contributors
- THEEANNA JETHER D. ALEJOS
- STEPHANY ANN S. DELA PEÑA
- GRACIELLA E. PASTORAL
- BRYAN OLIVER M. GALANG
