import { Routes, Route, Navigate } from'react-router-dom';
import { MembersDashboardPage } from'./dashboard';
import { MembersProfilePage } from'./profile';
import { MembersSettingsPage } from'./settings';
import { MembersAdminPage } from'./admin';
import { MembersContactPage } from'./contact';
import { MembersYoutubeScriptsPage } from'./youtube-scripts';
import { MembersVideoThumbnailsPage } from'./video-thumbnails';
import { MembersTranscriptionsPage } from'./transcriptions';
import { MembersScraperPage } from'./scraper';

export function MembersArea() {
 return (
 <Routes>
 <Route path="/dashboard" element={<MembersDashboardPage />} />
 <Route path="/profile" element={<MembersProfilePage />} />
 <Route path="/settings" element={<MembersSettingsPage />} />
 <Route path="/admin" element={<MembersAdminPage />} />
 <Route path="/contact" element={<MembersContactPage />} />
 <Route path="/youtube-scripts" element={<MembersYoutubeScriptsPage />} />
 <Route path="/video-thumbnails" element={<MembersVideoThumbnailsPage />} />
 <Route path="/transcriptions" element={<MembersTranscriptionsPage />} />
 <Route path="/scraper" element={<MembersScraperPage />} />
 <Route path="*" element={<Navigate to="/dashboard" />} />
 </Routes>
 );
}
