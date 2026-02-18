import { Routes, Route, Navigate } from'react-router-dom';
import { MembersDashboardPage } from'./dashboard';
import { MembersProfilePage } from'./profile';
import { MembersSettingsPage } from'./settings';
import { MembersAdminPage } from'./admin';
import { MembersContactPage } from'./contact';
import { MembersMessageTemplatesPage } from'./message-templates';
import { MembersAnalyticsPage } from'./analytics';
import { MembersOutboxPage } from'./outbox';
import { MembersIntegrationPage } from'./integration';

export function MembersArea() {
 return (
 <Routes>
 <Route path="/dashboard" element={<MembersDashboardPage />} />
 <Route path="/profile" element={<MembersProfilePage />} />
 <Route path="/settings" element={<MembersSettingsPage />} />
 <Route path="/admin" element={<MembersAdminPage />} />
 <Route path="/contact" element={<MembersContactPage />} />
 <Route path="/message-templates" element={<MembersMessageTemplatesPage />} />
 <Route path="/analytics" element={<MembersAnalyticsPage />} />
 <Route path="/outbox" element={<MembersOutboxPage />} />
 <Route path="/integration" element={<MembersIntegrationPage />} />
 <Route path="*" element={<Navigate to="/dashboard" />} />
 </Routes>
 );
}
