import { readFileSync, readdirSync, statSync } from "fs";
import {
  loadConfig,
  loadLastEstimate,
} from "../core/telemetry.js";
import type { LastEstimate } from "../types.js";
import { MODEL_PRICING } from "../data/pricing.js";
import { join } from "path";
import { homedir } from "os";

export async function runReport(): Promise<void> {
  try {
    const lastEstimate = loadLastEstimate();
    if (!lastEstimate) {
      console.log("  No estimate found. Run a prompt with Tarmac active first.");
      return;
    }

    // Find the transcript for this session
    const transcriptPath = findTranscript(lastEstimate.sessionId);
    if (!transcriptPath) {
      console.log("  Could not find transcript for session: " + lastEstimate.sessionId);
      return;
    }

    const outcome = extractOutcome(transcriptPath);
    if (!outcome) {
      console.log("  Could not extract outcome from transcript.");
      return;
    }

    const comparison = formatComparison(lastEstimate, outcome);
    if (comparison) {
      console.log(comparison);
    } else {
      console.log("  Session too short to report (< $0.01 or ≤ 2 API calls).");
    }
  } catch (err) {
    console.error(
      `[tarmac] report error: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

function findTranscript(sessionId: string): string | null {
  const claudeProjectsDir = join(homedir(), ".claude", "projects");
  try {
    for (const dir of readdirSync(claudeProjectsDir)) {
      const dirPath = join(claudeProjectsDir, dir);
      try {
        if (!statSync(dirPath).isDirectory()) continue;
        const candidate = join(dirPath, sessionId + ".jsonl");
        try {
          statSync(candidate);
          return candidate;
        } catch {
          continue;
        }
      } catch {
        continue;
      }
    }
  } catch {
    // projects dir doesn't exist
  }
  return null;
}

interface SessionOutcome {
  loops: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCost: number;
  model: string;
  initialContext: number;
  finalContext: number;
  durationSeconds: number;
}

function extractOutcome(
  transcriptPath: string
): SessionOutcome | null {
  try {
    const content = readFileSync(transcriptPath, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);

    let loops = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let model = "unknown";
    let initialContext = 0;
    let finalContext = 0;
    let firstTimestamp: number | null = null;
    let lastTimestamp: number | null = null;

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);

        if (entry.timestamp) {
          const ts = new Date(entry.timestamp).getTime();
          if (!firstTimestamp) firstTimestamp = ts;
          lastTimestamp = ts;
        }

        if (entry.type === "assistant" && entry.message?.usage) {
          const usage = entry.message.usage;
          totalInputTokens += usage.input_tokens || 0;
          totalOutputTokens += usage.output_tokens || 0;
          loops++;

          if (loops === 1) {
            initialContext = usage.input_tokens || 0;
          }
          finalContext = usage.input_tokens || 0;

          if (entry.message.model) {
            model = entry.message.model;
          }
        }
      } catch {
        continue;
      }
    }

    if (loops === 0) return null;

    const pricing = MODEL_PRICING.find((p) => model.includes(p.modelId)) ||
      MODEL_PRICING[0];
    const estimatedCost =
      (totalInputTokens * pricing.inputPerMillion) / 1_000_000 +
      (totalOutputTokens * pricing.outputPerMillion) / 1_000_000;

    const durationSeconds =
      firstTimestamp && lastTimestamp
        ? Math.round((lastTimestamp - firstTimestamp) / 1000)
        : 0;

    return {
      loops,
      totalInputTokens,
      totalOutputTokens,
      estimatedCost,
      model,
      initialContext,
      finalContext,
      durationSeconds,
    };
  } catch {
    return null;
  }
}

function formatComparison(
  estimate: LastEstimate,
  outcome: SessionOutcome
): string | null {
  const actualCost = outcome.estimatedCost;
  if (actualCost < 0.01 || outcome.loops <= 2) return null;

  const modelEstimate = estimate.models.find((m) =>
    outcome.model.includes(m.modelId)
  ) || estimate.models[0];

  const inRange =
    actualCost >= modelEstimate.costLow && actualCost <= modelEstimate.costHigh;

  const lines: string[] = [];
  lines.push("");
  lines.push("  📊 TARMAC SESSION REPORT");
  lines.push("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("");
  lines.push(`    Model:      ${modelEstimate.model}`);
  lines.push(`    Estimated:  ${fmtDollars(modelEstimate.costLow)} - ${fmtDollars(modelEstimate.costHigh)}`);
  lines.push(`    Actual:     ${fmtDollars(actualCost)}`);
  lines.push(`    Result:     ${inRange ? "✅ Within estimate" : "❌ Outside estimate"}`);
  lines.push("");
  lines.push(`    API calls:  ${outcome.loops}`);
  lines.push(`    Duration:   ${outcome.durationSeconds}s`);
  lines.push("");
  lines.push("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("");

  return lines.join("\n");
}

function fmtDollars(amount: number): string {
  if (amount < 0.01) return `$${amount.toFixed(3)}`;
  return `$${amount.toFixed(2)}`;
}
