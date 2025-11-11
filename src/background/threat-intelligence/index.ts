/**
 * Threat Intelligence Module - Main Entry Point
 * Orchestrates all threat intelligence capabilities
 */

export { analyzeURL } from './url-analyzer';
export { checkEmailBreach, checkMultipleEmails } from './breach-checker';
export {
  checkMisinformation,
  enhanceFactCheckWithCampaigns,
  addCustomCampaign,
  getAllCampaigns,
  checkSourceReliability,
} from './misinformation-tracker';
export { performComplianceCheck, checkVulnerabilities } from './compliance-checker';
export {
  generateThreatReport,
  getCachedReport,
  exportReportAsHTML,
  type ReportGenerationOptions,
} from './threat-report-generator';
export {
  detectDomainSquatting,
  monitorBrand,
  addMonitoredBrand,
  getMonitoredBrands,
  runBrandMonitoringScan,
} from './brand-monitor';
export {
  detectDeepfake,
  detectDeepfakeBatch,
  getDeepfakeAPIRecommendations,
} from './deepfake-detector';

// Re-export types
export * from '@/shared/threat-intelligence-types';
