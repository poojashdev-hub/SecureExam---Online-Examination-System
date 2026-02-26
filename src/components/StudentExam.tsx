import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Send,
  User,
  MonitorOff,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ExamConfig, ExamResult, Question } from '../types';

interface StudentExamProps {
  examId: string;
  onBack: () => void;
}

export default function StudentExam({ examId, onBack }: StudentExamProps) {
  const [studentName, setStudentName] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [config, setConfig] = useState<ExamConfig | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<{ [key: string]: number }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [isTerminated, setIsTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');
  const [loading, setLoading] = useState(true);

  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Security: Prevent tab switching and window blur
  const terminateExam = useCallback(async (reason: string) => {
    if (isTerminated || result) return;
    
    setIsTerminated(true);
    setTerminationReason(reason);
    
    // Auto-submit on termination
    const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
    try {
      const res = await fetch(`/api/exam/${examId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          responses,
          timeTakenSeconds: timeTaken,
          terminated: true,
          terminationReason: reason
        })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Failed to submit on termination", err);
    }
  }, [examId, studentName, responses, isTerminated, result]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isStarted && !result && !isTerminated) {
        terminateExam('Tab switching or window minimization detected');
      }
    };

    const handleBlur = () => {
      if (isStarted && !result && !isTerminated) {
        terminateExam('Window focus lost (possible screen switching)');
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isStarted && !result && !isTerminated) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isStarted, result, isTerminated, terminateExam]);

  useEffect(() => {
    fetch(`/api/exam/${examId}`)
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setTimeLeft(data.durationMinutes * 60);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [examId]);

  const startExam = () => {
    if (!studentName.trim()) return;
    setIsStarted(true);
    startTimeRef.current = Date.now();
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          submitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Try to enter fullscreen for extra security
    try {
      document.documentElement.requestFullscreen();
    } catch (e) {
      console.warn("Fullscreen failed", e);
    }
  };

  const submitExam = async () => {
    if (result) return;
    if (timerRef.current) clearInterval(timerRef.current);
    
    const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
    
    try {
      const res = await fetch(`/api/exam/${examId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          responses,
          timeTakenSeconds: timeTaken,
          terminated: false
        })
      });
      const data = await res.json();
      setResult(data);
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading Exam...</div>;
  if (!config) return <div className="flex items-center justify-center h-screen">Exam not found.</div>;

  if (result) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-neutral-100"
        >
          {result.terminated ? (
            <div className="mb-6">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MonitorOff className="text-red-500 w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-red-600 mb-2">Exam Terminated</h2>
              <p className="text-neutral-500 text-sm">{result.terminationReason}</p>
            </div>
          ) : (
            <div className="mb-6">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="text-emerald-500 w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Exam Completed</h2>
              <p className="text-neutral-500 text-sm">Your responses have been submitted successfully.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-neutral-50 p-4 rounded-2xl">
              <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Score</p>
              <p className="text-2xl font-bold text-neutral-900">{result.score}/{config.totalMarks}</p>
            </div>
            <div className="bg-neutral-50 p-4 rounded-2xl">
              <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Percentage</p>
              <p className="text-2xl font-bold text-neutral-900">{result.percentage.toFixed(1)}%</p>
            </div>
          </div>

          <div className="text-left space-y-3 mb-8">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Student Name:</span>
              <span className="font-medium">{result.studentName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Correct Answers:</span>
              <span className="font-medium">{result.totalCorrect} / {config.questions.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Time Taken:</span>
              <span className="font-medium">{Math.floor(result.timeTakenSeconds / 60)}m {result.timeTakenSeconds % 60}s</span>
            </div>
          </div>

          <button 
            onClick={onBack}
            className="w-full py-4 bg-neutral-900 text-white rounded-2xl font-medium hover:bg-neutral-800 transition-colors"
          >
            Return to Home
          </button>
        </motion.div>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full bg-white rounded-3xl shadow-xl p-8 border border-neutral-100 relative"
        >
          <button 
            onClick={onBack}
            className="absolute -top-4 -left-4 p-3 bg-white border border-neutral-200 text-neutral-600 rounded-2xl hover:bg-neutral-50 transition-all shadow-sm z-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-50 rounded-2xl">
              <Shield className="text-indigo-600 w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">Secure Exam Portal</h1>
              <p className="text-neutral-500 text-sm">Integrity Monitoring Active</p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
              <AlertTriangle className="text-amber-600 w-5 h-5 shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-bold mb-1">Important Rules:</p>
                <ul className="list-disc list-inside space-y-1 opacity-90">
                  <li>Do not switch tabs or minimize the window.</li>
                  <li>Do not refresh the page.</li>
                  <li>Exam will terminate immediately on any violation.</li>
                  <li>The system will enter fullscreen mode.</li>
                </ul>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Enter Your Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input 
                  type="text" 
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <button 
            onClick={startExam}
            disabled={!studentName.trim()}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
          >
            Start Examination
          </button>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = config.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-bottom border-neutral-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
              {currentQuestionIndex + 1}
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900">Question {currentQuestionIndex + 1} of {config.questions.length}</h2>
              <p className="text-xs text-neutral-400 uppercase tracking-widest">Secure Session</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${timeLeft < 60 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-neutral-50 border-neutral-100 text-neutral-600'}`}>
              <Clock className="w-4 h-4" />
              <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
            </div>
            <button 
              onClick={submitExam}
              className="px-6 py-2 bg-neutral-900 text-white rounded-xl text-sm font-bold hover:bg-neutral-800 transition-colors"
            >
              Finish Exam
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-3xl shadow-sm border border-neutral-200 p-8 md:p-12"
          >
            <h3 className="text-xl md:text-2xl font-medium text-neutral-900 mb-8 leading-relaxed">
              {currentQuestion.text}
            </h3>

            <div className="space-y-4">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => setResponses(prev => ({ ...prev, [currentQuestion.id]: idx }))}
                  className={`w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center gap-4 group ${
                    responses[currentQuestion.id] === idx 
                      ? 'border-indigo-600 bg-indigo-50/50' 
                      : 'border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    responses[currentQuestion.id] === idx 
                      ? 'border-indigo-600 bg-indigo-600' 
                      : 'border-neutral-300 group-hover:border-neutral-400'
                  }`}>
                    {responses[currentQuestion.id] === idx && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <span className={`text-lg ${responses[currentQuestion.id] === idx ? 'text-indigo-900 font-medium' : 'text-neutral-700'}`}>
                    {option}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Navigation */}
      <footer className="bg-white border-t border-neutral-200 p-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button 
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-neutral-600 font-medium hover:bg-neutral-50 disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          <div className="flex gap-2">
            {config.questions.map((_, idx) => (
              <div 
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentQuestionIndex ? 'w-8 bg-indigo-600' : 
                  responses[config.questions[idx].id] !== undefined ? 'bg-indigo-200' : 'bg-neutral-200'
                }`}
              />
            ))}
          </div>

          {currentQuestionIndex === config.questions.length - 1 ? (
            <button 
              onClick={submitExam}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              Submit Exam
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button 
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              className="flex items-center gap-2 px-8 py-3 bg-neutral-900 text-white rounded-2xl font-bold hover:bg-neutral-800 transition-all"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
