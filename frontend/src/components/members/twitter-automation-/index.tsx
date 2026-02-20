import { Routes, Route, Navigate } from 'react-router-dom';
import { MembersDashboardPage } from './dashboard';
import { MembersProfilePage } from './profile';
import { MembersSettingsPage } from './settings';
import { MembersAdminPage } from './admin';
import { MembersContactPage } from './contact';
import { MembersContentScraperPage } from './content-scraper';
import { MembersTweetQueuePage } from './tweet-queue';
import { MembersAutoRepliesPage } from './auto-replies';
import { MembersAnalyticsPage } from './analytics';
import { MembersAutomationRulesPage } from './automation-rules';

export function MembersArea() {
  return (
    <Routes>
      <Route path="/dashboard" element={<MembersDashboardPage />} />
      <Route path="/profile" element={<MembersProfilePage />} />
      <Route path="/settings" element={<MembersSettingsPage />} />
      <Route path="/admin" element={<MembersAdminPage />} />
      <Route path="/contact" element={<MembersContactPage />} />
      <Route path="/content-scraper" element={<MembersContentScraperPage />} />
      <Route path="/tweet-queue" element={<MembersTweetQueuePage />} />
      <Route path="/auto-replies" element={<MembersAutoRepliesPage />} />
      <Route path="/analytics" element={<MembersAnalyticsPage />} />
      <Route path="/automation-rules" element={<MembersAutomationRulesPage />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}