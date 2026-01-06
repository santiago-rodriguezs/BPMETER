# 🌐 Production URLs - BPMETER

## Live URLs

- **Frontend**: https://bpmeter-bay.vercel.app/
- **Backend**: https://bpmeter.onrender.com

## Configuration

### Vercel Environment Variable
```
NEXT_PUBLIC_BACKEND_URL=https://bpmeter.onrender.com
```

### Backend CORS
Configured to allow: `https://bpmeter-bay.vercel.app`

---

## Testing

```bash
# Test backend
curl https://bpmeter.onrender.com/api/health

# Expected response:
# {"status": "ok", "message": "BPM Detection API is running"}
```

---

## Notes

- ⚠️ Render free tier spins down after 15 min of inactivity
- First request after spin down takes ~30-50 seconds
- Consider upgrading to paid tier ($7/month) for always-on backend

