# Quiz App API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All requests (except auth endpoints) require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Request:
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student" // or "teacher"
}
```

Response:
```json
{
  "message": "User registered successfully",
  "userId": "507f1f77bcf86cd799439011"
}
```

---

### Login User
**POST** `/auth/login`

Request:
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student"
  },
  "role": "student"
}
```

---

## Teacher Endpoints

### Create Class
**POST** `/teacher/classes`

Request:
```json
{
  "name": "Mathematics 101",
  "description": "Advanced Mathematics for Class 10"
}
```

Response:
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Mathematics 101",
  "description": "Advanced Mathematics for Class 10",
  "code": "MATH101XY",
  "teacherId": "507f1f77bcf86cd799439012",
  "students": [],
  "createdAt": "2024-01-04T12:00:00Z"
}
```

---

### Get All Classes
**GET** `/teacher/classes`

Response:
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Mathematics 101",
    "students": ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"],
    "createdAt": "2024-01-04T12:00:00Z"
  }
]
```

---

### Create Test
**POST** `/teacher/tests`

Request:
```json
{
  "title": "Math Chapter 5",
  "description": "Test on Algebra",
  "classId": "507f1f77bcf86cd799439011",
  "duration": 60,
  "difficulty": "medium",
  "questions": [
    {
      "type": "multiple_choice",
      "question": "What is 2 + 2?",
      "options": ["3", "4", "5", "6"],
      "correctAnswer": "4",
      "explanation": "Basic addition",
      "difficulty": "easy",
      "marks": 1
    }
  ]
}
```

Response:
```json
{
  "_id": "507f1f77bcf86cd799439020",
  "title": "Math Chapter 5",
  "teacherId": "507f1f77bcf86cd799439012",
  "classId": "507f1f77bcf86cd799439011",
  "questions": [...],
  "duration": 60,
  "difficulty": "medium",
  "isPublished": false,
  "totalMarks": 10,
  "createdAt": "2024-01-04T12:00:00Z"
}
```

---

### Get Test
**GET** `/teacher/tests/:testId`

Response:
```json
{
  "_id": "507f1f77bcf86cd799439020",
  "title": "Math Chapter 5",
  "questions": [...],
  "totalMarks": 10,
  ...
}
```

---

### Publish Test
**POST** `/teacher/tests/:testId/publish`

Request:
```json
{
  "startTime": "2024-01-05T10:00:00Z",
  "endTime": "2024-01-05T11:00:00Z"
}
```

Response:
```json
{
  "_id": "507f1f77bcf86cd799439020",
  "isPublished": true,
  "startTime": "2024-01-05T10:00:00Z",
  "endTime": "2024-01-05T11:00:00Z"
}
```

---

### Get Class Report
**GET** `/teacher/classes/:classId/report`

Response:
```json
{
  "classId": "507f1f77bcf86cd799439011",
  "className": "Mathematics 101",
  "totalStudents": 25,
  "totalTests": 5,
  "averageClassScore": 78.5,
  "topPerformers": [
    {
      "studentId": "507f1f77bcf86cd799439013",
      "studentName": "John Doe",
      "averageScore": 92.5,
      "position": 1
    }
  ]
}
```

---

## Student Endpoints

### Get Available Tests
**GET** `/student/tests`

Response:
```json
[
  {
    "_id": "507f1f77bcf86cd799439020",
    "title": "Math Chapter 5",
    "duration": 60,
    "questionCount": 10,
    "difficulty": "medium",
    "isPublished": true,
    "startTime": "2024-01-05T10:00:00Z",
    "endTime": "2024-01-05T11:00:00Z"
  }
]
```

---

### Join Class
**POST** `/student/classes/join`

Request:
```json
{
  "classCode": "MATH101XY"
}
```

Response:
```json
{
  "message": "Successfully joined class",
  "classId": "507f1f77bcf86cd799439011",
  "className": "Mathematics 101"
}
```

---

### Start Test
**GET** `/student/tests/:testId/start`

Response:
```json
{
  "_id": "507f1f77bcf86cd799439020",
  "title": "Math Chapter 5",
  "duration": 60,
  "questions": [
    {
      "_id": "q1",
      "type": "multiple_choice",
      "question": "What is 2 + 2?",
      "options": ["3", "4", "5", "6"],
      "difficulty": "easy",
      "marks": 1
    }
  ],
  "totalMarks": 10
}
```

---

### Submit Test
**POST** `/student/tests/:testId/submit`

Request:
```json
{
  "answers": [
    {
      "questionId": "q1",
      "answer": "4",
      "timeSpent": 30
    }
  ],
  "totalTimeSpent": 3600
}
```

Response:
```json
{
  "_id": "507f1f77bcf86cd799439030",
  "testId": "507f1f77bcf86cd799439020",
  "studentId": "507f1f77bcf86cd799439013",
  "totalMarks": 10,
  "obtainedMarks": 9,
  "percentage": 90,
  "status": "grading",
  "cheatingScore": 5,
  "submittedAt": "2024-01-05T10:45:00Z"
}
```

---

### Get Test Results
**GET** `/student/results`

Response:
```json
[
  {
    "_id": "507f1f77bcf86cd799439030",
    "testId": "507f1f77bcf86cd799439020",
    "title": "Math Chapter 5",
    "obtainedMarks": 9,
    "totalMarks": 10,
    "percentage": 90,
    "status": "graded",
    "submittedAt": "2024-01-05T10:45:00Z"
  }
]
```

---

### Get Result Detail
**GET** `/student/results/:resultId`

Response:
```json
{
  "_id": "507f1f77bcf86cd799439030",
  "testId": "507f1f77bcf86cd799439020",
  "studentId": "507f1f77bcf86cd799439013",
  "answers": [
    {
      "questionId": "q1",
      "question": "What is 2 + 2?",
      "studentAnswer": "4",
      "correctAnswer": "4",
      "isCorrect": true,
      "marksObtained": 1
    }
  ],
  "totalMarks": 10,
  "obtainedMarks": 9,
  "percentage": 90,
  "cheatingScore": 5,
  "cheatingDetails": "Suspicious pattern detected in answer timing"
}
```

---

## Test Generation Endpoints

### Generate from PDF
**POST** `/tests/generate/pdf`

Request (FormData):
```
file: <binary PDF file>
numberOfQuestions: 5
difficulty: "medium"
```

Response:
```json
{
  "questions": [
    {
      "type": "multiple_choice",
      "question": "Question from PDF",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "difficulty": "medium",
      "marks": 1
    }
  ]
}
```

---

### Generate from Web Search
**POST** `/tests/generate/web`

Request:
```json
{
  "searchQuery": "Photosynthesis",
  "numberOfQuestions": 5,
  "difficulty": "medium"
}
```

Response:
```json
{
  "questions": [
    {
      "type": "multiple_choice",
      "question": "What is the primary purpose of photosynthesis?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "difficulty": "medium",
      "marks": 1
    }
  ]
}
```

---

### Grade Short Answer
**POST** `/tests/grade-answer`

Request:
```json
{
  "question": "What is photosynthesis?",
  "studentAnswer": "Process where plants convert sunlight to energy",
  "correctAnswer": "Process by which plants convert light energy to chemical energy"
}
```

Response:
```json
{
  "isCorrect": true,
  "score": 85,
  "feedback": "Good understanding. You could mention glucose production."
}
```

---

### Detect Cheating
**POST** `/tests/detect-cheating`

Request:
```json
{
  "studentAnswers": [
    {
      "question": "Q1",
      "answer": "Answer 1"
    }
  ],
  "testDuration": 60,
  "timeSpent": 120
}
```

Response:
```json
{
  "cheatingScore": 45,
  "details": "Moderate suspicion: Test completed too quickly (2x faster than average). Some answers show unusual patterns."
}
```

---

## Report Generation Endpoints

### Generate Result Card
**POST** `/reports/generate-result-card`

Request:
```json
{
  "resultId": "507f1f77bcf86cd799439030",
  "format": "pdf" // or "image"
}
```

Response:
```json
{
  "url": "https://example.com/result-card-123.pdf",
  "format": "pdf"
}
```

---

### Generate Class Report
**GET** `/reports/class-report/:classId`

Response:
```json
{
  "classId": "507f1f77bcf86cd799439011",
  "className": "Mathematics 101",
  "totalStudents": 25,
  "totalTests": 5,
  "reportUrl": "https://example.com/report-123.pdf"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request data",
  "details": "Field 'email' is required"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized: Invalid token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden: Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting
- 100 requests per 15 minutes per IP
- 1000 requests per hour per authenticated user

---

## Webhooks (Future)
- Test result submitted
- Test published
- Student joined class
- Cheating detected

---

## SDK Usage

```javascript
import { api } from '@/lib/api-client'

// Get tests
const tests = await api.get<Test[]>('/teacher/tests')

// Create test
const newTest = await api.post<Test>('/teacher/tests', {
  title: 'New Test',
  ...
})

// Update test
const updated = await api.put<Test>('/teacher/tests/123', {
  ...
})

// Delete test
await api.delete('/teacher/tests/123')
```

---

**Last Updated**: January 4, 2026
