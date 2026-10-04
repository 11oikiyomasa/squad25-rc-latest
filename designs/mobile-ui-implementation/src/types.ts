export interface Author { id: string; name: string; avatarColor: string; }
export interface Publication { id: string; name: string; verified: boolean; }
export interface Article {
  id: string;
  title: string;
  excerpt: string;
  publication: Publication;
  author: Author;
  date: string;
  readingTime: number;
  imageUrl?: string;
  tags: string[];
  reactions: number;
  comments: number;
  shares: number;
  memberOnly: boolean;
}
