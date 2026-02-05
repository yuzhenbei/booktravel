import { supabase } from '../lib/supabase';
import { PostItem, CommentItem } from '../../pages/Community';

export const communityService = {
  async getPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        user:profiles(username, avatar_url, department),
        book:books(title)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((p: any) => ({
      id: p.id,
      userName: p.user?.username || 'Unknown',
      targetUser: '全体书友',
      avatar1: p.user?.avatar_url,
      avatar2: 'https://picsum.photos/seed/globe/100/100',
      time: new Date(p.created_at).toLocaleDateString(),
      location: p.user?.department || 'Unknown',
      bookTitle: p.book?.title || '',
      content: p.content,
      likes: p.likes_count,
      comments: p.comments_count,
      image1: p.image_urls?.[0],
      image2: p.image_urls?.[1],
      tag: p.tag
    })) as PostItem[];
  },

  async getComments(postId: string) {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        user:profiles(username, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data.map((c: any) => ({
      id: c.id,
      userName: c.user?.username || 'Unknown',
      avatar: c.user?.avatar_url,
      content: c.content,
      time: new Date(c.created_at).toLocaleString()
    })) as CommentItem[];
  },

  async createComment(postId: string, content: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 1. Insert Comment
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content
      })
      .select(`
        *,
        user:profiles(username, avatar_url)
      `)
      .single();

    if (error) throw error;

    // 2. Increment comment count (optional, but good for UI)
    // Note: In a real app, use a Database Trigger or Edge Function for atomicity
    await supabase.rpc('increment_comments_count', { row_id: postId });

    return {
      id: data.id,
      userName: data.user?.username,
      avatar: data.user?.avatar_url,
      content: data.content,
      time: '刚刚'
    } as CommentItem;
  },

  async createPost(content: string, bookId?: string, images?: string[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content,
        book_id: bookId,
        image_urls: images || []
      })
      .select()
      .single();

    return { data, error };
  }
};
