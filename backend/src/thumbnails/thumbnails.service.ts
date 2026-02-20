import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';

export interface Thumbnail {
  id: string;
  name: string;
  url: string;
}

@Injectable()
export class ThumbnailsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<Thumbnail[]> {
    const data = this.db.readSync();
    return data.thumbnails || [];
  }

  async create(thumbnail: { name: string; url: string }): Promise<Thumbnail> {
    const newThumbnail: Thumbnail = {
      id: this.generateId(),
      ...thumbnail,
    };
    const data = this.db.readSync();
    data.thumbnails = data.thumbnails || [];
    data.thumbnails.push(newThumbnail);
    this.db.writeSync(data);
    return newThumbnail;
  }

  async update(id: string, thumbnail: { name?: string; url?: string }): Promise<Thumbnail> {
    const data = this.db.readSync();
    const index = data.thumbnails.findIndex((t: Thumbnail) => t.id === id);
    if (index === -1) {
      throw new Error('Thumbnail not found');
    }
    const updatedThumbnail = { ...data.thumbnails[index], ...thumbnail };
    data.thumbnails[index] = updatedThumbnail;
    this.db.writeSync(data);
    return updatedThumbnail;
  }

  async remove(id: string): Promise<Thumbnail> {
    const data = this.db.readSync();
    const index = data.thumbnails.findIndex((t: Thumbnail) => t.id === id);
    if (index === -1) {
      throw new Error('Thumbnail not found');
    }
    const [deletedThumbnail] = data.thumbnails.splice(index, 1);
    this.db.writeSync(data);
    return deletedThumbnail;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
