"use client";

export default function ReportCard({ report }) {

  if (!report) return null;

  return (

    <div className="report-card">

        <div className="report-header">

          <h2>
            NETSHIELD SECURITY REPORT
          </h2>

          <div
            className={`status-tag ${
              report.status === "safe"
                ? "safe-tag"
                : "danger-tag"
            }`}
          >

            {
              report.status === "safe"
              ? "SAFE"
              : "THREAT DETECTED"
            }


        </div>

      </div>

      <div className="report-grid">

        <div className="report-box">
          <span>Target</span>
          <p>{report.target}</p>
        </div>

        <div className="report-box">
          <span>Scan Type</span>
          <p>{report.type}</p>
        </div>

        <div className="report-box">
          <span>Risk Level</span>
          <p>{report.riskLevel}</p>
        </div>

        <div className="report-box">
          <span>Security Score</span>
          <p>{report.score}</p>
        </div>

        <div className="report-box">
          <span>Detection Ratio</span>
          <p>{report.ratio}</p>
        </div>

        <div className="report-box">
          <span>Malicious</span>
          <p>{report.malicious}</p>
        </div>

        <div className="report-box">
          <span>Suspicious</span>
          <p>{report.suspicious}</p>
        </div>

        <div className="report-box">
          <span>Harmless</span>
          <p>{report.harmless}</p>
        </div>

      </div>

      <div className="recommendation-box">

        <h3>
          Recommendation
        </h3>

        <p>
          {report.recommendation}
        </p>

      </div>

      <div className="terminal-box">

        <h3>
          Full Scan Output
        </h3>

        <pre>
          {report.rawOutput}
        </pre>

      </div>

    </div>
  );
}