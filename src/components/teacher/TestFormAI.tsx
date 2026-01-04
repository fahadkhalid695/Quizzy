'use client';

import { useState, useRef } from 'react';
import { useNotify } from '@/components/common/Notification';
import { api } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import { Input, TextArea, Select } from '@/components/ui/FormElements';
import Card from '@/components/ui/Card';

interface Question {
  id: string;
  question: string;
  type: 'multiple_choice' | 'short_answer' | 'true_false' | 'essay';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
}

interface TestFormProps {
  classId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

type GenerationMode = 'manual' | 'topic' | 'file' | 'text';
type Step = 'mode' | 'generate' | 'questions' | 'settings';

export default function TestFormAI({ classId, onSuccess, onCancel }: TestFormProps) {
  const [step, setStep] = useState<Step>('mode');
  const [mode, setMode] = useState<GenerationMode>('manual');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Test Details
  const [testData, setTestData] = useState({
    title: '',
    description: '',
    duration: 60,
    difficulty: 'medium',
  });
  
  // Questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  
  // AI Generation Settings
  const [aiSettings, setAiSettings] = useState({
    topic: '',
    text: '',
    numQuestions: 10,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    questionTypes: ['multiple_choice'] as string[],
  });
  
  // File Upload
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dynamic Test Settings
  const [isDynamic, setIsDynamic] = useState(false);
  const [dynamicSettings, setDynamicSettings] = useState({
    questionsPerStudent: 10,
    shuffleQuestions: true,
    shuffleOptions: true,
    regenerateOnRetake: false,
  });
  
  // Research Summary (from AI)
  const [researchSummary, setResearchSummary] = useState('');
  
  const notify = useNotify();

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      notify.error('File size must be less than 10MB');
      return;
    }
    
    const allowedTypes = [
      'application/pdf',
      'image/png', 'image/jpeg', 'image/jpg', 'image/webp',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt')) {
      notify.error('Unsupported file type. Please upload PDF, images, Word, PowerPoint, or text files.');
      return;
    }
    
    setUploadedFile(file);
    
    // Preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview('');
    }
  };

  // Generate questions from topic
  const generateFromTopic = async () => {
    if (!aiSettings.topic.trim()) {
      notify.error('Please enter a topic');
      return;
    }
    
    setGenerating(true);
    try {
      const response = await api.post<{
        questions: Question[];
        researchSummary: string;
      }>('/api/tests/generate/topic', {
        topic: aiSettings.topic,
        numQuestions: aiSettings.numQuestions,
        difficulty: aiSettings.difficulty,
        questionTypes: aiSettings.questionTypes,
      });
      
      const generatedQuestions = response.questions.map((q: any, idx: number) => ({
        ...q,
        id: `gen-${Date.now()}-${idx}`,
      }));
      
      setQuestions(generatedQuestions);
      setResearchSummary(response.researchSummary || '');
      setTestData(prev => ({
        ...prev,
        title: prev.title || `Quiz: ${aiSettings.topic}`,
        difficulty: aiSettings.difficulty,
      }));
      notify.success(`Generated ${generatedQuestions.length} questions!`);
      setStep('questions');
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  };

  // Generate questions from text
  const generateFromText = async () => {
    if (!aiSettings.text.trim()) {
      notify.error('Please enter some text');
      return;
    }
    
    setGenerating(true);
    try {
      const response = await api.post<{ questions: Question[] }>('/api/tests/generate/text', {
        text: aiSettings.text,
        numQuestions: aiSettings.numQuestions,
        difficulty: aiSettings.difficulty,
      });
      
      const generatedQuestions = response.questions.map((q: any, idx: number) => ({
        ...q,
        id: `gen-${Date.now()}-${idx}`,
      }));
      
      setQuestions(generatedQuestions);
      notify.success(`Generated ${generatedQuestions.length} questions!`);
      setStep('questions');
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  };

  // Generate questions from file
  const generateFromFile = async () => {
    if (!uploadedFile) {
      notify.error('Please upload a file');
      return;
    }
    
    setGenerating(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('numQuestions', aiSettings.numQuestions.toString());
      formData.append('difficulty', aiSettings.difficulty);
      formData.append('questionTypes', JSON.stringify(aiSettings.questionTypes));
      
      const response = await fetch('/api/tests/generate/file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate questions');
      }
      
      const generatedQuestions = data.questions.map((q: any, idx: number) => ({
        ...q,
        id: `gen-${Date.now()}-${idx}`,
      }));
      
      setQuestions(generatedQuestions);
      setTestData(prev => ({
        ...prev,
        title: prev.title || `Quiz from ${uploadedFile.name}`,
        difficulty: aiSettings.difficulty,
      }));
      notify.success(`Generated ${generatedQuestions.length} questions from ${uploadedFile.name}!`);
      setStep('questions');
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  };

  // Add/Edit question manually
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    type: 'multiple_choice',
    difficulty: 'medium',
    marks: 1,
    options: ['', '', '', ''],
  });

  const handleAddQuestion = () => {
    if (!currentQuestion.question || !currentQuestion.correctAnswer) {
      notify.error('Question and correct answer are required');
      return;
    }

    const newQuestion: Question = {
      id: editingQuestion?.id || Date.now().toString(),
      question: currentQuestion.question || '',
      type: currentQuestion.type as Question['type'],
      options: currentQuestion.type === 'multiple_choice' ? currentQuestion.options : undefined,
      correctAnswer: currentQuestion.correctAnswer || '',
      explanation: currentQuestion.explanation || '',
      difficulty: currentQuestion.difficulty as Question['difficulty'],
      marks: currentQuestion.marks || 1,
    };

    if (editingQuestion) {
      setQuestions(questions.map(q => q.id === editingQuestion.id ? newQuestion : q));
      setEditingQuestion(null);
      notify.success('Question updated');
    } else {
      setQuestions([...questions, newQuestion]);
      notify.success('Question added');
    }
    
    setCurrentQuestion({
      type: 'multiple_choice',
      difficulty: 'medium',
      marks: 1,
      options: ['', '', '', ''],
    });
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setCurrentQuestion({
      ...question,
      options: question.options || ['', '', '', ''],
    });
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  // Submit test
  const handleSubmit = async () => {
    if (!testData.title.trim()) {
      notify.error('Please enter a test title');
      return;
    }
    
    if (questions.length === 0) {
      notify.error('Add at least one question');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/tests/create', {
        ...testData,
        classId,
        questions: questions.map(q => ({
          question: q.question,
          type: q.type,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          marks: q.marks,
        })),
        aiGenerated: mode !== 'manual',
        sourceType: mode,
        sourceTopic: mode === 'topic' ? aiSettings.topic : undefined,
        isDynamic,
        dynamicSettings: isDynamic ? {
          questionPool: questions.map(q => ({
            question: q.question,
            type: q.type,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty,
            marks: q.marks,
          })),
          ...dynamicSettings,
        } : undefined,
      });
      
      notify.success('Test created successfully!');
      onSuccess?.();
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to create test');
    } finally {
      setLoading(false);
    }
  };

  // Render mode selection
  const renderModeSelection = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">How would you like to create your test?</h2>
        <p className="text-gray-400">Choose a method to get started</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Manual */}
        <button
          onClick={() => { setMode('manual'); setStep('questions'); }}
          className="p-6 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-purple-500/50 rounded-2xl text-left transition group"
        >
          <div className="text-4xl mb-4">✏️</div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition">Manual Creation</h3>
          <p className="text-gray-400 text-sm">Create questions one by one with full control over content</p>
        </button>
        
        {/* AI from Topic */}
        <button
          onClick={() => { setMode('topic'); setStep('generate'); }}
          className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 hover:border-purple-500/50 rounded-2xl text-left transition group"
        >
          <div className="text-4xl mb-4">🤖</div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition">AI from Topic</h3>
          <p className="text-gray-400 text-sm">Enter a topic and let AI research and generate questions</p>
          <span className="inline-block mt-2 px-2 py-1 bg-purple-500/30 text-purple-300 text-xs rounded-full">AI Powered</span>
        </button>
        
        {/* AI from File */}
        <button
          onClick={() => { setMode('file'); setStep('generate'); }}
          className="p-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/30 hover:border-blue-500/50 rounded-2xl text-left transition group"
        >
          <div className="text-4xl mb-4">📄</div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition">AI from Document</h3>
          <p className="text-gray-400 text-sm">Upload PDF, images, Word, or PowerPoint files</p>
          <span className="inline-block mt-2 px-2 py-1 bg-blue-500/30 text-blue-300 text-xs rounded-full">AI Powered</span>
        </button>
        
        {/* AI from Text */}
        <button
          onClick={() => { setMode('text'); setStep('generate'); }}
          className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/30 hover:border-green-500/50 rounded-2xl text-left transition group"
        >
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition">AI from Text</h3>
          <p className="text-gray-400 text-sm">Paste text content and generate questions from it</p>
          <span className="inline-block mt-2 px-2 py-1 bg-green-500/30 text-green-300 text-xs rounded-full">AI Powered</span>
        </button>
      </div>
    </div>
  );

  // Render AI generation options
  const renderGenerationStep = () => (
    <div className="space-y-6">
      <button
        onClick={() => setStep('mode')}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition"
      >
        ← Back to methods
      </button>
      
      <Card>
        <Card.Header 
          title={
            mode === 'topic' ? '🤖 Generate from Topic' :
            mode === 'file' ? '📄 Generate from Document' :
            '📝 Generate from Text'
          }
        />
        <Card.Body className="space-y-6">
          {/* Topic Mode */}
          {mode === 'topic' && (
            <>
              <Input
                label="Topic"
                value={aiSettings.topic}
                onChange={(e) => setAiSettings(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="e.g., World War II, Photosynthesis, JavaScript Basics"
              />
              <p className="text-sm text-gray-400">
                AI will research this topic and generate comprehensive questions covering key concepts.
              </p>
            </>
          )}
          
          {/* File Mode */}
          {mode === 'file' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Upload Document</label>
                <div 
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer
                    ${uploadedFile ? 'border-green-500/50 bg-green-500/10' : 'border-white/20 hover:border-purple-500/50 hover:bg-white/5'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.docx,.pptx"
                    className="hidden"
                  />
                  
                  {uploadedFile ? (
                    <div className="space-y-2">
                      {filePreview && (
                        <img src={filePreview} alt="Preview" className="max-h-32 mx-auto rounded-lg" />
                      )}
                      <div className="text-green-400 text-xl">✓</div>
                      <p className="text-white font-medium">{uploadedFile.name}</p>
                      <p className="text-gray-400 text-sm">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setUploadedFile(null); setFilePreview(''); }}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-4xl mb-4">📁</div>
                      <p className="text-white font-medium">Click to upload or drag and drop</p>
                      <p className="text-gray-400 text-sm mt-2">
                        PDF, Images (PNG, JPG, WebP), Word, PowerPoint, or Text files
                      </p>
                      <p className="text-gray-500 text-xs mt-1">Max size: 10MB</p>
                    </>
                  )}
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm">
                <p className="text-blue-300 font-medium mb-2">📖 Supported Content:</p>
                <ul className="text-blue-200/70 space-y-1">
                  <li>• <strong>PDF:</strong> Textbooks, articles, lecture notes</li>
                  <li>• <strong>Images:</strong> Screenshots, diagrams with text, handwritten notes (OCR)</li>
                  <li>• <strong>Word/PowerPoint:</strong> Lecture slides, study materials</li>
                </ul>
              </div>
            </>
          )}
          
          {/* Text Mode */}
          {mode === 'text' && (
            <TextArea
              label="Content"
              value={aiSettings.text}
              onChange={(e) => setAiSettings(prev => ({ ...prev, text: e.target.value }))}
              placeholder="Paste your study material, article, or any text content here..."
              rows={8}
            />
          )}
          
          {/* Common AI Settings */}
          <div className="border-t border-white/10 pt-6 space-y-4">
            <h4 className="font-semibold text-white">Generation Settings</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Number of Questions"
                type="number"
                value={aiSettings.numQuestions}
                onChange={(e) => setAiSettings(prev => ({ ...prev, numQuestions: parseInt(e.target.value) || 5 }))}
                min="1"
                max="50"
              />
              
              <Select
                label="Difficulty Level"
                value={aiSettings.difficulty}
                onChange={(e) => setAiSettings(prev => ({ ...prev, difficulty: e.target.value as any }))}
                options={[
                  { value: 'easy', label: 'Easy' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'hard', label: 'Hard' },
                ]}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Question Types</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'multiple_choice', label: 'Multiple Choice' },
                  { value: 'true_false', label: 'True/False' },
                  { value: 'short_answer', label: 'Short Answer' },
                ].map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setAiSettings(prev => ({
                        ...prev,
                        questionTypes: prev.questionTypes.includes(type.value)
                          ? prev.questionTypes.filter(t => t !== type.value)
                          : [...prev.questionTypes, type.value]
                      }));
                    }}
                    className={`px-4 py-2 rounded-lg border transition ${
                      aiSettings.questionTypes.includes(type.value)
                        ? 'bg-purple-500/30 border-purple-500 text-purple-300'
                        : 'bg-white/5 border-white/20 text-gray-400 hover:border-white/40'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <Button
            variant="primary"
            onClick={
              mode === 'topic' ? generateFromTopic :
              mode === 'file' ? generateFromFile :
              generateFromText
            }
            isLoading={generating}
            disabled={
              (mode === 'topic' && !aiSettings.topic.trim()) ||
              (mode === 'file' && !uploadedFile) ||
              (mode === 'text' && !aiSettings.text.trim())
            }
            className="w-full"
          >
            {generating ? 'Generating Questions...' : '✨ Generate Questions with AI'}
          </Button>
        </Card.Body>
      </Card>
    </div>
  );

  // Render questions management
  const renderQuestionsStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep('mode')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition"
        >
          ← Back to methods
        </button>
        <span className="text-gray-400">{questions.length} questions</span>
      </div>
      
      {/* Research Summary */}
      {researchSummary && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
          <h4 className="font-semibold text-purple-300 mb-2">📚 AI Research Summary</h4>
          <p className="text-gray-300 text-sm">{researchSummary}</p>
        </div>
      )}
      
      {/* Test Details */}
      <Card>
        <Card.Header title="Test Details" />
        <Card.Body className="space-y-4">
          <Input
            label="Test Title"
            name="title"
            value={testData.title}
            onChange={(e) => setTestData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Chapter 1 Quiz"
            required
          />
          <TextArea
            label="Description"
            name="description"
            value={testData.description}
            onChange={(e) => setTestData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Optional description"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration (minutes)"
              type="number"
              value={testData.duration}
              onChange={(e) => setTestData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
              min="5"
              max="300"
            />
            <Select
              label="Difficulty Level"
              value={testData.difficulty}
              onChange={(e) => setTestData(prev => ({ ...prev, difficulty: e.target.value }))}
              options={[
                { value: 'easy', label: 'Easy' },
                { value: 'medium', label: 'Medium' },
                { value: 'hard', label: 'Hard' },
              ]}
            />
          </div>
        </Card.Body>
      </Card>
      
      {/* Questions List */}
      {questions.length > 0 && (
        <Card>
          <Card.Header title={`Questions (${questions.length})`} />
          <Card.Body className="space-y-3 max-h-96 overflow-y-auto">
            {questions.map((q, idx) => (
              <div 
                key={q.id} 
                className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-purple-400 font-bold">Q{idx + 1}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        q.type === 'multiple_choice' ? 'bg-blue-500/20 text-blue-300' :
                        q.type === 'true_false' ? 'bg-green-500/20 text-green-300' :
                        q.type === 'short_answer' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-purple-500/20 text-purple-300'
                      }`}>
                        {q.type.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        q.difficulty === 'easy' ? 'bg-green-500/20 text-green-300' :
                        q.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {q.difficulty}
                      </span>
                      <span className="text-gray-500 text-xs">{q.marks} marks</span>
                    </div>
                    <p className="text-white truncate">{q.question}</p>
                    {q.options && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {q.options.map((opt, i) => (
                          <span 
                            key={i}
                            className={`text-xs px-2 py-1 rounded ${
                              opt === q.correctAnswer 
                                ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                                : 'bg-white/5 text-gray-400'
                            }`}
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditQuestion(q)}
                      className="p-2 hover:bg-white/10 rounded-lg text-blue-400 hover:text-blue-300 transition"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleRemoveQuestion(q.id)}
                      className="p-2 hover:bg-white/10 rounded-lg text-red-400 hover:text-red-300 transition"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </Card.Body>
        </Card>
      )}
      
      {/* Add/Edit Question Form */}
      <Card>
        <Card.Header title={editingQuestion ? '✏️ Edit Question' : '➕ Add Question'} />
        <Card.Body className="space-y-4">
          <TextArea
            label="Question"
            value={currentQuestion.question || ''}
            onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question: e.target.value }))}
            placeholder="Type your question here"
            rows={2}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Question Type"
              value={currentQuestion.type || 'multiple_choice'}
              onChange={(e) => setCurrentQuestion(prev => ({ 
                ...prev, 
                type: e.target.value as Question['type'],
                options: e.target.value === 'multiple_choice' ? ['', '', '', ''] : undefined,
              }))}
              options={[
                { value: 'multiple_choice', label: 'Multiple Choice' },
                { value: 'short_answer', label: 'Short Answer' },
                { value: 'true_false', label: 'True/False' },
                { value: 'essay', label: 'Essay' },
              ]}
            />
            
            <Select
              label="Difficulty"
              value={currentQuestion.difficulty || 'medium'}
              onChange={(e) => setCurrentQuestion(prev => ({ ...prev, difficulty: e.target.value as Question['difficulty'] }))}
              options={[
                { value: 'easy', label: 'Easy' },
                { value: 'medium', label: 'Medium' },
                { value: 'hard', label: 'Hard' },
              ]}
            />
          </div>
          
          {currentQuestion.type === 'multiple_choice' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Options</label>
              {(currentQuestion.options || []).map((option, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    value={option || ''}
                    onChange={(e) => {
                      const newOptions = [...(currentQuestion.options || [])];
                      newOptions[idx] = e.target.value;
                      setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
                    }}
                    placeholder={`Option ${idx + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: option }))}
                    className={`px-3 py-2 rounded-lg border transition whitespace-nowrap ${
                      currentQuestion.correctAnswer === option
                        ? 'bg-green-500/30 border-green-500 text-green-300'
                        : 'bg-white/5 border-white/20 text-gray-400 hover:border-green-500/50'
                    }`}
                  >
                    {currentQuestion.correctAnswer === option ? '✓ Correct' : 'Set Correct'}
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {currentQuestion.type === 'true_false' && (
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: 'True' }))}
                className={`flex-1 py-3 rounded-lg border transition ${
                  currentQuestion.correctAnswer === 'True'
                    ? 'bg-green-500/30 border-green-500 text-green-300'
                    : 'bg-white/5 border-white/20 text-gray-400 hover:border-green-500/50'
                }`}
              >
                ✓ True
              </button>
              <button
                type="button"
                onClick={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: 'False' }))}
                className={`flex-1 py-3 rounded-lg border transition ${
                  currentQuestion.correctAnswer === 'False'
                    ? 'bg-red-500/30 border-red-500 text-red-300'
                    : 'bg-white/5 border-white/20 text-gray-400 hover:border-red-500/50'
                }`}
              >
                ✗ False
              </button>
            </div>
          )}
          
          {(currentQuestion.type === 'short_answer' || currentQuestion.type === 'essay') && (
            <Input
              label="Correct/Sample Answer"
              value={currentQuestion.correctAnswer || ''}
              onChange={(e) => setCurrentQuestion(prev => ({ ...prev, correctAnswer: e.target.value }))}
              placeholder="Enter the correct or sample answer"
            />
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Marks"
              type="number"
              value={currentQuestion.marks || 1}
              onChange={(e) => setCurrentQuestion(prev => ({ ...prev, marks: parseInt(e.target.value) || 1 }))}
              min="1"
              max="100"
            />
          </div>
          
          <TextArea
            label="Explanation (Optional)"
            value={currentQuestion.explanation || ''}
            onChange={(e) => setCurrentQuestion(prev => ({ ...prev, explanation: e.target.value }))}
            placeholder="Explanation for the correct answer"
            rows={2}
          />
          
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="success" 
              onClick={handleAddQuestion} 
              className="flex-1"
            >
              {editingQuestion ? 'Update Question' : 'Add Question'}
            </Button>
            {editingQuestion && (
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => {
                  setEditingQuestion(null);
                  setCurrentQuestion({
                    type: 'multiple_choice',
                    difficulty: 'medium',
                    marks: 1,
                    options: ['', '', '', ''],
                  });
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>
      
      {/* Continue to Settings */}
      {questions.length > 0 && (
        <Button
          variant="primary"
          onClick={() => setStep('settings')}
          className="w-full"
        >
          Continue to Test Settings →
        </Button>
      )}
    </div>
  );

  // Render final settings
  const renderSettingsStep = () => (
    <div className="space-y-6">
      <button
        onClick={() => setStep('questions')}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition"
      >
        ← Back to questions
      </button>
      
      <Card>
        <Card.Header title="🎯 Dynamic Test Settings" />
        <Card.Body className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl">
            <div>
              <h4 className="font-semibold text-white">Enable Dynamic Tests</h4>
              <p className="text-gray-400 text-sm">Each student gets a unique set of questions from the pool</p>
            </div>
            <button
              onClick={() => setIsDynamic(!isDynamic)}
              className={`relative w-14 h-7 rounded-full transition ${isDynamic ? 'bg-purple-500' : 'bg-gray-600'}`}
            >
              <span 
                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${isDynamic ? 'left-8' : 'left-1'}`}
              />
            </button>
          </div>
          
          {isDynamic && (
            <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-xl">
              <Input
                label="Questions per Student"
                type="number"
                value={dynamicSettings.questionsPerStudent}
                onChange={(e) => setDynamicSettings(prev => ({ 
                  ...prev, 
                  questionsPerStudent: Math.min(parseInt(e.target.value) || 5, questions.length)
                }))}
                min="1"
                max={questions.length}
              />
              <p className="text-gray-400 text-sm">
                From your pool of {questions.length} questions, each student will get {dynamicSettings.questionsPerStudent} randomly selected questions.
              </p>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dynamicSettings.shuffleQuestions}
                    onChange={(e) => setDynamicSettings(prev => ({ ...prev, shuffleQuestions: e.target.checked }))}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-white">Shuffle Question Order</span>
                    <p className="text-gray-500 text-sm">Questions appear in different order for each student</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dynamicSettings.shuffleOptions}
                    onChange={(e) => setDynamicSettings(prev => ({ ...prev, shuffleOptions: e.target.checked }))}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-white">Shuffle Answer Options</span>
                    <p className="text-gray-500 text-sm">Multiple choice options appear in different order</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dynamicSettings.regenerateOnRetake}
                    onChange={(e) => setDynamicSettings(prev => ({ ...prev, regenerateOnRetake: e.target.checked }))}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-white">Regenerate on Retake</span>
                    <p className="text-gray-500 text-sm">If retakes are allowed, generate new question set</p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Summary */}
      <Card>
        <Card.Header title="📋 Test Summary" />
        <Card.Body>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400">Title</span>
              <p className="text-white font-medium">{testData.title || 'Untitled Test'}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400">Duration</span>
              <p className="text-white font-medium">{testData.duration} minutes</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400">Questions</span>
              <p className="text-white font-medium">{questions.length} total</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400">Total Marks</span>
              <p className="text-white font-medium">{questions.reduce((sum, q) => sum + q.marks, 0)}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400">Creation Method</span>
              <p className="text-white font-medium capitalize">{mode === 'topic' ? 'AI from Topic' : mode === 'file' ? 'AI from File' : mode === 'text' ? 'AI from Text' : 'Manual'}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400">Dynamic Test</span>
              <p className="text-white font-medium">{isDynamic ? `Yes (${dynamicSettings.questionsPerStudent} per student)` : 'No'}</p>
            </div>
          </div>
        </Card.Body>
      </Card>
      
      {/* Submit */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          isLoading={loading}
          className="flex-1"
        >
          🚀 Create Test
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm">
          <span className={step === 'mode' ? 'text-purple-400 font-medium' : 'text-gray-500'}>1. Method</span>
          <span className={step === 'generate' ? 'text-purple-400 font-medium' : 'text-gray-500'}>2. Generate</span>
          <span className={step === 'questions' ? 'text-purple-400 font-medium' : 'text-gray-500'}>3. Questions</span>
          <span className={step === 'settings' ? 'text-purple-400 font-medium' : 'text-gray-500'}>4. Settings</span>
        </div>
        <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
            style={{ 
              width: step === 'mode' ? '25%' : 
                     step === 'generate' ? '50%' : 
                     step === 'questions' ? '75%' : '100%' 
            }}
          />
        </div>
      </div>
      
      {/* Step Content */}
      {step === 'mode' && renderModeSelection()}
      {step === 'generate' && renderGenerationStep()}
      {step === 'questions' && renderQuestionsStep()}
      {step === 'settings' && renderSettingsStep()}
    </div>
  );
}
