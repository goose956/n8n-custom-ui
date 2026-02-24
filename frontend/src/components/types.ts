export interface DashboardStats {
  totalScriptsCreated: number; // Total number of scripts created
  mostUsedAISkills: SkillUsage[]; // Most frequently used AI skills
  recentScriptHistory: ScriptHistory[]; // Recent script generation history
}

export interface SkillUsage {
  skillName: string; // Name of the AI skill
  usageCount: number; // Number of times the skill has been used
}

export interface ScriptHistory {
  scriptId: string; // ID of the generated script
  title: string; // Title of the script
  creationDate: string; // Date when the script was created
}

export interface AI_skill {
  id: string; // Unique identifier for the AI skill
  name: string; // Name of the AI skill
  description: string; // Description of what the skill does
  execute: (input: string) => Promise<string>; // Function to execute the skill with input
}

export interface Workflow {
  id: string; // Unique identifier for the workflow
  name: string; // Name of the workflow
  schedule: Schedule; // Schedule settings for the automation
  tasks: WorkflowTask[]; // List of tasks in the workflow
}

export interface Schedule {
  daily: boolean; // Whether the workflow is scheduled daily
  weekly: boolean; // Whether the workflow is scheduled weekly
  time: string; // Time at which the workflow runs
}

export interface WorkflowTask {
  taskId: string; // Unique identifier for the task
  taskType: 'scriptGeneration' | 'transcription' | 'thumbnailCreation'; // Type of AI task
  parameters: object; // Parameters for the specific task
}

export interface Document {
  documentId: string; // Unique identifier for the document
  title: string; // Title of the document
  uploadDate: string; // Date when document was uploaded
  documentType: 'script' | 'transcription' | 'thumbnail'; // Type of the document
  fileUrl: string; // URL to access the document file
}

export interface APIKey {
  keyId: string; // Unique identifier for the API key
  createdAt: string; // Creation date of the API key
  isActive: boolean; // Status of the API key (active/inactive)
  usageStats: UsageStatistics; // Statistics regarding the usage of the API key
}

export interface UsageStatistics {
  totalRequests: number; // Total requests made using this API key
  lastUsed: string; // Date when the API key was last used
}

export interface AdminAnalytics {
  userTrends: UserTrend[]; // Trends in user script creations
  contactSubmissions: ContactSubmission[]; // List of contact form submissions
}

export interface UserTrend {
  userId: string; // ID of the user
  totalScriptsCreated: number; // Total scripts created by the user
  lastActive: string; // Last active date of the user
}

export interface ContactSubmission {
  submissionId: string; // Unique identifier for the contact submission
  userId: string; // ID of the user who submitted the form
  message: string; // Content of the message
  submissionDate: string; // Date of the submission
}

export interface YouTubeBlogger {
  articleSize: number; // Size of the blog article in characters
  generateArticle: (skillShortcode: string) => Promise<string>; // Generate a blog article using a skill shortcode
  downloadAsPDF: () => Promise<void>; // Function to download the article as a PDF
}