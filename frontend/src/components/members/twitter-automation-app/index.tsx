import { Routes, Route, Navigate } from'react-router-dom';
import { MembersDashboardPage } from'./dashboard';
import { MembersProfilePage } from'./profile';
import { MembersSettingsPage } from'./settings';
import { MembersAdminPage } from'./admin';
import { MembersContactPage } from'./contact';
import { MembersDataScraperPage } from'./data-scraper';
import { MembersTweetQueuePage } from'./tweet-queue';
import { MembersAutoResponsesPage } from'./auto-responses';
import { MembersContentSourcesPage } from'./content-sources';
import { MembersAnalyticsPage } from'./analytics';
import { MembersOptInManagementPage } from'./opt-in-management';
import { MembersScraperPage } from'./scraper';

export function MembersArea() {
 return (
 <Routes>
 <Route path="/dashboard" element={<MembersDashboardPage />} />
 <Route path="/profile" element={<MembersProfilePage />} />
 <Route path="/settings" element={<MembersSettingsPage />} />
 <Route path="/admin" element={<MembersAdminPage />} />
 <Route path="/contact" element={<MembersContactPage />} />
 <Route path="/data-scraper" element={<MembersDataScraperPage />} />
 <Route path="/tweet-queue" element={<MembersTweetQueuePage />} />
 <Route path="/auto-responses" element={<MembersAutoResponsesPage />} />
 <Route path="/content-sources" element={<MembersContentSourcesPage />} />
 <Route path="/analytics" element={<MembersAnalyticsPage />} />
 <Route path="/opt-in-management" element={<MembersOptInManagementPage />} />
 <Route path="/scraper" element={<MembersScraperPage />} />
 <Route path="*" element={<Navigate to="/dashboard" />} />
 </Routes>
 );
}
