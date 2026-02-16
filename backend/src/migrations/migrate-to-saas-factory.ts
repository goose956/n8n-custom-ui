import * as fs from'fs';
import * as path from'path';

/**
 * Migration utility to transform current db.json to multi-app SaaS factory structure
 * 
 * This script:
 * 1. Backs up the current db.json
 * 2. Creates the new multi-app schema
 * 3. Migrates existing data to the "n8n-surface" app
 */

interface LegacyDB {
 n8nUrl: string;
 n8nApiKey: string;
 lastUpdated: string;
 workflowConfigs: Array<{
 workflowId: string;
 workflowName: string;
 fields: Array<{
 nodeId: string;
 fieldName: string;
 value: string;
 nodeType: string;
 }>;
 createdAt: string;
 updatedAt: string;
 }>;
}

interface NewDB {
 factory_version: string;
 last_updated: string;
 encryption_key_version: number;
 apps: Array<{
 id: number;
 name: string;
 slug: string;
 description: string;
 logo_url: string | null;
 primary_color: string;
 n8n_workflow_id: string | null;
 version: string;
 active: boolean;
 created_at: string;
 updated_at: string;
 }>;
 pages: any[];
 plans: any[];
 users: any[];
 subscriptions: any[];
 app_settings: any[];
 api_keys: any[];
 workflows: any[];
 workflow_configs: any[];
 app_usage: any[];
}

class DatabaseMigration {
 private dbPath: string;
 private backupPath: string;

 constructor(dbPath: string ='./backend/db.json') {
 this.dbPath = dbPath;
 this.backupPath = path.join(
 path.dirname(dbPath),
`db-backup-${new Date().toISOString().split('T')[0]}.json`
 );
 }

 /**
 * Read the current database file
 */
 readCurrentDB(): LegacyDB {
 try {
 const content = fs.readFileSync(this.dbPath,'utf-8');
 return JSON.parse(content);
 } catch (error) {
 console.error('Failed to read current db.json:', error);
 throw error;
 }
 }

 /**
 * Create a backup of the current database
 */
 backupCurrentDB(data: LegacyDB): void {
 try {
 fs.writeFileSync(this.backupPath, JSON.stringify(data, null, 2));
 console.log(`[OK] Backup created: ${this.backupPath}`);
 } catch (error) {
 console.error('Failed to create backup:', error);
 throw error;
 }
 }

 /**
 * Migrate legacy database to new structure
 */
 migrate(legacyDB: LegacyDB): NewDB {
 const timestamp = new Date().toISOString();
 const appId = 1;

 const newDB: NewDB = {
 factory_version:'1.0.0',
 last_updated: timestamp,
 encryption_key_version: 1,

 // Create the primary n8n-surface app
 apps: [
 {
 id: appId,
 name:'n8n Surface',
 slug:'n8n-surface',
 description:'n8n workflow management and configuration interface',
 logo_url: null,
 primary_color:'#3498db',
 n8n_workflow_id: null,
 version:'1.0.0',
 active: true,
 created_at: timestamp,
 updated_at: timestamp,
 },
 ],

 // Create default pages for the app
 pages: [
 {
 id: 1,
 app_id: appId,
 page_type:'index',
 title:'n8n Surface - Workflow Settings',
 content_json: {
 headline:'Simplify Your n8n Workflow Management',
 subheading:'Configure API keys, validate workflows, and manage executions',
 },
 custom_css: null,
 custom_component_path: null,
 created_at: timestamp,
 updated_at: timestamp,
 },
 {
 id: 2,
 app_id: appId,
 page_type:'thanks',
 title:'Settings Saved',
 content_json: {
 message:'Your n8n settings have been saved successfully!',
 redirect_url:'/n8n-surface',
 },
 custom_css: null,
 custom_component_path: null,
 created_at: timestamp,
 updated_at: timestamp,
 },
 {
 id: 3,
 app_id: appId,
 page_type:'members',
 title:'Members Area',
 content_json: {
 welcome:'Start managing your n8n workflows',
 },
 custom_css: null,
 custom_component_path: null,
 created_at: timestamp,
 updated_at: timestamp,
 },
 {
 id: 4,
 app_id: appId,
 page_type:'admin',
 title:'Admin Dashboard',
 content_json: {
 stats:'Workflow Overview',
 },
 custom_css: null,
 custom_component_path: null,
 created_at: timestamp,
 updated_at: timestamp,
 },
 ],

 // Create default plans
 plans: [
 {
 id: 1,
 app_id: appId,
 name:'Free',
 price: 0,
 billing_period:'monthly',
 features_json: {
 api_keys: 3,
 workflows: 10,
 api_calls: 1000,
 },
 stripe_price_id: null,
 created_at: timestamp,
 },
 {
 id: 2,
 app_id: appId,
 name:'Pro',
 price: 29.0,
 billing_period:'monthly',
 features_json: {
 api_keys: 50,
 workflows: 100,
 api_calls: 100000,
 },
 stripe_price_id: null,
 created_at: timestamp,
 },
 ],

 // Create default user
 users: [
 {
 id: 1,
 email:'admin@example.com',
 password_hash: null,
 name:'Admin User',
 created_at: timestamp,
 updated_at: timestamp,
 },
 ],

 // Create default subscription
 subscriptions: [
 {
 id: 1,
 user_id: 1,
 app_id: appId,
 plan_id: 2, // Pro plan
 status:'active',
 stripe_subscription_id: null,
 current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
 created_at: timestamp,
 updated_at: timestamp,
 },
 ],

 // Migrate app settings from legacy database
 app_settings: [
 {
 id: 1,
 app_id: appId,
 setting_key:'n8n_url',
 setting_value: legacyDB.n8nUrl ||'http://localhost:5678',
 created_at: legacyDB.lastUpdated,
 updated_at: legacyDB.lastUpdated,
 },
 {
 id: 2,
 app_id: appId,
 setting_key:'n8n_api_key',
 setting_value: legacyDB.n8nApiKey ||'',
 created_at: legacyDB.lastUpdated,
 updated_at: legacyDB.lastUpdated,
 },
 ],

 // Empty default collections
 api_keys: [],
 workflows: [],
 workflow_configs: [],
 app_usage: [],
 };

 // Migrate workflow configurations
 if (legacyDB.workflowConfigs && Array.isArray(legacyDB.workflowConfigs)) {
 const migratedWorkflows = legacyDB.workflowConfigs.map((wfConfig, index) => ({
 id: index + 1,
 app_id: appId,
 n8n_workflow_id: wfConfig.workflowId,
 name: wfConfig.workflowName,
 description:'',
 is_active: true,
 last_execution: wfConfig.updatedAt,
 created_at: wfConfig.createdAt,
 updated_at: wfConfig.updatedAt,
 }));

 newDB.workflows = migratedWorkflows;

 // Migrate workflow configs
 const migratedConfigs = legacyDB.workflowConfigs.flatMap((wfConfig, wfIndex) =>
 wfConfig.fields.map((field, fieldIndex) => ({
 id: wfIndex * 100 + fieldIndex + 1,
 workflow_id: wfIndex + 1,
 config_key: field.fieldName,
 config_value: field.value,
 created_at: wfConfig.createdAt,
 updated_at: wfConfig.updatedAt,
 }))
 );

 newDB.workflow_configs = migratedConfigs;
 }

 return newDB;
 }

 /**
 * Write the new database structure to file
 */
 writeNewDB(newDB: NewDB): void {
 try {
 fs.writeFileSync(this.dbPath, JSON.stringify(newDB, null, 2));
 console.log(`[OK] New database structure written to ${this.dbPath}`);
 } catch (error) {
 console.error('Failed to write new database:', error);
 throw error;
 }
 }

 /**
 * Execute the full migration
 */
 execute(): void {
 console.log(' Starting database migration to SaaS factory schema...\n');

 try {
 // 1. Read current database
 console.log(' Reading current database...');
 const legacyDB = this.readCurrentDB();
 console.log(`[OK] Read ${Object.keys(legacyDB).length} data collections\n`);

 // 2. Create backup
 console.log(' Creating backup...');
 this.backupCurrentDB(legacyDB);
 console.log('');

 // 3. Migrate data
 console.log(' Migrating data to new schema...');
 const newDB = this.migrate(legacyDB);
 console.log(`[OK] Created ${newDB.apps.length} app(s)`);
 console.log(`[OK] Created ${newDB.pages.length} page(s)`);
 console.log(`[OK] Migrated ${newDB.workflows.length} workflow(s)\n`);

 // 4. Write new database
 console.log(' Writing new database structure...');
 this.writeNewDB(newDB);
 console.log('');

 console.log('✨ Migration complete!');
 console.log('\nNext steps:');
 console.log('1. Update backend services to use multi-app structure');
 console.log('2. Update frontend routing for dynamic [app_slug]');
 console.log('3. Create app management endpoints');
 console.log('4. Test the new structure thoroughly');
 } catch (error) {
 console.error('[X] Migration failed:', error);
 process.exit(1);
 }
 }
}

// Run migration if executed directly
if (require.main === module) {
 const migration = new DatabaseMigration('./backend/db.json');
 migration.execute();
}

export { DatabaseMigration, LegacyDB, NewDB };
