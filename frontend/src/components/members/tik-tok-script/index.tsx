import { Routes, Route, Navigate } from 'react-router-dom';
import { MembersDashboardPage } from './dashboard';
import { MembersProfilePage } from './profile';
import { MembersSettingsPage } from './settings';
import { MembersAnalyticsPage } from './analytics';
import { MembersScriptGeneratorPage } from './script-generator';
import { MembersVideoAnalysisPage } from './video-analysis';
import { MembersBillingPage } from './billing';
import { MembersAdminPage } from './admin';

export function MembersArea() {
  return (
    <Routes>
        <Route path="/dashboard" element={<MembersDashboardPage />} />
        <Route path="/profile" element={<MembersProfilePage />} />
        <Route path="/settings" element={<MembersSettingsPage />} />
        <Route path="/analytics" element={<MembersAnalyticsPage />} />
        <Route path="/script-generator" element={<MembersScriptGeneratorPage />} />
        <Route path="/video-analysis" element={<MembersVideoAnalysisPage />} />
        <Route path="/billing" element={<MembersBillingPage />} />
        <Route path="/admin" element={<MembersAdminPage />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}
