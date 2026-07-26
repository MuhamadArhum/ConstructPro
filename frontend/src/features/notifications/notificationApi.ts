import { baseApi } from '../../api/baseApi';
import type { PaginatedList } from '../../types/common.types';
import type { NotificationDto, NotificationQuery, UnreadCountDto } from '../../types/notification.types';

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<PaginatedList<NotificationDto>, NotificationQuery>({
      query: (params) => ({ url: '/notifications', params }),
      providesTags: ['Notification'],
    }),
    getUnreadCount: builder.query<UnreadCountDto, void>({
      query: () => ({ url: '/notifications/unread-count' }),
      providesTags: ['Notification'],
    }),
    markAsRead: builder.mutation<void, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
    markAllAsRead: builder.mutation<void, void>({
      query: () => ({ url: '/notifications/read-all', method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
    generateNotifications: builder.mutation<void, void>({
      query: () => ({ url: '/notifications/generate', method: 'POST' }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetNotificationsQuery, useGetUnreadCountQuery,
  useMarkAsReadMutation, useMarkAllAsReadMutation, useGenerateNotificationsMutation,
} = notificationApi;
