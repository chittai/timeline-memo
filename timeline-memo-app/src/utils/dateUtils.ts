export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatDateTime = (date: Date): string => {
  return `${formatDate(date)} ${formatTime(date)}`;
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const getTimeRange = (posts: any[]): { start: Date; end: Date } => {
  if (posts.length === 0) {
    const now = new Date();
    return {
      start: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24時間前
      end: now,
    };
  }

  const timestamps = posts.map(post => post.createdAt.getTime());
  return {
    start: new Date(Math.min(...timestamps)),
    end: new Date(Math.max(...timestamps)),
  };
};