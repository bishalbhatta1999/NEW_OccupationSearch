import React, { FC } from 'react';
import { BookOpen, Users, Calendar } from 'lucide-react';

interface BlogPost {
  title: string;
  category: string;
  date: string;
  excerpt: string;
  image: string;
}

const posts: BlogPost[] = [
  {
    title: 'Latest Trends in IT Immigration',
    category: 'Industry Insights',
    date: 'March 15, 2024',
    excerpt: 'Discover the current trends in technology sector immigration to Australia...',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
  },
  {
    title: 'Success Story: From India to Sydney',
    category: 'Success Stories',
    date: 'March 12, 2024',
    excerpt: 'Read how Raj navigated his journey from being a software engineer in India...',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
  },
  {
    title: 'Upcoming Immigration Events',
    category: 'Events',
    date: 'March 10, 2024',
    excerpt: 'Join us for upcoming webinars and networking opportunities...',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
  }
];

const BlogSection: FC = () => {
  return (
    <section className="py-20 px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Stay Informed with the Latest News
          </h2>
          <p className="text-xl text-gray-600">
            Industry insights, success stories, and upcoming events
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <div key={index} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="aspect-w-16 aspect-h-9 overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>{post.date}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                  {post.title}
                </h3>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                <button className="text-blue-600 font-medium hover:text-blue-800 transition-colors">
                  Read More →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSection;