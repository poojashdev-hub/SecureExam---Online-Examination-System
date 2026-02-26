import React, { useState, useEffect } from 'react';
import ExaminerDashboard from './components/ExaminerDashboard';
import StudentExam from './components/StudentExam';
import { Shield, GraduationCap, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [view, setView] = useState<'home' | 'examiner' | 'student'>('home');
  const [examId, setExamId] = useState('');

  // Simple routing based on URL path
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/examiner') {
      setView('examiner');
    } else if (path.startsWith('/exam/')) {
      const id = path.split('/')[2];
      setExamId(id);
      setView('student');
    }
  }, []);

  const handleBack = () => {
    window.history.pushState({}, '', '/');
    setView('home');
    setExamId('');
  };

  if (view === 'examiner') return <ExaminerDashboard onBack={handleBack} />;
  if (view === 'student') return <StudentExam examId={examId} onBack={handleBack} />;

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-200"
          >
            <Shield className="text-white w-10 h-10" />
          </motion.div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">SecureExam</h1>
          <p className="text-neutral-500 text-lg">The world's most trusted online examination platform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.button 
            whileHover={{ y: -5 }}
            onClick={() => {
              window.history.pushState({}, '', '/examiner');
              setView('examiner');
            }}
            className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-neutral-200 text-left group transition-all hover:shadow-xl hover:border-indigo-100"
          >
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
              <GraduationCap className="text-indigo-600 w-7 h-7 group-hover:text-white transition-colors" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Examiner Portal</h2>
            <p className="text-neutral-500 leading-relaxed">Create exams, set solution keys, and monitor student performance in real-time.</p>
          </motion.button>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-neutral-200 text-left group transition-all hover:shadow-xl hover:border-emerald-100"
          >
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors">
              <UserCheck className="text-emerald-600 w-7 h-7 group-hover:text-white transition-colors" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Student Portal</h2>
            <p className="text-neutral-500 mb-6 leading-relaxed">Enter your exam ID to begin your secure examination session.</p>
            
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Enter Exam ID"
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
                className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
              <button 
                onClick={() => {
                  if (examId) {
                    window.history.pushState({}, '', `/exam/${examId}`);
                    setView('student');
                  }
                }}
                className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-bold hover:bg-neutral-800 transition-colors"
              >
                Go
              </button>
            </div>
          </motion.div>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-full text-xs font-bold text-neutral-400 uppercase tracking-widest">
            <Shield className="w-3 h-3" />
            Academic Integrity Enforcement Active
          </div>
        </div>
      </div>
    </div>
  );
}
