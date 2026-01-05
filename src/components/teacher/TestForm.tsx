'use client';

import { useState } from 'react';
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
}

export default function TestForm({ classId, onSuccess }: TestFormProps) {
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState({
    title: '',
    description: '',
    duration: 60,
    difficulty: 'medium',
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    type: 'multiple_choice',
    difficulty: 'medium',
    marks: 1,
    options: ['', '', '', ''],
  });
  const notify = useNotify();

  const handleTestChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTestData((prev) => ({
      ...prev,
      [name]: name === 'duration' ? (parseInt(value, 10) || 0) : value,
    }));
  };

  const handleDurationBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 5) {
      setTestData(prev => ({ ...prev, duration: 5 }));
    }
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.question || !currentQuestion.correctAnswer) {
      notify.error('Question and correct answer are required');
      return;
    }

    const newQuestion: Question = {
      id: Date.now().toString(),
      question: currentQuestion.question || '',
      type: currentQuestion.type as Question['type'],
      options: currentQuestion.options,
      correctAnswer: currentQuestion.correctAnswer || '',
      explanation: currentQuestion.explanation || '',
      difficulty: currentQuestion.difficulty as Question['difficulty'],
      marks: currentQuestion.marks || 1,
    };

    setQuestions([...questions, newQuestion]);
    setCurrentQuestion({
      type: 'multiple_choice',
      difficulty: 'medium',
      marks: 1,
      options: ['', '', '', ''],
    });
    notify.success('Question added');
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (questions.length === 0) {
      notify.error('Add at least one question');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/tests/create', {
        ...testData,
        classId,
        questions: questions.map((q) => ({
          question: q.question,
          type: q.type,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          marks: q.marks,
        })),
      });
      notify.success('Test created successfully!');
      setTestData({ title: '', description: '', duration: 60, difficulty: 'medium' });
      setQuestions([]);
      onSuccess?.();
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to create test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Test Details */}
        <Card>
          <Card.Header title="Test Details" />
          <Card.Body>
            <div className="space-y-4">
              <Input
                label="Test Title"
                name="title"
                value={testData.title}
                onChange={handleTestChange}
                placeholder="e.g., Chapter 1 Quiz"
                required
              />
              <TextArea
                label="Description"
                name="description"
                value={testData.description}
                onChange={handleTestChange}
                placeholder="Optional description"
                rows={3}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Duration (minutes)"
                  name="duration"
                  type="number"
                  value={testData.duration.toString()}
                  onChange={handleTestChange}
                  onBlur={handleDurationBlur}
                  min="5"
                  max="300"
                />
                <Select
                  label="Difficulty Level"
                  name="difficulty"
                  value={testData.difficulty}
                  onChange={handleTestChange}
                  options={[
                    { value: 'easy', label: 'Easy' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'hard', label: 'Hard' },
                  ]}
                />
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Questions Section */}
        <Card>
          <Card.Header title={`Add Questions (${questions.length} added)`} />
          <Card.Body className="space-y-4">
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 space-y-3">
              <Input
                label="Question"
                value={currentQuestion.question || ''}
                onChange={(e) =>
                  setCurrentQuestion((prev) => ({ ...prev, question: e.target.value }))
                }
                placeholder="Type your question here"
              />

              <Select
                label="Question Type"
                value={currentQuestion.type || 'multiple_choice'}
                onChange={(e) =>
                  setCurrentQuestion((prev) => ({
                    ...prev,
                    type: e.target.value as Question['type'],
                  }))
                }
                options={[
                  { value: 'multiple_choice', label: 'Multiple Choice' },
                  { value: 'short_answer', label: 'Short Answer' },
                  { value: 'true_false', label: 'True/False' },
                  { value: 'essay', label: 'Essay' },
                ]}
              />

              {currentQuestion.type === 'multiple_choice' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Options</label>
                  {(currentQuestion.options || []).map((option, idx) => (
                    <Input
                      key={idx}
                      value={option || ''}
                      onChange={(e) => {
                        const newOptions = [...(currentQuestion.options || [])];
                        newOptions[idx] = e.target.value;
                        setCurrentQuestion((prev) => ({ ...prev, options: newOptions }));
                      }}
                      placeholder={`Option ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Correct Answer"
                  value={currentQuestion.correctAnswer || ''}
                  onChange={(e) =>
                    setCurrentQuestion((prev) => ({ ...prev, correctAnswer: e.target.value }))
                  }
                  placeholder={
                    currentQuestion.type === 'multiple_choice' ? 'e.g., Option 1' : 'Answer'
                  }
                />
                <Input
                  label="Marks"
                  type="number"
                  value={currentQuestion.marks || 1}
                  onChange={(e) =>
                    setCurrentQuestion((prev) => ({
                      ...prev,
                      marks: parseInt(e.target.value) || 1,
                    }))
                  }
                  min="1"
                  max="100"
                />
              </div>

              <TextArea
                label="Explanation (Optional)"
                value={currentQuestion.explanation || ''}
                onChange={(e) =>
                  setCurrentQuestion((prev) => ({ ...prev, explanation: e.target.value }))
                }
                placeholder="Explanation for correct answer"
                rows={2}
              />

              <Button type="button" variant="success" onClick={handleAddQuestion} className="w-full">
                Add Question
              </Button>
            </div>

            {/* Added Questions */}
            {questions.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-white">Added Questions:</h3>
                {questions.map((q, idx) => (
                  <div key={q.id} className="flex items-start justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-white">
                        {idx + 1}. {q.question}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        Type: {q.type} | Marks: {q.marks} | Difficulty: {q.difficulty}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveQuestion(q.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Submit */}
        <div className="flex gap-2">
          <Button type="submit" variant="primary" isLoading={loading} className="flex-1">
            Create Test
          </Button>
        </div>
      </form>
    </div>
  );
}
