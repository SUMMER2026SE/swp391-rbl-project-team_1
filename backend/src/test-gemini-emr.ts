import dotenv from "dotenv";
import path from "path";

// Load env variables
dotenv.config({ path: path.join(__dirname, "../.env") });

import { getStructuredEmrFromTranscript } from "./services/gemini.service";

async function main() {
  const transcript = "Tôi bị đau nhức đầu. 2 viên 3 lần sau ăn 5 ngày.";
  console.log("Analyzing transcript:", transcript);
  try {
    const result = await getStructuredEmrFromTranscript(transcript);
    console.log("=== AI Result ===");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err);
  }
}

main();
