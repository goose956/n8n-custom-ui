import { Routes, Route, Navigate } from 'react-router-dom';
import MembersLayout from '../MembersLayout';
import MembersDashboardPage from './dashboard';
import MembersProfilePage from './MembersProfilePage';
import MembersSupportPage from './support';
import MembersSettingsPage from './settings';
import MembersScriptTemplateLibraryPage from './script-template-library';
import MembersTutorialsPage from './tutorials';
import MembersCommunityPage from './community';
import MembersAnalyticsPage from './analytics';

export function MembersArea() {
  return (
    <MembersLayout>
      <Routes>
        <Route path="/dashboard" element={<MembersDashboardPage />} />
        <Route path="/profile" element={<MembersProfilePage />} />
        <Route path="/support" element={<MembersSupportPage />} />
        <Route path="/settings" element={<MembersSettingsPage />} />
        <Route path="/script-template-library" element={<MembersScriptTemplateLibraryPage />} />
        <Route path="/tutorials" element={<MembersTutorialsPage />} />
        <Route path="/community" element={<MembersCommunityPage />} />
        <Route path="/analytics" element={<MembersAnalyticsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </MembersLayout>
  );
}