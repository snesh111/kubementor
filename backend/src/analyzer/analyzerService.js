import yaml from 'js-yaml';
import Project from '../models/Project.js';
import ProjectFile from '../models/ProjectFile.js';
import AnalysisReport from '../models/AnalysisReport.js';
import { runRulesOnDocuments } from './ruleEngine.js';
import { calculateScores } from './scoreEngine.js';
import { generateReport } from './reportGenerator.js';
import explainabilityEngine from './explainabilityEngine.js';
import { ApiError } from '../middleware/errorMiddleware.js';

export const analyzerService = {
  /**
   * Run readiness analysis on selected project files
   * @param {string} projectId - Project ObjectId
   * @param {string} userId - User ObjectId
   * @param {Array<string>} fileIds - Array of ProjectFile ObjectIds
   * @returns {Object} Saved AnalysisReport document + comparison metadata
   */
  analyzeProjectFiles: async (projectId, userId, fileIds) => {
    // 1. Verify project belongs to user
    const project = await Project.findOne({ _id: projectId, owner: userId });
    if (!project) {
      throw new ApiError('Project not found or not accessible', 404);
    }

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      throw new ApiError('Please select at least one Kubernetes YAML file to analyze.', 400);
    }

    // 2. Fetch previous report for before/after comparison
    const previousReport = await AnalysisReport.findOne({ project: projectId, user: userId })
      .sort({ createdAt: -1 });

    // 3. Fetch and verify selected files
    const files = await ProjectFile.find({
      _id: { $in: fileIds },
      project: projectId,
      owner: userId,
    });

    if (files.length === 0) {
      throw new ApiError('None of the specified files were found in this project.', 404);
    }

    // 4. Parse all YAML documents from selected files
    const parsedDocuments = [];
    const analyzedFilesMetadata = [];
    const parseErrors = [];

    for (const fileDoc of files) {
      analyzedFilesMetadata.push({
        fileId: fileDoc._id,
        originalName: fileDoc.originalName,
      });

      try {
        const docs = yaml.loadAll(fileDoc.content);
        docs.forEach((doc) => {
          if (doc && typeof doc === 'object') {
            parsedDocuments.push(doc);
          }
        });
      } catch (err) {
        parseErrors.push(`Failed to parse ${fileDoc.originalName}: ${err.message}`);
      }
    }

    if (parseErrors.length > 0 && parsedDocuments.length === 0) {
      throw new ApiError(`YAML Parsing Failed: ${parseErrors.join(' | ')}`, 400);
    }

    if (parsedDocuments.length === 0) {
      throw new ApiError('No valid Kubernetes YAML objects found in the selected files.', 400);
    }

    // 5. Run rule engine
    const rawFindings = runRulesOnDocuments(parsedDocuments);

    // 6. Enrich findings with Explainability Metadata (ruleId, why, recommendation)
    const enrichedFindings = explainabilityEngine.enrichFindings(rawFindings);

    // 7. Calculate category & overall scores
    const scoreResults = calculateScores(enrichedFindings);

    // 8. Generate report data
    const reportData = generateReport(enrichedFindings, scoreResults, analyzedFilesMetadata);

    // 9. Save report to MongoDB
    const reportDoc = await AnalysisReport.create({
      project: projectId,
      user: userId,
      analyzedFiles: reportData.analyzedFiles,
      analyzedAt: reportData.analyzedAt,
      overallScore: reportData.overallScore,
      categoryScores: reportData.categoryScores,
      categoryDeductions: reportData.categoryDeductions,
      findings: reportData.findings,
      recommendations: reportData.recommendations,
      analyzerVersion: reportData.analyzerVersion,
    });

    // Update project status to 'analyzed'
    project.status = 'analyzed';
    await project.save();

    // 10. Compute comparison diff against previous report if exists
    const comparison = explainabilityEngine.compareAnalyses(previousReport, reportDoc);

    const responseObj = reportDoc.toResponseObject();
    responseObj.comparison = comparison;

    return responseObj;
  },

  /**
   * Fetch analysis history for project
   */
  getProjectAnalysisHistory: async (projectId, userId) => {
    const project = await Project.findOne({ _id: projectId, owner: userId });
    if (!project) {
      throw new ApiError('Project not found or not accessible', 404);
    }

    const reports = await AnalysisReport.find({ project: projectId, user: userId })
      .sort({ createdAt: -1 })
      .select('overallScore categoryScores analyzedFiles analyzedAt createdAt');

    return reports.map((r) => r.toResponseObject());
  },

  /**
   * Fetch single complete analysis report by ID with comparison
   */
  getAnalysisReportById: async (projectId, analysisId, userId) => {
    const project = await Project.findOne({ _id: projectId, owner: userId });
    if (!project) {
      throw new ApiError('Project not found or not accessible', 404);
    }

    const reportDoc = await AnalysisReport.findOne({
      _id: analysisId,
      project: projectId,
      user: userId,
    });

    if (!reportDoc) {
      throw new ApiError('Analysis report not found or not accessible', 404);
    }

    // Fetch previous report before this one
    const previousReport = await AnalysisReport.findOne({
      project: projectId,
      user: userId,
      createdAt: { $lt: reportDoc.createdAt },
    }).sort({ createdAt: -1 });

    const comparison = explainabilityEngine.compareAnalyses(previousReport, reportDoc);
    const responseObj = reportDoc.toResponseObject();
    responseObj.comparison = comparison;

    return responseObj;
  },
};

export default analyzerService;
