import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), "data");
const EVAL_FILE = path.join(DATA_DIR, "evaluations.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(EVAL_FILE)) fs.writeFileSync(EVAL_FILE, "[]");
}

export function appendEvaluation(record) {
  ensureDataDir();
  const raw = fs.readFileSync(EVAL_FILE, "utf-8");
  let arr = [];
  try {
    arr = JSON.parse(raw || "[]");
  } catch (e) {
    arr = [];
  }

  arr.push(record);
  fs.writeFileSync(EVAL_FILE, JSON.stringify(arr, null, 2));
  return record;
}

export function readEvaluations() {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(EVAL_FILE, "utf-8");
    return JSON.parse(raw || "[]");
  } catch (e) {
    return [];
  }
}
