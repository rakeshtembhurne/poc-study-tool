export const API_ENDPOINTS = {
  v1: {
    auth: {
      login: '/api/v1/auth/login',
      signup: '/api/v1/auth/signup',
      refreshToken: '/api/v1/auth/refresh-token',
      resetPassword: '/api/v1/auth/reset-password',
      resetPasswordConfirm: '/api/v1/auth/reset-password/confirm',
    },
    decks: {
      fetch: '/api/v1/decks',
    },
    fileUpload: {
      upload: '/api/v1/file-processing/upload/multiple',
    },
    user: {
      updateEmail: '/api/v1/users/:id',
      updatePassword: '/api/v1/users/password',
      updateApiKey: '/api/v1/users/:id',
    },

    inputPrompt: {
      generateCard: '/api/v1/prompt/generate',
      review: {
        due: '/api/v1/review/due',
        submit: '/api/v1/review/submit',
      },
    },

    flashcards: {
      cardbulk: '/api/v1/flashcards/bulk', // ✅ your backend URL
    },
  },
};
