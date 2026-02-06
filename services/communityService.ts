
import { supabase } from '../lib/supabase';
import { PostItem } from '../pages/Community';

export const communityService = {
    async fetchPosts() {
        const { data, error } = await supabase
            .from('posts')
            .select(`
        *,
        author:profiles!author_id(full_name, avatar_url),
        book:books(title)
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform to frontend model if necessary, or ensure frontend adapts to this
        return data;
    },

    async createPost(post: Omit<PostItem, 'id' | 'time' | 'likes' | 'comments'>, userId: string) {
        const { data, error } = await supabase
            .from('posts')
            .insert({
                author_id: userId,
                content: post.content,
                book_title: post.bookTitle, // Note: Schema might need adjustment if we store raw title vs book_id
                location: post.location,
                tag: post.tag,
                image_urls: [post.image1, post.image2].filter(Boolean)
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
