# 🚀 How to Start the Application

## Important Notes

- **The React frontend** runs on `http://localhost:3000` (this is what you should open in your browser)
- **The Flask backend API** runs on `http://localhost:5000` (this is just the API, not meant to be accessed directly in browser)

## Step-by-Step Instructions

### 1. Start the Backend API (Terminal 1)

```bash
cd backend
python app_api.py
```

You should see:
```
Loading model...
✅ Model loaded successfully!

Connecting to MongoDB...
✅ Connected to MongoDB: disease_prediction_db

Starting Flask API server...
API available at http://localhost:5000
```

**Note**: If you see MongoDB connection errors, make sure MongoDB is running or update the `MONGO_URI` in your `.env` file.

### 2. Start the Frontend (Terminal 2)

Open a **new terminal window** and run:

```bash
cd frontend
npm start
```

You should see:
```
Compiled successfully!

You can now view the app in the browser.

  Local:            http://localhost:3000
```

### 3. Open in Browser

Open your browser and go to:
```
http://localhost:3000
```

**This is the main application!** The React frontend will automatically communicate with the backend API.

---

## Troubleshooting

### Error: "Failed to load resource: 404 (NOT FOUND)"

**If you're accessing `http://localhost:5000` directly:**
- This is normal! The backend API doesn't have a web interface
- Access `http://localhost:3000` instead (the React frontend)
- Or test the API at `http://localhost:5000/health` to see if it's running

### Error: "Cannot connect to MongoDB"

1. Make sure MongoDB is installed and running
2. Or use MongoDB Atlas (cloud) and update your `.env` file:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/
   DB_NAME=disease_prediction_db
   ```

### Error: "Model not found"

Make sure you have trained the model and the files exist in the `models/` directory:
- `models/disease_predictor.pkl`
- `models/label_encoders.pkl`
- `models/target_encoder.pkl`
- `models/feature_columns.pkl`

### Port Already in Use

If port 5000 or 3000 is already in use:

**For Backend (port 5000):**
- Find and close the process using port 5000
- Or modify `app_api.py` to use a different port

**For Frontend (port 3000):**
- The React dev server will ask if you want to use a different port
- Or stop any other React apps running

---

## Quick Test

Once both servers are running:

1. **Test Backend API:**
   - Open: `http://localhost:5000/health`
   - Should show: `{"status": "healthy", "model_loaded": true}`

2. **Test Frontend:**
   - Open: `http://localhost:3000`
   - Should show the HealthAI homepage

---

## What Each Server Does

- **Backend (port 5000)**: 
  - Handles API requests
  - Processes predictions
  - Manages user authentication
  - Stores data in MongoDB

- **Frontend (port 3000)**:
  - The user interface
  - Makes requests to the backend API
  - Displays results beautifully

Both need to be running for the application to work!
