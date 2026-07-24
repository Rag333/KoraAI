# 📧 Email Notifications & UI Improvements - Quick Start Guide

## What's New ✨

Your RAG system now has:

1. **📧 Email Notifications** - Send strategy evaluation reports to any email
2. **🎨 Improved UI** - Better styling, email modal, and enhanced dashboard
3. **⚡ Nodemailer Integration** - Full SMTP support with Gmail pre-configured

---

## Setup (5 minutes)

### Step 1: Configure Email in `.env`

Edit `.env` file and update email settings:

```env
# Gmail Configuration (recommended)
EMAIL_PROVIDER=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password  # NOT your Gmail password!
EMAIL_FROM=your-email@gmail.com

# Or generic SMTP:
EMAIL_PROVIDER=smtp
EMAIL_SMTP_HOST=smtp.yourprovider.com
EMAIL_SMTP_PORT=587
```

### Step 2: Get Gmail App Password

If using Gmail:

1. Go to https://myaccount.google.com/apppasswords
2. Select Mail + macOS (or your device)
3. Copy the generated 16-character password
4. Paste into `EMAIL_PASSWORD` in `.env`

### Step 3: Restart Server

```bash
npm run server
```

---

## Using Email Feature 🚀

### From Dashboard

1. Run an evaluation: Click **"Compare All Strategies"**
2. See results with metrics grid
3. Click **📧 Email Results** button
4. Enter recipient email address
5. Click **Send Email**
6. ✅ Success message appears

### Email Report Contents

Recipients will receive an HTML email with:

- ✓ Question being evaluated
- ✓ Performance table (latency, chunk count, RAGAS scores)
- ✓ Best strategy highlighted
- ✓ Summary statistics

---

## Testing Email Setup 🧪

### Test Connection via API

```bash
curl http://localhost:3000/api/email-test
```

Response:

```json
{
  "success": true,
  "message": "Email configuration verified successfully"
}
```

### Manual Test Email

```bash
curl -X POST http://localhost:3000/api/email-results \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "test@example.com",
    "question": "What is this product?",
    "results": [...],
    "summary": {...}
  }'
```

---

## UI Improvements 🎨

### New Components

#### Email Button

- Location: Bottom of dashboard results
- Style: Gradient brown button with email icon
- Hover: Lifts up with enhanced shadow
- Click: Opens modal for email input

#### Email Modal

- Style: Centered overlay with backdrop blur
- Inputs: Email address field (required)
- Actions: Send Email, Cancel buttons
- Feedback: Success/error message display

#### Dashboard Enhancements

- Best strategy gets ★ badge
- Metrics displayed as percentage values
- Answer details expandable sections
- Retrieved chunks with metadata

---

## Troubleshooting 🔧

### Email Not Sending?

1. **Check credentials**

   ```bash
   curl http://localhost:3000/api/email-test
   ```

   Should return `"success": true`

2. **Gmail specific**:
   - Verify 2-factor is enabled
   - Use App Password, not main password
   - Allow less secure apps if needed

3. **Generic SMTP**:
   - Verify host/port are correct
   - Check port 587 (TLS) vs 465 (SSL)
   - Test credentials with mail client first

### Modal Not Appearing?

- Clear browser cache
- Hard refresh (Cmd+Shift+R on Mac)
- Check browser console for errors

### Metrics Not Updating?

- Ensure documents are indexed (upload PDF first)
- Check server logs for errors
- Verify Pinecone connection

---

## API Reference 📚

### POST /api/evaluate

Evaluate all three strategies on a question

```bash
curl -X POST http://localhost:3000/api/evaluate \
  -H "Content-Type: application/json" \
  -d '{"question": "How do I use this product?"}'
```

**Response:**

```json
{
  "question": "How do I use this product?",
  "results": [
    {
      "strategy": "dense",
      "answer": "...",
      "latency": 245,
      "chunkCount": 3,
      "evaluation": {
        "faithfulness": 0.92,
        "contextRecall": 0.88,
        "answerRelevancy": 0.95
      },
      "retrievedChunks": [...]
    },
    ...
  ],
  "summary": {
    "avgLatency": 221.33,
    "bestStrategy": "hybrid",
    "allSucceeded": true
  }
}
```

### POST /api/email-results

Send evaluation report via email

```bash
curl -X POST http://localhost:3000/api/email-results \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "user@example.com",
    "question": "Question here",
    "results": [...],
    "summary": {...}
  }'
```

**Response:**

```json
{
  "success": true,
  "messageId": "<msg-id@gmail.com>",
  "message": "Email sent successfully to user@example.com"
}
```

### GET /api/email-test

Verify SMTP configuration

```bash
curl http://localhost:3000/api/email-test
```

**Response:**

```json
{
  "success": true,
  "message": "Email configuration verified successfully"
}
```

---

## Common Use Cases 💡

### Share Evaluation Results

1. Compare strategies on your question
2. Click "Email Results"
3. Send to team member or client
4. They receive formatted HTML report

### Track Performance Over Time

1. Run evaluation daily
2. Email reports to yourself
3. Compare metrics across days
4. Identify best performing strategy

### Test Different Strategies

1. Upload new document
2. Ask multiple questions
3. Compare all three strategies
4. Email winning strategy details

---

## Performance Expectations ⏱️

| Operation        | Time        |
| ---------------- | ----------- |
| Dense retrieval  | 100-300ms   |
| Sparse retrieval | 50-150ms    |
| Hybrid retrieval | 150-450ms   |
| Email send       | 2-5 seconds |
| Dashboard render | <500ms      |

---

## Files Changed 📝

```
Modified:
- frontend/src/Dashboard.jsx (added email handler & modal)
- frontend/src/styles.css (added email styling)
- routes/api.js (added email endpoints)
- package.json (added nodemailer dependency)
- .env (added email config)

Created:
- services/email-service.js (email sending logic)
- IMPLEMENTATION_SUMMARY.md (full docs)
```

---

## Need Help? 🆘

1. **Check logs**: Look at server console output
2. **Test connection**: Run `/api/email-test` endpoint
3. **Verify config**: Check `.env` file values
4. **Browser console**: Check for JavaScript errors (F12)
5. **Network tab**: See request/response details

---

**You're all set! 🎉 Start sending evaluation reports!**
