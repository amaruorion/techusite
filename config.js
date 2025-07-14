// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBB1BjMP2xyCUAhEqi657SKRGofp5IKV90",
  authDomain: "techusite-a9e09.firebaseapp.com",
  databaseURL: "https://techusite-a9e09-default-rtdb.firebaseio.com",
  projectId: "techusite-a9e09",
  storageBucket: "techusite-a9e09.firebasestorage.app",
  messagingSenderId: "421866148703",
  appId: "1:421866148703:web:c5cd3c300dc71cddd3dcea",
  measurementId: "G-7PG7B8C0QD"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Database
const database = firebase.database();
