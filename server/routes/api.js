import express from "express";
import multer from "multer";
import { answerQuestion } from "../services/chat-service.js";
import { indexDocumentFromBuffer } from "../services/document-service.js";
import { evaluateAllStrategies } from "../services/evaluation-service.js";
import {
  sendEvaluationEmail,
  testEmailConnection,
} from "../services/email-service.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please upload a PDF file." });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Only PDF uploads are supported." });
    }

    const result = await indexDocumentFromBuffer(
      req.file.buffer,
      req.file.originalname,
    );
    return res.json({
      message: "Document indexed successfully.",
      ...result,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/chat", async (req, res) => {
  try {
    const question = req.body?.question?.trim();
    const strategy = req.body?.strategy?.trim()?.toLowerCase() ?? "dense";

    if (!question) {
      return res.status(400).json({ error: "Question is required." });
    }

    const result = await answerQuestion(question, strategy);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

const performCompare = async (req, res) => {
  try {
    const question = req.body?.question?.trim();

    if (!question) {
      return res.status(400).json({ error: "Question is required." });
    }

    const result = await evaluateAllStrategies(question);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

router.post("/evaluate", performCompare);
router.post("/compare", performCompare);

router.get("/history", async (_req, res) => {
  try {
    const { readEvaluations } = await import("../services/store.js");
    const data = readEvaluations();
    return res.json({ results: data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/email-results", async (req, res) => {
  try {
    const { recipientEmail, question, results, summary } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({ error: "Recipient email is required." });
    }

    if (!question || !results || !summary) {
      return res
        .status(400)
        .json({ error: "Question, results, and summary are required." });
    }

    const result = await sendEvaluationEmail(
      recipientEmail,
      question,
      results,
      summary,
    );
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/email-test", async (_req, res) => {
  try {
    const result = await testEmailConnection();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
