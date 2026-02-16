# API Reference

## Dashboard Endpoint

- **Method & URL:** GET `${API_BASE}/api/dashboard`
- **Purpose:** Fetch dashboard data for user stats and recent trends.
- **Request Body/Params:** None
- **Expected Response Shape:**
    ```json
    {
        "userStats": {},
        "recentTrends": []
    }
    
- **Component Used:** `frontend/src/components/members/dashboard.tsx`

---

## Scripts Analytics Endpoint

- **Method & URL:** GET `/api/scripts/analytics`
- **Purpose:** Retrieve analytics data for user scripts.
- **Request Body/Params:** None
- **Expected Response Shape:**
    ```json
    {
        "analytics": {}
    }
    ```
- **Component Used:** `frontend/src/components/members/analytics.tsx`

---

## Scripts Endpoint

- **Method & URL:** GET `${API_BASE}/api/scripts`
- **Purpose:** Retrieve a list of user scripts created.
- **Request Body/Params:** None
- **Expected Response Shape:**
    ```json
    {
        "scripts": []
    }
    ```
- **Component Used:** `frontend/src/components/members/script-generator.tsx`

---

## Video Analysis Endpoint

- **Method & URL:** GET `/api/videos`
- **Purpose:** Fetch analysis data for TikTok videos.
- **Request Body/Params:** None
- **Expected Response Shape:**
    ```json
    {
        "videos": []
    }
    ```
- **Component Used:** `frontend/src/components/members/video-analysis.tsx`

---

## Billing Endpoint

- **Method & URL:** GET `${API_BASE}/api/billing`
- **Purpose:** Retrieve a user's billing information.
- **Request Body/Params:** None
- **Expected Response Shape:**
    ```json
    {
        "billingInfo": {}
    }
    ```
- **Component Used:** `frontend/src/components/members/billing.tsx`

---

## App Stats Endpoint

- **Method & URL:** GET `${API_BASE}/api/apps/6/stats`
- **Purpose:** Fetch statistics for a specific application.
- **Request Body/Params:** None
- **Expected Response Shape:**
    ```json
    {
        "appStats": {}
    }
    ```
- **Component Used:** `frontend/src/components/members/admin.tsx`

---

## App Analytics Endpoint

- **Method & URL:** GET `${API_BASE}/api/analytics/app/6`
- **Purpose:** Fetch analytics data for a specific application.
- **Request Body/Params:** None
- **Expected Response Shape:**
    ```json
    {
        "analytics": {}
    }
    ```
- **Component Used:** `frontend/src/components/members/admin.tsx`

---

## App Visitors Endpoint

- **Method & URL:** GET `${API_BASE}/api/analytics/app/6/visitors`
- **Purpose:** Fetch visitor data for a specific application.
- **Request Body/Params:** None
- **Expected Response Shape:**
    ```json
    {
        "visitors": []
    }
    ```
- **Component Used:** `frontend/src/components/members/admin.tsx`

---

## Errors Endpoint

- **Method & URL:** GET `${API_BASE}/api/analytics/errors?resolved=false`
- **Purpose:** Fetch unresolved error data for analytics.
- **Request Body/Params:** None
- **Expected Response Shape:**
    ```json
    {
        "errors": []
    }
    ```
- **Component Used:** `frontend/src/components/members/admin.tsx`

---

## API Usage Endpoint

- **Method & URL:** GET `${API_BASE}/api/analytics/api-usage`
- **Purpose:** Fetch analytics data related to API usage.
- **Request Body/Params:** None
- **Expected Response Shape:**
    ```json
    {
        "apiUsage": {}
    }
    ```
- **Component Used:** `frontend/src/components/members/admin.tsx`

---

## Resolve Error Endpoint

- **Method & URL:** POST `${API_BASE}/api/analytics/errors/${id}/resolve`
- **Purpose:** Resolve a specific error by ID.
- **Request Body/Params:** None
- **Expected Response Shape:**
    ```json
    {
        "message": "Error resolved successfully."
    }
    ```
- **Component Used:** `frontend/src/components/members/admin.tsx`