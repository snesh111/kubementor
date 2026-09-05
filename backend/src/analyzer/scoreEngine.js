export const calculateScores = (findings) => {
  const categoryDeductions = {
    security: [],
    reliability: [],
    performance: [],
    bestPractices: [],
  };

  let totalSecurityDeductions = 0;
  let totalReliabilityDeductions = 0;
  let totalPerformanceDeductions = 0;
  let totalBestPracticesDeductions = 0;

  findings.forEach((finding) => {
    const deduction = finding.deduction || 0;
    if (deduction <= 0) return;

    const item = {
      title: finding.title,
      deduction: deduction,
      resource: finding.resource || 'N/A',
    };

    switch (finding.category) {
      case 'Security':
        totalSecurityDeductions += deduction;
        categoryDeductions.security.push(item);
        break;
      case 'Reliability':
        totalReliabilityDeductions += deduction;
        categoryDeductions.reliability.push(item);
        break;
      case 'Performance':
        totalPerformanceDeductions += deduction;
        categoryDeductions.performance.push(item);
        break;
      case 'Best Practices':
        totalBestPracticesDeductions += deduction;
        categoryDeductions.bestPractices.push(item);
        break;
      default:
        break;
    }
  });

  const securityScore = Math.max(0, 100 - totalSecurityDeductions);
  const reliabilityScore = Math.max(0, 100 - totalReliabilityDeductions);
  const performanceScore = Math.max(0, 100 - totalPerformanceDeductions);
  const bestPracticesScore = Math.max(0, 100 - totalBestPracticesDeductions);

  // Overall Weighted Score: 30% Security, 30% Reliability, 20% Performance, 20% Best Practices
  const weightedOverall =
    securityScore * 0.30 +
    reliabilityScore * 0.30 +
    performanceScore * 0.20 +
    bestPracticesScore * 0.20;

  const overallScore = Math.round(weightedOverall);

  return {
    overallScore,
    categoryScores: {
      security: securityScore,
      reliability: reliabilityScore,
      performance: performanceScore,
      bestPractices: bestPracticesScore,
    },
    categoryDeductions,
  };
};

export default { calculateScores };
