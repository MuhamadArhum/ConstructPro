import { baseApi } from '../../api/baseApi';

export interface ProfileDto {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  profilePicturePath: string | null;
  roles: string[];
  createdAt: string;
  lastLoginAt: string | null;
}

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber?: string;
}

export const profileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<ProfileDto, void>({
      query: () => ({ url: '/profile', method: 'GET' }),
      providesTags: ['CurrentUser'],
    }),
    updateProfile: builder.mutation<ProfileDto, UpdateProfileRequest>({
      query: (body) => ({ url: '/profile', method: 'PUT', data: body }),
      invalidatesTags: ['CurrentUser'],
    }),
    uploadProfilePicture: builder.mutation<{ profilePicturePath: string }, FormData>({
      query: (formData) => ({ url: '/profile/picture', method: 'PUT', data: formData }),
      invalidatesTags: ['CurrentUser'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadProfilePictureMutation,
} = profileApi;
