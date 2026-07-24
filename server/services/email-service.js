import nodemailer from "nodemailer";

let transporter = null;

function initializeTransporter() {
  if (transporter) {
    return transporter;
  }

  const provider = process.env.EMAIL_PROVIDER || "gmail";

  if (provider === "gmail") {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  } else if (provider === "smtp") {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST,
      port: parseInt(process.env.EMAIL_SMTP_PORT || "587"),
      secure: process.env.EMAIL_SMTP_PORT === "465",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  } else {
    throw new Error(`Unsupported email provider: ${provider}`);
  }

  return transporter;
}

function formatEvaluationHTML(question, results, summary) {
  const resultCards = results
    .map(
      (result) => `
    <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <strong>${result.strategy.toUpperCase()}</strong>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            ${result.error ? `<span style="color: #dc2626;">Error: ${result.error}</span>` : `${result.latency}ms`}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            ${result.error ? "-" : result.chunkCount}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            ${result.error ? "-" : `${(result.evaluation?.faithfulness * 100).toFixed(0)}%`}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            ${result.error ? "-" : `${(result.evaluation?.contextRecall * 100).toFixed(0)}%`}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            ${result.error ? "-" : `${(result.evaluation?.answerRelevancy * 100).toFixed(0)}%`}
        </td>
    </tr>
`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1f2933; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #9f4d1f, #6a2f10); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 8px 0 0; opacity: 0.9; }
        .section { margin-bottom: 24px; }
        .section h2 { font-size: 18px; margin: 0 0 12px; color: #1f2933; border-bottom: 2px solid #f4efe6; padding-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        th { background: #f4efe6; padding: 12px; text-align: left; font-weight: 700; }
        td { padding: 12px; }
        .metric-box { background: #f4efe6; padding: 12px; border-radius: 8px; margin: 8px 0; }
        .metric-label { font-weight: 700; color: #6a2f10; }
        .best-badge { background: #22c55e; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 700; }
        .footer { color: #52606d; font-size: 12px; margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>RAG Strategy Evaluation Report</h1>
            <p>Strategy comparison results</p>
        </div>

        <div class="section">
            <h2>Question</h2>
            <p style="margin: 0; line-height: 1.6;">"${question}"</p>
        </div>

        <div class="section">
            <h2>Performance Comparison</h2>
            <table>
                <thead>
                    <tr>
                        <th>Strategy</th>
                        <th>Latency</th>
                        <th>Chunks</th>
                        <th>Faithfulness</th>
                        <th>Context Recall</th>
                        <th>Answer Relevancy</th>
                    </tr>
                </thead>
                <tbody>
                    ${resultCards}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>Summary</h2>
            <div class="metric-box">
                <span class="metric-label">Average Latency:</span> ${summary.avgLatency.toFixed(0)}ms
            </div>
            <div class="metric-box">
                <span class="metric-label">Best Strategy:</span> ${summary.bestStrategy.toUpperCase()} <span class="best-badge">WINNER</span>
            </div>
            <div class="metric-box">
                <span class="metric-label">Status:</span> ${summary.allSucceeded ? "✓ All strategies succeeded" : "⚠ Some strategies encountered errors"}
            </div>
        </div>

        <div class="footer">
            <p>This is an automated report from the RAG Evaluation System. Do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
`;
}

export async function sendEvaluationEmail(
  recipientEmail,
  question,
  results,
  summary,
) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error(
        "Email credentials not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env",
      );
    }

    const trans = initializeTransporter();
    const htmlContent = formatEvaluationHTML(question, results, summary);

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: recipientEmail,
      subject: `RAG Strategy Evaluation Report - ${new Date().toLocaleDateString()}`,
      html: htmlContent,
    };

    const result = await trans.sendMail(mailOptions);
    return {
      success: true,
      messageId: result.messageId,
      message: `Email sent successfully to ${recipientEmail}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function testEmailConnection() {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error("Email credentials not configured");
    }

    const trans = initializeTransporter();
    await trans.verify();
    return {
      success: true,
      message: "Email configuration verified successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
