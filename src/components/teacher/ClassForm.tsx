'use client';

import { useState, useEffect } from 'react';
import { useNotify } from '@/components/common/Notification';
import { api } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import { Input, TextArea } from '@/components/ui/FormElements';
import Card from '@/components/ui/Card';

interface ClassFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ClassForm({ onSuccess, onCancel }: ClassFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const notify = useNotify();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/api/classes/create', formData);
      notify.success('Class created successfully!');
      setFormData({ name: '', description: '' });
      onSuccess?.();
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to create class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <Card.Header title="Create New Class" />
      <Card.Body>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Class Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Biology 101"
            required
          />
          <TextArea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Optional: Add class details"
            rows={4}
          />
          <div className="flex gap-2">
            <Button type="submit" variant="primary" loading={loading}>
              Create Class
            </Button>
            {onCancel && (
              <Button type="button" variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card.Body>
    </Card>
  );
}
