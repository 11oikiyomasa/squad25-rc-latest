import { useState } from 'react';
import { 
  AppHeader, 
  OpenInAppBar, 
  PromotionBanner, 
  FeedTabs, 
  ArticleFeedItem, 
  NavigationDrawer, 
  ArticleHeader,
  ArticleBody,
  ArticleBottomBar
} from './components';
import { Article } from './types';

const sampleArticles: Article[] = [
  {
    id: '1',
    title: 'The Future of Artificial Intelligence in Healthcare',
    excerpt: 'How AI is revolutionizing diagnostics, treatment plans, and patient care in modern medicine.',
    publication: { id: 'pub1', name: 'Tech Health Journal', verified: true },
    author: { id: 'author1', name: 'Dr. Sarah Johnson', avatarColor: 'bg-blue-500' },
    date: 'Aug 24', readingTime: 5, tags: ['AI', 'Healthcare', 'Technology'],
    reactions: 24, comments: 8, shares: 3, memberOnly: false
  },
  {
    id: '2',
    title: 'Sustainable Architecture: Building Tomorrow\'s Cities',
    excerpt: 'Exploring innovative materials and designs that reduce environmental impact in urban construction.',
    publication: { id: 'pub2', name: 'Green Design Magazine', verified: true },
    author: { id: 'author2', name: 'Michael Chen', avatarColor: 'bg-green-500' },
    date: 'Aug 22', readingTime: 7, tags: ['Architecture', 'Sustainability', 'Urban Planning'],
    reactions: 42, comments: 15, shares: 9, memberOnly: true
  },
  {
    id: '3',
    title: 'The Psychology of Remote Work Productivity',
    excerpt: 'Understanding cognitive factors that influence performance in distributed work environments.',
    publication: { id: 'pub3', name: 'Workplace Insights', verified: false },
    author: { id: 'author3', name: 'Emma Rodriguez', avatarColor: 'bg-purple-500' },
    date: 'Aug 20', readingTime: 6, tags: ['Psychology', 'Remote Work', 'Productivity'],
    reactions: 18, comments: 12, shares: 5, memberOnly: false
  }
];

export default function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'feed' | 'article'>('feed');
  const [selectedArticle, setSelectedArticle] = useState<Article>(sampleArticles[0]);
  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);
  const closeDrawer = () => setIsDrawerOpen(false);
  const showArticle = (article: Article) => { setSelectedArticle(article); setCurrentView('article'); };

  return (
    <div className="min-h-screen bg-[#171717] text-white">
      <NavigationDrawer isOpen={isDrawerOpen} onClose={closeDrawer} />
      <div className={`min-h-screen ${isDrawerOpen ? 'overflow-hidden' : ''}`}>
        <AppHeader onMenuClick={toggleDrawer} />
        <OpenInAppBar />
        <PromotionBanner />
        {currentView === 'feed' ? (
          <>
            <FeedTabs />
            <div>{sampleArticles.map(article => <div key={article.id} onClick={() => showArticle(article)} className="cursor-pointer"><ArticleFeedItem article={article} /></div>)}</div>
          </>
        ) : (
          <>
            <div className="sticky top-14 z-10 border-b border-gray-800 bg-[#171717] p-4">
              <button onClick={() => setCurrentView('feed')} className="flex items-center gap-2 text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                <span>Back to feed</span>
              </button>
            </div>
            <ArticleHeader article={selectedArticle} />
            <ArticleBody />
            <ArticleBottomBar />
          </>
        )}
      </div>
    </div>
  );
}
