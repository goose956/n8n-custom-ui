import { Routes, Route, Navigate } from'react-router-dom';
import { MembersDashboardPage } from'./dashboard';
import { MembersProfilePage } from'./profile';
import { MembersSettingsPage } from'./settings';
import { MembersAdminPage } from'./admin';
import { MembersContactPage } from'./contact';
import { MembersScriptCreatorPage } from'./script-creator';
import { MembersEmailScraperPage } from'./email-scraper';
import { MembersTranscriptionsPage } from'./transcriptions';
import { MembersThumbnailCreatorPage } from'./thumbnail-creator';
import { MembersScraperPage } from'./scraper';

export function MembersArea() {
 return (
 <Routes>
 <Route path="/dashboard" element={<MembersDashboardPage />} />
 <Route path="/profile" element={<MembersProfilePage />} />
 <Route path="/settings" element={<MembersSettingsPage />} />
 <Route path="/admin" element={<MembersAdminPage />} />
 <Route path="/contact" element={<MembersContactPage />} />
 <Route path="/script-creator" element={<MembersScriptCreatorPage />} />
 <Route path="/email-scraper" element={<MembersEmailScraperPage />} />
 <Route path="/transcriptions" element={<MembersTranscriptionsPage />} />
 <Route path="/thumbnail-creator" element={<MembersThumbnailCreatorPage />} />
 <Route path="/scraper" element={<MembersScraperPage />} />
 <Route path="*" element={<Navigate to="/dashboard" />} />
 </Routes>
 );
}
