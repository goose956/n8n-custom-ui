import { Routes, Route, Navigate } from'react-router-dom';
import { MembersDashboardPage } from'./dashboard';
import { MembersSkillsPage } from'./skills';
import { MembersWorkflowsPage } from'./workflows';
import { MembersDocumentsPage } from'./documents';
import { MembersApiKeysPage } from'./api-keys';
import { MembersAdminPage } from'./admin';
import { MembersContactPage } from'./contact';
import { MembersYoutubeBloggerPage } from'./youtube-blogger';

export function MembersArea() {
 return (
 <Routes>
 <Route path="/dashboard" element={<MembersDashboardPage />} />
 <Route path="/skills" element={<MembersSkillsPage />} />
 <Route path="/workflows" element={<MembersWorkflowsPage />} />
 <Route path="/documents" element={<MembersDocumentsPage />} />
 <Route path="/api-keys" element={<MembersApiKeysPage />} />
 <Route path="/admin" element={<MembersAdminPage />} />
 <Route path="/contact" element={<MembersContactPage />} />
 <Route path="/youtube-blogger" element={<MembersYoutubeBloggerPage />} />
 <Route path="*" element={<Navigate to="/dashboard" />} />
 </Routes>
 );
}
