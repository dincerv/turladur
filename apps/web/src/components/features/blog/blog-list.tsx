import { BlogPostCard } from './blog-post-card';
import type { BlogPostListItem } from './blog.types';

type BlogListProps = {
  posts: BlogPostListItem[];
  total: number;
};

export function BlogList({ posts, total }: BlogListProps) {
  return (
    <section aria-label="Blog yazıları" className="mt-6">
      <p className="mb-4 text-sm text-neutral-500">
        <span className="font-medium text-neutral-800">{total}</span> yazı
      </p>
      <ul className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, index) => (
          <li key={post.id} className="h-full">
            <BlogPostCard post={post} priority={index < 3} />
          </li>
        ))}
      </ul>
    </section>
  );
}
