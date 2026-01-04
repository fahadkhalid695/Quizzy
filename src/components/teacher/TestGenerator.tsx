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
  const [source, setSource] = useState<'file' | 'web' | 'text'>('file');
  const [webUrl, setWebUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [loading, setLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notify = useNotify();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
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

    setLoading(true);

    try {
      let sourceData: any = {};

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
        setGeneratedQuestions(data.questions);
      } else if (source === 'web') {
        const response = await api.post('/api/tests/generate/web', {
          url: webUrl,
          numQuestions,
          difficulty,
        });
        setGeneratedQuestions(response.questions);
      } else {
        const response = await api.post('/api/tests/generate/text', {
          content: textContent,
          numQuestions,
          difficulty,
        });
        setGeneratedQuestions(response.questions);
      }

      notify.success(`Generated ${generatedQuestions.length} questions!`);
      onQuestionsGenerated?.(generatedQuestions);
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
          <label className="block text-sm font-medium text-gray-700 mb-3">Choose Source</label>
          <div className="grid grid-cols-3 gap-3">
            {(['file', 'web', 'text'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className={`py-3 rounded-lg font-medium transition ${
                  source === s
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {s === 'file' && '📄 File'}
                {s === 'web' && '🌐 Web'}
                {s === 'text' && '✍️ Text'}
              </button>
            ))}
          </div>
        </div>

        {/* Source Input */}
        {source === 'file' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload File (PDF, DOCX, PPTX, Images)
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition"
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
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-2">📁</div>
                  <p className="font-medium text-gray-900">Click to select file</p>
                  <p className="text-sm text-gray-500">or drag and drop</p>
                </>
              )}
            </button>
          </div>
        )}

        {source === 'web' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
            <input
              type="url"
              value={webUrl}
              onChange={(e) => setWebUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-indigo-600 focus:outline-none"
            />
          </div>
        )}

        {source === 'text' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Paste Text Content</label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Paste your study material here..."
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-indigo-600 focus:outline-none"
              rows={6}
            />
          </div>
        )}

        {/* Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Questions</label>
            <input
              type="number"
              min="1"
              max="20"
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value))}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2"
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
          loading={loading}
          className="w-full"
          size="lg"
        >
          🚀 Generate Questions with AI
        </Button>

        {/* Generated Questions Preview */}
        {generatedQuestions.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="font-bold text-lg text-gray-900">Generated Questions Preview:</h3>
            {generatedQuestions.map((q, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="font-medium text-gray-900">
                  {idx + 1}. {q.question}
                </p>
                <div className="mt-2 flex gap-2 text-xs">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {q.type.replace('_', ' ')}
                  </span>
                  <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded">
                    {q.difficulty}
                  </span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
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
