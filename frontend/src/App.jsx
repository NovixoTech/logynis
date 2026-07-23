import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Home from "./pages/Home.jsx";
import Chat from "./pages/Chat.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Settings from "./pages/Settings.jsx";
import ModeFeatures from "./pages/ModeFeatures.jsx";
import MemoryAid from "./pages/MemoryAid.jsx";
import Flashcards from "./pages/Flashcards.jsx";
import ConceptMap from "./pages/ConceptMap.jsx";
import ExplainDifferently from "./pages/ExplainDifferently.jsx";
import NoteSummarizer from "./pages/NoteSummarizer.jsx";
import CrossSubject from "./pages/CrossSubject.jsx";
import DebatePractice from "./pages/DebatePractice.jsx";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",color:"#6b7280"}}>Loading...</div>;
  if (!user) return <Navigate to="/signup" replace />;
  return children;
}

function Public({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/mode/study" replace />;
  return children;
}
function Routes_() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Public><Login /></Public>} />
      <Route path="/signup" element={<Public><Signup /></Public>} />
      <Route path="/chat/:mode" element={<Protected><Chat /></Protected>} />
      <Route path="/mode/:mode/chat" element={<Protected><Chat /></Protected>} />
      <Route path="/settings" element={<Protected><Settings /></Protected>} />
      <Route path="/mode/:mode" element={<Protected><ModeFeatures /></Protected>} />
      <Route path="/mode/study/flashcards" element={<Protected><Flashcards /></Protected>} />
      <Route path="/mode/study/memory-aid" element={<Protected><MemoryAid /></Protected>} /> 
      <Route path="/mode/study/concept-map" element={<Protected><ConceptMap /></Protected>} />
      <Route path="/mode/study/explain-differently" element={<Protected><ExplainDifferently /></Protected>} />
      <Route path="/mode/study/note-summarizer" element={<Protected><NoteSummarizer /></Protected>} />
      <Route path="/mode/study/cross-subject" element={<Protected><CrossSubject /></Protected>} />
      <Route path="/mode/study/debate-practice" element={<Protected><DebatePractice /></Protected>} /> 
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AuthProvider><Routes_ /></AuthProvider>;
}
