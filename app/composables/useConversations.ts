import { isToday, isYesterday, subMonths } from 'date-fns';

export interface UIConversation {
  id: number;
  label: string;
  createdAt: string;
}

export function useConversations(
  conversations: Ref<UIConversation[] | undefined>,
) {
  const groups = computed(() => {
    const today: UIConversation[] = [];
    const yesterday: UIConversation[] = [];
    const lastWeek: UIConversation[] = [];
    const lastMonth: UIConversation[] = [];
    const older: Record<string, UIConversation[]> = {};

    const oneWeekAgo = subMonths(new Date(), 0.25); // ~7 days ago
    const oneMonthAgo = subMonths(new Date(), 1);

    conversations.value?.forEach((conv) => {
      const d = new Date(conv.createdAt);
      if (isToday(d)) {
        today.push(conv);
      } else if (isYesterday(d)) {
        yesterday.push(conv);
      } else if (d >= oneWeekAgo) {
        lastWeek.push(conv);
      } else if (d >= oneMonthAgo) {
        lastMonth.push(conv);
      } else {
        const key = d.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
        });
        if (!older[key]) older[key] = [] as UIConversation[];
        (older[key] as UIConversation[]).push(conv);
      }
    });

    const formatted: Array<{
      id: string;
      label: string;
      items: UIConversation[];
    }> = [];

    if (today.length)
      formatted.push({ id: 'today', label: '今天', items: today });
    if (yesterday.length)
      formatted.push({ id: 'yesterday', label: '昨天', items: yesterday });
    if (lastWeek.length)
      formatted.push({ id: 'lastWeek', label: '最近一周', items: lastWeek });
    if (lastMonth.length)
      formatted.push({ id: 'lastMonth', label: '最近一月', items: lastMonth });

    const sortedMonths = Object.keys(older).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );
    for (const month of sortedMonths) {
      const items = older[month];
      if (items) formatted.push({ id: month, label: month, items });
    }

    return formatted;
  });

  return { groups };
}
