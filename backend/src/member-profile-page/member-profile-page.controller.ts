import { Controller, Get, Patch, Body, Req, HttpException, HttpStatus } from '@nestjs/common';
import { MemberProfilePageService } from './member-profile-page.service';

@Controller('api/member-profile-page')
export class MemberProfilePageController {
  constructor(private readonly memberProfileService: MemberProfilePageService) {}

  @Get('profile')
  async getUserProfile(@Req() req) {
    const userId = req.user.id;  // Assume userId is retrieved from request object
    try {
      return await this.memberProfileService.getUserProfile(userId);
    } catch (error) {
      throw new HttpException('User Profile not found', HttpStatus.NOT_FOUND);
    }
  }

  @Patch('profile')
  async updateUserProfile(@Req() req, @Body() updateProfileDto) {
    const userId = req.user.id;  // Assume userId is retrieved from request object
    try {
      return await this.memberProfileService.updateUserProfile(userId, updateProfileDto);
    } catch (error) {
      throw new HttpException('Profile update failed', HttpStatus.BAD_REQUEST);
    }
  }
}