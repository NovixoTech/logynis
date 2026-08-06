import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Subscribe from "./pages/Subscribe.jsx";
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
import AnxietySimulator from "./pages/AnxietySimulator.jsx";
import CommonMistakes from "./pages/CommonMistakes.jsx";
import EssayFeedback from "./pages/EssayFeedback.jsx";
import MoodCheckin from "./pages/MoodCheckin.jsx";
import OnePager from "./pages/OnePager.jsx";
import RapidRecall from "./pages/RapidRecall.jsx";
import ReadinessScore from "./pages/ReadinessScore.jsx";
import RevisionTimetable from "./pages/RevisionTimetable.jsx";
import SpacedRepetition from "./pages/SpacedRepetition.jsx";
import SpeedDrill from "./pages/SpeedDrill.jsx";
import StudyPlan from "./pages/StudyPlan.jsx";
import TimedMockExam from "./pages/TimedMockExam.jsx";
import WeakTopics from "./pages/WeakTopics.jsx";
import Reflection from "./pages/Reflection.jsx";
import Glossary from "./pages/Glossary.jsx";
import Referrals from "./pages/Referrals.jsx";
import OfflineLibrary from "./pages/OfflineLibrary.jsx";

const TRIAL_DAYS = 7;

// Returns null if the user's access is fine, or a reason string
// ("trial_expired" | "subscription_expired") if they should be blocked.
// hasSubscribedBefore (subscriptionexpiry ever being set) is what decides
// which message they see - it stays true even after subscriptionstatus
// flips to "inactive", so it survives repeated checks correctly.
function getExpiryReason(user) {
  if (!user) return null;
  const now = new Date();
  const hasSubscribedBefore = !!user.subscriptionexpiry;

  if (user.subscriptionstatus === "active" && user.subscriptionexpiry) {
    return new Date(user.subscriptionexpiry) > now ? null : "subscription_expired";
  }

  if (!hasSubscribedBefore) {
    const start = user.trialstartdate ? new Date(user.trialstartdate) : now;
    const trialEnd = new Date(start.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    return now >= trialEnd ? "trial_expired" : null;
  }

  return hasSubscribedBefore ? "subscription_expired" : "trial_expired";
}

const LoadingScreen = (
  <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",color:"#6b7280"}}>Loading...</div>
);

// For pages that just need login - Dashboard, Settings, Referrals, etc, and
// now ModeFeatures (the list of features inside a mode, like "Flashcards,
// Memory Aid, Concept Map..."). Browsing that list doesn't cost anything,
// so it stays open even after trial/subscription expiry - no reason to
// block someone from just looking at what's available.
function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return LoadingScreen;
  if (!user) return <Navigate to="/signup" replace />;
  return children;
}

// For the actual AI-generation surfaces - Chat, Flashcards, Memory Aid, and
// every other page where visiting it means you're about to trigger an AI
// call. This is where the clean paywall redirect belongs, so an expired
// trial gets a proper card instead of an inline error mid-generation.
function ProtectedFeature({ children }) {
  const { user: cachedUser, loading: authLoading, authFetch, updateUser } = useAuth();
  const [checking, setChecking] = useState(true);
  const [expiredReason, setExpiredReason] = useState(null);

  useEffect(() => {
    if (authLoading || !cachedUser) return;
    let cancelled = false;

    async function checkFresh() {
      try {
        const res = await authFetch("/user/profile");
        if (!res.ok) throw new Error("profile check failed");
        const fresh = await res.json();
        if (!cancelled) {
          updateUser(fresh);
          setExpiredReason(getExpiryReason(fresh));
        }
      } catch (e) {
        if (!cancelled) setExpiredReason(getExpiryReason(cachedUser));
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    checkFresh();
    return () => { cancelled = true; };
  }, [authLoading, cachedUser?.id]);

  if (authLoading || checking) return LoadingScreen;
  if (!cachedUser) return <Navigate to="/signup" replace />;
  if (expiredReason) return <Navigate to={`/subscribe?reason=${expiredReason}`} replace />;
  return children;
}

function Public({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function Routes_() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Public><Login /></Public>} />
      <Route path="/signup" element={<Public><Signup /></Public>} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/subscribe" element={<Protected><Subscribe /></Protected>} />
      <Route path="/chat/:mode" element={<ProtectedFeature><Chat /></ProtectedFeature>} />
      <Route path="/mode/:mode/chat" element={<ProtectedFeature><Chat /></ProtectedFeature>} />
      <Route path="/settings" element={<Protected><Settings /></Protected>} />
      <Route path="/mode/:mode" element={<Protected><ModeFeatures /></Protected>} />
      <Route path="/glossary" element={<Protected><Glossary /></Protected>} />
      <Route path="/referrals" element={<Protected><Referrals /></Protected>} />
      <Route path="/offline-library" element={<Protected><OfflineLibrary /></Protected>} />

      {/* Study mode */}
      <Route path="/mode/study/flashcards" element={<ProtectedFeature><Flashcards /></ProtectedFeature>} />
      <Route path="/mode/study/memory-aid" element={<ProtectedFeature><MemoryAid /></ProtectedFeature>} />
      <Route path="/mode/study/concept-map" element={<ProtectedFeature><ConceptMap /></ProtectedFeature>} />
      <Route path="/mode/study/explain-differently" element={<ProtectedFeature><ExplainDifferently /></ProtectedFeature>} />
      <Route path="/mode/study/note-summarizer" element={<ProtectedFeature><NoteSummarizer /></ProtectedFeature>} />
      <Route path="/mode/study/cross-subject" element={<ProtectedFeature><CrossSubject /></ProtectedFeature>} />
      <Route path="/mode/study/debate-practice" element={<ProtectedFeature><DebatePractice /></ProtectedFeature>} />
      

      {/* Exam mode */}
      <Route path="/mode/exam/timed-mock" element={<ProtectedFeature><TimedMockExam /></ProtectedFeature>} />
      <Route path="/mode/exam/weak-topics" element={<ProtectedFeature><WeakTopics /></ProtectedFeature>} />
      <Route path="/mode/exam/speed-drill" element={<ProtectedFeature><SpeedDrill /></ProtectedFeature>} />
      <Route path="/mode/exam/anxiety-simulator" element={<ProtectedFeature><AnxietySimulator /></ProtectedFeature>} />
      <Route path="/mode/exam/common-mistakes" element={<ProtectedFeature><CommonMistakes /></ProtectedFeature>} />
      <Route path="/mode/exam/readiness-score" element={<ProtectedFeature><ReadinessScore /></ProtectedFeature>} />
      <Route path="/mode/exam/study-plan" element={<ProtectedFeature><StudyPlan /></ProtectedFeature>} />

      {/* Homework mode */}
      <Route path="/mode/homework/essay-feedback" element={<ProtectedFeature><EssayFeedback /></ProtectedFeature>} />

      {/* Revision mode */}
      <Route path="/mode/revision/onepager" element={<ProtectedFeature><OnePager /></ProtectedFeature>} />
      <Route path="/mode/revision/rapid-recall" element={<ProtectedFeature><RapidRecall /></ProtectedFeature>} />
      <Route path="/mode/revision/revision-timetable" element={<ProtectedFeature><RevisionTimetable /></ProtectedFeature>} />
      <Route path="/mode/revision/spaced-repetition" element={<ProtectedFeature><SpacedRepetition /></ProtectedFeature>} />

      {/* Motivation mode */}
      <Route path="/mode/motivation/mood-checkin" element={<ProtectedFeature><MoodCheckin /></ProtectedFeature>} />
      <Route path="/mode/motivation/reflection" element={<ProtectedFeature><Reflection /></ProtectedFeature>} />


      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AuthProvider><Routes_ /></AuthProvider>;
}
