import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';

interface ContactForm {
  name: string;
  email: string;
  message: string;
}

@Injectable()
export class ContactService {
  private readonly contactsFile = 'contacts.json';

  constructor(private readonly db: DatabaseService) {}

  async processContactForm(contactData: ContactForm): Promise<void> {
    const { name, email, message } = contactData;
    if (!name || !email || !message) {
      throw new Error('Invalid contact data');
    }

    const contacts = await this.db.readSync(this.contactsFile) || [];
    contacts.push({ name, email, message, submittedAt: new Date().toISOString() });
    
    await this.db.writeSync(this.contactsFile, contacts);
  }
}
