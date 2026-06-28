import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createShortUrl,
  getAllShortUrls,
  getShortUrlAnalytics,
  updateShortUrl,
  deleteShortUrl,
  bulkDeleteShortUrls,
  exportAnalyticsCSV,
  getUserTags,
  getUrlsByTag,
} from "../../api/shortUrl.api";

// Async thunks
export const createUrl = createAsyncThunk("url/createUrl", async (payload, { rejectWithValue }) => {
  try {
    console.log('[createUrl] Creating URL with payload:', payload);
    const response = await createShortUrl(payload);
    console.log('[createUrl] Success:', response);
    return response;
  } catch (error) {
    console.error('[createUrl] Error:', error);
    const errorMessage = error.response?.data?.message || error.message || "Failed to create short URL";
    console.error('[createUrl] Returning error:', errorMessage);
    return rejectWithValue(errorMessage);
  }
});

export const fetchUserUrls = createAsyncThunk("url/fetchUserUrls", async (filters = {}, { rejectWithValue }) => {
  try {
    console.log('[fetchUserUrls] Fetching with filters:', filters);
    const response = await getAllShortUrls(filters || {});
    console.log('[fetchUserUrls] Response:', response);
    return response || [];
  } catch (error) {
    console.error('[fetchUserUrls] Error:', error.message);
    return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch URLs");
  }
});

export const fetchAnalytics = createAsyncThunk("url/fetchAnalytics", async (shortId, { rejectWithValue }) => {
  try {
    const response = await getShortUrlAnalytics(shortId);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch analytics");
  }
});

export const updateUrl = createAsyncThunk("url/updateUrl", async ({ shortId, updates }, { rejectWithValue }) => {
  try {
    const response = await updateShortUrl(shortId, updates);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to update URL");
  }
});

export const deleteUrl = createAsyncThunk("url/deleteUrl", async (shortId, { rejectWithValue }) => {
  try {
    await deleteShortUrl(shortId);
    return shortId;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to delete URL");
  }
});

export const bulkDeleteUrls = createAsyncThunk("url/bulkDelete", async (urlIds, { rejectWithValue }) => {
  try {
    await bulkDeleteShortUrls(urlIds);
    return urlIds;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to delete URLs");
  }
});

export const exportAnalytics = createAsyncThunk("url/exportAnalytics", async (shortId, { rejectWithValue }) => {
  try {
    const blob = await exportAnalyticsCSV(shortId);
    return { shortId, blob };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to export analytics");
  }
});

export const fetchUserTags = createAsyncThunk("url/fetchTags", async (_, { rejectWithValue }) => {
  try {
    const response = await getUserTags();
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch tags");
  }
});

export const searchUrlsByTag = createAsyncThunk("url/searchByTag", async (tag, { rejectWithValue }) => {
  try {
    const response = await getUrlsByTag(tag);
    return response;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch URLs by tag");
  }
});

const initialState = {
  urls: [],
  analytics: null,
  selectedUrl: null,
  tags: [],
  filteredUrls: [],
  settings: null,
  loading: false,
  analyticsLoading: false,
  error: null,
};

const urlSlice = createSlice({
  name: "url",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedUrl: (state, action) => {
      state.selectedUrl = action.payload;
    },
    clearAnalytics: (state) => {
      state.analytics = null;
    },
    filterByTag: (state, action) => {
      const tag = action.payload;
      if (tag) {
        state.filteredUrls = state.urls.filter(url => url.tags && url.tags.includes(tag));
      } else {
        state.filteredUrls = state.urls;
      }
    },
    searchUrls: (state, action) => {
      const query = action.payload.toLowerCase();
      state.filteredUrls = state.urls.filter(url =>
        url.short_url.includes(query) ||
        url.full_url.includes(query) ||
        (url.description && url.description.includes(query))
      );
    },
  },
  extraReducers: (builder) => {
    // Create URL
    builder.addCase(createUrl.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createUrl.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      // Add the newly created URL to the list
      if (action.payload && action.payload.shortUrl) {
        const savedUrl = action.payload.url || {};
        const newUrl = {
          _id: savedUrl._id || Math.random().toString() + Date.now(),
          short_url: action.payload.short_url || savedUrl.short_url || action.payload.shortUrl.split('/').pop(),
          full_url: action.payload.full_url || savedUrl.full_url || "",
          clicks: savedUrl.clicks || 0,
          created_at: savedUrl.created_at || new Date().toISOString(),
          tags: action.payload.tags || savedUrl.tags || [],
          description: action.payload.description || savedUrl.description || "",
          password: action.payload.password || savedUrl.password || null,
          expiresAt: action.payload.expiresAt || savedUrl.expiresAt || null,
          disabled: action.payload.disabled || savedUrl.disabled || false,
          affiliateCode: action.payload.affiliateCode || savedUrl.affiliateCode || null,
        };
        state.urls.unshift(newUrl);
        state.filteredUrls = state.urls;
        console.log('[createUrl] Added new URL to state:', newUrl);
      }
    });
    builder.addCase(createUrl.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Fetch User URLs
    builder.addCase(fetchUserUrls.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUserUrls.fulfilled, (state, action) => {
      state.loading = false;
      state.urls = action.payload;
      state.filteredUrls = action.payload;
      state.error = null;
    });
    builder.addCase(fetchUserUrls.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Fetch Analytics
    builder.addCase(fetchAnalytics.pending, (state) => {
      state.analyticsLoading = true;
      state.error = null;
    });
    builder.addCase(fetchAnalytics.fulfilled, (state, action) => {
      state.analyticsLoading = false;
      state.analytics = action.payload;
      state.error = null;
    });
    builder.addCase(fetchAnalytics.rejected, (state, action) => {
      state.analyticsLoading = false;
      state.error = action.payload;
    });

    // Update URL
    builder.addCase(updateUrl.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateUrl.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      const index = state.urls.findIndex((url) => url.short_url === action.payload.url.short_url);
      if (index !== -1) {
        state.urls[index] = action.payload.url;
        state.filteredUrls = state.urls;
      }
    });
    builder.addCase(updateUrl.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Delete URL
    builder.addCase(deleteUrl.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteUrl.fulfilled, (state, action) => {
      state.loading = false;
      state.urls = state.urls.filter((url) => url.short_url !== action.payload);
      state.filteredUrls = state.urls;
      state.error = null;
    });
    builder.addCase(deleteUrl.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Bulk Delete
    builder.addCase(bulkDeleteUrls.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(bulkDeleteUrls.fulfilled, (state, action) => {
      state.loading = false;
      state.urls = state.urls.filter(url => !action.payload.includes(url._id));
      state.filteredUrls = state.urls;
    });
    builder.addCase(bulkDeleteUrls.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Export Analytics
    builder.addCase(exportAnalytics.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(exportAnalytics.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null;
      // Handle download
      const url = window.URL.createObjectURL(action.payload.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${action.payload.shortId}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
    builder.addCase(exportAnalytics.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Fetch Tags
    builder.addCase(fetchUserTags.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUserTags.fulfilled, (state, action) => {
      state.loading = false;
      state.tags = action.payload;
      state.error = null;
    });
    builder.addCase(fetchUserTags.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Search by Tag
    builder.addCase(searchUrlsByTag.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(searchUrlsByTag.fulfilled, (state, action) => {
      state.loading = false;
      state.filteredUrls = action.payload;
      state.error = null;
    });
    builder.addCase(searchUrlsByTag.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const { 
  clearError, 
  setSelectedUrl, 
  clearAnalytics, 
  filterByTag, 
  searchUrls 
} = urlSlice.actions;

export default urlSlice.reducer;
