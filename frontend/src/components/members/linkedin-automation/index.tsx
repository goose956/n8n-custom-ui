import { Routes, Route, Navigate } from'react-router-dom';
import { MembersDashboardPage } from'./dashboard';
import { MembersProfilePage } from'./profile';
import { MembersSettingsPage } from'./settings';
import { MembersAdminPage } from'./admin';
import { MembersContactPage } from'./contact';
import { MembersCampaignsPage } from'./campaigns';
import { MembersAnalyticsPage } from'./analytics';
import { MembersIntegrationsPage } from'./integrations';

export function MembersArea() {
 return (
 <Routes>
 <Route path="/dashboard" element={<MembersDashboardPage />} />
 <Route path="/profile" element={<MembersProfilePage />} />
 <Route path="/settings" element={<MembersSettingsPage />} />
 <Route path="/admin" element={<MembersAdminPage />} />
 <Route path="/contact" element={<MembersContactPage />} />
 <Route path="/campaigns" element={<MembersCampaignsPage />} />
 <Route path="/analytics" element={<MembersAnalyticsPage />} />
 <Route path="/integrations" element={<MembersIntegrationsPage />} />
 <Route path="*" element={<Navigate to="/dashboard" />} />
 </Routes>
 );
}
