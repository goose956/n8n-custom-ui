import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ContactService } from './contact.service';

@Controller('api/contact-api')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('/submit')
  async handleContactSubmission(@Body() contactData: any): Promise<{ message: string }> {
    try {
      await this.contactService.processContactForm(contactData);
      return { message: 'Contact form submitted successfully.' };
    } catch (error) {
      throw new HttpException('Failed to submit contact form', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
