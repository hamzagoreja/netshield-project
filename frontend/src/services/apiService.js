const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080/scan";

export const apiService = {

  scanUrl: async (url) => {

    const params = new URLSearchParams();
    params.append("target", url);

    const response = await fetch(
      `${BASE_URL}/url`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: params,
      }
    );

    if (!response.ok) {
      throw new Error("URL scan failed");
    }

    const rawText = await response.text();

    return apiService._parseSpringResponse(
      url,
      "URL SCAN",
      rawText
    );
  },

  scanFile: async (file) => {

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${BASE_URL}/file`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("File scan failed");
    }

    const rawText = await response.text();

    return apiService._parseSpringResponse(
      file.name,
      "FILE SCAN",
      rawText
    );
  },

  scanImage: async (image) => {

    const formData = new FormData();
    formData.append("image", image);

    const response = await fetch(
      `${BASE_URL}/image`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Image scan failed");
    }

    const rawText = await response.text();

    return apiService._parseSpringResponse(
      image.name,
      "IMAGE SCAN",
      rawText
    );
  },

  getHistory: async () => {

    const response = await fetch(
      `${BASE_URL}/history`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch history");
    }

    return response.json();
  },

  _parseSpringResponse:
    (targetName, typeLabel, rawText) => {

      const getValue = (label) => {

        const regex =
          new RegExp(
            `${label}\\s*[:=]\\s*(.+)`,
            "i"
          );

        const match =
          rawText.match(regex);

        return match
          ? match[1].trim()
          : "N/A";
      };

      const riskLevel =
        getValue("Risk Level");

      const detectionRatio =
        getValue("Detection Ratio");

      const securityScore =
        getValue("Security Score");

      const recommendation =
        getValue("Recommendation");

      const maliciousMatch =
        rawText.match(
          /Malicious Engines\s*[:=]\s*(\d+)/i
        );

      const suspiciousMatch =
        rawText.match(
          /Suspicious Engines\s*[:=]\s*(\d+)/i
        );

      const harmlessMatch =
        rawText.match(
          /Harmless Engines\s*[:=]\s*(\d+)/i
        );

      const malicious =
        maliciousMatch
          ? maliciousMatch[1]
          : "0";

      const suspicious =
        suspiciousMatch
          ? suspiciousMatch[1]
          : "0";

      const harmless =
        harmlessMatch
          ? harmlessMatch[1]
          : "0";

      const maliciousCount =
        parseInt(malicious) || 0;

      const suspiciousCount =
        parseInt(suspicious) || 0;

      // ✅ Fixed: was "isMalicious" (undefined variable) — now uses
      // the parsed engine counts to correctly derive status
      const status =
        maliciousCount  > 0 ? "malicious" :
        suspiciousCount > 0 ? "warning"   :
                              "safe";

      return {
        target: targetName,
        type: typeLabel,

        status,

        riskLevel,
        ratio: detectionRatio,
        score: securityScore,

        recommendation,

        malicious,
        suspicious,
        harmless,

        rawOutput: rawText,
      };
    },
};