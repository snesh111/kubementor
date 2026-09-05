export const generateReport = (findings, scoreResults, analyzedFilesMetadata) => {
  // Sort findings by severity
  const severityWeights = { Critical: 1, High: 2, Medium: 3, Low: 4, Info: 5 };
  const sortedFindings = [...findings].sort((a, b) => {
    const weightA = severityWeights[a.severity] || 5;
    const weightB = severityWeights[b.severity] || 5;
    return weightA - weightB;
  });

  // Extract prioritized recommendations
  const recommendationsMap = new Map();
  sortedFindings.forEach((f) => {
    if (f.recommendation && !recommendationsMap.has(f.title)) {
      recommendationsMap.set(f.title, f.recommendation);
    }
  });

  const recommendationsList = Array.from(recommendationsMap.values());

  return {
    analyzedFiles: analyzedFilesMetadata,
    overallScore: scoreResults.overallScore,
    categoryScores: scoreResults.categoryScores,
    categoryDeductions: scoreResults.categoryDeductions,
    findings: sortedFindings,
    recommendations: recommendationsList,
    analyzerVersion: '1.0.0',
    analyzedAt: new Date(),
  };
};

export default { generateReport };
