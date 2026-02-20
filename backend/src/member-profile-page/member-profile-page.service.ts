import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../shared/database.service';

@Injectable()
export class MemberProfilePageService {
  constructor(private readonly db: DatabaseService) {}

  async getUserProfile(userId: string) {
    const data = this.db.readSync();
    return data.user_profiles.find(profile => profile.userId === userId);
  }

  async updateUserProfile(userId: string, updateProfileDto: any): Promise<any> {
    const data = this.db.readSync();
    const userProfileIndex = data.user_profiles.findIndex(profile => profile.userId === userId);

    if (userProfileIndex === -1) {
      throw new Error('User profile not found');
    }

    const updatedProfile = { ...data.user_profiles[userProfileIndex], ...updateProfileDto };
    data.user_profiles[userProfileIndex] = updatedProfile;
    this.db.writeSync(data);
    return updatedProfile;
  }
}