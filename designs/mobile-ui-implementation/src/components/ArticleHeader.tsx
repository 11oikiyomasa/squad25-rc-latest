import { Article } from '../types';

interface ArticleHeaderProps {
  article: Article;
}

export function ArticleHeader({ article }: ArticleHeaderProps) {
  return (
    <div className="border-b border-gray-800 p-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-full bg-gray-700 px-3 py-1 text-xs text-gray-300">
          {article.publication.name}
        </div>
        <button className="rounded-full border border-gray-600 px-3 py-1 text-xs text-gray-300">
          Follow
        </button>
        {article.memberOnly && (
          <div className="rounded bg-gray-800 px-2 py-1 text-xs text-yellow-400">
            Member only
          </div>
        )}
      </div>
      
      <div className="mb-4 flex flex-wrap gap-2">
        {article.tags.map((tag) => (
          <div key={tag} className="flex items-center gap-1">
            <div className="rounded-full border border-gray-600 px-3 py-1 text-xs text-gray-300">
              {tag}
            </div>
            <button className="rounded-full border border-gray-600 px-2 py-1 text-xs text-gray-300">
              +
            </button>
          </div>
        ))}
      </div>
      
      <h1 className="mb-3 text-3xl font-bold text-white md:text-4xl">
        {article.title}
      </h1>
      
      <p className="mb-4 text-xl text-gray-400">
        {article.excerpt}
      </p>
      
      <div className="mb-4 text-gray-500">
        {article.readingTime} min read · {article.date}, 2026
      </div>
      
      <div className="mb-6 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${article.author.avatarColor} text-white`}>
          {article.author.name.charAt(0)}
        </div>
        <div className="font-medium text-white">{article.author.name}</div>
        <button className="rounded-full border border-gray-600 px-4 py-1 text-sm text-gray-300">
          Follow
        </button>
      </div>
      
      <div className="flex gap-3">
        <button className="flex items-center gap-2 rounded-full border border-gray-600 px-4 py-2 text-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m-2.828-9.9a9 9 0 012.828-2.828" />
          </svg>
          Listen
        </button>
        <button className="flex items-center gap-2 rounded-full border border-gray-600 px-4 py-2 text-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </button>
        <button className="flex items-center gap-2 rounded-full border border-gray-600 px-4 py-2 text-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 2zm7 0a1 1 0 012 0 1 1 0 011-2z" />
          </svg>
          More
        </button>
      </div>
    </div>
  );
}