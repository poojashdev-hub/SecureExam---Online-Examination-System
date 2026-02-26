import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Settings, 
  FileText, 
  Key, 
  Clock, 
  Trophy,
  Users,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'motion/react';
import { Question, SolutionKey, ExamConfig } from '../types';

interface ExaminerDashboardProps {
  onBack: () => void;
}

export default function ExaminerDashboard({ onBack }: ExaminerDashboardProps) {
  const [examId, setExamId] = useState('EXAM-' + Math.random().toString(36).substring(7).toUpperCase());
  const [duration, setDuration] = useState(30);
  const [totalMarks, setTotalMarks] = useState(100);
  const [questions, setQuestions] = useState<Question[]>([
    { id: '1', text: 'What is the capital of France?', options: ['London', 'Berlin', 'Paris', 'Madrid'] }
  ]);
  const [solutionKey, setSolutionKey] = useState<SolutionKey>({ '1': 2 });
  const [isSaved, setIsSaved] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const addQuestion = () => {
    const newId = (questions.length + 1).toString();
    setQuestions([...questions, { id: newId, text: '', options: ['', '', '', ''] }]);
    setSolutionKey({ ...solutionKey, [newId]: 0 });
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
    const newKey = { ...solutionKey };
    delete newKey[id];
    setSolutionKey(newKey);
  };

  const updateQuestion = (id: string, text: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, text } : q));
  };

  const updateOption = (qId: string, optIdx: number, text: string) => {
    setQuestions(questions.map(q => q.id === qId ? {
      ...q,
      options: q.options.map((o, i) => i === optIdx ? text : o)
    } : q));
  };

  const handleSave = async () => {
    const config: ExamConfig = {
      id: examId,
      durationMinutes: duration,
      totalMarks,
      questions
    };

    try {
      const res = await fetch('/api/exam/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: examId, config, solutionKey })
      });
      if (res.ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchResults = async () => {
    try {
      const res = await fetch(`/api/exam/${examId}/results`);
      const data = await res.json();
      setResults(data);
      setShowResults(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-3 bg-white border border-neutral-200 text-neutral-600 rounded-2xl hover:bg-neutral-50 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Examiner Dashboard</h1>
              <p className="text-neutral-500">Create and manage secure examinations</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => window.open(`/exam/${examId}`, '_blank')}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl font-bold hover:bg-emerald-100 transition-all"
            >
              <ExternalLink className="w-5 h-5" />
              Launch Exam
            </button>
            <button 
              onClick={fetchResults}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-neutral-200 text-neutral-700 rounded-2xl font-medium hover:bg-neutral-50 transition-all"
            >
              <Users className="w-5 h-5" />
              View Results
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <Save className="w-5 h-5" />
              {isSaved ? 'Saved!' : 'Save Exam'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-200">
              <div className="flex items-center gap-2 mb-6">
                <Settings className="w-5 h-5 text-indigo-600" />
                <h2 className="font-bold text-neutral-900">Exam Configuration</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Exam ID</label>
                  <input 
                    type="text" 
                    value={examId}
                    onChange={(e) => setExamId(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Duration (Minutes)</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                    <input 
                      type="number" 
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Total Marks</label>
                  <div className="relative">
                    <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                    <input 
                      type="number" 
                      value={totalMarks}
                      onChange={(e) => setTotalMarks(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-xs text-indigo-700 font-medium mb-2">Student Access Link:</p>
                <div className="flex items-center gap-2 text-xs font-mono text-indigo-900 bg-white p-2 rounded-lg border border-indigo-200 break-all mb-3">
                  {window.location.origin}/exam/{examId}
                </div>
                <button 
                  onClick={() => window.open(`/exam/${examId}`, '_blank')}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Launch Student View
                </button>
              </div>
            </div>
          </div>

          {/* Questions Area */}
          <div className="lg:col-span-2 space-y-6">
            {showResults ? (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-neutral-200">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-neutral-900">Student Results</h2>
                  <button onClick={() => setShowResults(false)} className="text-sm text-indigo-600 font-medium">Back to Editor</button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-neutral-100">
                        <th className="pb-4 font-bold text-neutral-400 text-xs uppercase tracking-wider">Student</th>
                        <th className="pb-4 font-bold text-neutral-400 text-xs uppercase tracking-wider">Score</th>
                        <th className="pb-4 font-bold text-neutral-400 text-xs uppercase tracking-wider">Status</th>
                        <th className="pb-4 font-bold text-neutral-400 text-xs uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {results.map((r, i) => (
                        <tr key={i} className="group hover:bg-neutral-50 transition-colors">
                          <td className="py-4 font-medium text-neutral-900">{r.studentName}</td>
                          <td className="py-4">
                            <span className="font-bold text-indigo-600">{r.score}</span>
                            <span className="text-neutral-400 text-xs ml-1">/ {totalMarks}</span>
                          </td>
                          <td className="py-4">
                            {r.terminated ? (
                              <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold">Terminated</span>
                            ) : (
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold">Completed</span>
                            )}
                          </td>
                          <td className="py-4 text-sm text-neutral-500">
                            {Math.floor(r.timeTakenSeconds / 60)}m {r.timeTakenSeconds % 60}s
                          </td>
                        </tr>
                      ))}
                      {results.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-10 text-center text-neutral-400">No results yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-xl font-bold text-neutral-900">Question Paper</h2>
                  </div>
                  <button 
                    onClick={addQuestion}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-xl text-sm font-bold hover:bg-neutral-800 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Add Question
                  </button>
                </div>

                {questions.map((q, qIdx) => (
                  <motion.div 
                    key={q.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-200 relative group"
                  >
                    <button 
                      onClick={() => removeQuestion(q.id)}
                      className="absolute top-6 right-6 p-2 text-neutral-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    <div className="flex gap-4 mb-6">
                      <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-500 font-bold text-sm shrink-0">
                        {qIdx + 1}
                      </div>
                      <textarea 
                        value={q.text}
                        onChange={(e) => updateQuestion(q.id, e.target.value)}
                        placeholder="Enter question text..."
                        className="w-full bg-transparent border-none focus:ring-0 text-lg font-medium text-neutral-900 resize-none outline-none"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-3 bg-neutral-50 p-3 rounded-2xl border border-neutral-100">
                          <button 
                            onClick={() => setSolutionKey({ ...solutionKey, [q.id]: optIdx })}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              solutionKey[q.id] === optIdx 
                                ? 'bg-emerald-500 border-emerald-500' 
                                : 'border-neutral-300 hover:border-neutral-400'
                            }`}
                          >
                            {solutionKey[q.id] === optIdx && <Key className="w-3 h-3 text-white" />}
                          </button>
                          <input 
                            type="text" 
                            value={opt}
                            onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                            placeholder={`Option ${optIdx + 1}`}
                            className="w-full bg-transparent border-none focus:ring-0 text-sm text-neutral-700 outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
