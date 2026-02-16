import { Injectable } from'@nestjs/common';
import { DatabaseService } from'../shared/database.service';

export interface AppPlan {
 id: string;
 name: string;
 description: string;
 status:'draft' |'processing' |'completed';
 priority:'low' |'medium' |'high' |'urgent';
 category: string;
 tags: string[];
 order: number;
 progress: number; // 0-100
 notes: string;
 dueDate: string | null;
 createdAt: string;
 updatedAt: string;
}

@Injectable()
export class AppPlannerService {
 constructor(private readonly db: DatabaseService) {}

 private readDatabase(): any {
 return this.db.readSync();
 }

 private writeDatabase(data: any): void {
 this.db.writeSync(data);
 }

 private getPlans(): AppPlan[] {
 const db = this.readDatabase();
 return db.appPlans || [];
 }

 private savePlans(plans: AppPlan[]): void {
 const db = this.readDatabase();
 db.appPlans = plans;
 this.writeDatabase(db);
 }

 private generateId(): string {
 return`app-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
 }

 // --- CRUD --------------------------------------------------------------------

 getAll(): AppPlan[] {
 return this.getPlans().sort((a, b) => a.order - b.order);
 }

 getById(id: string): AppPlan | null {
 return this.getPlans().find((p) => p.id === id) || null;
 }

 create(data: {
 name: string;
 description?: string;
 status?: AppPlan['status'];
 priority?: AppPlan['priority'];
 category?: string;
 tags?: string[];
 notes?: string;
 dueDate?: string | null;
 }): AppPlan {
 const plans = this.getPlans();
 const maxOrder = plans.length > 0 ? Math.max(...plans.map((p) => p.order)) : -1;

 const now = new Date().toISOString();
 const plan: AppPlan = {
 id: this.generateId(),
 name: data.name,
 description: data.description ||'',
 status: data.status ||'draft',
 priority: data.priority ||'medium',
 category: data.category ||'General',
 tags: data.tags || [],
 order: maxOrder + 1,
 progress: data.status ==='completed' ? 100 : 0,
 notes: data.notes ||'',
 dueDate: data.dueDate || null,
 createdAt: now,
 updatedAt: now,
 };

 plans.push(plan);
 this.savePlans(plans);
 return plan;
 }

 update(id: string, data: Partial<Omit<AppPlan,'id' |'createdAt'>>): AppPlan | null {
 const plans = this.getPlans();
 const idx = plans.findIndex((p) => p.id === id);
 if (idx === -1) return null;

 // Auto-set progress when status changes
 if (data.status ==='completed' && data.progress === undefined) {
 data.progress = 100;
 }
 if (data.status ==='draft' && data.progress === undefined) {
 data.progress = 0;
 }

 plans[idx] = {
 ...plans[idx],
 ...data,
 updatedAt: new Date().toISOString(),
 };

 this.savePlans(plans);
 return plans[idx];
 }

 delete(id: string): boolean {
 const plans = this.getPlans();
 const idx = plans.findIndex((p) => p.id === id);
 if (idx === -1) return false;

 plans.splice(idx, 1);
 // Re-number orders
 plans.sort((a, b) => a.order - b.order).forEach((p, i) => (p.order = i));
 this.savePlans(plans);
 return true;
 }

 // --- Reorder -----------------------------------------------------------------

 reorder(orderedIds: string[]): AppPlan[] {
 const plans = this.getPlans();
 const planMap = new Map(plans.map((p) => [p.id, p]));

 // Assign new orders based on the provided ID array
 orderedIds.forEach((id, index) => {
 const plan = planMap.get(id);
 if (plan) {
 plan.order = index;
 plan.updatedAt = new Date().toISOString();
 }
 });

 // Any plans not in the orderedIds list go at the end
 let nextOrder = orderedIds.length;
 for (const plan of plans) {
 if (!orderedIds.includes(plan.id)) {
 plan.order = nextOrder++;
 }
 }

 this.savePlans(plans);
 return this.getAll();
 }

 // --- Stats -------------------------------------------------------------------

 getStats(): {
 total: number;
 draft: number;
 processing: number;
 completed: number;
 avgProgress: number;
 categories: Record<string, number>;
 byPriority: Record<string, number>;
 overdue: number;
 } {
 const plans = this.getPlans();
 const now = new Date();

 const draft = plans.filter((p) => p.status ==='draft').length;
 const processing = plans.filter((p) => p.status ==='processing').length;
 const completed = plans.filter((p) => p.status ==='completed').length;
 const avgProgress = plans.length > 0 ? Math.round(plans.reduce((sum, p) => sum + p.progress, 0) / plans.length) : 0;

 const categories: Record<string, number> = {};
 const byPriority: Record<string, number> = {};
 let overdue = 0;

 for (const plan of plans) {
 categories[plan.category] = (categories[plan.category] || 0) + 1;
 byPriority[plan.priority] = (byPriority[plan.priority] || 0) + 1;
 if (plan.dueDate && new Date(plan.dueDate) < now && plan.status !=='completed') {
 overdue++;
 }
 }

 return { total: plans.length, draft, processing, completed, avgProgress, categories, byPriority, overdue };
 }

 // --- Duplicate ---------------------------------------------------------------

 duplicate(id: string): AppPlan | null {
 const plan = this.getById(id);
 if (!plan) return null;

 return this.create({
 name:`${plan.name} (Copy)`,
 description: plan.description,
 status:'draft',
 priority: plan.priority,
 category: plan.category,
 tags: [...plan.tags],
 notes: plan.notes,
 dueDate: plan.dueDate,
 });
 }
}
