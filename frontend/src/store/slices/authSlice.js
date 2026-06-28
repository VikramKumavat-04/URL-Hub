import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loginUser, registerUser, logoutUser as apiLogoutUser } from "../../api/user.api";

// Async thunks
export const login = createAsyncThunk("auth/login", async ({ email, password }, { rejectWithValue }) => {
  try {
    console.log('[login] Starting login with email:', email);
    const response = await loginUser(email, password);
    console.log('[login] Response received:', response);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    console.log('[login] Success: Token and user saved to localStorage');
    return response;
  } catch (error) {
    console.error('[login] Error:', {
      message: error.message,
      responseStatus: error.response?.status,
      responseData: error.response?.data,
      fullError: error
    });
    return rejectWithValue(error.response?.data?.message || error.message || "Login failed");
  }
});

export const register = createAsyncThunk("auth/register", async ({ name, email, password }, { rejectWithValue }) => {
  try {
    console.log('[register] Starting registration with email:', email);
    const response = await registerUser(name, email, password);
    console.log('[register] Response received:', response);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    console.log('[register] Success: Token and user saved to localStorage');
    return response;
  } catch (error) {
    console.error('[register] Error:', {
      message: error.message,
      responseStatus: error.response?.status,
      responseData: error.response?.data,
      fullError: error
    });
    return rejectWithValue(error.response?.data?.message || error.message || "Registration failed");
  }
});

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      apiLogoutUser();
    },
    clearError: (state) => {
      state.error = null;
    },
    setAuthFromStorage: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = !!action.payload.token;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
    });

    // Register
    builder.addCase(register.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(register.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
    });
    builder.addCase(register.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
    });
  },
});

export const { logout, clearError, setAuthFromStorage } = authSlice.actions;
export default authSlice.reducer;
