import { Controller, Get, Post, Body } from'@nestjs/common';
import { SettingsService } from'./settings.service';

export interface SettingsDto {
 n8nUrl: string;
 n8nApiKey: string;
}

@Controller('api/settings')
export class SettingsController {
 constructor(private readonly settingsService: SettingsService) {}

 @Post('save')
 async saveSettings(@Body() settings: SettingsDto) {
 return this.settingsService.saveSettings(settings);
 }

 @Get('load')
 async loadSettings() {
 return this.settingsService.loadSettings();
 }

 @Get('test-connection')
 async testConnection() {
 return this.settingsService.testN8nConnection();
 }

 @Post('test-integration')
 async testIntegration(@Body() body: { service: string }) {
 return this.settingsService.testIntegrationKey(body.service);
 }

 @Get('workflows')
 async getWorkflows() {
 return this.settingsService.getWorkflows();
 }
}
