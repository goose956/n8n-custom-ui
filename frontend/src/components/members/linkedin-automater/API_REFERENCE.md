# API Reference

## User Profile

### GET /api/user-profile
- **Method:** GET
- **Purpose:** Retrieve the user profile details.
- **Request Body/Params:** None
- **Expected Response Shape:**
  ```json
  {
    "username": "string",
    "email": "string",
    "integrationSettings": { /* integration settings */ }
  }
  
- **Component:** `frontend/src/components/members/linkedin-automater/profile.tsx`

### POST /api/user-profile
- **Method:** POST
- **Purpose:** Update the user profile details.
- **Request Body:**
  ```json
  {
    /* Draft user profile data */
  }
  ```
- **Expected Response Shape:** 
  ```json
  {
    "success": true,
    "message": "Profile updated successfully",
    "data": { /* updated user profile data */ }
  }
  ```
- **Component:** `frontend/src/components/members/linkedin-automater/profile.tsx`

## Settings

### GET /api/settings
- **Method:** GET
- **Purpose:** Retrieve user settings.
- **Request Body/Params:** None
- **Expected Response Shape:**
  ```json
  {
    /* JSON object containing various user settings */
  }
  ```
- **Component:** `frontend/src/components/members/linkedin-automater/settings.tsx`

## Admin Analytics

### GET /api/apps/10/stats
- **Method:** GET
- **Purpose:** Retrieve statistics related to app ID 10.
- **Request Body/Params:** None
- **Expected Response Shape:**
  ```json
  {
    /* JSON object containing stats */
  }
  ```
- **Component:** `frontend/src/components/members/linkedin-automater/admin.tsx`

### GET /api/analytics/app/10
- **Method:** GET
- **Purpose:** Retrieve analytics data for app ID 10.
- **Request Body/Params:** None
- **Expected Response Shape:**
  ```json
  {
    /* JSON object containing analytics data */
  }
  ```
- **Component:** `frontend/src/components/members/linkedin-automater/admin.tsx`

### GET /api/contact
- **Method:** GET
- **Purpose:** Retrieve contact information related to app ID 10.
- **Request Body/Params:** Query param `app_id=10`
- **Expected Response Shape:**
  ```json
  {
    /* JSON object containing contact information */
  }
  ```
- **Component:** `frontend/src/components/members/linkedin-automater/admin.tsx`

### GET /api/apps/10/members
- **Method:** GET
- **Purpose:** Retrieve members associated with app ID 10.
- **Request Body/Params:** None
- **Expected Response Shape:**
  ```json
  [
    {
      "id": "string",
      "name": "string",
      "status": "string"
    }
  ]
  ```
- **Component:** `frontend/src/components/members/linkedin-automater/admin.tsx`

### POST /api/contact/{id}/status
- **Method:** POST
- **Purpose:** Update the status of a contact by ID.
- **Request Body:**
  ```json
  {
    "status": "string"
  }
  ```
- **Expected Response Shape:** 
  ```json
  {
    "success": true
  }
  ```
- **Component:** `frontend/src/components/members/linkedin-automater/admin.tsx`

### DELETE /api/contact/{id}
- **Method:** DELETE
- **Purpose:** Delete a contact by ID.
- **Request Body/Params:** None
- **Expected Response Shape:** 
  ```json
  {
    "success": true
  }
  ```
- **Component:** `frontend/src/components/members/linkedin-automater/admin.tsx`

### PATCH /api/apps/10/members/{member.id}
- **Method:** PATCH
- **Purpose:** Update member details for app ID 10.
- **Request Body:**
  ```json
  {
    "status": "string"
  }
  ```
- **Expected Response Shape:** 
  ```json
  {
    "success": true
  }
  ```
- **Component:** `frontend/src/components/members/linkedin-automater/admin.tsx`

### DELETE /api/apps/10/members/{deleteDialog.member.id}
- **Method:** DELETE
- **Purpose:** Remove a member by ID from app ID 10.
- **Request Body/Params:** None
- **Expected Response Shape:** 
  ```json
  {
    "success": true
  }
  ```
- **Component:** `frontend/src/components/members/linkedin-automater/admin.tsx`

## Contact

### POST /api/contact
- **Method:** POST
- **Purpose:** Submit a new contact inquiry.
- **Request Body:**
  ```json
  {
    /* Form data for contact submission */
    "app_id": 10
  }
  ```
- **Expected Response Shape:** 
  ```json
  {
    "success": true,
    "message": "Contact submitted successfully"
  }
  ```
- **Component:** `frontend/src/components/members/linkedin-automater/contact.tsx`

## Integration

### GET /api/integrations
- **Method:** GET
- **Purpose:** Retrieve integration settings.
- **Request Body/Params:** None
- **Expected Response Shape:** 
  ```json
  {
    /* JSON object containing integration settings */
  }
  ```
- **Component:** `frontend/src/components/members/linkedin-automater/integration.tsx`

## Analytics

### GET /api/analytics
- **Method:** GET
- **Purpose:** Retrieve analytics data.
- **Request Body/Params:** None
- **Expected Response Shape:** 
  ```json
  {
    /* JSON object containing analytics overview */
  }
  ```
- **Component:** `frontend/src/components/members/linkedin-automater/analytics.tsx`

## Campaigns

### GET /api/campaigns
- **Method:** GET
- **Purpose:** Retrieve campaign data.
- **Request Body/Params:** None
- **Expected Response Shape:** 
  ```json
  [
    {
      "id": "string",
      "name": "string",
      "created_at": "string"
    }
  ]
  ```
- **Component:** `frontend/src/components/members/linkedin-automater/campaigns.tsx`