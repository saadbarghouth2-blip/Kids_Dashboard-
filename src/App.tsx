import { useMemo, useState } from "react";
import GlowBackground from "./components/GlowBackground";
import LessonSelect from "./quiz/LessonSelect";
import QuizPage from "./quiz/QuizPage";
import HomePage from "./HomePage";
import { LESSONS, getLesson } from "./quiz/lessons";

export default function App() {
  const [started, setStarted] = useState(false);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const lesson = useMemo(() => (lessonId ? getLesson(lessonId) : null), [lessonId]);

  return (
    <div className="relative">
      <GlowBackground />
      {!started ? (
        <HomePage onStart={() => setStarted(true)} />
      ) : lesson ? (
        <QuizPage lesson={lesson} onBack={() => setLessonId(null)} />
      ) : (
        <LessonSelect lessons={LESSONS} onPick={(id) => setLessonId(id)} />
      )}
    </div>
  );
}
