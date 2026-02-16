import { Injectable } from'@nestjs/common';
import { SettingsService } from'../settings/settings.service';
import { WorkflowValidationService } from'./workflow-validation.service';
import { WorkflowConfigService } from'./workflow-config.service';
import axios from'axios';

@Injectable()
export class WorkflowsService {
 constructor(
 private readonly settingsService: SettingsService,
 private readonly validationService: WorkflowValidationService,
 private readonly configService: WorkflowConfigService,
 ) {}

 async getWorkflows() {
 try {
 const settings = this.settingsService.loadSettingsSync();
 
 if (!settings) {
 return { success: false, message:'No settings configured', workflows: [] };
 }

 const decryptedApiKey = this.settingsService.decryptSync(settings.n8nApiKey);
 
 const response = await axios.get(`${settings.n8nUrl}/api/v1/workflows`, {
 headers: {
'X-N8N-API-KEY': decryptedApiKey,
 },
 timeout: 5000,
 });

 return {
 success: true,
 workflows: response.data.data || [],
 };
 } catch (error) {
 const message = error instanceof Error ? error.message : String(error);
 return {
 success: false,
 message:`Failed to fetch workflows: ${message}`,
 workflows: [],
 };
 }
 }

 async triggerWorkflow(workflowId: string, data?: Record<string, any>) {
 try {
 const settings = this.settingsService.loadSettingsSync();
 
 if (!settings) {
 return { success: false, message:'No settings configured' };
 }

 // Get saved workflow config and merge with trigger data
 const config = await this.configService.getWorkflowConfig(workflowId);
 let mergedData = data || {};
 
 // Apply saved configuration values if they exist
 if (config && config.fields && config.fields.length > 0) {
 for (const field of config.fields) {
 mergedData[`${field.nodeId}_${field.fieldName}`] = field.value;
 }
 }

 const decryptedApiKey = this.settingsService.decryptSync(settings.n8nApiKey);
 
 const response = await axios.post(
`${settings.n8nUrl}/api/v1/workflows/${workflowId}/execute`,
 { data: mergedData },
 {
 headers: {
'X-N8N-API-KEY': decryptedApiKey,
 },
 timeout: 30000,
 }
 );

 return {
 success: true,
 message:'Workflow triggered successfully',
 executionId: response.data.id,
 };
 } catch (error) {
 const message = error instanceof Error ? error.message : String(error);
 return {
 success: false,
 message:`Failed to trigger workflow: ${message}`,
 };
 }
 }

 async getWorkflowsWithValidation() {
 try {
 const settings = this.settingsService.loadSettingsSync();
 
 if (!settings) {
 return { success: false, message:'No settings configured', workflows: [] };
 }

 const decryptedApiKey = this.settingsService.decryptSync(settings.n8nApiKey);
 
 const response = await axios.get(`${settings.n8nUrl}/api/v1/workflows`, {
 headers: {
'X-N8N-API-KEY': decryptedApiKey,
 },
 timeout: 5000,
 });

 const workflows = response.data.data || [];
 const validations = await this.validationService.validateAllWorkflows(workflows);

 // Merge validation data with workflows
 const enrichedWorkflows = workflows.map((wf: any) => {
 const validation = validations.find(v => v.workflowId === wf.id);
 return {
 ...wf,
 validation: validation || { isValid: true, issues: [] },
 };
 });

 return {
 success: true,
 workflows: enrichedWorkflows,
 message:`Found ${workflows.length} workflows`,
 };
 } catch (error) {
 const message = error instanceof Error ? error.message : String(error);
 return {
 success: false,
 message:`Failed to fetch workflows: ${message}`,
 workflows: [],
 };
 }
 }
}
