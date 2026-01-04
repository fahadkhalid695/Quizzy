'use client';

import { useState, useRef } from 'react';
import { useNotify } from '@/components/common/Notification';
import { api } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface GeneratedQuestion {
  question: string;
  type: 'multiple_choice' | 'short_answer' | 'true_false' | 'essay';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
}

interface TestGeneratorProps {
  onQuestionsGenerated?: (questions: GeneratedQuestion[]) => void;
}

export default function TestGenerator({ onQuestionsGenerated }: TestGeneratorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState<'file' | 'web' | 'text' | 'topic'>('file');
  const [webUrl, setWebUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionTypes, setQuestionTypes] = useState<string[]>(['multiple_choice']);
  const [loading, setLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [researchSummary, setResearchSummary] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notify = useNotify();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const toggleQuestionType = (type: string) => {
    setQuestionTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (source === 'file' && !file) {
      notify.error('Please select a file');
      return;
    }

    if (source === 'web' && !webUrl.trim()) {
      notify.error('Please enter a URL');
      return;
    }

    if (source === 'text' && !textContent.trim()) {
      notify.error('Please enter some text content');
      return;
    }

    if (source === 'topic' && !topicInput.trim()) {
      notify.error('Please enter a topic to research');
      return;
    }

    setLoading(true);
    setResearchSummary('');

    try {
      let questions: GeneratedQuestion[] = [];

      if (source === 'file') {
        const formData = new FormData();
        formData.append('file', file!);
        formData.append('numQuestions', numQuestions.toString());
        formData.append('difficulty', difficulty);

        const response = await fetch('/api/tests/generate/file', {
          method: 'POST',
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) throw new Error('Failed to generate from file');
        const data = await response.json();
        questions = data.questions;
      } else if (source === 'web') {
        const response = await api.post<{ questions: any[] }>('/api/tests/generate/web', {
          url: webUrl,
          numQuestions,
          difficulty,
        });
        questions = response.questions;
      } else if (source === 'topic') {
        const response = await api.post<{ questions: any[]; researchSummary: string }>('/api/tests/generate/topic', {
          topic: topicInput,
          numQuestions,
          difficulty,
          questionTypes,
        });
        questions = response.questions;
        setResearchSummary(response.researchSummary);
      } else {
        const response = await api.post<{ questions: any[] }>('/api/tests/generate/text', {
          content: textContent,
          numQuestions,
          difficulty,
        });
        questions = response.questions;
      }

      setGeneratedQuestions(questions);
      notify.success(`Generated ${questions.length} questions!`);
      onQuestionsGenerated?.(questions);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to generate questions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Card.Header title="🤖 Generate Test Questions Using AI" />
      <Card.Body className="space-y-6">
        {/* Source Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Choose Source</label>
          <div className="grid grid-cols-4 gap-3">
            {(['file', 'web', 'text', 'topic'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className={`py-3 rounded-lg font-medium transition ${
                  source === s
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {s === 'file' && '📄 File'}
                {s === 'web' && '🌐 Web'}
                {s === 'text' && '✍️ Text'}
                {s === 'topic' && '🔬 Research'}
              </button>
            ))}
          </div>
        </div>

        {/* Source Input */}
        {source === 'file' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Upload File (PDF, DOCX, PPTX, Images)
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-purple-500 transition bg-white/5"
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.docx,.pptx,.jpg,.png,.jpeg"
                className="hidden"
              />
              {file ? (
                <>
                  <div className="text-2xl mb-2">✓</div>
                  <p className="font-medium text-white">{file.name}</p>
                  <p className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-2">📁</div>
                  <p className="font-medium text-white">Click to select file</p>
                  <p className="text-sm text-gray-400">or drag and drop</p>
                </>
              )}
            </button>
          </div>
        )}

        {source === 'web' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Website URL</label>
            <input
              type="url"
              value={webUrl}
              onChange={(e) => setWebUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full bg-white/5 border-2 border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
            />
          </div>
        )}

        {source === 'text' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Paste Text Content</label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Paste your study material here..."
              className="w-full bg-white/5 border-2 border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              rows={6}
            />
          </div>
        )}

        {source === 'topic' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                🔬 Research Topic
              </label>
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="e.g., Photosynthesis, World War II, Quantum Computing..."
                className="w-full bg-white/5 border-2 border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <p className="text-sm text-gray-400 mt-1">
                AI will research this topic and generate comprehensive quiz questions
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Question Types</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'multiple_choice', label: '📝 Multiple Choice' },
                  { value: 'true_false', label: '✅ True/False' },
                  { value: 'short_answer', label: '✍️ Short Answer' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleQuestionType(value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      questionTypes.includes(value)
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Number of Questions</label>
            <input
              type="number"
              min="1"
              max="20"
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value))}
              className="w-full bg-white/5 border-2 border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty Level</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full bg-white/5 border-2 border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          variant="primary"
          onClick={handleGenerate}
          isLoading={loading}
          className="w-full"
          size="lg"
        >
          {source === 'topic' ? '🔬 Research & Generate Questions' : '🚀 Generate Questions with AI'}
        </Button>

        {/* Research Summary */}
        {researchSummary && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
            <h3 className="font-bold text-blue-400 mb-2">📚 Research Summary</h3>
            <p className="text-blue-200 text-sm whitespace-pre-wrap">{researchSummary}</p>
          </div>
        )}

        {/* Generated Questions Preview */}
        {generatedQuestions.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="font-bold text-lg text-white">Generated Questions Preview:</h3>
            {generatedQuestions.map((q, idx) => (
              <div key={idx} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="font-medium text-white">
                  {idx + 1}. {q.question}
                </p>
                <div className="mt-2 flex gap-2 text-xs">
                  <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                    {q.type.replace('_', ' ')}
                  </span>
                  <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                    {q.difficulty}
                  </span>
                  <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                    {q.marks} marks
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
