import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { MembersService, RegisterDto } from './members.service';

@Controller('api/apps/:appId/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  /** List all registered members for this app (with plan/tier info) */
  @Get()
  async listMembers(@Param('appId', ParseIntPipe) appId: number) {
    const members = await this.membersService.listMembers(appId);
    return { success: true, data: members, timestamp: new Date().toISOString() };
  }

  /** Register a new member from the signup / register page */
  @Post('register')
  async register(
    @Param('appId', ParseIntPipe) appId: number,
    @Body() dto: RegisterDto,
  ) {
    const member = await this.membersService.register(appId, dto);
    return { success: true, data: member, timestamp: new Date().toISOString() };
  }

  /** Delete a member (revoke access) */
  @Delete(':userId')
  async deleteMember(
    @Param('appId', ParseIntPipe) appId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    await this.membersService.deleteMember(appId, userId);
    return { success: true, timestamp: new Date().toISOString() };
  }

  /** Update member status or plan */
  @Patch(':userId')
  async updateMember(
    @Param('appId', ParseIntPipe) appId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() update: { status?: string; plan_id?: number },
  ) {
    const member = await this.membersService.updateMember(appId, userId, update);
    return { success: true, data: member, timestamp: new Date().toISOString() };
  }
}
