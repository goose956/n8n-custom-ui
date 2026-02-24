import { Controller, Get, Post, Body, HttpCode, Query, Param, Delete } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';

interface ContactSubmission {
  id: number;
  app_id?: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  created_at: string;
}

@Controller('api/contact')
export class ContactController {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Submit a contact form (public — used by members area contact page)
   */
  @Post()
  @HttpCode(200)
  submitContact(
    @Body() body: { name: string; email: string; subject?: string; message: string; app_id?: number },
  ) {
    const data = this.db.readSync();
    const submissions: ContactSubmission[] = data.contact_submissions || [];

    const newSubmission: ContactSubmission = {
      id: submissions.length > 0 ? Math.max(...submissions.map(s => s.id || 0)) + 1 : 1,
      app_id: body.app_id,
      name: body.name,
      email: body.email,
      subject: body.subject || 'No Subject',
      message: body.message,
      status: 'new',
      created_at: new Date().toISOString(),
    };

    submissions.push(newSubmission);
    data.contact_submissions = submissions;
    this.db.writeSync(data);

    return { success: true, data: { id: newSubmission.id } };
  }

  /**
   * Get all contact submissions (admin — with optional status/app filter)
   */
  @Get()
  getSubmissions(
    @Query('status') status?: string,
    @Query('app_id') appId?: string,
  ) {
    const data = this.db.readSync();
    let submissions: ContactSubmission[] = data.contact_submissions || [];

    if (status) submissions = submissions.filter(s => s.status === status);
    if (appId) submissions = submissions.filter(s => String(s.app_id) === String(appId));

    // Most recent first
    submissions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { success: true, data: submissions, total: submissions.length };
  }

  /**
   * Update submission status (mark as read, replied, archived)
   */
  @Post(':id/status')
  @HttpCode(200)
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'new' | 'read' | 'replied' | 'archived',
  ) {
    const data = this.db.readSync();
    const submissions: ContactSubmission[] = data.contact_submissions || [];
    const sub = submissions.find(s => s.id === parseInt(id));

    if (!sub) {
      return { success: false, message: 'Submission not found' };
    }

    sub.status = status;
    data.contact_submissions = submissions;
    this.db.writeSync(data);

    return { success: true, data: sub };
  }

  /**
   * Delete a contact submission
   */
  @Delete(':id')
  deleteSubmission(@Param('id') id: string) {
    const data = this.db.readSync();
    const submissions: ContactSubmission[] = data.contact_submissions || [];
    const idx = submissions.findIndex(s => s.id === parseInt(id));

    if (idx === -1) {
      return { success: false, message: 'Submission not found' };
    }

    submissions.splice(idx, 1);
    data.contact_submissions = submissions;
    this.db.writeSync(data);

    return { success: true };
  }
}
