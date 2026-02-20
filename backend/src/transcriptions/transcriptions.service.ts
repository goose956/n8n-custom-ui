import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';

interface Transcription {
  id: number;
  text: string;
}

@Injectable()
export class TranscriptionsService {
  constructor(private readonly db: DatabaseService) {}

  private generateId(): number {
    const transcriptions = this.db.readSync<Transcription[]>('transcriptions.json') || [];
    return transcriptions.length ? transcriptions[transcriptions.length - 1].id + 1 : 1;
  }

  fetchAllTranscriptions(): Transcription[] {
    return this.db.readSync<Transcription[]>('transcriptions.json') || [];
  }

  createTranscription(text: string): Transcription {
    const transcriptions = this.db.readSync<Transcription[]>('transcriptions.json') || [];
    const newTranscription: Transcription = { id: this.generateId(), text };
    transcriptions.push(newTranscription);
    this.db.writeSync('transcriptions.json', transcriptions);
    return newTranscription;
  }
}
